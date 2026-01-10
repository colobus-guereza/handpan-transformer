'use client';

import React, { useMemo } from 'react';
import Digipan3D, { svgTo3D, getTonefieldDimensions, Digipan3DHandle } from './Digipan3D';
import { Scale } from '@/data/handpanScales';
import { getNoteFrequency } from '@/constants/noteFrequencies';
import { DIGIPAN_VIEW_CONFIG, DIGIPAN_SCALE_OVERRIDES } from '@/constants/digipanViewConfig';
import * as THREE from 'three';
import { VisualTonefield } from './VisualTonefield';
import { useTexture } from '@react-three/drei';
import { HANDPAN_CONFIG } from '@/constants/handpanConfig';

interface Digipan14Props {
    scale?: Scale | null;
    onScaleSelect?: (scale: Scale) => void;
    onNoteClick?: (noteId: number) => void;
    isCameraLocked?: boolean;
    extraControls?: React.ReactNode;
    showControls?: boolean;
    showInfoPanel?: boolean;
    initialViewMode?: 0 | 1 | 2 | 3 | 4;
    viewMode?: 0 | 1 | 2 | 3 | 4;
    onViewModeChange?: (mode: 0 | 1 | 2 | 3 | 4) => void;
    enableZoom?: boolean;
    enablePan?: boolean;
    showLabelToggle?: boolean;

    forceCompactView?: boolean;
    notes?: any[]; // Allow passing notes for editor mode override
    showAxes?: boolean;
    onIsRecordingChange?: (isRecording: boolean) => void;
    hideTouchText?: boolean;
    onRecordingComplete?: (blob: Blob) => void;
    recordingCropMode?: 'full' | 'square';
    disableRecordingUI?: boolean;
    externalTouchText?: string | null;
    showTouchText?: boolean;
    disableJamSession?: boolean; // ★ Mobile Optimization
    backgroundColor?: string;
    bottomTextColor?: string;
    bottomTextOpacity?: number;
}

// Composite Background Component for Digipan 14 (10 notes image + 4 visual tonefields)
const Digipan14Background = ({ centerX = 500, centerY = 500, visualNotes = [], viewMode }: { centerX?: number; centerY?: number; visualNotes?: any[]; viewMode?: number }) => {
    // Load texture (Using 10notes.png as base)
    const tex1 = useTexture('/images/digipan/10notes.png');

    const size = HANDPAN_CONFIG.OUTER_RADIUS * 2; // 57cm

    // Calculate Image Position to adjust for Center Offset
    const pos = svgTo3D(500, 500, centerX, centerY);

    return (
        <group>
            {/* Top Image (10 Notes) */}
            <mesh position={[pos.x, pos.y, -0.5]} rotation={[0, 0, 0]}>
                <planeGeometry args={[size, size]} />
                <meshBasicMaterial map={tex1} transparent opacity={1} />
            </mesh>

            {/* Permanent Visual Tonefields for Bottom Notes (N10, N11, N12, N13) */}
            {viewMode !== 4 && visualNotes.map((note) => {
                const cx = note.cx ?? 500;
                const cy = note.cy ?? 500;
                const notePos = svgTo3D(cx, cy, centerX, centerY);
                const rotationZ = -THREE.MathUtils.degToRad(note.rotate || 0);

                // Dimension Calc
                const isDing = note.id === 0;
                const visualHz = note.visualFrequency ?? (note.frequency || 440);
                const dims = getTonefieldDimensions(visualHz, isDing);

                const rx = dims.width;
                const ry = dims.height;
                const radiusX = rx / 2;
                const radiusY = ry / 2;

                const scaleXMult = note.scaleX ?? 1;
                const scaleYMult = note.scaleY ?? 1;
                const finalRadiusX = radiusX * scaleXMult;
                const finalRadiusY = radiusY * scaleYMult;

                return (
                    <VisualTonefield
                        key={`vis-${note.id}`}
                        position={[notePos.x, notePos.y, -0.1]}
                        rotationZ={rotationZ}
                        radiusX={finalRadiusX}
                        radiusY={finalRadiusY}
                        // Style matches Digipan 11/12 final polish
                        color="#A0522D"
                        opacity={0.6}
                        fillOpacity={0.15}
                    />
                );
            })}
        </group>
    );
};


