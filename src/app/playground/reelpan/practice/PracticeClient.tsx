"use client";

import { Suspense, useMemo, useState, useRef, useEffect, useCallback } from "react";
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { motion, AnimatePresence } from "framer-motion";
import { SCALES } from '@/data/handpanScales';
import { Layout, Check, Square, Circle, Smartphone, Keyboard, Play, Pause, Volume2, Download, Trash2, X, Type, ChevronDown, Share2, RefreshCcw, Drum, SlidersHorizontal, Settings2, Sparkles, ArrowLeft, Repeat2 } from 'lucide-react';
import { PracticeSkeleton } from "@/components/skeletons/PracticeSkeleton";
import { Digipan3DHandle } from "@/components/digipan/Digipan3D";
import { useHandpanAudio } from "@/hooks/useHandpanAudio";
import { getNoteFrequency } from "@/constants/noteFrequencies";
import { parseMidi, mapMidiToDigipan } from '@/lib/midiUtils';
import { ProcessedSong } from '@/store/useMidiStore';

import * as Tone from 'tone';

const PRACTICE_SONGS = [
    { id: '1', title: 'Spirited Away', scaleName: 'D Kurd 10', midiSrc: '/practice/midi/spirited_away.mid', xmlSrc: '/practice/score/spirited_away.xml' },
    { id: '2', title: 'First Step (Interstellar)', scaleName: 'E Amara 18', midiSrc: undefined, xmlSrc: undefined },
    { id: '3', title: 'Merry-Go-Round', scaleName: 'B Celtic Minor', midiSrc: undefined, xmlSrc: undefined },
    {
        id: '4',
        title: 'We wish you a merry christmas',
        scaleName: 'D Kurd 9',
        midiSrc: '/practice/midi/wewishyouamerrychristmas.mid',
        xmlSrc: '/practice/score/wewishyouamerrychristmas.xml'
    }
];


const Digipan9 = dynamic(() => import('@/components/digipan/Digipan9'), { ssr: false });
const Digipan10 = dynamic(() => import('@/components/digipan/Digipan10'), { ssr: false });
const Digipan11 = dynamic(() => import('@/components/digipan/Digipan11'), { ssr: false });
const Digipan12 = dynamic(() => import('@/components/digipan/Digipan12'), { ssr: false });
const Digipan14 = dynamic(() => import('@/components/digipan/Digipan14'), { ssr: false });
const Digipan14M = dynamic(() => import('@/components/digipan/Digipan14M'), { ssr: false });
const Digipan15M = dynamic(() => import('@/components/digipan/Digipan15M'), { ssr: false });
const Digipan18M = dynamic(() => import('@/components/digipan/Digipan18M'), { ssr: false });

// Score Component
import { OSMDScoreHandle } from '@/components/score/OSMDScore';
const OSMDScore = dynamic(() => import('@/components/score/OSMDScore'), {
    ssr: false,
    loading: () => <div className="w-full h-full flex items-center justify-center text-black/30 text-xs">Loading Score...</div>
});

// 상태 정의: 대기중 | 녹화중 | 검토중(완료후)
type RecordState = 'idle' | 'recording' | 'reviewing';

