
import React, { useMemo } from 'react';
import Digipan3D, { svgTo3D, getTonefieldDimensions, Digipan3DHandle } from './Digipan3D';
import { useTexture } from '@react-three/drei';
import { HANDPAN_CONFIG } from '@/constants/handpanConfig';
import { Scale } from '@/data/handpanScales';
import { getNoteFrequency } from '@/constants/noteFrequencies';
import { DIGIPAN_VIEW_CONFIG } from '@/constants/digipanViewConfig';
import * as THREE from 'three';
import { VisualTonefield } from './VisualTonefield';

// Composite Background Component for Digipan 11
const Digipan11Background = ({ centerX = 500, centerY = 500, visualNotes = [], viewMode }: { centerX?: number; centerY?: number; visualNotes?: any[]; viewMode?: number }) => {
    // Load texture
    const tex1 = useTexture('/images/digipan/9notes.png');

    const size = HANDPAN_CONFIG.OUTER_RADIUS * 2; // 57cm

    // Calculate Image Position to adjust for Center Offset
    // Using exported svgTo3D from Digipan3D relative to the CENTER of the SVG (500, 500)
    const pos = svgTo3D(500, 500, centerX, centerY);

    return (
        <group>
            {/* Top Image (Centered relative to adjusted origin) */}
            <mesh position={[pos.x, pos.y, -0.5]} rotation={[0, 0, 0]}>
                <planeGeometry args={[size, size]} />
                <meshBasicMaterial map={tex1} transparent opacity={1} />
            </mesh>

            {/* Permanent Visual Tonefields for Bottom Notes (N9, N10) */}
            {/* Show in Modes 0-3 (UI 1-4), Hide in Mode 4 (UI 5 - Guide Mode uses Spheres) */}
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
                        color="#A0522D"
                        opacity={0.6}
                        fillOpacity={0.15}
                    />
                );
            })}
            {/* Permanent Visual Tonefields for Bottom Notes REMOVED - Handled by ToneFieldMesh in Digipan3D now */}
        </group >
    );
};

interface Digipan11Props {
    scale?: Scale | null;
    onScaleSelect?: (scale: Scale) => void;
    onNoteClick?: (noteId: number) => void;
    isCameraLocked?: boolean;
    extraControls?: React.ReactNode;
    notes?: any[]; // Allow passing notes for editor mode override
    // New Props
    showControls?: boolean;
    showInfoPanel?: boolean;
    initialViewMode?: 0 | 1 | 2 | 3 | 4;
    viewMode?: 0 | 1 | 2 | 3 | 4;
    onViewModeChange?: (mode: 0 | 1 | 2 | 3 | 4) => void;
    enableZoom?: boolean;
    enablePan?: boolean;
    showLabelToggle?: boolean;
    forceCompactView?: boolean;
    showAxes?: boolean;
    onIsRecordingChange?: (isRecording: boolean) => void;
    hideTouchText?: boolean;
}

