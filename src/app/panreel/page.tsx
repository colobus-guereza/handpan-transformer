"use client";

import React, { Suspense, useMemo, useState, useRef, useEffect } from "react";
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from "framer-motion";
import { SCALES } from '@/data/handpanScales';
import { Layout, Check, Square, Circle, Smartphone, Keyboard, Play, Pause, Volume2, Download, Trash2, X, Type, ChevronDown, Share2, RefreshCcw } from 'lucide-react';
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

// 상태 정의: 대기중 | 녹화중 | 검토중(완료후)
type RecordState = 'idle' | 'recording' | 'reviewing';

export default function PanReelPage() {
    // 1. State Management
    const [recordState, setRecordState] = useState<RecordState>('idle');
    const [isRecording, setIsRecording] = useState(false); // 기존 호환성 유지
    const [layoutMode, setLayoutMode] = useState<'reel' | 'square'>('reel');
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [showScaleSelector, setShowScaleSelector] = useState(false);
    const [targetScale, setTargetScale] = useState(SCALES.find(s => s.id === 'd_kurd_10') || SCALES[0]);
    const [previewingScaleId, setPreviewingScaleId] = useState<string | null>(null);
    const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
    const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<0 | 1 | 2 | 3 | 4>(2); // 2 = Labels Visible, 3 = Labels Hidden

    // 녹화 타이머용
    const [recordTimer, setRecordTimer] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

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
    const abortControllerRef = useRef<AbortController | null>(null);

    // 2. Audio Preloading
    const { isLoaded, loadingProgress, playNote, resumeAudio } = useHandpanAudio();

    // 3. Handlers
    const stopPreview = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setPreviewingScaleId(null);
    };

    const handlePreview = async (e: React.MouseEvent, scale: any) => {
        e.stopPropagation(); // Don't select the scale
        resumeAudio(); // Ensure audio context is ready

        if (previewingScaleId === scale.id) {
            stopPreview();
            return;
        }

        stopPreview();
        setPreviewingScaleId(scale.id);

        const controller = new AbortController();
        abortControllerRef.current = controller;

        const allNotes = [scale.notes.ding, ...scale.notes.top, ...scale.notes.bottom];
        const sortedNotes = [...allNotes].sort((a, b) => getNoteFrequency(a) - getNoteFrequency(b));

        const wait = (ms: number) => new Promise<void>((resolve, reject) => {
            if (controller.signal.aborted) return reject(new Error('Aborted'));
            const id = setTimeout(() => {
                if (controller.signal.aborted) reject(new Error('Aborted'));
                else resolve();
            }, ms);
            controller.signal.addEventListener('abort', () => clearTimeout(id));
        });

        try {
            // Ascending
            for (let i = 0; i < sortedNotes.length; i++) {
                const note = sortedNotes[i];
                const isDing = note === scale.notes.ding;
                const isTop = i === sortedNotes.length - 1;

                // Base delay logic matching Digipan3D
                let delay = isDing ? 500 : 180;
                // Rubato
                delay += Math.random() * 30;

                // For the very first note, we play immediately (or small delay)
                if (i === 0) await wait(50);
                else await wait(delay);

                playNote(note);

                // Root emphasis breath (after playing root)
                if (isDing) await wait(600);
            }

            // Peak breath
            await wait(400);

            // Descending
            for (let i = sortedNotes.length - 1; i >= 0; i--) {
                const note = sortedNotes[i];
                const isDing = note === scale.notes.ding;

                let delay = isDing ? 800 : 180;
                delay += Math.random() * 30;

                await wait(delay);
                playNote(note);
            }

            // Finished successfully
            setPreviewingScaleId(null);
            abortControllerRef.current = null;

        } catch (err: any) {
            // Ignore abort errors
            if (err.message !== 'Aborted') {
                console.error('Preview error:', err);
            }
        }
    };

    useEffect(() => {
        if (!showScaleSelector) stopPreview();
    }, [showScaleSelector]);

    // 1. 녹화 시작
    const startRecording = () => {
        setRecordState('recording');
        setIsRecording(true);
        setRecordTimer(0);
        timerRef.current = setInterval(() => setRecordTimer(t => t + 1), 1000);
        // 실제 녹화 시작 (기존 Digipan 컴포넌트의 녹화 기능 호출)
        if (digipanRef.current) {
            digipanRef.current.handleRecordToggle();
        }
    };

    // 2. 녹화 종료 -> 리뷰 모드로 전환
    const stopRecording = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setIsRecording(false);
        // 실제 녹화 종료 (기존 Digipan 컴포넌트의 녹화 기능 호출 - 이거로 blob이 생성됨)
        if (digipanRef.current) {
            digipanRef.current.handleRecordToggle();
        }
        // 상태는 handleRecordingComplete에서 reviewing으로 전환됨
    };

    const handleRecordToggle = () => {
        if (recordState === 'idle') {
            startRecording();
        } else if (recordState === 'recording') {
            stopRecording();
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

    // Recording Handlers
    const handleRecordingComplete = (blob: Blob) => {
        setRecordingBlob(blob);
        // 비디오 URL 생성 및 리뷰 모드 전환
        const url = URL.createObjectURL(blob);
        setRecordedVideoUrl(url);
        setRecordState('reviewing');
    };

    // 3. 결정: 삭제 (재촬영)
    const handleDiscardRecording = () => {
        if (recordedVideoUrl) {
            URL.revokeObjectURL(recordedVideoUrl);
        }
        setRecordedVideoUrl(null);
        setRecordingBlob(null);
        setRecordTimer(0);
        setRecordState('idle');
    };

    // 4. 결정: 저장 (다운로드)
    const handleSaveRecording = async () => {
        if (!recordingBlob) return;

        // MIME 타입에 따라 확장자 결정
        const mimeType = recordingBlob.type;
        let extension = 'mp4'; // 기본값
        if (mimeType.includes('webm')) {
            extension = 'webm';
        } else if (mimeType.includes('mp4') || mimeType.includes('h264')) {
            extension = 'mp4';
        }

        // 다운로드
        const url = URL.createObjectURL(recordingBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `PanReel_${Date.now()}.${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // 저장 후 대기 상태로 복귀
        handleDiscardRecording();
    };

    // 5. 결정: 공유 (Web Share API)
    // iOS Safari에서는 files만 전달해야 제대로 작동함 (title, text 포함 시 문제 발생)
    const handleShareRecording = async () => {
        if (!recordingBlob) return;

        // MIME 타입에 따라 확장자 및 타입 결정
        const mimeType = recordingBlob.type;
        let extension = 'mp4';
        let shareType = 'video/mp4';

        if (mimeType.includes('webm')) {
            extension = 'webm';
            shareType = 'video/webm';
        } else if (mimeType.includes('mp4') || mimeType.includes('h264')) {
            extension = 'mp4';
            shareType = 'video/mp4';
        }

        const fileName = `PanReel_${Date.now()}.${extension}`;
        const file = new File([recordingBlob], fileName, { type: shareType });

        // 모바일에서 Web Share API 시도 (HTTPS 환경에서만 작동)
        try {
            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                // ⚠️ iOS Safari 호환성: files만 전달 (title, text 제거)
                await navigator.share({
                    files: [file]
                });
                // 공유 성공 후 대기 상태로 복귀
                handleDiscardRecording();
                return;
            }
        } catch (e: unknown) {
            // AbortError는 사용자가 공유 취소한 경우 - 리뷰 화면 유지
            if (e instanceof Error && e.name === 'AbortError') {
                return;
            }
            console.log("공유 실패:", e);
        }

        // Web Share API 미지원 시 알림
        alert("이 브라우저에서는 공유 기능을 사용할 수 없습니다.\n'저장' 버튼을 눌러 다운로드 후 직접 공유해주세요.");
    };

    // 타이머 포맷팅 (00:00)
    const formatTime = (sec: number) => {
        const m = Math.floor(sec / 60).toString().padStart(2, '0');
        const s = (sec % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
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
            viewMode: viewMode,
            onViewModeChange: setViewMode,
            onIsRecordingChange: setIsRecording,
            onRecordingComplete: handleRecordingComplete,
            disableRecordingUI: true,
            hideTouchText: true,
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
                {/* 리뷰 모드일 때는 살짝 어둡게(Blur) 처리해서 결과창에 집중하게 함 */}
                <div
                    className={`absolute inset-0 z-0 transition-all duration-500 ease-in-out ${recordState === 'reviewing' ? 'blur-sm scale-95 opacity-50' : ''
                        }`}
                >
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

                {/* === Layer 3: System UI (Controls) - 리뷰 모드가 아닐 때만 표시 === */}
                {recordState !== 'reviewing' && (
                    <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-between">

                        <header className="flex items-center justify-center px-4 py-8 bg-gradient-to-b from-black/80 to-transparent pointer-events-auto">
                            <motion.button
                                onClick={() => setShowScaleSelector(true)}
                                key={targetScale.id}
                                initial={{ y: -10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="flex flex-col items-center group active:scale-95 transition-transform"
                            >
                                <div className="flex items-center gap-1.5">
                                    <h1 className="text-white font-bold text-xl tracking-[0.15em] drop-shadow-md group-hover:text-white/80 transition-colors">
                                        {targetScale.name}
                                    </h1>
                                    <ChevronDown size={18} className="text-white/60 group-hover:text-white/80 transition-colors mt-0.5" />
                                </div>
                                <div className="w-16 h-1 bg-white/30 rounded-full mt-2 group-hover:bg-white/50 transition-colors" />
                            </motion.button>
                        </header>

                        <div className="flex-1 min-h-[100px]" />

                        <footer className="w-full px-6 py-8 pb-10 bg-gradient-to-t from-black/95 to-transparent pointer-events-auto min-h-[180px] flex flex-col items-center gap-6">

                            {/* 녹화 타이머 뱃지 */}
                            <motion.div
                                initial={false}
                                animate={{
                                    opacity: recordState === 'recording' ? 1 : 0,
                                    y: recordState === 'recording' ? 0 : 10,
                                }}
                                transition={{ duration: 0.3 }}
                                className={`flex items-center gap-2 px-4 py-1.5 rounded-full backdrop-blur-md border transition-all duration-300
                                ${recordState === 'recording'
                                        ? 'bg-red-500/20 border-red-500/50'
                                        : 'bg-black/20 border-white/10 pointer-events-none'}
                            `}
                            >
                                <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                                <span className="text-red-100 font-mono text-sm font-medium tracking-wider">{formatTime(recordTimer)}</span>
                            </motion.div>

                            {/* 하단 버튼 그룹 */}
                            <div className="w-full flex items-center justify-between max-w-[380px]">
                                {/* 1. Label Toggle */}
                                <button
                                    onClick={() => setViewMode(prev => prev === 2 ? 3 : 2)}
                                    className={`w-12 h-12 rounded-full backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-white/20 transition-all active:scale-95 ${viewMode === 2 ? 'bg-white/20' : 'bg-white/10'}`}
                                >
                                    <Type size={18} className={`${viewMode === 2 ? 'text-white' : 'text-white/40'}`} />
                                </button>

                                {/* 2. Layout Mode */}
                                <button
                                    onClick={toggleLayout}
                                    className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-white/20 transition-all active:scale-95"
                                >
                                    <span className="text-[10px] font-bold text-white tracking-widest">{layoutMode === 'reel' ? "9:16" : "1:1"}</span>
                                </button>

                                {/* 3. Record Button (Center) - 🔴 Main Record Toggle Button */}
                                <div className="relative group z-10 flex justify-center mx-2">
                                    <div className={`absolute inset-0 bg-red-500 rounded-full blur-2xl transition-opacity duration-500 ${recordState === 'recording' ? 'opacity-60 animate-pulse' : 'opacity-0 group-hover:opacity-30'}`} />
                                    <button
                                        onClick={handleRecordToggle}
                                        className="relative transition-all duration-300 hover:scale-105 active:scale-95"
                                        aria-label={recordState === 'recording' ? "녹화 정지" : "녹화 시작"}
                                    >
                                        {/* Outer Ring */}
                                        <div className={`
                                        flex items-center justify-center rounded-full border-4 transition-all duration-300
                                        ${recordState === 'recording' ? 'w-20 h-20 border-red-500' : 'w-16 h-16 border-white'}
                                    `}>
                                            {/* Inner Shape (Circle -> Square) */}
                                            <div className={`
                                            bg-red-500 transition-all duration-300 shadow-[0_0_15px_rgba(239,68,68,0.5)]
                                            ${recordState === 'recording' ? 'w-8 h-8 rounded-md' : 'w-14 h-14 rounded-full'}
                                        `} />
                                        </div>
                                    </button>
                                </div>

                                {/* 4. Right Extra 1 */}
                                <button className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-white/20 transition-all active:scale-95">
                                </button>

                                {/* 5. Right Extra 2 */}
                                <button className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-white/20 transition-all active:scale-95">
                                </button>
                            </div>
                        </footer>
                    </div>
                )}

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
                                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar" style={{ touchAction: 'pan-x' }}>
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

            {/* ============================================================
                LAYER 5: Review Overlay (녹화 완료 시에만 등장)
                - 여기가 '3가지 선택지'가 나오는 핵심 UI입니다.
            ============================================================= */}
            <AnimatePresence>
                {recordState === 'reviewing' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 z-[200] flex flex-col items-center justify-end bg-black/70 backdrop-blur-md"
                    >
                        {/* Preview Area (Video) */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            {recordedVideoUrl ? (
                                <video
                                    src={recordedVideoUrl}
                                    loop
                                    autoPlay
                                    playsInline
                                    className="w-full h-full object-contain max-w-[480px]"
                                />
                            ) : (
                                <div className="text-white/50 text-center">
                                    <p className="text-2xl font-bold text-white mb-2">Done! 🎉</p>
                                    <p>Loading preview...</p>
                                </div>
                            )}
                        </div>

                        {/* Action Card (Bottom Sheet style) */}
                        <motion.div
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 100, opacity: 0 }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                            className="w-full max-w-md bg-zinc-900/95 border-t border-white/10 rounded-t-3xl p-6 pb-8 flex flex-col gap-5 shadow-2xl backdrop-blur-xl"
                        >
                            {/* Time Badge */}
                            <div className="flex justify-center">
                                <div className="px-4 py-1.5 rounded-full bg-white/10 text-white/80 text-sm font-mono tracking-wider">
                                    {formatTime(recordTimer)}
                                </div>
                            </div>

                            {/* Primary Actions (Save & Share) */}
                            <div className="flex gap-3">
                                <button
                                    onClick={handleSaveRecording}
                                    className="flex-1 h-14 rounded-2xl bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center gap-2.5 font-semibold text-white transition active:scale-95"
                                >
                                    <Download size={22} />
                                    Save
                                </button>

                                <button
                                    onClick={handleShareRecording}
                                    className="flex-1 h-14 rounded-2xl bg-white hover:bg-gray-100 flex items-center justify-center gap-2.5 font-semibold text-black shadow-lg transition active:scale-95"
                                >
                                    <Share2 size={22} />
                                    Share
                                </button>
                            </div>

                            {/* Secondary Action (Discard) */}
                            <button
                                onClick={handleDiscardRecording}
                                className="w-full py-2.5 rounded-xl flex items-center justify-center gap-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition active:scale-95 text-sm"
                            >
                                <RefreshCcw size={16} />
                                Retake
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

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
                .no-scrollbar::-webkit-scrollbar {
                  display: none;
                }
                .no-scrollbar {
                  -ms-overflow-style: none;
                  scrollbar-width: none;
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
