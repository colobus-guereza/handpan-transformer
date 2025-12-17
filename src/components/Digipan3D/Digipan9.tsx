import React, { useMemo } from 'react';
import Digipan3D from './Digipan3D';
import { Scale } from '../../data/handpanScales';
import { getNoteFrequency } from '../../constants/noteFrequencies';
import { DIGIPAN_VIEW_CONFIG } from '../../constants/digipanViewConfig';

import { Digipan3DHandle } from './Digipan3D';

export interface Digipan9Props {
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
    // AutoPlayer Props
    isAutoPlay?: boolean;
    demoActiveNoteId?: number | null;
    backgroundImage?: string | null;
    centerX?: number;
    centerY?: number;
}

const Digipan9 = React.forwardRef<Digipan3DHandle, Digipan9Props>(({
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
    isAutoPlay = false,
    demoActiveNoteId,
    backgroundImage,
    centerX = 500,
    centerY = 500
}, ref) => {

    // Internal Note Generation (Standard 9-Note D Kurd Layout)
    const internalNotes = useMemo(() => {
        if (!scale || externalNotes) return [];

        // 9-Note Coordinates (D Kurd 9 Template)
        const templateData = [
            { "id": 0, "cx": 513, "cy": 528, "scale": 0, "rotate": 89, "position": "center", "angle": 0, "scaleX": 1.43, "scaleY": 1.22 },
            { "id": 1, "cx": 662, "cy": 808, "scale": 0, "rotate": 66, "position": "top", "angle": 0, "scaleX": 1.00, "scaleY": 0.89 },
            { "id": 2, "cx": 349, "cy": 810, "scale": 0, "rotate": 107, "position": "top", "angle": 0, "scaleX": 1.04, "scaleY": 0.87 },
            { "id": 3, "cx": 843, "cy": 589, "scale": 0, "rotate": 187, "position": "top", "angle": 0, "scaleX": 0.89, "scaleY": 0.91 },
            { "id": 4, "cx": 172, "cy": 599, "scale": 0, "rotate": 154, "position": "top", "angle": 0, "scaleX": 1.10, "scaleY": 0.91 },
            { "id": 5, "cx": 788, "cy": 316, "scale": 0, "rotate": 145, "position": "top", "angle": 0, "scaleX": 1.03, "scaleY": 0.94 },
            { "id": 6, "cx": 201, "cy": 350, "scale": 0, "rotate": 148, "position": "top", "angle": 0, "scaleX": 1.20, "scaleY": 0.79 },
            { "id": 7, "cx": 594, "cy": 184, "scale": 0, "rotate": 188, "position": "top", "angle": 0, "scaleX": 1.27, "scaleY": 0.77 },
            { "id": 8, "cx": 370, "cy": 195, "scale": 0, "rotate": 144, "position": "top", "angle": 0, "scaleX": 1.18, "scaleY": 0.78 }
        ];

        // Template Frequencies for fixed visual size (D Kurd 9)
        const TEMPLATE_FREQUENCIES = [
            getNoteFrequency('D3'),  // Ding
            getNoteFrequency('A3'),  // 1
            getNoteFrequency('Bb3'), // 2
            getNoteFrequency('C4'),  // 3
            getNoteFrequency('D4'),  // 4
            getNoteFrequency('E4'),  // 5
            getNoteFrequency('F4'),  // 6
            getNoteFrequency('G4'),  // 7
            getNoteFrequency('A4')   // 8
        ];

        // Determine Scale Notes
        // Digipan 9 expects 1 Ding + 8 Tonefields
        const currentScaleNotes = [scale.notes.ding, ...scale.notes.top];

        // Map data
        // Map data
        const generatedNotes = templateData.map((t, i) => {
            const noteName = currentScaleNotes[i] || '';
            const frequency = getNoteFrequency(noteName);
            const visualFrequency = TEMPLATE_FREQUENCIES[i] || 440;

            return {
                ...t,
                label: noteName,
                frequency: frequency || 440,
                visualFrequency: visualFrequency, // Fixed visual size
                labelOffset: 25
            };
        });

        // Sort by frequency to determine 1-based numbering
        const sorted = [...generatedNotes].sort((a, b) => a.frequency - b.frequency);

        return generatedNotes.map(n => {
            const rank = sorted.findIndex(x => x.id === n.id) + 1;
            return {
                ...n,
                subLabel: rank.toString()
            };
        });

    }, [scale, externalNotes]);

    // Use external notes if provided (Editor Mode), otherwise use internal default (Standard Component)
    const notesToRender = externalNotes || internalNotes;

    return (
        <Digipan3D
            ref={ref}
            notes={notesToRender}
            scale={scale}
            isCameraLocked={isCameraLocked}
            onNoteClick={onNoteClick}
            onScaleSelect={onScaleSelect}
            centerX={centerX}
            centerY={centerY}
            backgroundImage={backgroundImage || "/images/9notes.png"}
            extraControls={extraControls}
            noteCountFilter={9}

            // AutoPlay Support
            isAutoPlay={isAutoPlay}
            showControls={showControls && !isAutoPlay}
            showInfoPanel={showInfoPanel && !isAutoPlay}

            initialViewMode={initialViewMode}
            viewMode={viewMode}
            onViewModeChange={onViewModeChange}
            enableZoom={enableZoom}
            enablePan={enablePan}
            showLabelToggle={showLabelToggle}
            forceCompactView={forceCompactView}
            showAxes={showAxes}
            onIsRecordingChange={onIsRecordingChange}
            sceneSize={forceCompactView ? { width: 66, height: 50 } : { width: 64, height: 60 }}
            cameraZoom={DIGIPAN_VIEW_CONFIG['9'].zoom}
            cameraTargetY={DIGIPAN_VIEW_CONFIG['9'].targetY}
        />
    );
});

export default Digipan9;
