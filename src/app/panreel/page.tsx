"use client";

import React, { Suspense, useMemo, useState, useRef, useEffect } from "react";
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from "framer-motion";
import { SCALES } from '@/data/handpanScales';
import { Layout, Check, Square, Circle, Smartphone, Keyboard, Play, Pause, Volume2 } from 'lucide-react';
import { Digipan3DHandle } from "@/components/digipan/Digipan3D";
import { useHandpanAudio } from "@/hooks/useHandpanAudio";
import { getNoteFrequency } from "@/constants/noteFrequencies";

// Dynamically import all Digipan variants
const Digipan9 = dynamic(() => import('@/components/digipan/Digipan9'), { ssr: false });
const Digipan10 = dynamic(() => import('@/components/digipan/Digipan10'), { ssr: false });
const Digipan11 = dynamic(() => import('@/components/digipan/Digipan11'), { ssr: false });
const Digipan12 = dynamic(() => import('@/components/digipan/Digipan12'), { ssr: false });
const Digipan14 = dynamic(() => import('@/components/digipan/Digipan14'), { ssr: false });
const Digipan14M = dynamic(() => import('@/components/digipan/Digipan14M'), { ssr: false });
const Digipan15M = dynamic(() => import('@/components/digipan/Digipan15M'), { ssr: false });
const Digipan18M = dynamic(() => import('@/components/digipan/Digipan18M'), { ssr: false });

