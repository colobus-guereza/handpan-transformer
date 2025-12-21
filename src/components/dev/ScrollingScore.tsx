// @ts-nocheck - VexFlow 5.0 has incomplete TypeScript definitions
"use client";

import React, { useEffect, useRef } from 'react';
import * as VF from 'vexflow';
import { ParsedScore } from '@/lib/musicXmlUtils';

// Type assertion for vexflow 5.0 compatibility
const VexFlow = VF as any;

interface ScrollingScoreProps {
    score: ParsedScore | null;
    currentTime?: number;
    bpm?: number;
    isPlaying?: boolean;
}

const ScrollingScore: React.FC<ScrollingScoreProps> = ({ score, currentTime = 0, bpm = 120, isPlaying = false }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const measureWidth = 250;
    const playheadOffset = 100; // Fixed offset from left where the playhead sits

    // Auto-scroll logic refined for playhead alignment
    useEffect(() => {
        if (!scrollContainerRef.current || !score || !isPlaying) return;

        let totalTime = 0;
        let pixelsForSeconds = 0;

        for (let i = 0; i < score.measures.length; i++) {
            const m = score.measures[i];
            const beats = m.timeSignature?.beats || 4;
            const beatType = m.timeSignature?.beatType || 4;

            // Precise duration calculation: (beats / beatType) * 4 * (60 / bpm)
            // This relates the "measure beats" to the standard quarter note BPM
            const measureDuration = (beats / beatType) * 4 * (60 / bpm);

            if (currentTime >= totalTime && currentTime < totalTime + measureDuration) {
                const progress = (currentTime - totalTime) / measureDuration;
                pixelsForSeconds = i * measureWidth + (progress * measureWidth);
                break;
            }
            totalTime += measureDuration;

            // If we are past the end, just cap it
            if (i === score.measures.length - 1 && currentTime >= totalTime) {
                pixelsForSeconds = score.measures.length * measureWidth;
            }
        }

        // Align the "pixels from start of data" with the fixed "playheadOffset"
        // At 0s, pixelsForSeconds=0, scrollLeft=0. Viewport x=100 (playhead) aligns with Content x=100 (start).
        scrollContainerRef.current.scrollTo({
            left: pixelsForSeconds,
            behavior: 'auto'
        });

    }, [currentTime, score, bpm, isPlaying]);

    const mapDuration = (type: string, isRest: boolean): string => {
        const mapping: { [key: string]: string } = {
            'whole': 'w',
            'half': 'h',
            'quarter': 'q',
            'eighth': '8',
            '16th': '16',
            '32nd': '32',
            '64th': '64',
        };
        const duration = mapping[type.toLowerCase()] || 'q';
        return isRest ? duration + 'r' : duration;
    };

    useEffect(() => {
        if (!containerRef.current || !score) return;

        // Clear previous render
        containerRef.current.innerHTML = '';

        const renderer = new VexFlow.Renderer(containerRef.current, VexFlow.Renderer.Backends.SVG);

        // Dynamic width based on measures (fixed width per measure for easy scrolling)
        const width = score.measures.length * measureWidth + playheadOffset * 2; // Extra padding
        const height = 150;

        renderer.resize(width, height);
        const context = renderer.getContext();
        context.setFont('Arial', 10, '').setBackgroundFillStyle('#eed');

        let x = playheadOffset; // Start rendering at playheadOffset to allow space
        const y = 40;

        score.measures.forEach((measure, index) => {
            const stave = new VexFlow.Stave(x, y, measureWidth);

            // Add clef and time signature only to the first measure
            if (index === 0) {
                stave.addClef('treble');
                if (measure.timeSignature) {
                    stave.addTimeSignature(`${measure.timeSignature.beats}/${measure.timeSignature.beatType}`);
                }
            }

            stave.setContext(context).draw();

            const notes = measure.notes.map((n) => {
                const baseDuration = mapDuration(n.type, n.isRest);
                const duration = baseDuration + "d".repeat(n.dots);

                const staveNote = new VexFlow.StaveNote({
                    clef: 'treble',
                    keys: [n.isRest ? 'b/4' : `${n.step.toLowerCase()}${n.alter === 1 ? '#' : (n.alter === -1 ? 'b' : '')}/${n.octave}`],
                    duration,
                });

                // Add accidental if present
                const accidentalStr = n.alter === 1 ? '#' : (n.alter === -1 ? 'b' : '');
                if (accidentalStr && !n.isRest) {
                    staveNote.addModifier(new VexFlow.Accidental(accidentalStr));
                }

                // Add dots modifiers
                for (let i = 0; i < n.dots; i++) {
                    staveNote.addModifier(new VexFlow.Dot());
                }

                return staveNote;
            });

            if (notes.length > 0) {
                const voice = new VexFlow.Voice({
                    numBeats: measure.timeSignature?.beats || 4,
                    beatValue: measure.timeSignature?.beatType || 4
                }).setStrict(false);
                voice.addTickables(notes);

                new VexFlow.Formatter().joinVoices([voice]).format([voice], measureWidth - 50);
                voice.draw(context, stave);
            }

            x += measureWidth;
        });

    }, [score]);

    if (!score) return null;

    return (
        <div className="relative w-full bg-white/5 backdrop-blur-md z-10 border-b border-white/10 shrink-0">
            {/* Header info */}
            <div className="px-4 py-2 border-b border-white/5 flex justify-between items-center bg-black/20">
                <div className="text-xs font-bold text-emerald-400 font-mono uppercase tracking-widest flex items-center gap-2">
                    <span className="bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">{score.title}</span>
                    <span className="text-white/40">-</span>
                    <span>{score.composer}</span>
                </div>
                <div className="text-[10px] font-mono text-neutral-500 flex gap-3">
                    <span>{score.measures.length} Measures</span>
                    <span>BPM: {bpm}</span>
                    <span className="text-emerald-500/60">Pos: {currentTime.toFixed(2)}s</span>
                </div>
            </div>

            {/* Scroll Wrapper to hold fixed playhead and scrolling content */}
            <div className="relative w-full">
                {/* Vertical Playhead (Fixed relative to the viewer) */}
                <div
                    className="absolute top-0 bottom-0 w-0.5 bg-emerald-500 z-50 pointer-events-none shadow-[0_0_15px_rgba(16,185,129,0.8)]"
                    style={{ left: playheadOffset }}
                />

                {/* Scroll Container */}
                <div
                    ref={scrollContainerRef}
                    className="w-full overflow-x-auto scrollbar-hide [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden relative"
                >
                    <div className="p-4 pt-4 pb-6">
                        <div ref={containerRef} className="bg-white rounded-lg shadow-2xl inline-block" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScrollingScore;
