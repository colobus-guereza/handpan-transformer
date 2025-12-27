'use client';

import React, { useMemo } from 'react';
import Digipan3D, { svgTo3D, getTonefieldDimensions, Digipan3DHandle } from './Digipan3D';
import { Scale } from '@/data/handpanScales';
import { getNoteFrequency } from '@/constants/noteFrequencies';
import { DIGIPAN_VIEW_CONFIG } from '@/constants/digipanViewConfig';
import * as THREE from 'three';
import { VisualTonefield } from './VisualTonefield';
import { useTexture } from '@react-three/drei';
import { HANDPAN_CONFIG } from '@/constants/handpanConfig';

interface Digipan15MProps {
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
}

// Composite Background Component for Digipan 15M (Mutant image + 4 visual tonefields)
const Digipan15MBackground = ({ centerX = 500, centerY = 500, visualNotes = [], viewMode }: { centerX?: number; centerY?: number; visualNotes?: any[]; viewMode?: number }) => {
    // Load texture (Using 12notes_mutant.png) - Same as 14M for now
    const tex1 = useTexture('/images/digipan/12notes_mutant.png');

    const size = HANDPAN_CONFIG.OUTER_RADIUS * 2; // 57cm

    // Calculate Image Position to adjust for Center Offset
    const pos = svgTo3D(500, 500, centerX, centerY);

    return (
        <group>
            {/* Top Image (12 Notes Mutant) */}
            <mesh position={[pos.x, pos.y, -0.5]} rotation={[0, 0, 0]}>
                <planeGeometry args={[size, size]} />
                <meshBasicMaterial map={tex1} transparent opacity={1} />
            </mesh>

            {/* Permanent Visual Tonefields for Bottom Notes (N10, N11, N12, N13) */}
            {viewMode !== 4 && visualNotes.filter(n => !n.hideGuide).map((note) => {
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


const Digipan15M = React.forwardRef<Digipan3DHandle, Digipan15MProps>(({
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

    // 15-Note Base Coordinates (Cloned from Digipan14M)
    const baseNotes15 = useMemo(() => [
        {
            "id": 0,
            "cx": 503,
            "cy": 519,
            "scale": 0,
            "rotate": 89,
            "position": "center",
            "angle": 0,
            "scaleX": 1.36,
            "scaleY": 1.16
        },
        {
            "id": 1,
            "cx": 645,
            "cy": 814,
            "scale": 0,
            "rotate": 66,
            "position": "top",
            "angle": 0,
            "scaleX": 1,
            "scaleY": 0.89
        },
        {
            "id": 2,
            "cx": 377,
            "cy": 822,
            "scale": 0,
            "rotate": 108,
            "position": "top",
            "angle": 0,
            "scaleX": 0.98,
            "scaleY": 0.9
        },
        {
            "id": 3,
            "cx": 836,
            "cy": 638,
            "scale": 0,
            "rotate": 194,
            "position": "top",
            "angle": 0,
            "scaleX": 1,
            "scaleY": 0.93
        },
        {
            "id": 4,
            "cx": 182,
            "cy": 658,
            "scale": 0,
            "rotate": 163,
            "position": "top",
            "angle": 0,
            "scaleX": 0.99,
            "scaleY": 0.91
        },
        {
            "id": 5,
            "cx": 848,
            "cy": 393,
            "scale": 0,
            "rotate": 158,
            "position": "top",
            "angle": 0,
            "scaleX": 0.94,
            "scaleY": 0.82
        },
        {
            "id": 6,
            "cx": 155,
            "cy": 413,
            "scale": 0,
            "rotate": 28,
            "position": "top",
            "angle": 0,
            "scaleX": 0.97,
            "scaleY": 0.85
        },
        {
            "id": 7,
            "cx": 717,
            "cy": 182,
            "scale": 0,
            "rotate": 121,
            "position": "top",
            "angle": 0,
            "scaleX": 1.02,
            "scaleY": 0.89
        },
        {
            "id": 8,
            "cx": 258,
            "cy": 204,
            "scale": 0,
            "rotate": 54,
            "position": "top",
            "angle": 0,
            "scaleX": 0.98,
            "scaleY": 0.99
        },
        {
            "id": 9,
            "cx": 487,
            "cy": 135,
            "scale": 0,
            "rotate": 93,
            "position": "top",
            "angle": 0,
            "scaleX": 1.07,
            "scaleY": 1.05
        },
        {
            "id": 10,
            "cx": 381,
            "cy": 316,
            "scale": 0,
            "rotate": 58,
            "position": "top",
            "angle": 0,
            "scaleX": 0.9,
            "scaleY": 0.89
        },
        {
            "id": 11,
            "cx": 625,
            "cy": 311,
            "scale": 0,
            "rotate": 117,
            "position": "top",
            "angle": 0,
            "scaleX": 0.85,
            "scaleY": 0.92
        },
        {
            "id": 12,
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
            "id": 13,
            "cx": 995,
            "cy": 762,
            "scale": 0,
            "rotate": 24,
            "position": "bottom",
            "angle": 0,
            "scaleX": 1.24,
            "scaleY": 1.48
        },
        {
            "id": 14,
            "cx": 0,
            "cy": 260,
            "scale": 0,
            "rotate": 24,
            "position": "bottom",
            "angle": 0,
            "scaleX": 1.3900000000000001,
            "scaleY": 1.72
        }
    ], []);

    const internalNotes = useMemo(() => {
        if (externalNotes && externalNotes.length > 0) return externalNotes;
        if (!scale) return baseNotes15.map(n => ({ ...n, label: '', frequency: 440, visualFrequency: 440, offset: [0, 0, 0] as [number, number, number] }));

        // Template Notes for frequency lookup
        const TEMPLATE_NOTES = ["D3", "A3", "Bb3", "C4", "D4", "E4", "F4", "G4", "A4", "C5", "D5", "E5", "G5", "A5", "B5"];

        // Determine Scale Notes (Ding + Top + Bottom)
        const currentScaleNotes = [scale.notes.ding, ...scale.notes.top, ...(scale.notes.bottom || [])];

        const generatedNotes = baseNotes15.map((n, i) => {
            const noteName = currentScaleNotes[i] || '';
            const frequency = getNoteFrequency(noteName);
            const visualNoteName = TEMPLATE_NOTES[i] || "A4";
            const visualFrequency = getNoteFrequency(visualNoteName);

            return {
                ...n,
                label: noteName,
                frequency: frequency || 440,
                visualFrequency: visualFrequency || 440,
                labelOffset: 25,
                offset: [0, 0, 0] as [number, number, number]
            };
        });



        // Sort by frequency for subLabel
        const sortedByPitch = [...generatedNotes].sort((a, b) => a.frequency - b.frequency);

        return generatedNotes.map(n => {
            const rank = sortedByPitch.findIndex(x => x.id === n.id) + 1;
            const subLabel = rank.toString();
            return { ...n, subLabel };
        });

    }, [scale, externalNotes, baseNotes15]);

    const notesToRender = externalNotes || internalNotes;

    // Filter notes for the Permanent Visual Layer (Bottom 4 notes: IDs >= 10)
    const visualNotes = useMemo(() => {
        return notesToRender.filter(n => n.id >= 12);
    }, [notesToRender]);

    return (
        <Digipan3D
            ref={ref}
            scale={scale}
            onIsRecordingChange={onIsRecordingChange}
            hideTouchText={hideTouchText}
            onRecordingComplete={onRecordingComplete}
            disableRecordingUI={disableRecordingUI}
            recordingCropMode={recordingCropMode}
            notes={notesToRender.length > 0 ? notesToRender : baseNotes15.map(n => ({ ...n, label: '', frequency: 440, visualFrequency: 440, offset: [0, 0, 0] as [number, number, number] }))}
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
            backgroundContent={<Digipan15MBackground visualNotes={visualNotes} viewMode={viewMode} />}
            forceCompactView={forceCompactView}
            hideStaticLabels={true}
            cameraTargetY={DIGIPAN_VIEW_CONFIG['15M'].targetY} // Using config
            sceneSize={forceCompactView ? { width: 66, height: 66 } : { width: 64, height: 66 }} // Tighter vertical bounds (60 + 10%)
            cameraZoom={DIGIPAN_VIEW_CONFIG['15M'].zoom}
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

export default Digipan15M;