export default function PanReelPage() {
    // 1. State Management
    const [isRecording, setIsRecording] = useState(false);
    const [layoutMode, setLayoutMode] = useState<'reel' | 'square'>('reel');
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [showScaleSelector, setShowScaleSelector] = useState(false);
    const [targetScale, setTargetScale] = useState(SCALES.find(s => s.id === 'd_kurd_10') || SCALES[0]);
    const [previewingScaleId, setPreviewingScaleId] = useState<string | null>(null);

    // Filter & Sort State
    const [filterNoteCount, setFilterNoteCount] = useState<string>('all');
    const [sortBy, setSortBy] = useState<'default' | 'name' | 'notes'>('default');

    const processedScales = useMemo(() => {
        let result = [...SCALES];

        // 1. Filter
        if (filterNoteCount !== 'all') {
            if (filterNoteCount === 'mutant') {
                // Check if ID contains mutant OR check tags if 'mutant' wasn't in ID policy (just to be safe)
                result = result.filter(s => s.id.includes('mutant') || s.name.toLowerCase().includes('mutant'));
            } else if (filterNoteCount === '11+') {
                result = result.filter(s => {
                    const count = 1 + s.notes.top.length + s.notes.bottom.length;
                    return count >= 11;
                });
            } else {
                const target = parseInt(filterNoteCount);
                result = result.filter(s => {
                    const count = 1 + s.notes.top.length + s.notes.bottom.length;
                    return count === target;
                });
            }
        }

        // 2. Sort
        if (sortBy === 'name') {
            result.sort((a, b) => a.name.localeCompare(b.name));
        } else if (sortBy === 'notes') {
            result.sort((a, b) => {
                const countA = 1 + a.notes.top.length + a.notes.bottom.length;
                const countB = 1 + b.notes.top.length + b.notes.bottom.length;
                return countA - countB;
            });
        }

        return result;
    }, [filterNoteCount, sortBy]);

    const digipanRef = useRef<Digipan3DHandle>(null);
    const previewTimersRef = useRef<NodeJS.Timeout[]>([]);

    // 2. Audio Preloading
    const { isLoaded, loadingProgress, playNote, resumeAudio } = useHandpanAudio();

    // 3. Handlers
    const stopPreview = () => {
        previewTimersRef.current.forEach(clearTimeout);
        previewTimersRef.current = [];
        setPreviewingScaleId(null);
    };

    const handlePreview = (e: React.MouseEvent, scale: any) => {
        e.stopPropagation(); // Don't select the scale
        resumeAudio(); // Ensure audio context is ready

        if (previewingScaleId === scale.id) {
            stopPreview();
            return;
        }

        stopPreview();
        setPreviewingScaleId(scale.id);

        const allNotes = [scale.notes.ding, ...scale.notes.top, ...scale.notes.bottom];
        const sortedNotes = [...allNotes].sort((a, b) => getNoteFrequency(a) - getNoteFrequency(b));

        const timers: NodeJS.Timeout[] = [];
        let accumulatedDelay = 0;

        // Ascending
        sortedNotes.forEach((note, idx) => {
            const isDing = note === scale.notes.ding;
            const isTop = idx === sortedNotes.length - 1;
            const delay = isDing ? 500 : isTop ? 800 : 180;

            const t = setTimeout(() => {
                playNote(note);
            }, accumulatedDelay);
            timers.push(t);
            accumulatedDelay += delay;

            if (isDing) accumulatedDelay += 400; // Extra breath at root
        });

        accumulatedDelay += 400; // Peak breath

        // Descending
        for (let i = sortedNotes.length - 1; i >= 0; i--) {
            const note = sortedNotes[i];
            const isDing = note === scale.notes.ding;
            const delay = isDing ? 800 : 180;

            const t = setTimeout(() => {
                playNote(note);
                if (isDing) setPreviewingScaleId(null); // End of sequence
            }, accumulatedDelay);
            timers.push(t);
            accumulatedDelay += delay;
        }

        previewTimersRef.current = timers;
    };

    useEffect(() => {
        if (!showScaleSelector) stopPreview();
    }, [showScaleSelector]);

    const handleRecordToggle = () => {
        if (digipanRef.current) {
            digipanRef.current.handleRecordToggle();
        }
    };

    const toggleLayout = () => {
        if (isTransitioning) return;
        setIsTransitioning(true);
        setLayoutMode(prev => prev === 'reel' ? 'square' : 'reel');
        setTimeout(() => setIsTransitioning(false), 800);
    };

    const handleScaleSelect = (scale: any) => {
        setTargetScale(scale);
        setShowScaleSelector(false);
    };

    // 4. Dynamic Component Resolver
    const renderActiveDigipan = () => {
        const bottomCount = targetScale.notes.bottom ? targetScale.notes.bottom.length : 0;
        const totalNotes = 1 + targetScale.notes.top.length + bottomCount;

        const commonProps = {
            ref: digipanRef,
            scale: targetScale,
            showControls: false,
            showInfoPanel: false,
            isCameraLocked: true,
            initialViewMode: 2 as 0 | 1 | 2 | 3 | 4,
            onIsRecordingChange: setIsRecording,
        };

        if (totalNotes === 18) return <Digipan18M {...commonProps} />;
        if (totalNotes === 15) return <Digipan15M {...commonProps} />;
        if (totalNotes === 14) {
            return targetScale.id.includes('mutant') ? <Digipan14M {...commonProps} /> : <Digipan14 {...commonProps} />;
        }
        if (totalNotes === 12) return <Digipan12 {...commonProps} />;
        if (totalNotes === 11) return <Digipan11 {...commonProps} />;
        if (totalNotes === 9) return <Digipan9 {...commonProps} />;

        return <Digipan10 {...commonProps} />;
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-950 overflow-hidden touch-none overscroll-none">

            <main className="relative w-full max-w-[480px] h-[100dvh] bg-black shadow-2xl overflow-hidden flex flex-col items-center justify-center">

                {/* === Layer 1: 3D Scene (STABLE) === */}
                <div className="absolute inset-0 z-0">
                    <Suspense fallback={<div className="flex items-center justify-center h-full text-neutral-800">Initializing...</div>}>
                        {renderActiveDigipan()}
                    </Suspense>

                    {!isLoaded && (
                        <div className="absolute top-2 left-2 px-2 py-1 bg-black/40 backdrop-blur-md rounded text-[10px] text-white/40 pointer-events-none">
                            Preloading Sounds: {loadingProgress}%
                        </div>
                    )}
                </div>

                {/* === Layer 1.5: Cinematic Masking === */}
                <div className="absolute inset-0 z-[5] pointer-events-none flex items-center justify-center">
                    <motion.div
                        initial={false}
                        animate={{
                            borderRadius: layoutMode === 'reel' ? 0 : 48,
                            boxShadow: layoutMode === 'reel'
                                ? "0 0 0 0px rgba(0,0,0,0)"
                                : "0 0 0 2000px rgba(0,0,0,1)",
                            scale: layoutMode === 'reel' ? 1.05 : 1,
                        }}
                        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                        className={`relative w-full aspect-square z-20 border-white/40 ${layoutMode === 'square' ? 'border-[2px]' : 'border-0'}`}
                    >
                        <motion.div
                            animate={{ opacity: layoutMode === 'square' ? 1 : 0 }}
                            className="absolute inset-0 rounded-[48px] ring-2 ring-inset ring-white/40"
                        />
                    </motion.div>
                </div>

                {/* === Layer 1.8: Cinematic Transition Blur === */}
                <AnimatePresence>
                    {isTransitioning && (
                        <motion.div
                            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                            animate={{ opacity: 1, backdropFilter: 'blur(15px)' }}
                            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                            transition={{ duration: 0.4 }}
                            className="absolute inset-0 z-[15] bg-black/20 pointer-events-none"
                        />
                    )}
                </AnimatePresence>

                {/* === Layer 3: System UI (Controls) === */}
                <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-between">

                    <header className="flex items-center justify-center px-4 py-8 bg-gradient-to-b from-black/80 to-transparent pointer-events-auto">
                        <motion.div
                            key={targetScale.id}
                            initial={{ y: -10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="flex flex-col items-center"
                        >
                            <h1 className="text-white font-bold text-xl tracking-[0.15em] drop-shadow-md">
                                {targetScale.name}
                            </h1>
                            <div className="w-16 h-1 bg-white/30 rounded-full mt-2" />
                        </motion.div>
                    </header>

                    <div className="flex-1 min-h-[100px]" />

                    <footer className="w-full px-6 py-8 pb-10 bg-gradient-to-t from-black/95 to-transparent pointer-events-auto min-h-[140px] grid grid-cols-[1fr_auto_1fr] items-center">

                        {/* Left: Layout Mode */}
                        <div className="flex justify-center mt-3">
                            <ControlButton
                                label={layoutMode === 'reel' ? "9:16" : "1:1"}
                                icon={layoutMode === 'reel' ? <Smartphone size={24} /> : <Square size={22} className="text-white stroke-white" />}
                                onClick={toggleLayout}
                            />
                        </div>

                        {/* Center: Record Button */}
                        <div className="relative group z-10 flex justify-center">
                            <div className={`absolute inset-0 bg-red-500 rounded-full blur-2xl transition-opacity duration-500 ${isRecording ? 'opacity-60 animate-pulse' : 'opacity-0 group-hover:opacity-30'}`} />
                            <button
                                onClick={handleRecordToggle}
                                className={`relative w-24 h-24 rounded-full border-4 border-white/90 flex items-center justify-center transition-all duration-500 ${isRecording ? 'bg-red-700 scale-90 shadow-[0_0_40px_rgba(220,38,38,1)]' : 'bg-red-600 active:scale-90 shadow-[0_0_20px_rgba(220,38,38,0.5)]'
                                    }`}
                                aria-label={isRecording ? "Stop Recording" : "Start Recording"}
                            >
                                {isRecording ? (
                                    <Square size={32} className="text-white fill-current" />
                                ) : (
                                    <Circle size={38} className="text-white fill-current" />
                                )}
                            </button>
                        </div>

                        {/* Right: Scale Selector */}
                        <div className="flex justify-center mt-3">
                            <ControlButton
                                label={targetScale.name}
                                icon={<Keyboard size={24} />}
                                onClick={() => setShowScaleSelector(true)}
                            />
                        </div>
                    </footer>
                </div>

                {/* === Layer 4: Scale Selector Overlay === */}
                <AnimatePresence>
                    {showScaleSelector && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-2xl flex flex-col pointer-events-auto"
                        >
                            <div className="flex items-center justify-between px-6 py-8 border-b border-white/10">
                                <h2 className="text-white font-bold text-lg tracking-wider uppercase">Select Scale</h2>
                                <button
                                    onClick={() => setShowScaleSelector(false)}
                                    className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar flex flex-col gap-4">
                                {/* Search & Filter Controls */}
                                <div className="flex flex-col gap-3 px-2">
                                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                                        {(() => {
                                            // 1. Calculate available counts and stats
                                            const stats = SCALES.reduce((acc, scale) => {
                                                const totalNotes = 1 + scale.notes.top.length + scale.notes.bottom.length;

                                                // Count by N
                                                acc[totalNotes] = (acc[totalNotes] || 0) + 1;

                                                // Count Mutant
                                                if (scale.id.includes('mutant') || scale.tags.some(t => t.toLowerCase().includes('mutant'))) {
                                                    acc.mutant = (acc.mutant || 0) + 1;
                                                }
                                                return acc;
                                            }, { mutant: 0 } as Record<string, number>);

                                            const availableCounts = Object.keys(stats)
                                                .filter(k => k !== 'mutant')
                                                .map(Number)
                                                .sort((a, b) => a - b);

                                            const filters = [
                                                { label: 'All', value: 'all', count: SCALES.length },
                                                ...availableCounts.map(n => ({ label: `${n}N`, value: String(n), count: stats[n] })),
                                                { label: 'Mutant', value: 'mutant', count: stats.mutant }
                                            ];

                                            return filters.map(filter => (
                                                <button
                                                    key={filter.value}
                                                    onClick={() => setFilterNoteCount(filter.value)}
                                                    className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-colors whitespace-nowrap
                                                        ${filterNoteCount === filter.value
                                                            ? 'bg-white text-black'
                                                            : 'bg-white/10 text-white/60 hover:bg-white/20'}`}
                                                >
                                                    <span className="text-xs font-bold uppercase tracking-wider">{filter.label}</span>
                                                    <span className={`text-[10px] font-bold ${filterNoteCount === filter.value ? 'opacity-100' : 'opacity-50'}`}>
                                                        {filter.count}
                                                    </span>
                                                </button>
                                            ));
                                        })()}
                                    </div>
                                    <div className="flex justify-end gap-4 px-1">
                                        <button
                                            onClick={() => setSortBy('default')}
                                            className={`text-[10px] font-bold uppercase tracking-widest ${sortBy === 'default' ? 'text-white' : 'text-white/40'}`}
                                        >
                                            Default
                                        </button>
                                        <button
                                            onClick={() => setSortBy('name')}
                                            className={`text-[10px] font-bold uppercase tracking-widest ${sortBy === 'name' ? 'text-white' : 'text-white/40'}`}
                                        >
                                            A-Z
                                        </button>
                                        <button
                                            onClick={() => setSortBy('notes')}
                                            className={`text-[10px] font-bold uppercase tracking-widest ${sortBy === 'notes' ? 'text-white' : 'text-white/40'}`}
                                        >
                                            Notes
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-3 pb-20">
                                    {processedScales.map((scale) => {
                                        const topNotes = [scale.notes.ding, ...scale.notes.top].join(' ');
                                        const bottomNotes = scale.notes.bottom.length > 0 ? scale.notes.bottom.join(' ') : null;

                                        return (
                                            <button
                                                key={scale.id}
                                                onClick={() => handleScaleSelect(scale)}
                                                className={`p-5 rounded-[24px] text-left transition-all flex items-center justify-between group relative overflow-hidden border border-white/5
                                                    ${targetScale.id === scale.id
                                                        ? 'bg-white text-black'
                                                        : 'bg-white/5 text-white hover:bg-white/10'}`}
                                            >
                                                <div className="flex flex-col gap-2 z-10 flex-1 min-w-0 pr-4">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-bold text-lg tracking-tight truncate">{scale.name}</span>
                                                    </div>

                                                    <div className={`flex flex-col gap-1 text-[11px] font-medium opacity-70 ${targetScale.id === scale.id ? 'text-black/70' : 'text-white/60'}`}>
                                                        <div className="flex gap-2">
                                                            <span className="font-bold w-3">T</span>
                                                            <span className="truncate">{topNotes}</span>
                                                        </div>
                                                        {bottomNotes && (
                                                            <div className="flex gap-2">
                                                                <span className="font-bold w-3">B</span>
                                                                <span className="truncate">{bottomNotes}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex gap-1.5 flex-wrap mt-1">
                                                        {scale.tags.map((tag, idx) => (
                                                            <span key={idx} className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider
                                                                ${targetScale.id === scale.id ? 'bg-black/10 text-black/60' : 'bg-white/10 text-white/50'}`}>
                                                                #{tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 z-10 shrink-0">
                                                    <button
                                                        onClick={(e) => handlePreview(e, scale)}
                                                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all
                                                            ${targetScale.id === scale.id
                                                                ? 'bg-black/10 hover:bg-black/20 text-black'
                                                                : 'bg-white/10 hover:bg-white/20 text-white'}`}
                                                    >
                                                        {previewingScaleId === scale.id ? (
                                                            <Volume2 size={20} className="animate-pulse" />
                                                        ) : (
                                                            <Play size={20} fill="currentColor" />
                                                        )}
                                                    </button>
                                                </div>

                                                {/* Progress Bar for preview */}
                                                {previewingScaleId === scale.id && (
                                                    <motion.div
                                                        layoutId="preview-indicator"
                                                        className="absolute bottom-0 left-0 h-1 bg-current opacity-30"
                                                        initial={{ width: 0 }}
                                                        animate={{ width: "100%" }}
                                                        transition={{ duration: 6, ease: "linear" }} // Approx duration, resets on stop
                                                    />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black via-black/90 to-transparent pointer-events-none">
                                <p className="text-center text-gray-500 text-[10px] tracking-[0.3em] font-bold uppercase pointer-events-auto">
                                    {SCALES.length} MASTER SCALES
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </main>

            <style jsx global>{`
                body {
                  overscroll-behavior-y: none;
                  touch-action: none;
                }
                .custom-scrollbar::-webkit-scrollbar {
                  width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                  background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                  background: rgba(255, 255, 255, 0.1);
                  border-radius: 10px;
                }
            `}</style>
        </div>
    );
}

// Reusable Control Button
function ControlButton({ label, icon, onClick }: { label: string; icon: React.ReactNode; onClick?: () => void }) {
    return (
        <div className="flex flex-col items-center gap-2 group cursor-pointer" onClick={onClick}>
            <button className="w-14 h-14 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-xl flex items-center justify-center text-2xl group-hover:bg-white/20 transition-all active:scale-95 shadow-lg">
                {icon}
            </button>
            <span className="text-[11px] text-gray-400 font-bold uppercase tracking-[0.2em] group-hover:text-white transition-colors">
                {label}
            </span>
        </div>
    );
}
