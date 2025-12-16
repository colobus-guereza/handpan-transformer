import React, { useMemo } from 'react';
import Digipan3D from './Digipan3D';
import DigipanAutoPlayer from './DigipanAutoPlayer';
import { Scale } from '../../data/handpanScales';
import { getNoteFrequency } from '../../constants/noteFrequencies';
import { DIGIPAN_VIEW_CONFIG } from '../../constants/digipanViewConfig';

import { Digipan3DHandle } from './Digipan3D';
import { useControls, folder } from 'leva';
import { DigipanHarmonicConfig } from '../../constants/harmonicDefaults';

export interface DigipanDMProps {
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

const DigipanDM = React.forwardRef<Digipan3DHandle, DigipanDMProps>(({
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

    // 1. Digital Harmonics Engine is now in Digipan3D
    // We just configure the settings here via Leva

    // 2. Leva Controls for Tuning
    const resonanceConfig = useControls('Digital Harmonics (Octave)', {
        'Octave Settings': folder({
            enableHarmonics: { value: true, label: 'Active (On/Off)' },
            trimStart: { value: 0.05, min: 0, max: 0.5, step: 0.01, label: 'Attack Trim (sec)' },
            fadeInDuration: { value: 1.07, min: 0, max: 2.0, step: 0.01, label: 'Fade In (sec)' },
            fadeInCurve: { value: 8.2, min: 1, max: 10, step: 0.1, label: 'Curve Exp' },
            delayTime: { value: 0.04, min: 0, max: 0.5, step: 0.001, label: 'Latency (sec)' },
            masterGain: { value: 0.55, min: 0, max: 1, step: 0.01, label: 'Harmonic Vol' }
        }, { collapsed: false }),
        'Fifth Settings': folder({
            enableFiveHarmonics: { value: true, label: 'Active (On/Off)' },
            trimStartFive: { value: 0.05, min: 0, max: 0.5, step: 0.01, label: 'Attack Trim (sec)' },
            fadeInDurationFive: { value: 1.07, min: 0, max: 2.0, step: 0.01, label: 'Fade In (sec)' },
            fadeInCurveFive: { value: 10.0, min: 1, max: 10, step: 0.1, label: 'Curve Exp' },
            delayTimeFive: { value: 0.02, min: 0, max: 0.5, step: 0.001, label: 'Latency (sec)' },
            masterGainFive: { value: 0.30, min: 0, max: 1, step: 0.01, label: 'Harmonic Vol' }
        }, { collapsed: false })
    });

    // Internal Note Generation (Standard 10-Note D Kurd Layout)
    const internalNotes = useMemo(() => {
        if (!scale || externalNotes) return [];

        // 10-Note Coordinates (D Kurd 10 Template)
        const templateData = [
            { "id": 0, "cx": 508, "cy": 515, "scale": 0, "rotate": 89, "position": "center", "angle": 0, "scaleX": 1.36, "scaleY": 1.16 },
            { "id": 1, "cx": 639, "cy": 811, "scale": 0, "rotate": 66, "position": "top", "angle": 0, "scaleX": 1, "scaleY": 0.89 },
            { "id": 2, "cx": 356, "cy": 811, "scale": 0, "rotate": 103, "position": "top", "angle": 0, "scaleX": 0.98, "scaleY": 0.9 },
            { "id": 3, "cx": 822, "cy": 626, "scale": 0, "rotate": 194, "position": "top", "angle": 0, "scaleX": 1, "scaleY": 0.93 },
            { "id": 4, "cx": 178, "cy": 609, "scale": 0, "rotate": 163, "position": "top", "angle": 0, "scaleX": 0.99, "scaleY": 0.91 },
            { "id": 5, "cx": 832, "cy": 391, "scale": 0, "rotate": 158, "position": "top", "angle": 0, "scaleX": 0.94, "scaleY": 0.82 },
            { "id": 6, "cx": 184, "cy": 367, "scale": 0, "rotate": 28, "position": "top", "angle": 0, "scaleX": 0.97, "scaleY": 0.85 },
            { "id": 7, "cx": 703, "cy": 215, "scale": 0, "rotate": 142, "position": "top", "angle": 0, "scaleX": 1.02, "scaleY": 0.8 },
            { "id": 8, "cx": 314, "cy": 200, "scale": 0, "rotate": 57, "position": "top", "angle": 0, "scaleX": 0.98, "scaleY": 0.83 },
            { "id": 9, "cx": 508, "cy": 143, "scale": 0, "rotate": 138, "position": "top", "angle": 0, "scaleX": 1.07, "scaleY": 0.79 }
        ];

        // Template Frequencies for fixed visual size (D Kurd 10)
        const TEMPLATE_FREQUENCIES = [
            getNoteFrequency('D3'),  // Ding
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

        // Determine Scale Notes
        // Digipan 10 expects 1 Ding + 9 Tonefields
        const currentScaleNotes = [scale.notes.ding, ...scale.notes.top];

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

    // === AutoPlayer Mode ===
    if (isAutoPlay) {
        return (
            <DigipanAutoPlayer
                notes={notesToRender}
                scale={scale}
                centerX={centerX}
                centerY={centerY}
                backgroundImage={backgroundImage || "/images/10notes.png"}
                demoActiveNoteId={demoActiveNoteId}
            />
        );
    } // End AutoPlayer Mode


    // 3. Resonance Logic Wrapper
    // DEPRECATED: Logic moved to Digipan3D. 
    // We only need to pass the clicked ID through.
    const handleNoteClick = (noteId: number) => {
        if (onNoteClick) onNoteClick(noteId);
    };

    // Construct Harmonic Config Object from Leva
    const harmonicSettings: DigipanHarmonicConfig = {
        octave: {
            active: resonanceConfig.enableHarmonics,
            trim: resonanceConfig.trimStart,
            fade: resonanceConfig.fadeInDuration,
            curve: resonanceConfig.fadeInCurve,
            latency: resonanceConfig.delayTime,
            gain: resonanceConfig.masterGain
        },
        fifth: {
            active: resonanceConfig.enableFiveHarmonics,
            trim: resonanceConfig.trimStartFive,
            fade: resonanceConfig.fadeInDurationFive,
            curve: resonanceConfig.fadeInCurveFive,
            latency: resonanceConfig.delayTimeFive,
            gain: resonanceConfig.masterGainFive
        }
    };

    return (
        <Digipan3D
            ref={ref}
            notes={notesToRender}
            scale={scale}
            isCameraLocked={isCameraLocked}
            onNoteClick={handleNoteClick}
            onScaleSelect={onScaleSelect}
            centerX={centerX}
            centerY={centerY}
            backgroundImage={backgroundImage || "/images/10notes.png"}
            harmonicSettings={harmonicSettings} // Pass Controlled Settings
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
            sceneSize={forceCompactView ? { width: 66, height: 50 } : { width: 64, height: 60 }}
            cameraZoom={DIGIPAN_VIEW_CONFIG['DM'].zoom}
            cameraTargetY={DIGIPAN_VIEW_CONFIG['DM'].targetY}
        />
    );
});

export default DigipanDM;
