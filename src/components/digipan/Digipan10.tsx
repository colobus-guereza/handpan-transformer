'use client';

import React, { useMemo } from 'react';
import Digipan3D from './Digipan3D';
import { Scale } from '@/data/handpanScales';
import { getNoteFrequency } from '@/constants/noteFrequencies';
import { DIGIPAN_VIEW_CONFIG } from '@/constants/digipanViewConfig';

import { Digipan3DHandle } from './Digipan3D';

interface Digipan10Props {
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
}

const Digipan10 = React.forwardRef<Digipan3DHandle, Digipan10Props>(({
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
    hideTouchText = false
}, ref) => {

    // 10-Note Specific Layout (Coordinates for 10notes.png)
    const notes = useMemo(() => {
        // If external notes are provided (Editor Mode), use them directly
        // We still need to map the labels and frequencies if they aren't fully populated, 
        // but for the editor on page.tsx, we will pass fully formed objects.
        if (scale && forceCompactView === false && React.isValidElement(extraControls) && Object.keys(extraControls).length === 0) {
            // Heuristic to detect if we are in a "normal" usage or "editor" usage might be tricky without explicit prop.
            // Actually, `activeNotes10` in page.tsx effectively replaces this entire hook's logic if passed.
        }

        // HOWEVER, the standard way in Digipan9 was:
        // const notesToRender = externalNotes || internalNotes;

        // So we should just compute internalNotes and then choose.
        // Let's copy that pattern.

        if (!scale) return [];

        // Hardcoded Coordinates for '10notes.png'
        const userProvidedData = [
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
                "cy": 143,
                "scale": 0,
                "rotate": 138,
                "position": "top",
                "angle": 0,
                "scaleX": 1.07,
                "scaleY": 0.79
            }
        ];

        // Template Frequencies (D Kurd 10) - Fixed for Visual Layout
        const TEMPLATE_FREQUENCIES = [
            getNoteFrequency('D3'),  // Ding (0)
            getNoteFrequency('A3'),  // 1
            getNoteFrequency('Bb3'), // 2
            getNoteFrequency('C4'),  // 3
            getNoteFrequency('D4'),  // 4
            getNoteFrequency('E4'),  // 5
            getNoteFrequency('F4'),  // 6
            getNoteFrequency('G4'),  // 7
            getNoteFrequency('A4'),  // 8
            getNoteFrequency('C5')   // 9
        ];

        // Map Scale Frequencies to this layout
        const dingNote = {
            ...userProvidedData[0],
            label: scale.notes.ding,
            frequency: TEMPLATE_FREQUENCIES[0],
            labelOffset: 25
        };

        const topNotes = scale.notes.top.map((pitch, index) => {
            const template = userProvidedData[index + 1];
            if (!template) return null;

            return {
                ...template,
                label: pitch,
                frequency: TEMPLATE_FREQUENCIES[index + 1] || 440,
                labelOffset: 25
            };
        }).filter(n => n !== null);

        const generatedNotes = [dingNote, ...topNotes] as any[];

        // Sort by frequency to determine 1-based numbering
        const sorted = [...generatedNotes].sort((a, b) => a.frequency - b.frequency);

        return generatedNotes.map(n => {
            const rank = sorted.findIndex(x => x.id === n.id) + 1;
            return {
                ...n,
                subLabel: rank.toString()
            };
        });
    }, [scale]);

    // Use external notes if provided (Editor Mode), otherwise use internal default (Standard Component)
    const notesToRender = externalNotes || notes;

    return (
        <Digipan3D
            ref={ref}
            notes={notesToRender}
            scale={scale}
            isCameraLocked={isCameraLocked}
            onNoteClick={onNoteClick}
            onScaleSelect={onScaleSelect}
            backgroundImage="/images/digipan/10notes.png" // Fixed Background for Digipan10
            extraControls={extraControls}
            noteCountFilter={10}
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
            onIsRecordingChange={onIsRecordingChange}
            hideTouchText={hideTouchText}
            sceneSize={forceCompactView ? { width: 66, height: 50 } : { width: 64, height: 60 }}
            cameraZoom={DIGIPAN_VIEW_CONFIG['10'].zoom}
            cameraTargetY={DIGIPAN_VIEW_CONFIG['10'].targetY}
        />
    );
});

export default Digipan10;