const Digipan11 = React.forwardRef<Digipan3DHandle, Digipan11Props>(({
    scale,
    onScaleSelect,
    onNoteClick,
    isCameraLocked = false,
    extraControls,
    notes: externalNotes,
    showControls = true,
    showInfoPanel = true,
    initialViewMode = 2,
    viewMode,
    onViewModeChange,
    enableZoom = true,
    enablePan = true,
    showLabelToggle = false,
    forceCompactView = false,
    showAxes = false,
    onIsRecordingChange,
    hideTouchText = false
}, ref) => {

    // Internal Note Generation (C# Pygmy 11 Layout)
    const internalNotes = useMemo(() => {
        if (!scale || externalNotes) return [];

        // Fine-tuned 11-Note Coordinates (from digipan-3d-test/page.tsx)
        const templateData = [
            {
                "id": 0,
                "cx": 512,
                "cy": 530,
                "scale": 0,
                "rotate": 89,
                "position": "center",
                "angle": 0,
                "scaleX": 1.48,
                "scaleY": 1.26
            },
            {
                "id": 1,
                "cx": 662,
                "cy": 808,
                "scale": 0,
                "rotate": 66,
                "position": "top",
                "angle": 0,
                "scaleX": 1,
                "scaleY": 1
            },
            {
                "id": 2,
                "cx": 349,
                "cy": 810,
                "scale": 0,
                "rotate": 107,
                "position": "top",
                "angle": 0,
                "scaleX": 1.04,
                "scaleY": 1.04
            },
            {
                "id": 3,
                "cx": 837,
                "cy": 588,
                "scale": 0,
                "rotate": 199,
                "position": "top",
                "angle": 0,
                "scaleX": 0.93,
                "scaleY": 0.89
            },
            {
                "id": 4,
                "cx": 175,
                "cy": 599,
                "scale": 0,
                "rotate": 164,
                "position": "top",
                "angle": 0,
                "scaleX": 1.07,
                "scaleY": 0.8900000000000001
            },
            {
                "id": 5,
                "cx": 788,
                "cy": 316,
                "scale": 0,
                "rotate": 145,
                "position": "top",
                "angle": 0,
                "scaleX": 0.97,
                "scaleY": 0.92
            },
            {
                "id": 6,
                "cx": 201,
                "cy": 348,
                "scale": 0,
                "rotate": 43,
                "position": "top",
                "angle": 0,
                "scaleX": 1.19,
                "scaleY": 0.8499999999999999
            },
            {
                "id": 7,
                "cx": 597,
                "cy": 180,
                "scale": 0,
                "rotate": 188,
                "position": "top",
                "angle": 0,
                "scaleX": 1.17,
                "scaleY": 0.77
            },
            {
                "id": 8,
                "cx": 370,
                "cy": 195,
                "scale": 0,
                "rotate": 144,
                "position": "top",
                "angle": 0,
                "scaleX": 1.18,
                "scaleY": 0.8099999999999999
            },
            {
                "id": 9,
                "cx": 1000,
                "cy": 762,
                "scale": 0,
                "rotate": 21,
                "position": "bottom",
                "angle": 0,
                "scaleX": 1.0,
                "scaleY": 1.2
            },
            {
                "id": 10,
                "cx": 1,
                "cy": 762,
                "scale": 0,
                "rotate": 158,
                "position": "bottom",
                "angle": 0,
                "scaleX": 1.0,
                "scaleY": 1.3
            }
        ];

        // Template Notes for frequency lookup (Visual Sizing)
        const TEMPLATE_NOTES = ["D3", "A3", "Bb3", "C4", "D4", "E4", "F4", "G4", "A4", "C5", "D5"];

        // Determine Scale Notes (Ding + Top + Bottom)
        const currentScaleNotes = [scale.notes.ding, ...scale.notes.top, ...(scale.notes.bottom || [])];

        // 1. Generate Notes with Frequency and Offsets
        const generatedNotes = templateData.map((n, i) => {
            const noteName = currentScaleNotes[i] || '';
            const frequency = getNoteFrequency(noteName);
            const visualNoteName = TEMPLATE_NOTES[i] || "A4";
            const visualFrequency = getNoteFrequency(visualNoteName);

            return {
                ...n,
                label: noteName, // Default label
                frequency: frequency || 440,
                visualFrequency: visualFrequency || 440,
                labelOffset: 25,
                offset: [0, 0, 0] as [number, number, number] // Centered for all notes
            };
        });

        // 2. Sort by Pitch to determine Rank (1-based index) for subLabel
        const sortedByPitch = [...generatedNotes].sort((a, b) => a.frequency - b.frequency);

        // 3. Assign subLabel based on Rank (All notes including Ding get their rank number)
        const finalNotes = generatedNotes.map(n => {
            const rank = sortedByPitch.findIndex(x => x.id === n.id) + 1;
            const subLabel = rank.toString(); // All notes get rank number
            return { ...n, subLabel };
        });

        return finalNotes;

    }, [scale, externalNotes]); // removed useVerticalLayout dep

    // Use external notes if provided (Editor Mode), otherwise use internal default (Standard Component)
    const notesToRender = externalNotes || internalNotes;

    // Calculate Scene Size for Camera Auto-Fit
    // Now just a fixed single size since we removed the split view
    const sceneSize = forceCompactView ? { width: 66, height: 50 } : { width: 64, height: 60 };

    return (
        <Digipan3D
            ref={ref}
            notes={notesToRender}
            scale={scale}
            isCameraLocked={isCameraLocked}
            onNoteClick={onNoteClick}
            onScaleSelect={onScaleSelect}
            // Background is simpler now - we pass content instead of string
            backgroundContent={<Digipan11Background visualNotes={notesToRender.filter(n => n.id >= 9)} viewMode={viewMode} />}
            // tonefieldOffset={[-28.5, 0, 0]} // REMOVED global offset, will use per-note offset
            extraControls={extraControls}
            noteCountFilter={9} // Keep filter as 9 for now as it duplicates 9
            showControls={showControls}
            showInfoPanel={showInfoPanel}
            initialViewMode={initialViewMode}
            viewMode={viewMode}
            onViewModeChange={onViewModeChange}
            enableZoom={enableZoom}
            enablePan={enablePan}
            showLabelToggle={showLabelToggle}
            forceCompactView={forceCompactView}
            showAxes={showAxes}
            hideStaticLabels={true} // Hide RS/LS/H labels
            sceneSize={sceneSize} // Pass dynamic scene size
            cameraZoom={DIGIPAN_VIEW_CONFIG['11'].zoom}
            cameraTargetY={DIGIPAN_VIEW_CONFIG['11'].targetY}
            onIsRecordingChange={onIsRecordingChange}
            hideTouchText={hideTouchText}
        />
    );
});

export default Digipan11;