export default function ReelPanPage() {
    // 1. State Management
    const [recordState, setRecordState] = useState<RecordState>('idle');
    const [isRecording, setIsRecording] = useState(false); // 기존 호환성 유지
    const [layoutMode, setLayoutMode] = useState<'reel' | 'square'>('reel');
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [showScaleSelector, setShowScaleSelector] = useState(false);
    // Updated default scale to D Kurd 9 as requested for the default song
    const [targetScale, setTargetScale] = useState(SCALES.find(s => s.id === 'd_kurd_9') || SCALES[0]);
    const [currentSong, setCurrentSong] = useState(PRACTICE_SONGS.find(s => s.id === '4') || PRACTICE_SONGS[0]);
    const [previewingScaleId, setPreviewingScaleId] = useState<string | null>(null);
    const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
    const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<0 | 1 | 2 | 3 | 4>(2); // 2 = Labels Visible, 3 = Labels Hidden
    const [isScaleLoading, setIsScaleLoading] = useState(false); // 스케일 전환 로딩 상태
    const [isPageReady, setIsPageReady] = useState(false); // 페이지 초기 로딩 상태

    // MIDI Playback State
    const [midiData, setMidiData] = useState<ProcessedSong | null>(null);
    const [isMidiPlaying, setIsMidiPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [playbackTime, setPlaybackTime] = useState(0);

    // Loop State
    const [loopState, setLoopState] = useState<'none' | 'start_set' | 'loop_active'>('none');
    const [loopStart, setLoopStart] = useState<number | null>(null);
    const [loopEnd, setLoopEnd] = useState<number | null>(null);

    // Playback Refs
    const playbackStartTimeRef = useRef<number>(0);
    const pausedTimeRef = useRef<number>(0);
    const playheadIndexRef = useRef<number>(0);
    const requestRef = useRef<number>(0);

    // Sync Refs
    const scoreFirstNoteTimeRef = useRef<number>(0);
    const midiFirstNoteTimeRef = useRef<number>(0);

    // Drum State
    const [isDrumPlaying, setIsDrumPlaying] = useState(false);
    const [showDrumSettings, setShowDrumSettings] = useState(false);
    const [drumBpm, setDrumBpm] = useState(100);
    const [drumPattern, setDrumPattern] = useState('Basic 8-beat');
    const [drumTimeSignature, setDrumTimeSignature] = useState('4/4');

    // -- Drum State --

    // Ref for independent drum control
    const isDrumPlayingRef = useRef(false);

    // 녹화 타이머용
    const [recordTimer, setRecordTimer] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // 롱프레스 타이머용
    const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isLongPressActive = useRef(false);

    // ★ MIDI 중복 로딩 방지용 Ref (StrictMode 대응)
    const lastLoadedMidiSrcRef = useRef<string | null>(null);

    // 2. Audio Preloading (Moved Up for Scope)
    const { isLoaded, loadingProgress, playNote, resumeAudio, preloadScaleNotes } = useHandpanAudio();

    // Effect: Preload Audio Files for Target Scale
    useEffect(() => {
        if (!targetScale) return;
        const allNotes = [targetScale.notes.ding, ...targetScale.notes.top, ...targetScale.notes.bottom];
        preloadScaleNotes(allNotes);
        console.log(`[Audio] Preloading ${allNotes.length} notes for ${targetScale.name}`);
    }, [targetScale, preloadScaleNotes]);

    // ★ Auto-Load MIDI (StrictMode 중복 실행 방지 적용)
    useEffect(() => {
        const loadMidi = async () => {
            // [방어 로직 1] 곡이 없으면 초기화
            if (!currentSong.midiSrc) {
                setMidiData(null);
                lastLoadedMidiSrcRef.current = null;
                return;
            }

            // [방어 로직 2 - 핵심] 이미 로드 요청한 곡과 동일하면 중단 (Double Init 방지)
            if (lastLoadedMidiSrcRef.current === currentSong.midiSrc) {
                console.log(`[Practice] ⏭️ Skip duplicate load for: ${currentSong.title}`);
                return;
            }

            try {
                // 로딩 시작 마킹 (동기적으로 즉시 설정하여 후속 호출 차단)
                lastLoadedMidiSrcRef.current = currentSong.midiSrc;

                // 기존 재생 중지
                stopMidiPlay();

                console.log(`[Practice] 🎵 Start loading MIDI: ${currentSong.title}`);
                console.time('[Practice] parseMidi duration');

                const response = await fetch(currentSong.midiSrc);
                const arrayBuffer = await response.arrayBuffer();

                // 무거운 연산 (여기가 렉의 주범, 이제 한 번만 실행됨)
                const processedSong = await parseMidi(arrayBuffer, currentSong.title, 'standard');

                console.timeEnd('[Practice] parseMidi duration');

                // [방어 로직 3] 비동기 처리 중 곡이 바뀌었는지 최종 확인
                if (lastLoadedMidiSrcRef.current !== currentSong.midiSrc) {
                    console.log('[Practice] ⚠️ Song changed during parsing, discard result.');
                    return;
                }

                setMidiData(processedSong);
                console.log(`[Practice] ✅ Successfully Loaded: ${processedSong.midiName}`);
            } catch (err) {
                console.error(`[Practice] ❌ Error loading MIDI:`, err);
                // 에러 발생 시 ref 초기화하여 재시도 가능하게 함
                lastLoadedMidiSrcRef.current = null;
            }
        };

        loadMidi();
    }, [currentSong]);

    // --- MIDI Playback Logic ---
    const stopMidiPlay = useCallback(() => {
        if (requestRef.current) {
            cancelAnimationFrame(requestRef.current);
            requestRef.current = 0;
        }
        setIsMidiPlaying(false);
        setIsPaused(false);
        setPlaybackTime(0);
        playheadIndexRef.current = 0;
        pausedTimeRef.current = 0;

        // Reset Score Cursor
        if (scoreRef.current) {
            scoreRef.current.hideCursor();
            scoreRef.current.resetCursor();
        }
    }, []);

    // Loop Button Handler (3-state toggle: none → start_set → loop_active → none)
    const handleLoopButton = useCallback(() => {
        // Get the time at current playhead position (scroll position) from SCORE perspective
        let currentTime = playbackTime;

        if (scoreRef.current) {
            const scoreTime = scoreRef.current.getTimeAtScrollPosition();
            // Adjust score time back to audio time: AudioTime = ScoreTime + Offset
            // Offset = MidiFirst - ScoreFirst
            const offset = Math.max(0, midiFirstNoteTimeRef.current - scoreFirstNoteTimeRef.current);
            currentTime = scoreTime + offset;
        }

        if (loopState === 'none') {
            // State 1: Set A point at current playhead position
            setLoopStart(currentTime);
            setLoopState('start_set');
            console.log('[Loop] A point set at playhead:', currentTime.toFixed(2));
        } else if (loopState === 'start_set') {
            // State 2: Set B point and immediately activate loop
            setLoopEnd(currentTime);
            setLoopState('loop_active');
            console.log('[Loop] B point set and loop activated:', currentTime.toFixed(2));
        } else {
            // State 3: Clear loop (back to none)
            setLoopStart(null);
            setLoopEnd(null);
            setLoopState('none');
            console.log('[Loop] Loop cleared');
        }
    }, [loopState, playbackTime]);

    const handleTogglePlay = useCallback(async () => {
        console.log('[Practice] handleTogglePlay clicked', {
            hasMidi: !!midiData,
            hasScale: !!targetScale,
            hasDigipan: !!digipanRef.current,
            isMidiPlaying,
            isPaused
        });

        if (!midiData || !targetScale || !digipanRef.current) {
            console.log('[Play] Aborting early:', {
                midiData: !!midiData,
                targetScale: !!targetScale,
                digipanRef: !!digipanRef.current
            });
            return;
        }

        if (isMidiPlaying && !isPaused) {
            // PAUSE Logic
            console.log('[Play] Pausing playback');
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
                requestRef.current = 0;
            }
            const now = Date.now();
            pausedTimeRef.current = (now - playbackStartTimeRef.current) / 1000;
            setIsPaused(true);
            return;
        }

        if (isMidiPlaying && isPaused) {
            // RESUME Logic
            console.log('[Play] Resuming playback from', pausedTimeRef.current);
            resumeAudio();
            playbackStartTimeRef.current = Date.now() - (pausedTimeRef.current * 1000);
            setIsPaused(false);
        } else {
            // START Logic (Initial or from scrolled position)
            console.log('[Play] Starting new playback');
            const melodyTrack = midiData.tracks.find(t => t.role === 'melody');
            if (!melodyTrack) {
                console.warn('[Play] No melody track found');
                return;
            }

            const transposition = midiData.matchResult?.transposition || 0;
            const mappedNotes = mapMidiToDigipan(melodyTrack.notes, transposition, targetScale);
            console.log('[Play] Mapped notes:', mappedNotes.length);

            if (mappedNotes.length === 0) {
                console.warn('[Play] No playable notes mapped');
                return;
            }

            // Check if user has scrolled to a specific position (Seek feature)
            // BUT: If loop is active, always start from A point (loopStart)
            let startTime = 0;
            if (loopState === 'loop_active' && loopStart !== null) {
                startTime = loopStart;
                console.log('[Play] Loop active - starting from A point:', startTime.toFixed(2), 'seconds');
            } else if (scoreRef.current && scoreRef.current.getTimeAtScrollPosition() > 0.1) {
                // Seek from Score Position
                // AudioTime = ScoreTime + Offset
                const scoreTime = scoreRef.current.getTimeAtScrollPosition();
                const offset = Math.max(0, midiFirstNoteTimeRef.current - scoreFirstNoteTimeRef.current);
                startTime = scoreTime + offset;

                console.log('[Play] Starting from scroll position (adj):', startTime.toFixed(2), 'ScoreTime:', scoreTime.toFixed(2));
            } else {
                // Initial Start: Always start from 0 as user confirmed MIDI starts at 0
                const firstNoteTime = mappedNotes[0]?.time || 0;
                midiFirstNoteTimeRef.current = firstNoteTime;
                startTime = 0;
            }

            // Find the note index to start from
            let startIndex = 0;
            for (let i = 0; i < mappedNotes.length; i++) {
                if (mappedNotes[i].time >= startTime) {
                    startIndex = i;
                    break;
                }
            }

            resumeAudio();
            setIsMidiPlaying(true);
            setIsPaused(false);
            setPlaybackTime(startTime);
            playheadIndexRef.current = startIndex;
            pausedTimeRef.current = 0;
            playbackStartTimeRef.current = Date.now() - (startTime * 1000);

            // Immediate Playback for Initial Notes (Fixing 0.1s delay)
            // If we are starting from 0, immediately trigger notes at t=0
            if (startTime < 0.2) {
                let playedCount = 0;
                for (let i = 0; i < mappedNotes.length; i++) {
                    // Trigger notes within first 200ms immediately
                    // User reported first note at 0.1s was skipped or delayed.
                    // Extending this window ensures it plays instantly.
                    if (mappedNotes[i].time <= 0.2) {
                        digipanRef.current?.triggerNote(mappedNotes[i].noteId);
                        console.log('[Play] Immediate trigger:', mappedNotes[i].noteName);
                        playedCount++;
                    } else {
                        break;
                    }
                }
                // Update playhead so tick loop doesn't play them again (or double trigger)
                // Note: Tick loop checks (note.time <= currentSeconds). 
                // If we set playheadIndexRef = playedCount, tick loop starts from next note.
                // CurrentSeconds will start from ~0.0.
                playheadIndexRef.current = Math.max(startIndex, playedCount);
            } else {
                playheadIndexRef.current = startIndex;
            }

            if (scoreRef.current) {
                scoreRef.current.showCursor();
            }
        }

        // Common Tick Loop Initiation (for Start and Resume)
        const melodyTrack = midiData.tracks.find(t => t.role === 'melody')!;
        const transposition = midiData.matchResult?.transposition || 0;
        const mappedNotes = mapMidiToDigipan(melodyTrack.notes, transposition, targetScale);

        const tick = () => {
            const now = Date.now();
            const currentSeconds = (now - playbackStartTimeRef.current) / 1000;
            setPlaybackTime(currentSeconds);

            // Trigger Notes
            while (playheadIndexRef.current < mappedNotes.length) {
                const note = mappedNotes[playheadIndexRef.current];
                if (note.time <= currentSeconds) {
                    digipanRef.current?.triggerNote(note.noteId);
                    playheadIndexRef.current++;
                } else {
                    break;
                }
            }

            // Update Score Position (Smooth) with Sync Offset
            if (scoreRef.current) {
                // Calculate Offset: MidiFirst - ScoreFirst
                const offset = Math.max(0, midiFirstNoteTimeRef.current - scoreFirstNoteTimeRef.current);
                const scoreTime = currentSeconds - offset;
                scoreRef.current.updateTime(scoreTime);
            }

            // Loop Check: If we've reached loopEnd, jump back to loopStart
            if (loopState === 'loop_active' && loopEnd !== null && loopStart !== null && currentSeconds >= loopEnd) {
                // Find the note index at loopStart
                let newIndex = 0;
                for (let i = 0; i < mappedNotes.length; i++) {
                    if (mappedNotes[i].time >= loopStart) {
                        newIndex = i;
                        break;
                    }
                }
                playheadIndexRef.current = newIndex;
                playbackStartTimeRef.current = Date.now() - (loopStart * 1000);
                setPlaybackTime(loopStart);
                console.log('[Loop] Jumping back to loopStart:', loopStart);
            }

            // Check Completion
            if (playheadIndexRef.current >= mappedNotes.length && currentSeconds > mappedNotes[mappedNotes.length - 1].time + 1) {
                stopMidiPlay();
                return;
            }

            requestRef.current = requestAnimationFrame(tick);
        };

        requestRef.current = requestAnimationFrame(tick);
    }, [midiData, targetScale, isMidiPlaying, isPaused, stopMidiPlay, resumeAudio, loopState, loopStart]);



    // Stop playback if unmounting or song changing
    useEffect(() => {
        return () => stopMidiPlay();
    }, [stopMidiPlay]);

    // Filter & Sort State
    const [filterNoteCount, setFilterNoteCount] = useState<string>('all');
    const [sortBy, setSortBy] = useState<'name' | 'notes'>('name');

    const [countdown, setCountdown] = useState<number | 'Touch!' | null>(null);

    const processedScales = useMemo(() => {
        let result = [...SCALES];

        // 1. Filter
        if (filterNoteCount !== 'all') {
            if (filterNoteCount === 'mutant') {
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

    // 3. Playback Refs
    const digipanRef = useRef<Digipan3DHandle>(null);
    const scoreRef = useRef<OSMDScoreHandle>(null); // Ref for OSMD Score Control
    const previewTimersRef = useRef<NodeJS.Timeout[]>([]);
    const abortControllerRef = useRef<AbortController | null>(null);

    // 2. Audio Preloading


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
                let delay = isDing ? 500 : 180;
                delay += Math.random() * 30;
                if (i === 0) await wait(50);
                else await wait(delay);
                playNote(note);
                if (isDing) await wait(600);
            }
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
            setPreviewingScaleId(null);
            abortControllerRef.current = null;
        } catch (err: any) {
            if (err.message !== 'Aborted') {
                console.error('Preview error:', err);
            }
        }
    };

    // ╔════════════════════════════════════════════════════════════════════════════╗
    // ║                         🥁 DRUM AUDIO ENGINE                               ║
    // ╠════════════════════════════════════════════════════════════════════════════╣
    // ║  킥 드럼은 딩(Ding) 피치와 연결되어 하모닉하게 조화됨                        ║
    // ║  - Kick: 딩 피치 - 1옥타브 (베이스 주파수)                                  ║
    // ║  - Snare: NoiseSynth 기반 (딩 피치 연결 없음)                               ║
    // ║  - Hat: NoiseSynth 기반 (딩 피치 연결 없음)                                 ║
    // ╚════════════════════════════════════════════════════════════════════════════╝

    // Drum Audio Refs (Pop/Rock)
    const drumMasterGainRef = useRef<Tone.Gain | null>(null);
    const kickSynthRef = useRef<Tone.MembraneSynth | null>(null);
    const snareSynthRef = useRef<Tone.NoiseSynth | null>(null);
    const hatSynthRef = useRef<Tone.NoiseSynth | null>(null);
    const drumLoopIdRef = useRef<number | null>(null);



    // ═══════════════════════════════════════════════════════════════════════════
    // 🎧 LOFI CHILL DRUM AUDIO REFS (빈티지 더스티 사운드 - 먹먹한 질감)
    // ═══════════════════════════════════════════════════════════════════════════
    const lofiKickSynthRef = useRef<Tone.MembraneSynth | null>(null);   // Soft Thump (둥근 저음)
    const lofiSnareSynthRef = useRef<Tone.NoiseSynth | null>(null);     // Dry Clap (건조한 탁)
    const lofiHatSynthRef = useRef<Tone.NoiseSynth | null>(null);       // Tick (작은 틱)

    // Dynamic Pitch Refs (킥만 딩과 연결)
    const drumPitchRef = useRef("C1");   // Kick: 딩 - 1옥타브
    const drumStartOffsetRef = useRef(0); // 드럼 시작 오프셋 (항상 step 0부터 시작하기 위함)

    // [Drum Engine] Initialize Synths
    useEffect(() => {
        if (typeof window === 'undefined') return;

        // ═══════════════════════════════════════════════════════════════════════
        // 🔊 MASTER BUS: 전체 드럼 볼륨 제어
        // ═══════════════════════════════════════════════════════════════════════
        const masterGain = new Tone.Gain(0.8).toDestination();
        drumMasterGainRef.current = masterGain;


        // ═══════════════════════════════════════════════════════════════════════
        // 🦵 KICK DRUM: Deep & Heavy Bass (딩 피치 - 1옥타브)
        // ═══════════════════════════════════════════════════════════════════════
        // 특성: 깊고 무거운 베이스, 딩의 서브하모닉 주파수
        // - MembraneSynth: 드럼 막(membrane) 시뮬레이션
        // - Sine Wave: 순수한 저음, 배음 없이 깔끔한 펀치
        // - pitchDecay: 0.05s 동안 피치 하강 (뚱- 느낌)
        // - Lowpass Filter 90Hz: 고음역 차단, 서브베이스만 통과
        // - Compressor: 다이나믹 제어, 일정한 펀치감
        // ───────────────────────────────────────────────────────────────────────
        const kickCompressor = new Tone.Compressor({
            threshold: -12,  // 압축 시작 레벨 (dB) - 더 빨리 압축
            ratio: 8,        // 8:1 압축 비율 - 더 강한 압축
            attack: 0.005,   // 더 빠른 어택으로 펀치 유지
            release: 0.1     // 짧은 릴리즈
        }).connect(masterGain);

        const kickFilter = new Tone.Filter(120, "lowpass").connect(kickCompressor);
        // └─ 120Hz 이상 차단: 약간의 어택 성분 허용

        kickSynthRef.current = new Tone.MembraneSynth({
            pitchDecay: 0.02,   // 피치 하강 시간 (초) - 빠른 하강 = 딱딱한 느낌
            octaves: 1.5,       // 1.5옥타브 하강 (좁은 범위)
            oscillator: {
                type: "triangle"  // 삼각파 = 약간의 배음으로 딱딱한 질감
            },
            envelope: {
                attack: 0.001,        // 즉각적 어택 (펀치)
                decay: 0.3,           // 짧은 디케이 (딱딱함)
                sustain: 0.01,        // 거의 없는 서스테인
                release: 0.5,         // 짧은 릴리즈
                attackCurve: "exponential"
            },
            volume: 8  // 볼륨 부스트 (dB)
        }).connect(kickFilter);

        // ═══════════════════════════════════════════════════════════════════════
        // 🪘 SNARE DRUM: Metallic Finger Tap
        // ═══════════════════════════════════════════════════════════════════════
        // 특성: 금속을 손가락으로 때릴 때의 쫀득한 질감
        // - NoiseSynth: 화이트 노이즈 기반
        // - Bandpass Filter 2000Hz + Q: 금속성 공명 느낌
        // - 짧은 어택 + 적당한 디케이: "딱-" 하고 쫀득하게 끊김
        // ───────────────────────────────────────────────────────────────────────
        const snareFilter = new Tone.Filter({
            frequency: 2000,    // 2kHz 중심 주파수 (금속성 고음역)
            type: "bandpass",
            Q: 2               // 공명 품질 (높을수록 좁고 날카로운 공명)
        }).connect(masterGain);

        snareSynthRef.current = new Tone.NoiseSynth({
            noise: { type: "white" },  // 화이트 노이즈 (높은 피치 유지)
            envelope: {
                attack: 0.002,   // 2ms - 즉각적이지만 살짝 부드러운 시작 (쫀득함)
                decay: 0.06,     // 60ms - 울림 반으로 줄임
                sustain: 0       // 완전 끊김
            },
            volume: 2 // 스네어 부스트
        }).connect(snareFilter);

        // ═══════════════════════════════════════════════════════════════════════
        // 🎩 HI-HAT: Sharp & Crisp
        // ═══════════════════════════════════════════════════════════════════════
        // 특성: 샤프하고 짧은 하이햇
        // - Pink Noise: 부드러운 톤
        // - Bandpass Filter 3500Hz: 중고음역 통과
        // - 즉각적 어택, 50ms 지속: "칙!" 하고 짧게 끊김
        // ───────────────────────────────────────────────────────────────────────
        const hatFilter = new Tone.Filter(3500, "bandpass").connect(masterGain);
        hatSynthRef.current = new Tone.NoiseSynth({
            noise: { type: "pink" },
            envelope: {
                attack: 0.001,   // 1ms - 즉각적 어택
                decay: 0.05,     // 50ms - 짧은 지속
                sustain: 0
            },
            volume: 0  // 70% -> 100% (0dB)
        }).connect(hatFilter);

        // ═══════════════════════════════════════════════════════════════════════════
        // 🎷 JAZZ REMOVED (Replaced by Tribal Hook)
        // ═══════════════════════════════════════════════════════════════════════════

        // ═══════════════════════════════════════════════════════════════════════
        // 🎧 LOFI KICK: Soft Thump (먹먹하고 둥근 저음)
        // ═══════════════════════════════════════════════════════════════════════
        // 특성: LP판 샘플링 느낌, 찰진 고음(Click) 제거
        // ───────────────────────────────────────────────────────────────────────
        const lofiKickFilter = new Tone.Filter(600, "lowpass").connect(masterGain);
        // └─ 600Hz lowpass: 찰진 고음 제거, 둥근 저음만

        lofiKickSynthRef.current = new Tone.MembraneSynth({
            pitchDecay: 0.03,   // 빠른 피치 하강 (음정이 튜지 않게)
            octaves: 1.2,       // 좁은 범위
            oscillator: {
                type: "sine"    // 순수 사인파 (둥근 저음)
            },
            envelope: {
                attack: 0.02,         // 부드러운 어택
                decay: 0.35,          // 적당한 디케이
                sustain: 0.01,
                release: 0.4,
                attackCurve: "linear"
            },
            volume: 6  // 약간 부스트 -> 더 부스트
        }).connect(lofiKickFilter);

        // ═══════════════════════════════════════════════════════════════════════
        // 🎧 LOFI SNARE: Dry Clap (건조하고 짧은 탁)
        // ═══════════════════════════════════════════════════════════════════════
        // 특성: 고음 노이즈 차단, 부드러운 "탁" 소리
        // ───────────────────────────────────────────────────────────────────────
        const lofiSnareFilter = new Tone.Filter(1500, "lowpass").connect(masterGain);
        // └─ 1500Hz lowpass: 고음역 노이즈 차단

        lofiSnareSynthRef.current = new Tone.NoiseSynth({
            noise: { type: "pink" },  // 핑크 노이즈 (부드러운 톤)
            envelope: {
                attack: 0.005,   // 빠른 어택
                decay: 0.08,     // 80ms - 짧고 건조
                sustain: 0
            },
            volume: 2  // 적당한 볼륨 -> 부스트
        }).connect(lofiSnareFilter);

        // ═══════════════════════════════════════════════════════════════════════
        // 🎧 LOFI HAT: Tick (배경 백색소음 같은 틱)
        // ═══════════════════════════════════════════════════════════════════════
        // 특성: 금속성 제거, 아주 작은 "틱" 소리
        // ───────────────────────────────────────────────────────────────────────
        const lofiHatFilter = new Tone.Filter(2500, "lowpass").connect(masterGain);
        // └─ 2500Hz lowpass: 금속성 없애기

        lofiHatSynthRef.current = new Tone.NoiseSynth({
            noise: { type: "pink" },  // 핑크 노이즈
            envelope: {
                attack: 0.003,   // 빠른 어택
                decay: 0.04,     // 40ms - 매우 짧음
                sustain: 0
            },
            volume: -6  // 매우 작은 볼륨 -> 약간 키움
        }).connect(lofiHatFilter);

        // ═══════════════════════════════════════════════════════════════════════
        // 🧹 CLEANUP: 컴포넌트 언마운트 시 리소스 해제
        // ═══════════════════════════════════════════════════════════════════════
        return () => {
            // Pop/Rock synths
            kickSynthRef.current?.dispose();
            snareSynthRef.current?.dispose();
            hatSynthRef.current?.dispose();
            // Jazz synths
            hatSynthRef.current?.dispose();
            // Jazz synths removed
            // Lofi Chill synths
            lofiKickSynthRef.current?.dispose();
            lofiSnareSynthRef.current?.dispose();
            lofiHatSynthRef.current?.dispose();
            masterGain.dispose();
            if (drumLoopIdRef.current !== null) Tone.Transport.clear(drumLoopIdRef.current);
        };
    }, []);

    // [Chord Pad Engine] 독립적 초기화 (Scale Recommender와 완전 분리)

    // [Drum Engine] Dynamic Pitch Update (딩 피치 기반)
    // ═══════════════════════════════════════════════════════════════════════════
    // 스케일 변경 시 킥 드럼 피치를 딩과 하모닉하게 조정
    // - Kick: 딩 - 1옥타브 (서브베이스)
    // ═══════════════════════════════════════════════════════════════════════════
    useEffect(() => {
        if (!targetScale?.notes?.ding) return;

        const ding = targetScale.notes.ding;
        // Parse Note (e.g., "D3", "F#3", "Bb4")
        const match = ding.match(/^([a-zA-Z#]+)(\d+)$/);

        if (match) {
            const noteName = match[1];
            const octave = parseInt(match[2], 10);

            // 🦵 Kick: 딩 - 1옥타브 (서브베이스 영역)
            const kickOctave = Math.max(0, octave - 1);
            drumPitchRef.current = `${noteName}${kickOctave}`;
        } else {
            // Fallback if parsing fails
            drumPitchRef.current = "C1";
        }
    }, [targetScale]);

    // [Drum Engine] BPM Management (Separated for smooth transitions)
    useEffect(() => {
        if (typeof window === 'undefined') return;
        Tone.Transport.bpm.value = drumBpm;
    }, [drumBpm]);

    // [Drum Engine] Pattern Management
    useEffect(() => {
        if (typeof window === 'undefined') return;

        // ★ 1. [방어 코드] 기존 루프가 있다면 확실하게 제거하고 시작 (유령 루프 방지)
        if (drumLoopIdRef.current !== null) {
            Tone.Transport.clear(drumLoopIdRef.current);
            drumLoopIdRef.current = null;
        }

        // Play 상태가 아니면 루프 스케줄링 하지 않음
        if (!isDrumPlaying) return;

        Tone.Transport.swing = 0;          // 스윙 없음

        // Pattern logic based on drumPattern & drumTimeSignature
        // ★ 킥 피치는 drumPitchRef.current (딩 피치 - 1옥타브)와 연결됨
        const loopId = Tone.Transport.scheduleRepeat((time) => {
            // ★ 드럼 버튼이 활성화된 경우에만 소리 재생
            if (!isDrumPlayingRef.current) return;

            // ============================================================
            // [핵심 수정] Offset 로직 제거 -> 글로벌 시간(Ticks) 절대값 사용
            // ============================================================

            // PPQ (Pulses Per Quarter) is usually 192 in Tone.js
            // 16th note = 1/4 beat = PPQ / 4 ticks
            const TICKS_PER_STEP = Tone.Transport.PPQ / 4; // 192 / 4 = 48 ticks per 16th note

            // Current Transport Position in Ticks
            const currentTicks = Tone.Transport.ticks;

            // Absolute Step Index (반올림으로 미세 오차 보정)
            const absoluteStep = Math.round(currentTicks / TICKS_PER_STEP);

            const is68 = drumTimeSignature === '6/8';
            const is34 = drumTimeSignature === '3/4';
            const division = is68 ? 12 : (is34 ? 12 : 16); // 3/4도 12 step (3박 × 4)

            // ★ 오프셋 없이, 전체 시간에서 현재 루프의 위치를 나머지 연산(%)으로 찾음
            // 이렇게 하면 버튼을 언제 누르든, 흐르는 음악의 '정위치' 소리가 남
            const step = absoluteStep % division;

            // ===== 4/4 박자 =====
            if (drumTimeSignature === '4/4') {
                if (drumPattern === 'Basic 8-beat') {
                    // ★ Basic 8-beat: 클래식한 팝/록 드럼 패턴
                    // Kick: 1박, 3박 (step 0, 8)
                    if (step === 0 || step === 8) {
                        kickSynthRef.current?.triggerAttackRelease(drumPitchRef.current, "8n", time, 0.8);
                    }
                    // Snare: 2박, 4박 (step 4, 12)
                    if (step === 4 || step === 12) {
                        snareSynthRef.current?.triggerAttackRelease("8n", time, 0.5);
                    }
                    // Hat: 8th notes (정박마다)
                    if (step % 2 === 0) {
                        const isAccent = step % 4 === 0;
                        hatSynthRef.current?.triggerAttackRelease("32n", time, isAccent ? 0.3 : 0.15);
                    }
                }
                else if (drumPattern === 'Funky Groove') {
                    // ═══════════════════════════════════════════════════════════
                    // ★ Funky Groove (Funky): 16비트 그루브 & 싱코페이션
                    // ═══════════════════════════════════════════════════════════

                    // 1. Hi-Hat: 16분음표 연속 연주 (Funky Feel)
                    let hatVel = 0.1;
                    if (step % 4 === 0) hatVel = 0.3;      // Downbeat (강)
                    else if (step % 2 === 0) hatVel = 0.2; // Upbeat '&' (중)

                    hatSynthRef.current?.triggerAttackRelease("32n", time, hatVel);

                    // 2. Kick: 펑키한 싱코페이션 (1, 3, 3&)
                    if (step === 0) kickSynthRef.current?.triggerAttackRelease(drumPitchRef.current, "8n", time, 0.8);
                    if (step === 3) kickSynthRef.current?.triggerAttackRelease(drumPitchRef.current, "8n", time, 0.5); // Ghost Kick
                    if (step === 10) kickSynthRef.current?.triggerAttackRelease(drumPitchRef.current, "8n", time, 0.7);

                    // 3. Snare: 2, 4 + Ghost Notes
                    // Main: 4, 12
                    // Ghost: 7, 9, 15
                    if (step === 4 || step === 12) {
                        snareSynthRef.current?.triggerAttackRelease("8n", time, 0.6);
                    } else if (step === 7 || step === 9 || step === 15) {
                        if (Math.random() > 0.4) {
                            snareSynthRef.current?.triggerAttackRelease("16n", time, 0.15); // Ghost Snare
                        }
                    }
                }
                else if (drumPattern === 'Lofi Chill') {
                    // ═══════════════════════════════════════════════════════════════
                    // 🎧 LOFI CHILL: Lazy Dilla Feel
                    // ═══════════════════════════════════════════════════════════════
                    // 요청: "Basic 8-beat와 동일한 박자이되, 스네어에 60ms 레이백 적용 (Dilla Feel)"

                    const humanize = () => (Math.random() - 0.5) * 0.015;
                    const snareLayback = 0.035; // 35ms delay for subtle lazy snare

                    // Kick: 1박, 3박 (step 0, 8) - NO delay (tight)
                    if (step === 0 || step === 8) {
                        lofiKickSynthRef.current?.triggerAttackRelease(drumPitchRef.current, "8n", time, 0.7 + humanize());
                    }

                    // Snare: 2박, 4박 (step 4, 12) - WITH LAYBACK
                    if (step === 4 || step === 12) {
                        // 중요: time + snareLayback 으로 살짝 밀어서 재생
                        lofiSnareSynthRef.current?.triggerAttackRelease("8n", time + snareLayback, 0.5 + humanize());
                    }

                    // Hat: 8th notes (Straight but Lofi sound)
                    if (step % 2 === 0) {
                        const isAccent = step % 4 === 0;
                        const vel = isAccent ? 0.25 : 0.15;
                        lofiHatSynthRef.current?.triggerAttackRelease("32n", time, vel + humanize());
                    }
                }

                else {
                    // Default Fallback
                    if (step === 0 || step === 8) kickSynthRef.current?.triggerAttackRelease(drumPitchRef.current, "8n", time);
                    if (step === 4 || step === 12) snareSynthRef.current?.triggerAttackRelease("8n", time);
                    if (step % 2 === 0) hatSynthRef.current?.triggerAttackRelease("32n", time, 0.1);
                }
            }
            // ===== 3/4 박자 =====
            else if (is34) {
                if (drumPattern === 'Basic 8-beat') {
                    // Waltz Standard
                    if (step === 0) kickSynthRef.current?.triggerAttackRelease(drumPitchRef.current, "8n", time, 0.8);
                    if (step === 4 || step === 8) snareSynthRef.current?.triggerAttackRelease("8n", time, 0.4);
                    if (step % 2 === 0) hatSynthRef.current?.triggerAttackRelease("32n", time, 0.15);
                }
                else if (drumPattern === 'Funky Groove') {
                    // Jazz Waltz Feel
                    if (step % 2 === 0) hatSynthRef.current?.triggerAttackRelease("32n", time, step % 4 === 0 ? 0.25 : 0.15);

                    if (step === 0) kickSynthRef.current?.triggerAttackRelease(drumPitchRef.current, "8n", time, 0.8);
                    // Syncopated Kick
                    if (step === 7) kickSynthRef.current?.triggerAttackRelease(drumPitchRef.current, "16n", time, 0.4);

                    if (step === 4 || step === 8) snareSynthRef.current?.triggerAttackRelease("8n", time, 0.5);
                }
                else if (drumPattern === 'Lofi Chill') {
                    // Lofi Waltz
                    const humanize = () => (Math.random() - 0.5) * 0.02;
                    const snareLayback = 0.04;

                    if (step === 0) lofiKickSynthRef.current?.triggerAttackRelease(drumPitchRef.current, "8n", time, 0.7);

                    // Snare on 2, 3
                    if (step === 4 || step === 8) {
                        lofiSnareSynthRef.current?.triggerAttackRelease("8n", time + snareLayback, 0.5 + humanize());
                    }

                    if (step % 2 === 0) lofiHatSynthRef.current?.triggerAttackRelease("32n", time, 0.2 + humanize());
                }

                else {
                    // 다른 프리셋도 3/4에선 Waltz 기본 사용
                    if (step === 0) kickSynthRef.current?.triggerAttackRelease(drumPitchRef.current, "8n", time, 0.8);
                    if (step === 4 || step === 8) snareSynthRef.current?.triggerAttackRelease("8n", time, 0.4);
                    if (step % 2 === 0) hatSynthRef.current?.triggerAttackRelease("32n", time, 0.15);
                }
            }
            // ===== 6/8 박자 =====
            else if (is68) {
                if (drumPattern === 'Basic 8-beat') {
                    // 6/8 기본 패턴
                    if (step === 0) kickSynthRef.current?.triggerAttackRelease(drumPitchRef.current, "8n", time, 0.8);
                    if (step === 6) snareSynthRef.current?.triggerAttackRelease("8n", time, 0.5);
                    if (step % 2 === 0) hatSynthRef.current?.triggerAttackRelease("32n", time, 0.2);
                }
                else if (drumPattern === 'Funky Groove') {
                    // ★ Funky Groove 6/8
                    if (step === 0) kickSynthRef.current?.triggerAttackRelease(drumPitchRef.current, "8n", time, 0.8);
                    if (step === 9) kickSynthRef.current?.triggerAttackRelease(drumPitchRef.current, "8n", time, 0.45); // 서브 펀치

                    if (step === 6) snareSynthRef.current?.triggerAttackRelease("8n", time, 0.55);
                    if (step === 11) snareSynthRef.current?.triggerAttackRelease("16n", time, 0.18); // 고스트 노트

                    if (step % 2 === 0) {
                        let hatVel = 0.12;
                        if (step === 0 || step === 6) hatVel = 0.28;
                        else if (step === 4 || step === 8) hatVel = 0.18;
                        hatSynthRef.current?.triggerAttackRelease("32n", time, hatVel);
                    }
                }

                else if (drumPattern === 'Lofi Chill') {
                    // 🎧 LOFI CHILL 6/8
                    const humanize = () => (Math.random() - 0.5) * 0.2;
                    const lazyDelay = 0.035 + Math.random() * 0.02;

                    // 🦵 KICK (1박)
                    if (step === 0) {
                        lofiKickSynthRef.current?.triggerAttackRelease(drumPitchRef.current, "4n", time, 0.7 + humanize());
                    }
                    if (step === 10) {
                        lofiKickSynthRef.current?.triggerAttackRelease(drumPitchRef.current, "8n", time, 0.4 + humanize());
                    }

                    // 🪘 SNARE (4박 백비트)
                    if (step === 6) {
                        lofiSnareSynthRef.current?.triggerAttackRelease("16n", time + lazyDelay, 0.55 + humanize());
                    }

                    // 🎩 HAT (8분음표)
                    if (step % 2 === 0) {
                        const isDownbeat = step === 0 || step === 6;
                        const shakerVel = isDownbeat ? 0.25 : 0.35;
                        lofiHatSynthRef.current?.triggerAttackRelease("16n", time + lazyDelay * 0.5, shakerVel + humanize());
                    }
                }

                else {
                    // 다른 프리셋도 6/8에선 기본 사용
                    if (step === 0) kickSynthRef.current?.triggerAttackRelease(drumPitchRef.current, "8n", time, 0.8);
                    if (step === 6) snareSynthRef.current?.triggerAttackRelease("8n", time, 0.5);
                    if (step % 2 === 0) hatSynthRef.current?.triggerAttackRelease("32n", time, 0.2);
                }
            }
        }, "16n");

        drumLoopIdRef.current = loopId;

        // Cleanup: Effect가 다시 실행되거나 언마운트될 때 루프 해제
        // ★ 이를 통해 중복 루프 실행(CPU 부하, 렉)을 방지
        return () => {
            if (loopId !== null) {
                Tone.Transport.clear(loopId);
            }
        };
    }, [drumPattern, drumTimeSignature, isDrumPlaying]);

    // [Drum Engine] Playback Sync (Bus Stop 모델 적용)
    // ★ Mobile Optimization: 마운트 시 불필요한 Transport 조작 방지
    const wasDrumEverStartedRef = useRef(false);

    useEffect(() => {
        isDrumPlayingRef.current = isDrumPlaying;

        if (isDrumPlaying) {
            wasDrumEverStartedRef.current = true;  // 드럼이 시작되었음을 기록
            Tone.start();

            // ★★★ Bus Stop 모델: Transport 상태에 따른 시작 방식 ★★★
            if (Tone.Transport.state === 'started') {
                // ─────────────────────────────────────────────────────────────
                // [Case B: 합류] 화음이 이미 돌고 있음 → 흐름에 탑승
                // ─────────────────────────────────────────────────────────────
                // Global Grid Lock을 사용하므로 별도의 오프셋 계산 불필요
                console.log(`[DrumDebug] Joining running Transport. (Global Grid Lock Active)`);
            } else {
                // ─────────────────────────────────────────────────────────────
                // [Case A: 첫 시작] 아무도 재생 중이 아님 → Transport 리셋 후 시작
                // ─────────────────────────────────────────────────────────────
                console.log("[DrumDebug] Fresh start (Case A)");
                Tone.Transport.position = 0;
                Tone.Transport.start();
            }
        } else {
            // ═══════════════════════════════════════════════════════════════
            // [OFF 로직] 드럼 중지
            // ═══════════════════════════════════════════════════════════════
            // ★ Mobile Optimization: 드럼이 한 번도 시작되지 않았으면 불필요한 Transport 조작 스킵
            if (!wasDrumEverStartedRef.current) {
                // 초기 마운트 - Transport 건드리지 않음
                return;
            }

            // 스케줄된 루프 클리어는 Pattern useEffect의 cleanup에서 처리됨
            // Transport 정지 (화음 제거됨 - 드럼만 제어)
            console.log("[DrumDebug] Stopping Transport");
            Tone.Transport.stop();
            Tone.Transport.position = 0;
        }
    }, [isDrumPlaying]);


    // Drum Handlers
    const handleDrumDown = (e: React.PointerEvent) => {
        // Prevent double fire with mouse/touch
        (e.target as HTMLElement).setPointerCapture(e.pointerId);

        isLongPressActive.current = false;
        longPressTimerRef.current = setTimeout(() => {
            isLongPressActive.current = true;
            setShowDrumSettings(true);
        }, 600);
    };

    const handleDrumUp = (e: React.PointerEvent) => {
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }

        if (!isLongPressActive.current) {
            // 짧게 눌렀을 때만 토글
            Tone.start(); // [UX 개선] 즉시 AudioContext 활성화
            setIsDrumPlaying(prev => !prev);
        }
        isLongPressActive.current = false;
    };

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
        // 재생 버튼 클릭 로직 (추후 구현)
        // 녹화 기능 제거됨
    };

    const toggleLayout = () => {
        if (isTransitioning) return;
        setIsTransitioning(true);
        setLayoutMode(prev => prev === 'reel' ? 'square' : 'reel');
        setTimeout(() => setIsTransitioning(false), 800);
    };

    const handleScaleSelect = (scale: any) => {
        // E Amara 18은 수리 중으로 선택 불가
        if (scale.id === 'e_amara_18') {
            return;
        }
        if (scale.id === targetScale.id) {
            setShowScaleSelector(false);
            return;
        }
        setShowScaleSelector(false);
        setIsScaleLoading(true);

        // 짧은 딜레이 후 스케일 변경 (fade-out 애니메이션 시간)
        setTimeout(() => {
            setTargetScale(scale);
            // 로딩 완료 시뮬레이션 (실제 3D 컴포넌트 마운트 시간 고려)
            setTimeout(() => {
                setIsScaleLoading(false);
            }, 400);
        }, 200);
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
        a.download = `ReelPan_${Date.now()}.${extension}`;
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

        const fileName = `ReelPan_${Date.now()}.${extension}`;
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
            showTouchText: false, // 비활성화 (화음 반주로 대체됨)
            externalTouchText: countdown ? countdown.toString() : null, // 3D 카운트다운 텍스트 주입
            recordingCropMode: layoutMode === 'square' ? 'square' as 'square' : 'full' as 'full',
            enableZoom: false, // 마우스 휠 줌인/줌아웃 비활성화
            enablePan: false, // 모바일 터치로 카메라 이동 비활성화
            disableJamSession: true, // ★ 방해꾼 제거: 내부 오디오 엔진 비활성화
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

    // 페이지 초기 로딩 - 모든 요소가 마운트된 후 ready
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsPageReady(true);
        }, 800); // 충분한 로딩 시간
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="flex items-center justify-center min-h-dvh bg-black overflow-hidden touch-none overscroll-none">

            <main className="relative w-full max-w-[480px] h-dvh bg-white shadow-2xl overflow-hidden flex flex-col items-center justify-center" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>

                {/* === Layer 0: Initial Page Loading Skeleton === */}
                <AnimatePresence>
                    {!isPageReady && (
                        <PracticeSkeleton />
                    )}
                </AnimatePresence>

                {/* === Layer 1: 3D Scene (Instrument Area - below score area) === */}
                <div
                    className={`absolute top-[calc(120px+15%)] left-0 w-full h-[50%] z-0 transition-all duration-500 ease-in-out pointer-events-none ${recordState === 'reviewing' ? 'blur-sm scale-95 opacity-50' : ''
                        }`}
                >
                    {/* 디지팬은 항상 렌더링 (로딩 중에도 뒤에서 마운트) */}
                    <motion.div
                        key={targetScale.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: isScaleLoading ? 0 : 1 }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className="absolute inset-0"
                    >
                        <Suspense fallback={<div className="flex items-center justify-center h-full text-neutral-800">Initializing...</div>}>
                            {renderActiveDigipan()}
                        </Suspense>
                    </motion.div>

                    {/* 스케일 전환 시 로딩 스켈레톤 (오버레이) */}
                    <AnimatePresence>
                        {isScaleLoading && (
                            <motion.div
                                key="skeleton-overlay"
                                initial={{ opacity: 1 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.5, ease: 'easeOut' }}
                                className="absolute inset-0 flex items-center justify-center z-10 bg-white"
                            >
                                {/* Skeleton Circle - matches actual digipan size and position */}
                                <div className="relative w-full h-full">
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-[85vw] max-w-[360px] aspect-square rounded-full bg-gradient-to-br from-white/10 to-white/5 animate-pulse" />
                                    </div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-[85vw] max-w-[360px] aspect-square flex items-center justify-center">
                                            <div className="w-[30%] h-[30%] rounded-full bg-white/10 animate-pulse" />
                                        </div>
                                    </div>
                                    {/* Orbiting dots */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-[85vw] max-w-[360px] aspect-square relative animate-spin" style={{ animationDuration: '3s' }}>
                                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white/20" />
                                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white/20" />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {!isLoaded && (
                        <div className="absolute top-2 left-2 px-2 py-1 bg-black/40 backdrop-blur-md rounded text-[10px] text-white/40 pointer-events-none z-20">
                            Preloading Sounds: {loadingProgress}%
                        </div>
                    )}
                </div>

                {/* === Layer 1.2: Score Area (Top, right below header) === */}
                <div className="absolute top-[120px] left-0 w-full h-[15%] z-[2] flex items-end justify-center bg-white overflow-hidden border-b border-white">
                    {currentSong.xmlSrc && midiData ? (
                        <div className="w-full h-full relative flex items-center">
                            {/* Vertical Playhead Line (Fixed Position - Center) */}
                            <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[2px] bg-red-500/80 z-20 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                            <div className="w-full h-[120px]">
                                <OSMDScore
                                    ref={scoreRef}
                                    musicXmlUrl={currentSong.xmlSrc}
                                    drawCredits={false}
                                    autoResize={true}
                                    externalBpm={midiData.bpm}
                                    loopStartTime={loopStart !== null ? loopStart - Math.max(0, midiFirstNoteTimeRef.current - scoreFirstNoteTimeRef.current) : null}
                                    loopEndTime={loopEnd !== null ? loopEnd - Math.max(0, midiFirstNoteTimeRef.current - scoreFirstNoteTimeRef.current) : null}
                                    onScoreLoaded={(time) => {
                                        scoreFirstNoteTimeRef.current = time;
                                        console.log('[Practice] Score loaded. First note time:', time);
                                    }}
                                />
                            </div>
                        </div>
                    ) : currentSong.xmlSrc ? (
                        /* Loading state while MIDI loads */
                        <div className="mb-4 text-black/30 font-medium text-xs tracking-widest">
                            Loading...
                        </div>
                    ) : (
                        /* Placeholder for songs without score */
                        <div className="mb-4 text-black/20 font-bold text-xs tracking-widest border border-black/10 px-4 py-2 rounded-full">
                            NO SCORE
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
                {
                    recordState !== 'reviewing' && (
                        <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-between">

                            <header className="relative flex items-center justify-center px-4 py-8 bg-white pointer-events-auto">
                                <Link
                                    href="/playground"
                                    className="absolute left-4 w-10 h-10 rounded-full bg-black/5 flex items-center justify-center text-black/60 hover:text-black hover:bg-black/10 transition-all border border-black/5"
                                >
                                    <ArrowLeft size={20} />
                                </Link>
                                <motion.button
                                    onClick={() => setShowScaleSelector(true)}
                                    key={targetScale.id}
                                    initial={{ y: -10, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    className="flex flex-col items-center group active:scale-95 transition-transform max-w-[200px]"
                                >
                                    <div className="flex items-center gap-1.5 w-full justify-center">
                                        <h1 className="text-black font-normal text-sm tracking-normal truncate">
                                            {currentSong.title}
                                        </h1>
                                        <ChevronDown size={18} className="text-black/60 group-hover:text-black/80 transition-colors mt-0.5 flex-shrink-0" />
                                    </div>
                                </motion.button>
                            </header>




                            <div className="flex-1 min-h-[100px]" />

                            <footer className="w-full px-6 py-4 pb-6 bg-white pointer-events-auto min-h-[126px] flex items-center justify-center relative z-30">
                                {/* Stop/Reset Button (Left of Play, same height) */}
                                <button
                                    className={`absolute right-1/2 mr-10 w-11 h-11 rounded-full border backdrop-blur-xl flex items-center justify-center transition-all active:scale-95 bg-slate-900/80 border-slate-700/50 text-white/80 hover:bg-slate-800 hover:text-white z-40 ${!midiData ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    onClick={stopMidiPlay}
                                    disabled={!midiData}
                                >
                                    <Square size={16} fill="currentColor" />
                                </button>

                                {/* Play/Pause Button (Centered) */}
                                <button
                                    className={`w-14 h-14 rounded-full border backdrop-blur-xl flex items-center justify-center transition-all active:scale-95 shadow-lg z-40 ${isMidiPlaying && !isPaused
                                        ? 'bg-slate-900/90 border-slate-700/60 text-white'
                                        : 'bg-slate-900/80 border-slate-700/50 text-white hover:bg-slate-800'
                                        } ${!midiData ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    onClick={handleTogglePlay}
                                    disabled={!midiData}
                                >
                                    {isMidiPlaying && !isPaused ? (
                                        <Pause size={24} fill="currentColor" />
                                    ) : (
                                        <Play size={24} fill="currentColor" />
                                    )}
                                </button>

                                {/* Loop Button (Right of Play, same height) */}
                                <button
                                    className={`absolute left-1/2 ml-10 w-11 h-11 rounded-full border backdrop-blur-xl flex items-center justify-center transition-all active:scale-95 z-40 ${loopState === 'none'
                                        ? 'bg-slate-900/80 border-slate-700/50 text-white/80'
                                        : loopState === 'start_set'
                                            ? 'bg-emerald-500/90 border-emerald-400/70 text-white'
                                            : 'bg-blue-500/90 border-blue-400/70 text-white animate-pulse'
                                        } ${!midiData ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    onClick={handleLoopButton}
                                    disabled={!midiData}
                                >
                                    <Repeat2 size={18} />
                                    {/* State indicator */}
                                    {loopState === 'start_set' && (
                                        <span className="absolute -top-1 -right-1 text-[8px] font-bold bg-emerald-500 text-black rounded-full w-4 h-4 flex items-center justify-center">A</span>
                                    )}
                                    {loopState === 'loop_active' && (
                                        <span className="absolute -top-1 -right-1 text-[8px] font-bold bg-blue-500 text-white rounded-full px-1 h-4 flex items-center justify-center">A-B</span>
                                    )}
                                </button>
                            </footer>
                        </div>
                    )
                }

                {/* === Layer 3.5: Drum Settings Popup === */}
                <AnimatePresence>
                    {showDrumSettings && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
                            onClick={() => setShowDrumSettings(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.9, y: 20 }}
                                className="w-full max-w-xs bg-zinc-900 border border-white/10 rounded-[32px] p-6 shadow-2xl"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                                            <Drum size={16} className="text-orange-400" />
                                        </div>
                                        <h3 className="text-white font-bold tracking-tight">Drum Settings</h3>
                                    </div>
                                    <button
                                        onClick={() => setShowDrumSettings(false)}
                                        className="text-white/40 hover:text-white"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="flex flex-col gap-6">
                                    {/* BPM Control */}
                                    <div className="flex flex-col gap-3">
                                        <div className="flex justify-between items-center px-1">
                                            <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Tempo</span>
                                            <span className="text-xl font-mono font-bold text-orange-400">{drumBpm} <span className="text-[10px] text-white/20 uppercase">BPM</span></span>
                                        </div>
                                        <input
                                            type="range"
                                            min="60"
                                            max="180"
                                            value={drumBpm}
                                            onChange={(e) => setDrumBpm(parseInt(e.target.value))}
                                            className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-orange-500"
                                        />
                                    </div>

                                    {/* Time Signature */}
                                    <div className="flex flex-col gap-3">
                                        <span className="text-xs font-bold text-white/40 uppercase tracking-widest px-1">Time Signature</span>
                                        <div className="grid grid-cols-3 gap-2">
                                            {['3/4', '4/4', '6/8'].map((ts) => (
                                                <button
                                                    key={ts}
                                                    onClick={() => setDrumTimeSignature(ts)}
                                                    className={`py-2.5 rounded-xl text-sm font-bold transition-all
                                                         ${drumTimeSignature === ts
                                                            ? 'bg-orange-500 text-black'
                                                            : 'bg-white/5 text-white/60 hover:bg-white/10'}
                                                     `}
                                                >
                                                    {ts}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Pattern Selection */}
                                    <div className="flex flex-col gap-3">
                                        <span className="text-xs font-bold text-white/40 uppercase tracking-widest px-1">Preset</span>
                                        <div className="grid grid-cols-1 gap-2">
                                            {['Basic 8-beat', 'Funky Groove', 'Lofi Chill'].map((p) => (
                                                <button
                                                    key={p}
                                                    onClick={() => {
                                                        // 1. 프리셋 변경 (BPM 유지)
                                                        setDrumPattern(p);
                                                        // NOTE: BPM 자동 변경 비활성화 (Seamless Transition 위해)
                                                        /*
                                                        if (p === 'Basic 8-beat') setDrumBpm(90);
                                                        else if (p === 'Funky Groove') setDrumBpm(100);
                                                        else if (p === 'Jazz Swing') setDrumBpm(120);
                                                        else if (p === 'Lofi Chill') setDrumBpm(80);
                                                        */

                                                        // 2. [UX 개선] 즉시 재생 (Audition Mode)
                                                        // 프리셋을 누르면 바로 소리가 나야 사용자가 알 수 있음
                                                        Tone.start();
                                                        setIsDrumPlaying(true);
                                                    }}
                                                    className={`px-4 py-3 rounded-2xl text-sm font-medium transition-all text-left flex items-center justify-between
                                                          ${drumPattern === p
                                                            ? 'bg-orange-500 text-black'
                                                            : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
                                                >
                                                    {p === 'Basic 8-beat' ? 'Basic 8-beat (90BPM)' :
                                                        p === 'Funky Groove' ? 'Funky Groove (100BPM)' :
                                                            p === 'Lofi Chill' ? 'Lofi Chill (70BPM)' : p}
                                                    {drumPattern === p && <Check size={16} />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>


                <AnimatePresence>
                    {showScaleSelector && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="absolute inset-0 z-[100] bg-black/60 backdrop-blur-[40px] flex flex-col pointer-events-auto"
                        >
                            <div className="flex items-center justify-between px-6 py-6 border-b border-white/[0.08]">
                                <h2 className="text-white font-bold text-sm tracking-[0.25em] uppercase opacity-90">Select Song</h2>
                                <button
                                    onClick={() => setShowScaleSelector(false)}
                                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all border border-white/[0.05]"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar flex flex-col gap-4">
                                {/* Songs List */}
                                <div className="grid grid-cols-1 gap-3 pb-20">
                                    {PRACTICE_SONGS.map((song) => {
                                        const isSelected = currentSong.id === song.id;
                                        return (
                                            <div
                                                key={song.id}
                                                role="button"
                                                onClick={() => {
                                                    setCurrentSong(song);
                                                    // Auto-switch scale based on song's scale name
                                                    const matchedScale = SCALES.find(s => s.name === song.scaleName);
                                                    if (matchedScale) {
                                                        setTargetScale(matchedScale);
                                                    }
                                                    setShowScaleSelector(false);
                                                }}
                                                className={`p-4 rounded-[32px] text-left transition-all duration-300 flex items-center justify-between group relative overflow-hidden border ${isSelected
                                                    ? 'cursor-default bg-slate-300/[0.06] backdrop-blur-md border-slate-300/30'
                                                    : 'cursor-pointer bg-white/[0.02] border-white/[0.05] text-white hover:bg-slate-300/[0.08] hover:border-slate-300/30'
                                                    }`}
                                            >
                                                <div className="flex items-center z-10 flex-1 min-w-0 pr-4">
                                                    <span className={`font-black text-xl tracking-tight truncate ${isSelected ? 'text-white' : 'text-white/90'}`}>
                                                        {song.title}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3 z-10 shrink-0">
                                                    <span className="text-xs font-medium text-white/40 uppercase tracking-wider">
                                                        {song.scaleName}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                        </motion.div>
                    )}
                </AnimatePresence>

                {/* === Layer 6: Countdown Overlay REMOVED (Now using 3D externalTouchText) === */}

            </main >

            {/* ============================================================
                LAYER 5: Review Overlay (녹화 완료 시에만 등장)
                - 여기가 '3가지 선택지'가 나오는 핵심 UI입니다.
            ============================================================= */}
            <AnimatePresence>
                {
                    recordState === 'reviewing' && (
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
                                        src={recordedVideoUrl || undefined}
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

                            {/* Action Bar (Compact Bottom Bar) */}
                            <motion.div
                                initial={{ y: 60, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: 60, opacity: 0 }}
                                transition={{ duration: 0.25, delay: 0.1 }}
                                className="w-full max-w-md bg-zinc-900/95 border-t border-white/10 rounded-t-2xl px-5 py-3 flex items-center justify-center gap-4 shadow-2xl backdrop-blur-xl"
                            >
                                {/* Retake (Red) */}
                                <button
                                    onClick={handleDiscardRecording}
                                    className="w-11 h-11 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500/30 transition active:scale-95"
                                    aria-label="Retake"
                                >
                                    <RefreshCcw size={20} />
                                </button>

                                {/* Time Badge */}
                                <span className="px-3 py-1.5 rounded-full bg-white/10 text-white/80 text-sm font-mono tracking-wider">
                                    {formatTime(recordTimer)}
                                </span>

                                {/* Save */}
                                <button
                                    onClick={handleSaveRecording}
                                    className="w-11 h-11 rounded-full bg-zinc-800 flex items-center justify-center text-white hover:bg-zinc-700 transition active:scale-95"
                                    aria-label="Save"
                                >
                                    <Download size={20} />
                                </button>

                                {/* Share */}
                                <button
                                    onClick={handleShareRecording}
                                    className="w-11 h-11 rounded-full bg-white flex items-center justify-center text-black hover:bg-gray-100 shadow-md transition active:scale-95"
                                    aria-label="Share"
                                >
                                    <Share2 size={20} />
                                </button>
                            </motion.div>
                        </motion.div>
                    )
                }
            </AnimatePresence >

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
        </div >
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
