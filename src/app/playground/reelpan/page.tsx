"use client";

import { Suspense, useMemo, useState, useRef, useEffect, use } from "react";
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { motion, AnimatePresence } from "framer-motion";
import { SCALES } from '@/data/handpanScales';
import { Layout, Check, Square, Circle, Smartphone, Keyboard, Play, Pause, Volume2, Download, Trash2, X, Type, ChevronDown, Share2, RefreshCcw, Drum, SlidersHorizontal, Settings2, Sparkles, ArrowLeft, Music2 } from 'lucide-react';
import { Digipan3DHandle } from "@/components/digipan/Digipan3D";
import { useHandpanAudio } from "@/hooks/useHandpanAudio";
import { getNoteFrequency } from "@/constants/noteFrequencies";
import * as Tone from 'tone';
import { useLoungeDrum } from '@/hooks/useLoungeDrum';

const Digipan9 = dynamic(() => import('@/components/digipan/Digipan9'), { ssr: false });
const Digipan10 = dynamic(() => import('@/components/digipan/Digipan10'), { ssr: false });
const Digipan11 = dynamic(() => import('@/components/digipan/Digipan11'), { ssr: false });
const Digipan12 = dynamic(() => import('@/components/digipan/Digipan12'), { ssr: false });
const Digipan14 = dynamic(() => import('@/components/digipan/Digipan14'), { ssr: false });
const Digipan14M = dynamic(() => import('@/components/digipan/Digipan14M'), { ssr: false });
const Digipan15M = dynamic(() => import('@/components/digipan/Digipan15M'), { ssr: false });
const Digipan18M = dynamic(() => import('@/components/digipan/Digipan18M'), { ssr: false });

// 화음반주 아이콘 컴포넌트 (겹쳐진 음표들로 화음 표현)
const PianoKeysIcon = ({ size = 18, className = '' }: { size?: number; className?: string }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        {/* 화음반주: 여러 음표가 겹쳐진 모양 */}
        {/* 첫 번째 음표 (왼쪽, 위) */}
        <ellipse cx="8" cy="7" rx="3" ry="2.5" fill="currentColor" opacity="0.9" />
        <line x1="10.5" y1="7" x2="10.5" y2="16" stroke="currentColor" strokeWidth="1.5" opacity="0.9" />

        {/* 두 번째 음표 (중앙, 중간) */}
        <ellipse cx="12" cy="10" rx="3" ry="2.5" fill="currentColor" opacity="0.8" />
        <line x1="14.5" y1="10" x2="14.5" y2="18" stroke="currentColor" strokeWidth="1.5" opacity="0.8" />

        {/* 세 번째 음표 (오른쪽, 아래) */}
        <ellipse cx="16" cy="13" rx="3" ry="2.5" fill="currentColor" opacity="0.7" />
        <line x1="18.5" y1="13" x2="18.5" y2="20" stroke="currentColor" strokeWidth="1.5" opacity="0.7" />
    </svg>
);

// 상태 정의: 대기중 | 녹화중 | 검토중(완료후)
type RecordState = 'idle' | 'recording' | 'reviewing';