const Digipan14 = React.forwardRef<Digipan3DHandle, Digipan14Props>(({
    scale,
    onScaleSelect,
    onNoteClick,
    isCameraLocked = false,
    extraControls,
    showControls = true,
    showInfoPanel = true,
    initialViewMode = 2,
    viewMode,
    onViewModeChange,
    enableZoom = true,
    enablePan = true,
    showLabelToggle = false,
    forceCompactView = false,
    notes: externalNotes,
    showAxes = false,
    onIsRecordingChange,
    hideTouchText = false,
    onRecordingComplete,
    disableRecordingUI,
    recordingCropMode,
    externalTouchText = null,
    showTouchText,
    disableJamSession = false,
    backgroundColor,
    bottomTextColor,
    bottomTextOpacity,
}, ref) => {

    // 10-Note Base Coordinates (from Digipan10.tsx)
    const baseNotes10 = useMemo(() => [
        {
            "id": 0,
            "cx": 508,
            "cy": 515,
            "scale": 0,
            "rotate": 89,
            "position": "center",
            "angle": 0,
            "scaleX": 1.36,
            "scaleY": 1.16
        },
        {
            "id": 1,
            "cx": 639,
            "cy": 811,
            "scale": 0,
            "rotate": 66,
            "position": "top",
            "angle": 0,
            "scaleX": 1,
            "scaleY": 0.89
        },
        {
            "id": 2,
            "cx": 356,
            "cy": 811,
            "scale": 0,
            "rotate": 103,
            "position": "top",
            "angle": 0,
            "scaleX": 0.98,
            "scaleY": 0.9
        },
        {
            "id": 3,
            "cx": 822,
            "cy": 626,
            "scale": 0,
            "rotate": 194,
            "position": "top",
            "angle": 0,
            "scaleX": 1,
            "scaleY": 0.93
        },
        {
            "id": 4,
            "cx": 178,
            "cy": 609,
            "scale": 0,
            "rotate": 163,
            "position": "top",
            "angle": 0,
            "scaleX": 0.99,
            "scaleY": 0.91
        },
        {
            "id": 5,
            "cx": 832,
            "cy": 391,
            "scale": 0,
            "rotate": 158,
            "position": "top",
            "angle": 0,
            "scaleX": 0.94,
            "scaleY": 0.82
        },
        {
            "id": 6,
            "cx": 184,
            "cy": 367,
            "scale": 0,
            "rotate": 28,
            "position": "top",
            "angle": 0,
            "scaleX": 0.97,
            "scaleY": 0.85
        },
        {
            "id": 7,
            "cx": 703,
            "cy": 215,
            "scale": 0,
            "rotate": 142,
            "position": "top",
            "angle": 0,
            "scaleX": 1.02,
            "scaleY": 0.8
        },
        {
            "id": 8,
            "cx": 314,
            "cy": 200,
            "scale": 0,
            "rotate": 57,
            "position": "top",
            "angle": 0,
            "scaleX": 0.98,
            "scaleY": 0.83
        },
        {
            "id": 9,
            "cx": 508,
            "cy": 142,
            "scale": 0,
            "rotate": 138,
            "position": "top",
            "angle": 0,
            "scaleX": 1.07,
            "scaleY": 0.79
        },
        {
            "id": 10,
            "cx": 0,
            "cy": 762,
            "scale": 0,
            "rotate": 158,
            "position": "bottom",
            "angle": 0,
            "scaleX": 1.29,
            "scaleY": 1.61
        },
        {
            "id": 11,
            "cx": 998,
            "cy": 762,
            "scale": 0,
            "rotate": 21,
            "position": "bottom",
            "angle": 0,
            "scaleX": 1.24,
            "scaleY": 1.48
        },
        {
            "id": 12,
            "cx": 386,
            "cy": -21,
            "scale": 0,
            "rotate": 76,
            "position": "bottom",
            "angle": 0,
            "scaleX": 0.9,
            "scaleY": 0.9
        },
        {
            "id": 13,
            "cx": 635,
            "cy": -14,
            "scale": 0,
            "rotate": 101,
            "position": "bottom",
            "angle": 0,
            "scaleX": 0.85,
            "scaleY": 0.85
        }
    ], []);

    const internalNotes = useMemo(() => {
        if (externalNotes && externalNotes.length > 0) return externalNotes;
        if (!scale) return baseNotes10.map(n => ({ ...n, label: '', frequency: 440, visualFrequency: 440, offset: [0, 0, 0] as [number, number, number] }));

        // Template Notes for frequency lookup
        const TEMPLATE_NOTES = ["D3", "A3", "Bb3", "C4", "D4", "E4", "F4", "G4", "A4", "C5", "D5", "E5", "G5", "A5"];

        // Determine Scale Notes (Ding + Top + Bottom)
        const currentScaleNotes = [scale.notes.ding, ...scale.notes.top, ...(scale.notes.bottom || [])];

        const generatedNotes = baseNotes10.map((n, i) => {
            const noteName = currentScaleNotes[i] || '';
            const frequency = getNoteFrequency(noteName);
            const visualNoteName = TEMPLATE_NOTES[i] || "A4";
            const visualFrequency = getNoteFrequency(visualNoteName);

            let freqForVisual = visualFrequency;
            // Manual overrides for Bottom Notes to match requirements
            if (n.id === 10) freqForVisual = getNoteFrequency("C5"); // Match D12
            if (n.id === 11) freqForVisual = getNoteFrequency("D5"); // Match D12

            // New notes logic:
            // "D5 톤필드 사이즈는 C5보다 살짝 작게." -> C5 is ~523Hz. D5 is ~587Hz. 
            // "E5 톤필드 사이즈는 D5보다 살짝 작게." -> D5 is ~587Hz. E5 is ~659Hz.
            // Using actual frequencies will naturally result in smaller sizes due to the formula in getTonefieldDimensions
            // But let's enforce it visually via overrides if needed.
            // Requirement said "N13(D5) size slightly smaller than C5". N14(E5) slightly smaller than D5.

            if (n.id === 12) freqForVisual = getNoteFrequency("D5");
            if (n.id === 13) freqForVisual = getNoteFrequency("E5");

            return {
                ...n,
                label: noteName,
                frequency: frequency || 440,
                visualFrequency: freqForVisual || 440,
                labelOffset: 25,
                offset: [0, 0, 0] as [number, number, number]
            };
        });

        // Sort by frequency for subLabel
        const sortedByPitch = [...generatedNotes].sort((a, b) => a.frequency - b.frequency);

        const finalNotes = generatedNotes.map(n => {
            const rank = sortedByPitch.findIndex(x => x.id === n.id) + 1;
            const subLabel = rank.toString();
            return { ...n, subLabel };
        });

        // Add Manual Snare Buttons (Bottom Left/Right) - Adjusted for Digipan14
        // Adjustments: LS cx+110/cy+110, RS cx-110/cy+110
        const snareNoteR = {
            id: 99,
            cx: 805,  // 915 - 110
            cy: 1025, // 915 + 110
            scale: 0,
            rotate: 0,
            position: 'bottom',
            angle: 0,
            scaleX: 0.7,
            scaleY: 0.7,
            label: 'SnareR',
            frequency: 0,
            visualFrequency: 440,
            labelOffset: 25,
            hideGuide: true,
            subLabel: 'Snare',
            offset: [0, 0, 0] as [number, number, number]
        };

        const snareNoteL = {
            id: 98,
            cx: 195,  // 85 + 110
            cy: 1025, // 915 + 110
            scale: 0,
            rotate: 0,
            position: 'bottom',
            angle: 0,
            scaleX: 0.7,
            scaleY: 0.7,
            label: 'SnareL',
            frequency: 0,
            visualFrequency: 440,
            labelOffset: 25,
            hideGuide: true,
            subLabel: 'Snare',
            offset: [0, 0, 0] as [number, number, number]
        };

        finalNotes.push(snareNoteR, snareNoteL);

        return finalNotes;

    }, [scale, externalNotes, baseNotes10]);

    const notesToRender = externalNotes || internalNotes;

    // Filter notes for the Permanent Visual Layer (Bottom 4 notes: IDs >= 10, exclude snares)
    const visualNotes = useMemo(() => {
        return notesToRender.filter(n => n.id >= 10 && n.id < 98);
    }, [notesToRender]);

    return (
        <Digipan3D
            ref={ref}
            onIsRecordingChange={onIsRecordingChange}
            hideTouchText={hideTouchText}
            onRecordingComplete={onRecordingComplete}
            disableRecordingUI={disableRecordingUI}
            recordingCropMode={recordingCropMode}
            scale={scale}
            notes={notesToRender.length > 0 ? notesToRender : baseNotes10.map(n => ({ ...n, label: '', frequency: 440, visualFrequency: 440, offset: [0, 0, 0] as [number, number, number] }))}
            onNoteClick={onNoteClick}
            isCameraLocked={isCameraLocked}
            extraControls={extraControls}
            showControls={showControls}
            showInfoPanel={showInfoPanel}
            initialViewMode={initialViewMode}
            viewMode={viewMode}
            onViewModeChange={onViewModeChange}
            enableZoom={enableZoom}
            enablePan={enablePan}
            showLabelToggle={showLabelToggle}
            backgroundContent={<Digipan14Background visualNotes={visualNotes} viewMode={viewMode} />}
            forceCompactView={forceCompactView}
            hideStaticLabels={true}
            sceneSize={forceCompactView ? { width: 66, height: 66 } : { width: 64, height: 66 }} // Tighter vertical bounds (60 + 10%)
            cameraZoom={(scale && DIGIPAN_SCALE_OVERRIDES[scale.id]?.zoom) || DIGIPAN_VIEW_CONFIG['14'].zoom}
            cameraTargetY={(scale && DIGIPAN_SCALE_OVERRIDES[scale.id]?.targetY) ?? DIGIPAN_VIEW_CONFIG['14'].targetY}
            showAxes={showAxes}
            externalTouchText={externalTouchText}
            showTouchText={showTouchText}
            disableJamSession={disableJamSession}
            backgroundColor={backgroundColor}
            bottomTextColor={bottomTextColor}
            bottomTextOpacity={bottomTextOpacity}
        />
    );
});

export default Digipan14;