export default function ReelPanPage(props: { params: Promise<Record<string, never>> }) {
    // Unwrap params to satisfy Next.js 16 requirement
    // params is not used in this component, but must be unwrapped to avoid enumeration errors
    const _params = use(props.params);
    // 1. State Management
    const [recordState, setRecordState] = useState<RecordState>('idle');
    const [isRecording, setIsRecording] = useState(false); // 기존 호환성 유지
    const [layoutMode, setLayoutMode] = useState<'reel' | 'square'>('reel');
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [showScaleSelector, setShowScaleSelector] = useState(false);
    const [targetScale, setTargetScale] = useState(SCALES.find(s => s.id === 'd_kurd_10') || SCALES[0]);
    const [previewingScaleId, setPreviewingScaleId] = useState<string | null>(null);
    const [isChordPlaying, setIsChordPlaying] = useState(false); // Chord Pad 반주 토글
    const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
    const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<0 | 1 | 2 | 3 | 4>(2); // 2 = Labels Visible, 3 = Labels Hidden
    const [isScaleLoading, setIsScaleLoading] = useState(false); // 스케일 전환 로딩 상태
    const [isPageReady, setIsPageReady] = useState(false); // 페이지 초기 로딩 상태

    // Drum State
    const [isDrumPlaying, setIsDrumPlaying] = useState(false);
    const [showDrumSettings, setShowDrumSettings] = useState(false);
    const [drumBpm, setDrumBpm] = useState(100);
    const [drumPattern, setDrumPattern] = useState('Basic 8-beat');
    const [drumTimeSignature, setDrumTimeSignature] = useState('4/4');

    // Chord Settings State
    const [showChordSettings, setShowChordSettings] = useState(false);
    const [chordProgressionType, setChordProgressionType] = useState('Cinematic 1-6-4-5');
    const [chordPadPreset, setChordPadPreset] = useState('Dreamy Pad');

    // Chord Pad State (독립적 시스템 - Scale Recommender와 분리)
    const chordPadSynthRef = useRef<Tone.PolySynth | null>(null);
    const chordPartRef = useRef<Tone.Part | null>(null);
    const chordMasterGainRef = useRef<Tone.Gain | null>(null);
    const chordEffectsRef = useRef<Tone.ToneAudioNode[]>([]);
    const chordSetsRef = useRef<{ barStart: number; notes: string[]; role: string }[]>([]);

    // Ref for independent drum/chord control
    const isDrumPlayingRef = useRef(false);
    const isChordPlayingRef = useRef(false);

    // 녹화 타이머용
    const [recordTimer, setRecordTimer] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // 롱프레스 타이머용
    const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isLongPressActive = useRef(false);
    const chordLongPressTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isChordLongPressActive = useRef(false);

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
    // 🍸 MODERN LOUNGE HOOK (Deep House)
    // ═══════════════════════════════════════════════════════════════════════════
    const [masterGainNode, setMasterGainNode] = useState<Tone.Gain | null>(null);
    const { kickRef: loungeKickRef, snareRef: loungeSnareRef, hatRef: loungeHatRef } = useLoungeDrum(masterGainNode);

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
        setMasterGainNode(masterGain);

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
    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Chord Pad Master Bus (독립적)
        const chordMasterGain = new Tone.Gain(0.35).toDestination();
        chordMasterGainRef.current = chordMasterGain;

        // Reverb + Delay Effect Chain
        const reverb = new Tone.Reverb({ decay: 8, wet: 0.4, preDelay: 0.1 }).connect(chordMasterGain);
        const delay = new Tone.PingPongDelay({ delayTime: "4n.", feedback: 0.3, wet: 0.2 }).connect(reverb);
        const chorus = new Tone.Chorus({ frequency: 0.3, delayTime: 4, depth: 0.6, spread: 180 }).connect(delay).start();

        // PAD Synth (dreamy triangle waves)
        chordPadSynthRef.current = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: "fattriangle", count: 3, spread: 30 },
            envelope: { attack: 2.0, decay: 1.5, sustain: 0.9, release: 3.0, attackCurve: "exponential" },
            volume: -12
        });
        chordPadSynthRef.current.maxPolyphony = 6;
        chordPadSynthRef.current.connect(chorus);

        chordEffectsRef.current = [chordMasterGain, reverb, delay, chorus];

        return () => {
            chordPadSynthRef.current?.dispose();
            chordPartRef.current?.dispose();
            chordEffectsRef.current.forEach(e => e.dispose());
        };
    }, []);

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

    // [Drum Engine] Pattern Management
    useEffect(() => {
        if (typeof window === 'undefined') return;

        // ★ Play 상태가 아니면 루프 스케줄링 하지 않음 (리소스 절약 및 즉시 시작 보장)
        if (!isDrumPlaying) return;

        Tone.Transport.bpm.value = drumBpm;

        // [User Request] Seamless Transition: BPM 변경 없이 프리셋만 변경
        // Phase Reset 로직 비활성화 -> 현재 비트(Step) 유지하며 자연스럽게 패턴만 바뀜
        /*
        if (isDrumPlayingRef.current) {
            const secondsPerStep = 60 / drumBpm / 4;
            drumStartOffsetRef.current = Math.round(Tone.Transport.seconds / secondsPerStep);
        }
        */

        // 🎷 Jazz Swing Logic Removed
        Tone.Transport.swing = 0;          // 스윙 없음

        // Pattern logic based on drumPattern & drumTimeSignature
        // ★ 킥 피치는 drumPitchRef.current (딩 피치 - 1옥타브)와 연결됨
        // [FIX] startTime 제거 (Tone.js Default: Current Transport Time)
        const loopId = Tone.Transport.scheduleRepeat((time) => {
            // ★ 드럼 버튼이 활성화된 경우에만 소리 재생
            if (!isDrumPlayingRef.current) return;

            // Derive step from Transport seconds to ensure reset on stop()
            // 4 steps per beat (16th notes)
            const secondsPerStep = 60 / drumBpm / 4;
            const absoluteStep = Math.round(Tone.Transport.seconds / secondsPerStep);

            // ★ 드럼 시작 오프셋을 빼서 항상 step 0부터 시작
            const relativeStep = absoluteStep - drumStartOffsetRef.current;

            const is68 = drumTimeSignature === '6/8';
            const is34 = drumTimeSignature === '3/4';
            const division = is68 ? 12 : (is34 ? 12 : 16); // 3/4도 12 step (3박 × 4)
            const step = ((relativeStep % division) + division) % division; // 음수 방지

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
                    // 요청: "더 펑키하게, 리듬을 쪼개달라" -> 16비트 하이햇 & 고스트 노트 추가

                    // 1. Hi-Hat: 16분음표 연속 연주 (Funky Feel)
                    // 강약: 강(0) 약(1) 중(2) 약(3)...
                    let hatVel = 0.1;
                    if (step % 4 === 0) hatVel = 0.3;      // Downbeat (강)
                    else if (step % 2 === 0) hatVel = 0.2; // Upbeat '&' (중)

                    hatSynthRef.current?.triggerAttackRelease("32n", time, hatVel);

                    // 2. Kick: 펑키한 싱코페이션
                    // 0(One), 3(1'e&'a), 10(3'e&'a')
                    if (step === 0) kickSynthRef.current?.triggerAttackRelease(drumPitchRef.current, "8n", time, 0.8);
                    if (step === 3) kickSynthRef.current?.triggerAttackRelease(drumPitchRef.current, "8n", time, 0.5); // Ghost Kick
                    if (step === 10) kickSynthRef.current?.triggerAttackRelease(drumPitchRef.current, "8n", time, 0.7);

                    // 3. Snare: Backbeat + Ghost Notes
                    // Main: 4, 12
                    // Ghost: 7("2e&'a'"), 9("3e'&'a"), 15("4e&'a'")
                    if (step === 4 || step === 12) {
                        snareSynthRef.current?.triggerAttackRelease("8n", time, 0.6);
                    } else if (step === 7 || step === 9 || step === 15) {
                        snareSynthRef.current?.triggerAttackRelease("16n", time, 0.15); // Ghost Snare
                    }
                }
                else if (drumPattern === 'Modern Lounge') {
                    // ═══════════════════════════════════════════════════════════════
                    // 🍸 MODERN LOUNGE (Deep House): Boots-Cats Groove
                    // ═══════════════════════════════════════════════════════════════
                    // Spec:
                    // Kick: 0, 4, 8, 12 (Every beat, Four-on-the-floor, Metronome)
                    // Snare (Clap): 4, 12 (Backbeat)
                    // Hat (Open): 2, 6, 10, 14 (Off-beat 'And')
                    // Ghost Hat: 0, 8 (Weak)

                    // 1. Kick (The Metronome) - Low Pitch (C1~C2 range)
                    // Deep House needs punchy but steady kick.
                    if (step % 4 === 0) {
                        // Kick Pitch: Ensure it's not too low.
                        // drumPitchRef.current is usually Ding-1octave.
                        loungeKickRef.current?.triggerAttackRelease(drumPitchRef.current, "8n", time, 1.0);
                    }

                    // 2. Snare (The Clap) - Tight Backbeat
                    if (step === 4 || step === 12) {
                        loungeSnareRef.current?.triggerAttackRelease("16n", time, 0.8);
                    }

                    // 3. Hat (The Groove) - Open Hat on Off-beats, Closed on Downbeats
                    if (step === 2 || step === 6 || step === 10 || step === 14) {
                        // Open Hat (Strong off-beat)
                        loungeHatRef.current?.triggerAttackRelease("16n", time, 0.8);
                    } else if (step === 0 || step === 8) {
                        // Closed Hat (Ghost notes on downbeats to glue rhythm)
                        // Trigger with very short release or lower volume
                        loungeHatRef.current?.triggerAttackRelease("32n", time, 0.1);
                    }
                }
                else if (drumPattern === 'Lofi Chill') {
                    // ═══════════════════════════════════════════════════════════════
                    // 🎧 LOFI CHILL: Basic 8-beat Rhythm + Lofi Tones
                    // ═══════════════════════════════════════════════════════════════
                    // 요청: "박자/리듬을 Basic 8-beat와 동일하게 설정하되 톤은 유지"

                    // Kick: 1박, 3박 (step 0, 8)
                    if (step === 0 || step === 8) {
                        lofiKickSynthRef.current?.triggerAttackRelease(drumPitchRef.current, "8n", time, 0.8);
                    }

                    // Snare: 2박, 4박 (step 4, 12)
                    if (step === 4 || step === 12) {
                        lofiSnareSynthRef.current?.triggerAttackRelease("8n", time, 0.5);
                    }

                    // Hat: 8th notes (정박마다)
                    if (step % 2 === 0) {
                        const isAccent = step % 4 === 0;
                        lofiHatSynthRef.current?.triggerAttackRelease("32n", time, isAccent ? 0.3 : 0.15);
                    }
                }
            }
            // ===== 3/4 박자 (Waltz) =====
            else if (is34) {
                if (drumPattern === 'Basic 8-beat') {
                    // 3/4 Waltz 기본 패턴
                    if (step === 0) kickSynthRef.current?.triggerAttackRelease(drumPitchRef.current, "8n", time, 0.8);
                    if (step === 4 || step === 8) snareSynthRef.current?.triggerAttackRelease("8n", time, 0.4);
                    if (step % 2 === 0) hatSynthRef.current?.triggerAttackRelease("32n", time, 0.15);
                }
                else if (drumPattern === 'Funky Groove') {
                    // ★ Funky Groove 3/4: 발라드 스타일
                    // 킥: Step 0 (강)
                    if (step === 0) {
                        kickSynthRef.current?.triggerAttackRelease(drumPitchRef.current, "8n", time, 0.8);
                    }
                    // 스네어: Step 4, 8 (가볍게 탭)
                    if (step === 4 || step === 8) {
                        const snareVel = 0.35;
                        snareSynthRef.current?.triggerAttackRelease("8n", time, snareVel);
                    }
                    // 하이햇: 매 박자 쪼개기 (0, 2, 4, 6, 8, 10)
                    if (step % 2 === 0) {
                        const hatVel = step === 0 ? 0.2 : 0.12;
                        hatSynthRef.current?.triggerAttackRelease("32n", time, hatVel);
                    }
                }
                else if (drumPattern === 'Modern Lounge') {
                    // 🍸 MODERN LOUNGE 3/4
                    // Kick: 0 (Downbeat)
                    // Clap: 4, 8 (Beats 2, 3)
                    // Hat: Off-beats (2, 6, 10)

                    if (step === 0) {
                        loungeKickRef.current?.triggerAttackRelease(drumPitchRef.current, "4n", time, 1.0);
                    }
                    if (step === 4 || step === 8) {
                        loungeSnareRef.current?.triggerAttackRelease("16n", time, 0.7);
                    }
                    if (step === 2 || step === 6 || step === 10) {
                        loungeHatRef.current?.triggerAttackRelease("16n", time, 0.6);
                    }
                }
                else if (drumPattern === 'Lofi Chill') {
                    // ═══════════════════════════════════════════════════════════════
                    // 🎧 LOFI CHILL 3/4: Lazy Waltz
                    // ═══════════════════════════════════════════════════════════════
                    // 12 steps = 3박 × 4
                    // Kick: Step 0 (1박)
                    // Snare: Step 4 (2박, Delayed), Step 8 (3박, Delayed)
                    // Hat: 8분음표 (Lazy Micro-timing)
                    // ───────────────────────────────────────────────────────────────

                    const humanize = () => (Math.random() - 0.5) * 0.2;
                    const lazyDelay = 0.035 + Math.random() * 0.02;

                    // 🦵 KICK: 1박에만 묵직하게
                    if (step === 0) {
                        lofiKickSynthRef.current?.triggerAttackRelease(drumPitchRef.current, "4n", time, 0.7 + humanize());
                    }

                    // 🪘 SNARE: 2박, 3박에 Lazy하게
                    if (step === 4 || step === 8) {
                        lofiSnareSynthRef.current?.triggerAttackRelease("16n", time + lazyDelay, 0.5 + humanize());
                    }

                    // 🎩 HAT: 8분음표
                    if (step % 2 === 0) {
                        const isDownbeat = step === 0 || step === 4 || step === 8;
                        const shakerVel = isDownbeat ? 0.25 : 0.35;
                        lofiHatSynthRef.current?.triggerAttackRelease("16n", time + lazyDelay * 0.5, shakerVel + humanize());
                    }
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
                    // ★ Funky Groove 6/8: 어쿠스틱 팝 그루브 스타일
                    // 6/8 = 12 steps (셔플 느낌의 복합박자)
                    // 
                    // 킥: Step 0 (1박 강) + Step 9 (서브 펀치, 다음 박 앞당김)
                    if (step === 0) {
                        kickSynthRef.current?.triggerAttackRelease(drumPitchRef.current, "8n", time, 0.8);
                    }
                    if (step === 9) {
                        // 서브 펀치: 리듬감 추가 (약하게)
                        kickSynthRef.current?.triggerAttackRelease(drumPitchRef.current, "8n", time, 0.45);
                    }
                    // 스네어: Step 6 (백비트) + Step 11 (고스트 노트)
                    if (step === 6) {
                        snareSynthRef.current?.triggerAttackRelease("8n", time, 0.55);
                    }
                    if (step === 11) {
                        // 고스트 노트: 다음 마디 진입 전 살짝 리프트
                        snareSynthRef.current?.triggerAttackRelease("16n", time, 0.18);
                    }
                    // 하이햇: 8분음표 간격 (step 0, 2, 4, 6, 8, 10)
                    // 삼분할 느낌 악센트: 1박(0), 2박(4), 4박(6), 5박(8)
                    if (step % 2 === 0) {
                        let hatVel = 0.12;
                        if (step === 0 || step === 6) hatVel = 0.28;      // 강박
                        else if (step === 4 || step === 8) hatVel = 0.18; // 중간 악센트
                        hatSynthRef.current?.triggerAttackRelease("32n", time, hatVel);
                    }
                }
                else if (drumPattern === 'Modern Lounge') {
                    // 🍸 MODERN LOUNGE 6/8
                    // Kick: 0, 6 (Dotted Quarters)
                    // Clap: 3, 9 (Triplets Backbeat? No, probably 6? Let's do Standard Backbeat feel)
                    // Let's do: Kick 0. Clap 6. (Simple)
                    // Hat: 2, 4, 8, 10?
                    // Standard 6/8 House: Kick on 0, 3, 6, 9 (Driving 4-on-floor feel over triplets)

                    // Kick: 0, 3, 6, 9 (Steps of 3)
                    if (step % 3 === 0) {
                        // Accent 0 and 6 slightly more
                        const vel = (step === 0 || step === 6) ? 1.0 : 0.8;
                        loungeKickRef.current?.triggerAttackRelease(drumPitchRef.current, "8n", time, vel);
                    }
                    // Clap: 6? Or 3, 9?
                    // Let's do Clap on 6.
                    if (step === 6) {
                        loungeSnareRef.current?.triggerAttackRelease("16n", time, 0.8);
                    }
                    // Hat: Offbeats in triplets? (step 1, 2, 4, 5...)
                    // Let's do Open Hat on 2, 5, 8, 11 (The "Ah" of 1-and-ah)
                    if (step === 2 || step === 5 || step === 8 || step === 11) {
                        loungeHatRef.current?.triggerAttackRelease("16n", time, 0.5);
                    }
                }
                else if (drumPattern === 'Lofi Chill') {
                    // ═══════════════════════════════════════════════════════════════
                    // 🎧 LOFI CHILL 6/8: Lazy Compound
                    // ═══════════════════════════════════════════════════════════════
                    // 12 steps = 2그룹 × 6
                    // Kick: Step 0 (1박)
                    // Snare: Step 6 (4박 Backbeat, Delayed)
                    // Hat: 8분음표 (Lazy Micro-timing)
                    // ───────────────────────────────────────────────────────────────

                    const humanize = () => (Math.random() - 0.5) * 0.2;
                    const lazyDelay = 0.035 + Math.random() * 0.02;

                    // 🦵 KICK (1박)
                    if (step === 0) {
                        lofiKickSynthRef.current?.triggerAttackRelease(drumPitchRef.current, "4n", time, 0.7 + humanize());
                    }
                    // Step 8 (5박 뒷박?) 아니면 Step 10? -> Step 10 (6박 앞)에 살짝
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

    }, [drumBpm, drumPattern, drumTimeSignature, isDrumPlaying]);

    // [Drum Engine] Playback Sync
    useEffect(() => {
        isDrumPlayingRef.current = isDrumPlaying; // Ref 동기화

        if (isDrumPlaying) {
            Tone.start();

            // ★ 드럼 시작 오프셋 설정 (항상 step 0부터 시작)
            const secondsPerStep = 60 / drumBpm / 4;
            const currentAbsoluteStep = Math.round(Tone.Transport.seconds / secondsPerStep);
            drumStartOffsetRef.current = currentAbsoluteStep;

            // 화음이 재생 중이 아닐 때만 Transport position 리셋
            if (!isChordPlayingRef.current) {
                Tone.Transport.position = 0;
                drumStartOffsetRef.current = 0; // Transport도 리셋했으므로 오프셋도 0
            }
            if (Tone.Transport.state !== 'started') {
                Tone.Transport.start();
            }
        } else {
            // 드럼 끄려는데 화음도 꺼져있으면 Transport 중지 및 위치 초기화
            if (!isChordPlayingRef.current) {
                Tone.Transport.position = 0;
                Tone.Transport.stop();
            }
        }
    }, [isDrumPlaying, drumBpm]);

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

    // Chord Long Press Handlers
    const handleChordDown = (e: React.PointerEvent) => {
        (e.target as HTMLElement).setPointerCapture(e.pointerId);

        isChordLongPressActive.current = false;
        chordLongPressTimerRef.current = setTimeout(() => {
            isChordLongPressActive.current = true;
            setShowChordSettings(true);
        }, 600);
    };

    const handleChordUp = (e: React.PointerEvent) => {
        if (chordLongPressTimerRef.current) {
            clearTimeout(chordLongPressTimerRef.current);
            chordLongPressTimerRef.current = null;
        }

        if (!isChordLongPressActive.current) {
            // 짧게 눌렀을 때만 토글
            handleChordToggle();
        }
        isChordLongPressActive.current = false;
    };

    useEffect(() => {
        if (!showScaleSelector) stopPreview();
    }, [showScaleSelector]);

    // [Chord Pad] 스케일 변경 시 화음 진행 계산 (독립 로직)
    useEffect(() => {
        if (!targetScale?.notes) return;

        const allNotes = [targetScale.notes.ding, ...targetScale.notes.top, ...targetScale.notes.bottom];
        if (allNotes.length < 5) return;

        // 인라인 calculateChordProgression (Scale Recommender 의존 없이)
        const noteToMidi = new Map<string, number>();
        const midiToNote = new Map<number, string>();

        allNotes.forEach(note => {
            const midi = Tone.Frequency(note).toMidi();
            noteToMidi.set(note, midi);
            midiToNote.set(midi, note);
        });

        const sortedMidis = Array.from(noteToMidi.values()).sort((a, b) => a - b);

        const findHarmonicNotes = (rootNote: string): string[] => {
            const rootMidi = noteToMidi.get(rootNote);
            if (rootMidi === undefined) return [rootNote];

            const chordNotes = [rootNote];
            const perfectFifth = sortedMidis.find(m => Math.abs(m - (rootMidi + 7)) <= 1);
            const minor3rd = sortedMidis.find(m => m === rootMidi + 3);
            const major3rd = sortedMidis.find(m => m === rootMidi + 4);

            if (minor3rd) chordNotes.push(midiToNote.get(minor3rd)!);
            else if (major3rd) chordNotes.push(midiToNote.get(major3rd)!);

            if (perfectFifth) {
                chordNotes.push(midiToNote.get(perfectFifth)!);
            } else {
                const octave = sortedMidis.find(m => m === rootMidi + 12);
                if (octave) chordNotes.push(midiToNote.get(octave)!);
            }
            return chordNotes;
        };

        const len = allNotes.length;
        const progressionIndices = [
            { idx: 0, bar: 1, role: "Root (i)" },
            { idx: 5 % len, bar: 5, role: "VI" },
            { idx: 3 % len, bar: 9, role: "iv" },
            { idx: 4 % len, bar: 13, role: "V" }
        ];

        chordSetsRef.current = progressionIndices.map(prog => ({
            barStart: prog.bar,
            notes: findHarmonicNotes(allNotes[prog.idx]),
            role: prog.role
        }));

        // 재생 중이면 스케일 변경 시 중지
        if (isChordPlaying && chordPartRef.current) {
            chordPartRef.current.stop();
            chordPadSynthRef.current?.releaseAll();
            setIsChordPlaying(false);
        }
    }, [targetScale]);

    // [Chord Pad] 화음 반주 토글 핸들러
    const handleChordToggle = async () => {
        await Tone.start();

        if (isChordPlaying) {
            // STOP - 화음 중지
            isChordPlayingRef.current = false;
            chordPartRef.current?.stop();
            chordPadSynthRef.current?.releaseAll();
            setIsChordPlaying(false);

            // 화음 끄려는데 드럼도 꺼져있으면 Transport 중지
            // ★ 드럼이 재생 중이면 Transport 위치를 초기화하지 않음
            if (!isDrumPlayingRef.current) {
                Tone.Transport.position = 0;
                Tone.Transport.stop();
            }
        } else {
            // START - 화음 시작 (무한 루프)
            const chordSets = chordSetsRef.current;
            if (chordSets.length < 4 || !chordPadSynthRef.current) return;

            // 기존 Part 정리
            if (chordPartRef.current) {
                chordPartRef.current.dispose();
            }

            // BPM 동기화 (드럼 BPM 사용)
            Tone.Transport.bpm.value = drumBpm;

            // 화음 Part 생성 (16마디 무한 루프)
            chordPartRef.current = new Tone.Part((time, value) => {
                const chord = value as { notes: string[]; role: string };
                chordPadSynthRef.current?.triggerAttackRelease(chord.notes, "4m", time);
            }, [
                ["0:0:0", chordSets[0]],
                ["4:0:0", chordSets[1]],
                ["8:0:0", chordSets[2]],
                ["12:0:0", chordSets[3]]
            ]);
            chordPartRef.current.loop = true;
            chordPartRef.current.loopEnd = "16:0:0";

            // ★ 드럼 재생 여부에 따라 시작 방식 결정
            if (isDrumPlayingRef.current) {
                // 드럼이 재생 중이면 즉시 시작 (현재 Transport 시간 기준)
                chordPartRef.current.start("+0");
            } else {
                // 드럼이 없으면 처음부터 시작
                Tone.Transport.position = 0;
                chordPartRef.current.start(0);
            }

            isChordPlayingRef.current = true;
            setIsChordPlaying(true);

            // Transport가 멈춰있으면 시작
            if (Tone.Transport.state !== 'started') {
                Tone.Transport.start();
            }
        }
    };

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
            // 카운트다운 시작
            let count = 4;
            setCountdown(count);

            const interval = setInterval(() => {
                count -= 1;
                if (count > 0) {
                    setCountdown(count);
                } else if (count === 0) {
                    setCountdown('Touch!');
                    startRecording(); // 실제 녹화 시작
                } else {
                    setCountdown(null);
                    clearInterval(interval);
                }
            }, 650); // 사용자의 요청에 따라 0.65초(650ms) 간격으로 조정
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

            <main className="relative w-full max-w-[480px] h-dvh bg-black shadow-2xl overflow-hidden flex flex-col items-center justify-center" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>

                {/* === Layer 0: Initial Page Loading Skeleton === */}
                <AnimatePresence>
                    {!isPageReady && (
                        <motion.div
                            key="page-skeleton"
                            initial={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                            className="absolute inset-0 z-[999] bg-slate-950"
                        >
                            {/* 1. Center: Digipan Skeleton (Background Layer) */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="relative w-[85vw] max-w-[360px] aspect-square">
                                    <div className="w-full h-full rounded-full bg-gradient-to-br from-white/10 to-white/5 animate-pulse" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-[30%] h-[30%] rounded-full bg-white/10 animate-pulse" />
                                    </div>
                                    <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s' }}>
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white/20" />
                                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white/20" />
                                    </div>
                                </div>
                            </div>

                            {/* 2. UI Overlay: Header & Footer (Foreground Layer) */}
                            <div className="absolute inset-0 flex flex-col justify-between">
                                {/* Header Skeleton - matches real header (px-4 py-8, centered scale name) */}
                                <header className="relative flex items-center justify-center px-4 py-8 bg-gradient-to-b from-black/80 to-transparent">
                                    {/* Back button placeholder */}
                                    <div className="absolute left-4 w-10 h-10 rounded-full bg-white/5 animate-pulse" />
                                    {/* Scale name placeholder */}
                                    <div className="flex flex-col items-center gap-1">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-28 h-6 bg-white/10 rounded-md animate-pulse" />
                                            <div className="w-4 h-4 bg-white/10 rounded animate-pulse" />
                                        </div>
                                    </div>
                                </header>

                                {/* Spacer equivalent to keep flex layout consistent if needed, but justify-between handles it */}

                                {/* Footer Skeleton - matches real footer (px-6 py-8 pb-10, min-h-[180px], max-w-[380px] justify-between) */}
                                <footer className="w-full px-6 py-8 pb-10 bg-gradient-to-t from-black/95 to-transparent min-h-[180px] flex flex-col items-center gap-6">
                                    {/* Timer badge placeholder (invisible in idle state, keeps spacing) */}
                                    <div className="h-8 opacity-0" />
                                    {/* Button group placeholder */}
                                    <div className="w-full flex items-center justify-between max-w-[380px]">
                                        <div className="w-12 h-12 rounded-full bg-white/10 animate-pulse" />
                                        <div className="w-12 h-12 rounded-full bg-white/10 animate-pulse" />
                                        {/* Center record button - larger */}
                                        <div className="w-16 h-16 rounded-full border-4 border-white/20 flex items-center justify-center">
                                            <div className="w-[85%] h-[85%] rounded-full bg-white/10 animate-pulse" />
                                        </div>
                                        <div className="w-12 h-12 rounded-full bg-white/10 animate-pulse" />
                                        <div className="w-12 h-12 rounded-full bg-white/10 animate-pulse" />
                                    </div>
                                </footer>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* === Layer 1: 3D Scene (STABLE) === */}
                {/* 리뷰 모드일 때는 살짝 어둡게(Blur) 처리해서 결과창에 집중하게 함 */}
                <div
                    className={`absolute inset-0 z-0 transition-all duration-500 ease-in-out ${recordState === 'reviewing' ? 'blur-sm scale-95 opacity-50' : ''
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
                                className="absolute inset-0 flex items-center justify-center z-10 bg-slate-950"
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

                        <header className="relative flex items-center justify-center px-4 py-8 bg-gradient-to-b from-black/80 to-transparent pointer-events-auto">
                            <Link
                                href="/playground"
                                className="absolute left-4 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all border border-white/5 backdrop-blur-md"
                            >
                                <ArrowLeft size={20} />
                            </Link>
                            <motion.button
                                onClick={() => setShowScaleSelector(true)}
                                key={targetScale.id}
                                initial={{ y: -10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="flex flex-col items-center group active:scale-95 transition-transform"
                            >
                                <div className="flex items-center gap-1.5">
                                    <h1 className="text-white font-normal text-xl tracking-normal drop-shadow-md group-hover:text-white/80 transition-colors">
                                        {targetScale.name}
                                    </h1>
                                    <ChevronDown size={18} className="text-white/60 group-hover:text-white/80 transition-colors mt-0.5" />
                                </div>
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

                                {/* 4. Drum Accompaniment */}
                                <button
                                    onPointerDown={handleDrumDown}
                                    onPointerUp={handleDrumUp}
                                    className={`w-12 h-12 rounded-full backdrop-blur-md border border-white/10 flex flex-col items-center justify-center transition-all active:scale-90 relative overflow-hidden group
                                         ${isDrumPlaying ? 'bg-orange-500/40 border-orange-500/50' : 'bg-white/10 hover:bg-white/20'}
                                     `}
                                >
                                    <Drum size={20} className={isDrumPlaying ? 'text-orange-200' : 'text-white/40'} />
                                    {isDrumPlaying && (
                                        <motion.div
                                            animate={{ opacity: [0, 1, 0] }}
                                            transition={{ duration: 1, repeat: Infinity }}
                                            className="absolute bottom-1 w-1 h-1 rounded-full bg-orange-400"
                                        />
                                    )}
                                    {/* Long press indicator hint */}
                                    <div className="absolute -top-1 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Settings2 size={8} className="text-white/40" />
                                    </div>
                                </button>

                                {/* 5. Chord Pad (화음 반주) Toggle */}
                                <button
                                    onPointerDown={handleChordDown}
                                    onPointerUp={handleChordUp}
                                    className={`w-12 h-12 rounded-full backdrop-blur-md border border-white/10 flex items-center justify-center transition-all active:scale-95 relative overflow-hidden group ${isChordPlaying ? 'bg-purple-500/30 border-purple-500/50' : 'bg-white/10 hover:bg-white/20'}`}
                                    title="화음 반주 토글 (길게 누르면 설정)"
                                >
                                    <Music2 size={18} className={isChordPlaying ? 'text-purple-300' : 'text-white/40'} />
                                    {isChordPlaying && (
                                        <motion.div
                                            animate={{ opacity: [0.3, 0.8, 0.3], scale: [1, 1.2, 1] }}
                                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                            className="absolute inset-0 rounded-full bg-purple-500/20"
                                        />
                                    )}
                                    {/* Long press indicator hint */}
                                    <div className="absolute -top-1 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Settings2 size={8} className="text-white/40" />
                                    </div>
                                </button>
                            </div>
                        </footer>
                    </div>
                )}

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
                                            {['Basic 8-beat', 'Funky Groove', 'Modern Lounge', 'Lofi Chill'].map((p) => (
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
                                                    {p}
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

                {/* === Layer 3.6: Chord Settings Popup === */}
                <AnimatePresence>
                    {showChordSettings && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
                            onClick={() => setShowChordSettings(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.9, y: 20 }}
                                className="w-full max-w-xs bg-zinc-900 border border-white/10 rounded-[32px] p-6 shadow-2xl max-h-[80vh] overflow-y-auto"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                                            <PianoKeysIcon size={16} className="text-purple-400" />
                                        </div>
                                        <h3 className="text-white font-bold tracking-tight">Chord Settings</h3>
                                    </div>
                                    <button
                                        onClick={() => setShowChordSettings(false)}
                                        className="text-white/40 hover:text-white"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="flex flex-col gap-6">
                                    {/* Current Chord Progression Display */}
                                    <div className="flex flex-col gap-3">
                                        <span className="text-xs font-bold text-white/40 uppercase tracking-widest px-1">현재 화성 진행</span>
                                        <div className="bg-white/5 rounded-2xl p-4">
                                            <div className="flex justify-between items-center gap-2">
                                                {chordSetsRef.current.slice(0, 4).map((chord, i) => (
                                                    <div key={i} className="flex-1 text-center">
                                                        <div className="text-purple-400 font-mono text-sm font-bold">
                                                            {chord.notes[0]?.replace(/\d/g, '')}
                                                        </div>
                                                        <div className="text-[10px] text-white/30 mt-1">Bar {chord.barStart}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Chord Progression Type */}
                                    <div className="flex flex-col gap-3">
                                        <span className="text-xs font-bold text-white/40 uppercase tracking-widest px-1">화성 진행 타입</span>
                                        <div className="grid grid-cols-1 gap-2">
                                            {['Cinematic 1-6-4-5', 'Pop 1-5-6-4', 'Jazz 2-5-1', 'Ambient Drone'].map((prog) => (
                                                <button
                                                    key={prog}
                                                    onClick={() => setChordProgressionType(prog)}
                                                    className={`px-4 py-3 rounded-2xl text-sm font-medium transition-all text-left flex items-center justify-between
                                                          ${chordProgressionType === prog
                                                            ? 'bg-purple-500 text-white'
                                                            : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
                                                >
                                                    {prog}
                                                    {chordProgressionType === prog && <Check size={16} />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Pad Tone Preset */}
                                    <div className="flex flex-col gap-3">
                                        <span className="text-xs font-bold text-white/40 uppercase tracking-widest px-1">패드 톤 프리셋</span>
                                        <div className="grid grid-cols-2 gap-2">
                                            {['Dreamy Pad', 'Warm Strings', 'Crystal Bell', 'Airy Synth'].map((preset) => (
                                                <button
                                                    key={preset}
                                                    onClick={() => setChordPadPreset(preset)}
                                                    className={`px-3 py-3 rounded-2xl text-xs font-medium transition-all text-center
                                                          ${chordPadPreset === preset
                                                            ? 'bg-purple-500 text-white'
                                                            : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
                                                >
                                                    {preset}
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
                                <h2 className="text-white font-bold text-sm tracking-[0.25em] uppercase opacity-90">Select Scale</h2>
                                <button
                                    onClick={() => setShowScaleSelector(false)}
                                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all border border-white/[0.05]"
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
                                                ...availableCounts.map(n => ({ label: `${n}`, value: String(n), count: stats[n] })),
                                                { label: 'Mutant', value: 'mutant', count: stats.mutant }
                                            ];

                                            return filters.map(filter => (
                                                <button
                                                    key={filter.value}
                                                    onClick={() => setFilterNoteCount(filter.value)}
                                                    className={`px-3 py-1.5 rounded-full flex items-center gap-2 transition-all border whitespace-nowrap
                                                        ${filterNoteCount === filter.value
                                                            ? 'bg-slate-300/80 border-slate-200 text-slate-900 shadow-[0_0_15px_rgba(200,200,210,0.4)]'
                                                            : 'bg-white/[0.03] border-white/[0.08] text-white/40 hover:text-slate-200/80 hover:bg-slate-300/10'}`}
                                                >
                                                    <span className="text-[13px] font-black uppercase tracking-widest">{filter.label}</span>
                                                    <span className={`text-[13px] font-bold ${filterNoteCount === filter.value ? 'opacity-80' : 'opacity-30'}`}>
                                                        {filter.count}
                                                    </span>
                                                </button>
                                            ));
                                        })()}
                                    </div>
                                    <div className="flex justify-end gap-5 px-1 pt-1">
                                        <button
                                            onClick={() => setSortBy('name')}
                                            className={`text-[12px] font-black uppercase tracking-[0.2em] transition-all ${sortBy === 'name' ? 'text-slate-200' : 'text-white/20 hover:text-slate-200/60'}`}
                                        >
                                            A-Z
                                        </button>
                                        <button
                                            onClick={() => setSortBy('notes')}
                                            className={`text-[12px] font-black uppercase tracking-[0.2em] transition-all ${sortBy === 'notes' ? 'text-slate-200' : 'text-white/20 hover:text-slate-200/60'}`}
                                        >
                                            Notes
                                        </button>
                                    </div>
                                </div>

                                {/* Scales List */}
                                <div className="grid grid-cols-1 gap-3 pb-20">
                                    {/* Current Selected Scale - First in List */}
                                    {(() => {
                                        const currentScale = processedScales.find(s => s.id === targetScale.id);
                                        if (!currentScale) return null;

                                        return (
                                            <div key={currentScale.id} className="mb-2">
                                                <div className="text-[12px] font-black uppercase tracking-[0.3em] text-white/30 mb-2 px-2">CURRENT SELECTED</div>
                                                <div
                                                    role="button"
                                                    tabIndex={0}
                                                    onClick={() => handleScaleSelect(currentScale)}
                                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleScaleSelect(currentScale); }}
                                                    className="p-4 rounded-[32px] text-left transition-all duration-300 flex items-center justify-between group relative overflow-hidden border cursor-pointer bg-slate-300/[0.06] backdrop-blur-md border-slate-300/30 hover:bg-slate-300/10 hover:border-slate-200/50"
                                                >
                                                    <div className="flex items-center z-10 flex-1 min-w-0 pr-4">
                                                        <span className="font-black text-xl tracking-tight truncate text-white">
                                                            {currentScale.name}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-3 z-10 shrink-0">
                                                        <button
                                                            onClick={(e) => handlePreview(e, currentScale)}
                                                            className="w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg bg-slate-300/25 hover:bg-slate-300/40 text-slate-100 border border-slate-200/30 backdrop-blur-sm"
                                                        >
                                                            {previewingScaleId === currentScale.id ? (
                                                                <Volume2 size={20} className="animate-pulse" />
                                                            ) : (
                                                                <Play size={22} fill="currentColor" className="ml-1" />
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* Other Scales */}
                                    {processedScales.filter(scale => scale.id !== targetScale.id).map((scale) => {
                                        return (
                                            <div
                                                key={scale.id}
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => handleScaleSelect(scale)}
                                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleScaleSelect(scale); }}
                                                className="p-4 rounded-[32px] text-left transition-all duration-300 flex items-center justify-between group relative overflow-hidden border cursor-pointer bg-white/[0.02] border-white/[0.05] text-white hover:bg-slate-300/[0.08] hover:border-slate-300/30"
                                            >
                                                <div className="flex items-center z-10 flex-1 min-w-0 pr-4">
                                                    <span className="font-black text-xl tracking-tight truncate text-white/90">
                                                        {scale.name}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-3 z-10 shrink-0">
                                                    <button
                                                        onClick={(e) => handlePreview(e, scale)}
                                                        className="w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg bg-white/10 hover:bg-slate-300/25 text-white hover:text-slate-100 border border-white/10 hover:border-slate-200/30"
                                                    >
                                                        {previewingScaleId === scale.id ? (
                                                            <Volume2 size={20} className="animate-pulse" />
                                                        ) : (
                                                            <Play size={22} fill="currentColor" className="ml-1" />
                                                        )}
                                                    </button>
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
