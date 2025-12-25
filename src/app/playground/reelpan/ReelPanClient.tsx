"use client";

import { Suspense, useMemo, useState, useRef, useEffect } from "react";
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { motion, AnimatePresence } from "framer-motion";
import { SCALES } from '@/data/handpanScales';
import { Layout, Check, Square, Circle, Smartphone, Keyboard, Play, Pause, Volume2, Download, Trash2, X, Type, ChevronDown, Share2, RefreshCcw, Drum, SlidersHorizontal, Settings2, Sparkles, ArrowLeft, Music2, Music, FileText } from 'lucide-react';

// MIDI parsing utilities
import { parseMidi, findBestMatchScale } from '@/lib/midiUtils';

// Score Component
import { OSMDScoreHandle } from '@/components/score/OSMDScore';
const OSMDScore = dynamic(() => import('@/components/score/OSMDScore'), {
    ssr: false,
});

// 곡 데이터 구조 (Practice와 동일)
const REELPAN_SONGS = [
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
import { Digipan3DHandle } from "@/components/digipan/Digipan3D";
import { useHandpanAudio } from "@/hooks/useHandpanAudio";
import { getNoteFrequency } from "@/constants/noteFrequencies";
import * as Tone from 'tone';


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

export default function ReelPanClient() {
    // 1. State Management
    const [recordState, setRecordState] = useState<RecordState>('idle');
    const [isRecording, setIsRecording] = useState(false); // 기존 호환성 유지
    const [layoutMode, setLayoutMode] = useState<'reel' | 'square'>('reel');
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [showScaleSelector, setShowScaleSelector] = useState(false);
    const [targetScale, setTargetScale] = useState(SCALES.find(s => s.id === 'd_kurd_10') || SCALES[0]);
    const [previewingScaleId, setPreviewingScaleId] = useState<string | null>(null);
    const [selectorMode, setSelectorMode] = useState<'scale' | 'song'>('scale'); // 스케일 vs 곡 선택 모드
    const [selectedSong, setSelectedSong] = useState<any>(null); // 선택된 곡
    const [isSongPlaying, setIsSongPlaying] = useState(false); // 곡 자동연주 상태
    const [showScore, setShowScore] = useState(false); // 악보 표시 상태
    const [midiData, setMidiData] = useState<any>(null); // 로딩된 MIDI 데이터
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
    const [isDrumSynthReady, setIsDrumSynthReady] = useState(false); // ★ 드럼 Synth 초기화 완료 상태

    // Chord Settings State
    const [showChordSettings, setShowChordSettings] = useState(false);
    const [chordProgressionType, setChordProgressionType] = useState('Cinematic');
    const [chordPadPreset, setChordPadPreset] = useState('Dreamy Pad');
    const [isChordSynthReady, setIsChordSynthReady] = useState(false); // ★ 화음 Synth 초기화 완료 상태

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

    const [recordCountdown, setRecordCountdown] = useState<number | 'Touch!' | null>(null);

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

    // 2. Audio Preloading (Prioritize Current Scale)
    const priorityNotes = useMemo(() => {
        if (!targetScale) return undefined;
        return [
            targetScale.notes.ding,
            ...targetScale.notes.top,
            ...(targetScale.notes.bottom || [])
        ];
    }, [targetScale.id]); // Stable dependency

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

        // ★ StrictMode 대응: 인스턴스 ID로 중복 cleanup 방지
        const instanceId = Date.now();
        (window as any).__drumInstanceId = instanceId;
        console.log("[DrumInit] Starting drum synth initialization... instanceId:", instanceId);

        // ═══════════════════════════════════════════════════════════════════════
        // 🔊 MASTER BUS: 전체 드럼 볼륨 제어
        // ═══════════════════════════════════════════════════════════════════════
        const masterGain = new Tone.Gain(0.8).toDestination();
        drumMasterGainRef.current = masterGain;
        console.log("[DrumInit] Master gain created");


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

        // ★ 초기화 완료 상태 설정 (버튼 활성화)
        setIsDrumSynthReady(true);
        console.log("[DrumInit] Drum synths initialized successfully");

        // ═══════════════════════════════════════════════════════════════════════
        // 🧹 CLEANUP: 컴포넌트 언마운트 시 리소스 해제
        // ═══════════════════════════════════════════════════════════════════════
        return () => {
            console.log("[DrumCleanup] Running cleanup for instanceId:", instanceId);

            // ★ StrictMode 가드: 현재 활성 인스턴스가 아니면 cleanup 스킵
            if ((window as any).__drumInstanceId !== instanceId) {
                console.log("[DrumCleanup] Skipping cleanup - newer instance exists");
                return;
            }

            // ★ 활성 인스턴스일 때만 버튼 비활성화
            setIsDrumSynthReady(false);

            // ★ 빠른 페이드 아웃 (300ms) 후 리소스 정리
            const fadeOutTime = 0.3;
            const now = Tone.now();

            // Drum Master Gain 페이드 아웃
            if (drumMasterGainRef.current) {
                drumMasterGainRef.current.gain.rampTo(0, fadeOutTime, now);
            }
            // ★ Chord Master Gain은 ChordCleanup에서 관리 (DrumCleanup에서 건드리지 않음)

            // 페이드 아웃 완료 후 리소스 정리 (350ms 후)
            setTimeout(() => {
                // 다시 한 번 검사: cleanup 도중 새 인스턴스가 생겼을 수 있음
                if ((window as any).__drumInstanceId !== instanceId) {
                    console.log("[DrumCleanup] Abort delayed cleanup - newer instance exists");
                    return;
                }

                // Pop/Rock synths
                kickSynthRef.current?.dispose();
                snareSynthRef.current?.dispose();
                hatSynthRef.current?.dispose();
                // Lofi Chill synths
                lofiKickSynthRef.current?.dispose();
                lofiSnareSynthRef.current?.dispose();
                lofiHatSynthRef.current?.dispose();
                masterGain.dispose();
                if (drumLoopIdRef.current !== null) Tone.Transport.clear(drumLoopIdRef.current);

                // Transport 정지
                Tone.Transport.stop();
                Tone.Transport.cancel();
                Tone.Transport.position = 0;
                console.log("[DrumCleanup] Complete");
            }, 350);
        };
    }, []);

    // [Chord Pad Engine] Sound Synthesis (Basic Dreamy Pad)
    useEffect(() => {
        if (typeof window === 'undefined') return;

        // ★ StrictMode 대응: 인스턴스 ID로 중복 cleanup 방지
        const instanceId = Date.now();
        (window as any).__chordInstanceId = instanceId;
        console.log("[ChordInit] Starting chord synth initialization... instanceId:", instanceId);

        // ★ 비동기 초기화 (Reverb는 Impulse Response Buffer 생성 대기 필요)
        const initAudio = async () => {
            // 1. Dispose Previous Nodes
            chordPadSynthRef.current?.dispose();
            chordEffectsRef.current.forEach(e => e.dispose());
            chordEffectsRef.current = [];

            // 2. Master Bus - 항상 새로 생성 (gain=0 문제 방지)
            if (chordMasterGainRef.current) {
                chordMasterGainRef.current.disconnect();
                chordMasterGainRef.current.dispose();
            }
            chordMasterGainRef.current = new Tone.Gain(0.35).toDestination();
            const masterGain = chordMasterGainRef.current;

            // 3. Create Reverb and await its ready state
            const reverb = new Tone.Reverb({ decay: 8, wet: 0.4, preDelay: 0.1 });
            await reverb.ready; // ★ 핵심: Impulse Response 생성 완료 대기

            // 4. Check if still the active instance before continuing
            if ((window as any).__chordInstanceId !== instanceId) {
                console.log("[ChordInit] Aborting - newer instance exists");
                reverb.dispose();
                return;
            }

            // 5. Create other effects
            const delay = new Tone.PingPongDelay({ delayTime: "4n.", feedback: 0.3, wet: 0.2 });
            const chorus = new Tone.Chorus({ frequency: 0.3, delayTime: 4, depth: 0.6, spread: 180 }).start();

            // 6. Create Dreamy Pad Synth
            const synth = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: "fattriangle", count: 3, spread: 30 },
                envelope: { attack: 2.0, decay: 1.5, sustain: 0.9, release: 3.0, attackCurve: "exponential" },
                volume: -12
            });

            synth.chain(chorus, delay, reverb, masterGain);
            synth.maxPolyphony = 6;

            // 7. Update References & Activate Button (Only if still active instance)
            // ★ 완료 시점에 instanceId 재확인 (경합 조건 방지)
            if ((window as any).__chordInstanceId === instanceId) {
                chordPadSynthRef.current = synth;
                chordEffectsRef.current = [chorus, delay, reverb];
                setIsChordSynthReady(true);
                console.log("[ChordInit] Audio initialized successfully (Reverb ready)");
            } else {
                console.log("[ChordInit] Completion abort - newer instance exists, disposing synth");
                synth.dispose();
                chorus.dispose();
                delay.dispose();
                reverb.dispose();
            }
        };

        initAudio();

        return () => {
            console.log("[ChordCleanup] Running cleanup for instanceId:", instanceId);

            // ★ StrictMode 가드: 현재 활성 인스턴스가 아니면 cleanup 스킵
            if ((window as any).__chordInstanceId !== instanceId) {
                console.log("[ChordCleanup] Skipping cleanup - newer instance exists");
                return;
            }

            // ★ 활성 인스턴스일 때만 버튼 비활성화
            setIsChordSynthReady(false);

            // ★ Chord Master Gain 페이드 아웃 (DrumCleanup은 건드리지 않음)
            const fadeOutTime = 0.3;
            const now = Tone.now();
            if (chordMasterGainRef.current) {
                chordMasterGainRef.current.gain.rampTo(0, fadeOutTime, now);
            }

            // 🧹 CHORD CLEANUP: 페이드 아웃 완료 후 (350ms) 리소스 해제
            setTimeout(() => {
                // 다시 한 번 검사
                if ((window as any).__chordInstanceId !== instanceId) {
                    console.log("[ChordCleanup] Abort delayed cleanup - newer instance exists");
                    return;
                }

                if (chordPartRef.current) {
                    chordPartRef.current.dispose();
                    chordPartRef.current = null;
                }
                chordPadSynthRef.current?.releaseAll();
                chordPadSynthRef.current?.dispose();
                chordEffectsRef.current.forEach(e => e.dispose());
                chordEffectsRef.current = [];

                // Master Gain도 정리 (initAudio에서 새로 생성하므로 여기서는 null만 설정)
                if (chordMasterGainRef.current) {
                    chordMasterGainRef.current.disconnect();
                    chordMasterGainRef.current.dispose();
                    chordMasterGainRef.current = null;
                }

                console.log("[ChordCleanup] Complete");
            }, 350);
        };
    }, []); // Run once on mount (Stable)

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
    useEffect(() => {
        isDrumPlayingRef.current = isDrumPlaying;
        console.log("[DrumPlayback] isDrumPlaying changed to:", isDrumPlaying);
        console.log("[DrumPlayback] kickSynthRef.current:", !!kickSynthRef.current);
        console.log("[DrumPlayback] Tone.context.state:", Tone.context.state);

        if (isDrumPlaying) {
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
            // 스케줄된 루프 클리어는 Pattern useEffect의 cleanup에서 처리됨

            // ★ 마지막 생존자 체크: 화음도 꺼져있다면 Transport 완전 정지
            if (!isChordPlayingRef.current) {
                console.log("[DrumDebug] Last Survivor: Stopping Transport");
                Tone.Transport.stop();
                Tone.Transport.position = 0;
            } else {
                console.log("[DrumDebug] Chord still playing, keeping Transport alive");
            }
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
            // ★ 가드: Synth가 아직 준비되지 않았으면 무시
            if (!isDrumSynthReady) {
                console.warn("[DrumButton] Synth not ready yet. Please wait...");
                return;
            }

            // 짧게 눌렀을 때만 토글
            console.log("[DrumButton] Short press detected, toggling drum");
            console.log("[DrumButton] Current Tone.context.state:", Tone.context.state);
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
        if (!targetScale?.notes) {
            console.log("[ChordDebug] No targetScale notes found");
            return;
        }

        const allNotes = [targetScale.notes.ding, ...targetScale.notes.top, ...targetScale.notes.bottom];
        console.log(`[ChordDebug] Analyzing scale: ${targetScale.name}, Notes count: ${allNotes.length}`);

        if (allNotes.length < 5) {
            console.warn("[ChordDebug] Not enough notes to generate chords (< 5)");
            return;
        }

        let progressionDegrees = [];

        // 1. 프리셋에 따른 도수(Degree) 선택
        switch (chordProgressionType) {
            case 'Hopeful Pop':
                progressionDegrees = [1, 5, 6, 4];
                break;
            case 'Emotional Sad':
                progressionDegrees = [6, 4, 1, 5];
                break;
            case 'Nostalgic Story':
                progressionDegrees = [2, 5, 1, 1];
                break;
            case 'Cinematic':
            default:
                progressionDegrees = [1, 6, 4, 5];
                break;
        }

        // 2. 스마트 보이싱 생성 함수 (불협화음 방지)
        const createSafeChord = (degree: number) => {
            // (A) 근음(Root) 찾기
            const rootIndex = (degree - 1) % allNotes.length;
            const rootNote = allNotes[rootIndex];
            const rootMidi = Tone.Frequency(rootNote).toMidi();

            // 스케일 전체의 중심음 (Ding) - 안전장치용
            const scaleDing = allNotes[0];

            // (B) 3도, 5도 후보군 선정 (기본적으로 +2, +4 시도)
            const candidateIndices = [
                (rootIndex + 2) % allNotes.length, // 잠정적 3rd
                (rootIndex + 4) % allNotes.length  // 잠정적 5th
            ];

            const chordNotes = [rootNote]; // 근음은 무조건 포함

            candidateIndices.forEach(idx => {
                const note = allNotes[idx];
                const noteMidi = Tone.Frequency(note).toMidi();

                // 근음과의 반음 간격 계산 (절대값) - 옥타브 무시 (% 12)
                const interval = Math.abs(noteMidi - rootMidi) % 12;

                // (C) 불협화음 필터링 (Tritone: 6, Minor 2nd: 1)
                const isDissonant = (interval === 6 || interval === 1);

                if (isDissonant) {
                    // 불협이면 --> 'Ding'으로 치환 (Anchor/Drone 효과)
                    chordNotes.push(scaleDing);
                } else {
                    chordNotes.push(note);
                }
            });

            // 중복 음 제거 (Set)
            return Array.from(new Set(chordNotes));
        };

        // 3. 화음 데이터 생성
        chordSetsRef.current = progressionDegrees.map((degree, index) => {
            return {
                barStart: (index * 4) + 1, // 1, 5, 9, 13 마디
                notes: createSafeChord(degree),
                role: `Chord ${degree}`
            };
        });

        console.log("[ChordDebug] Generated Chord Sets:", chordSetsRef.current);

        // 재생 중이면: 멈추지 않고 즉시 새로운 파트로 교체 (Hot-Swap)
        if (isChordPlayingRef.current) {
            console.log("[ChordDebug] Hot-swapping chord part...");

            // 1. 기존 파트 제거 (소리는 끄지 않음 - 자연스러운 Release 유지)
            if (chordPartRef.current) {
                chordPartRef.current.dispose();
                chordPartRef.current = null;
            }
            // chordPadSynthRef.current?.releaseAll(); // 삭제: 이전 화음 잔향 유지

            // 2. 새 파트 생성 (handleChordToggle 로직 재사용)
            const chordSets = chordSetsRef.current;
            Tone.Transport.bpm.value = drumBpm;

            chordPartRef.current = new Tone.Part((time, value) => {
                const synth = chordPadSynthRef.current;
                // ★ 방어 코드: Synth가 없거나 이미 disposed 상태면 무시
                if (!synth || synth.disposed) return;
                const chord = value as { notes: string[]; role: string };
                synth.triggerAttackRelease(chord.notes, "4m", time);
            }, [
                ["0:0:0", chordSets[0]],
                ["4:0:0", chordSets[1]],
                ["8:0:0", chordSets[2]],
                ["12:0:0", chordSets[3]]
            ]);
            chordPartRef.current.loop = true;
            chordPartRef.current.loopEnd = "16:0:0";

            // 3. 현재 Transport 위치에 맞춰서 즉시 시작
            const position = Tone.Transport.seconds;
            const offset = position % (Tone.Time("16:0:0").toSeconds()); // 16마디 길이로 모듈러 연산
            chordPartRef.current.start(0, offset);
        }
    }, [targetScale, chordProgressionType]);

    // [Chord Pad] 화음 반주 토글 핸들러 (Bus Stop 모델 적용)
    const handleChordToggle = async () => {
        console.log("[ChordDebug] Toggle clicked. Current state:", isChordPlaying);

        // ★ 가드: Synth가 아직 준비되지 않았으면 무시
        if (!isChordSynthReady) {
            console.warn("[ChordDebug] Synth not ready yet. Please wait...");
            return;
        }

        await Tone.start();

        if (isChordPlaying) {
            // ═══════════════════════════════════════════════════════════════
            // [OFF 로직] 화음 중지
            // ═══════════════════════════════════════════════════════════════
            console.log("[ChordDebug] Stopping chord...");
            isChordPlayingRef.current = false;
            setIsChordPlaying(false);

            // 1. 화음 파트 정리 (dispose로 완전 해제)
            if (chordPartRef.current) {
                chordPartRef.current.dispose();
                chordPartRef.current = null;
            }
            chordPadSynthRef.current?.releaseAll();

            // 2. ★ 마지막 생존자 체크: 드럼도 꺼져있다면 Transport 완전 정지
            if (!isDrumPlayingRef.current) {
                console.log("[ChordDebug] Last Survivor: Stopping Transport");
                Tone.Transport.stop();
                Tone.Transport.position = 0;
            } else {
                console.log("[ChordDebug] Drum still playing, keeping Transport alive");
            }

        } else {
            // ═══════════════════════════════════════════════════════════════
            // [ON 로직] 화음 시작
            // ═══════════════════════════════════════════════════════════════
            const chordSets = chordSetsRef.current;
            console.log("[ChordDebug] Starting chord. Sets available:", chordSets.length);

            // ★ FIX: disposed 상태 체크 추가 (React Strict Mode 이중 마운트 대응)
            if (chordSets.length < 4 || !chordPadSynthRef.current || chordPadSynthRef.current.disposed) {
                console.error("[ChordDebug] Failed to start. Sets:", chordSets.length, "Synth:", !!chordPadSynthRef.current, "Disposed:", chordPadSynthRef.current?.disposed);
                alert(`화음 생성 실패! (Chords: ${chordSets.length})\n스케일 음이 너무 적거나 초기화 오류입니다.\n페이지를 새로고침해주세요.`);
                return;
            }

            // 기존 Part 정리
            if (chordPartRef.current) {
                chordPartRef.current.dispose();
                chordPartRef.current = null;
            }

            // BPM 동기화 (드럼 BPM 사용)
            Tone.Transport.bpm.value = drumBpm;

            // 화음 Part 생성 (16마디 무한 루프)
            chordPartRef.current = new Tone.Part((time, value) => {
                const synth = chordPadSynthRef.current;
                // ★ 방어 코드: Synth가 없거나 이미 disposed 상태면 무시
                if (!synth || synth.disposed) return;
                const chord = value as { notes: string[]; role: string };
                synth.triggerAttackRelease(chord.notes, "4m", time);
            }, [
                ["0:0:0", chordSets[0]],
                ["4:0:0", chordSets[1]],
                ["8:0:0", chordSets[2]],
                ["12:0:0", chordSets[3]]
            ]);
            chordPartRef.current.loop = true;
            chordPartRef.current.loopEnd = "16:0:0";

            // ★★★ 핵심: Bus Stop 모델 - Transport 상태에 따른 시작 방식 ★★★
            if (Tone.Transport.state === 'started') {
                // ─────────────────────────────────────────────────────────────
                // [Case B: 합류] 드럼이 이미 돌고 있음 → 흐름에 탑승
                // ─────────────────────────────────────────────────────────────
                const now = Tone.Transport.seconds;
                console.log(`[ChordDebug] Joining running Transport at ${now.toFixed(2)}s`);

                // start(startTime, offset): Transport 시간 기준으로 Part를 시작
                // offset을 현재 시간과 맞춰 싱크를 유지
                chordPartRef.current.start(0, now % Tone.Time("16:0:0").toSeconds());

                // 즉시 소리가 나도록 현재 위치의 화음 재생
                const positionStr = Tone.Transport.position as string;
                const bars = parseInt(positionStr.split(":")[0]);
                const currentBar = bars % 16;

                let currentChordIndex = 0;
                if (currentBar >= 12) currentChordIndex = 3;
                else if (currentBar >= 8) currentChordIndex = 2;
                else if (currentBar >= 4) currentChordIndex = 1;

                const immediateChord = chordSets[currentChordIndex];
                if (immediateChord && chordPadSynthRef.current) {
                    console.log(`[ChordDebug] Playing immediate chord #${currentChordIndex}`);
                    chordPadSynthRef.current.triggerAttackRelease(immediateChord.notes, "4m", "+0.01");
                }

            } else {
                // ─────────────────────────────────────────────────────────────
                // [Case A: 첫 시작] 아무도 재생 중이 아님 → Transport 리셋 후 시작
                // ─────────────────────────────────────────────────────────────
                console.log("[ChordDebug] Fresh start (Case A)");
                Tone.Transport.position = 0;
                chordPartRef.current.start(0);
                Tone.Transport.start();
            }

            isChordPlayingRef.current = true;
            setIsChordPlaying(true);
        }
    };

    // 1. 녹화 시작
    const startRecording = async () => {
        console.log(`[RecordDebug] ${Date.now()} startRecording() called`);
        console.log(`[RecordDebug] Current states - recordState: ${recordState}, isRecording: ${isRecording}, recordCountdown: ${recordCountdown}`);

        if (timerRef.current) clearInterval(timerRef.current);

        console.log(`[RecordDebug] ${Date.now()} Setting recordState to 'recording'`);
        setRecordState('recording');
        setIsRecording(true);
        setRecordTimer(0);
        timerRef.current = setInterval(() => setRecordTimer(t => t + 1), 1000);

        // ★ FIX: Wait for React to complete re-rendering after state updates
        // This prevents the black flash caused by capturing canvas during React reconciliation
        console.log(`[RecordDebug] ${Date.now()} Waiting for React render to complete...`);
        await new Promise<void>(resolve => {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    console.log(`[RecordDebug] ${Date.now()} React render complete, starting recording`);
                    resolve();
                });
            });
        });

        // 실제 녹화 시작 (기존 Digipan 컴포넌트의 녹화 기능 호출)
        if (digipanRef.current) {
            console.log(`[RecordDebug] ${Date.now()} Calling digipanRef.handleRecordToggle()`);
            await digipanRef.current.handleRecordToggle();
            console.log(`[RecordDebug] ${Date.now()} digipanRef.handleRecordToggle() completed`);
        } else {
            console.warn(`[RecordDebug] digipanRef.current is null!`);
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

    const initiateRecordingProcess = () => {
        console.log(`[RecordDebug] ${Date.now()} initiateRecordingProcess() called`);
        console.log(`[RecordDebug] recordCountdown: ${recordCountdown}, recordState: ${recordState}`);

        // 카운트다운 중이면 중복 실행 방지
        if (recordCountdown) {
            console.log(`[RecordDebug] Blocked - countdown already in progress`);
            return;
        }

        if (recordState === 'idle') {
            console.log(`[RecordDebug] ${Date.now()} Starting countdown sequence`);
            // 카운트다운 시작
            let count = 3;
            setRecordCountdown(count);

            const interval = setInterval(() => {
                count -= 1;
                console.log(`[RecordDebug] ${Date.now()} Countdown tick: count=${count}`);
                if (count > 0) {
                    setRecordCountdown(count);
                } else if (count === 0) {
                    setRecordCountdown('Touch!');
                    clearInterval(interval);
                    console.log(`[RecordDebug] ${Date.now()} Countdown complete, showing Touch!`);

                    // Touch! 표시 시간을 650ms로 복구
                    setTimeout(() => {
                        console.log(`[RecordDebug] ${Date.now()} Setting recordCountdown to null (Touch fade out)`);
                        setRecordCountdown(null);

                        // Fade Out 시간을 고려하여 100ms 후 녹화 시작 (더 빠르게 반응)
                        setTimeout(() => {
                            console.log(`[RecordDebug] ${Date.now()} 100ms delay complete, calling startRecording()`);
                            startRecording();
                        }, 100);
                    }, 650);
                }
            }, 650); // 사용자의 요청에 따라 0.65초(650ms) 간격으로 조정
        } else if (recordState === 'recording') {
            console.log(`[RecordDebug] ${Date.now()} Stopping recording`);
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
                // 곡 선택 모드에서 스케일이 변경되면 곡 선택 해제
                if (selectedSong) {
                    setSelectedSong(null);
                    setIsSongPlaying(false);
                }
            }, 400);
        }, 200);
    };

    const handleSongSelect = async (song: any) => {
        setSelectedSong(song);
        // 곡의 스케일로 자동 전환
        const songScale = SCALES.find(s => s.name === song.scaleName);
        if (songScale && songScale.id !== targetScale.id) {
            setTargetScale(songScale);
        }
        setShowScaleSelector(false);
        setIsSongPlaying(false);

        // MIDI 파일 로딩
        if (song.midiSrc) {
            try {
                console.log('MIDI 파일 로딩 중:', song.midiSrc);
                // 1. Fetch MIDI File
                const response = await fetch(song.midiSrc);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const arrayBuffer = await response.arrayBuffer();

                // 2. Parse MIDI (ArrayBuffer, FileName)
                const midiResult = await parseMidi(arrayBuffer, song.title);

                if (midiResult) {
                    setMidiData(midiResult);
                    console.log('MIDI 파일 로딩 완료:', midiResult);
                } else {
                    console.error('MIDI 파일 파싱 실패');
                    setMidiData(null);
                }
            } catch (error) {
                console.error('MIDI 파일 로딩 에러:', error);
                setMidiData(null);
            }
        } else {
            setMidiData(null);
        }
    };

    const toggleSongPlayback = async () => {
        if (!selectedSong?.midiSrc || !midiData) return;

        if (isSongPlaying) {
            // 곡 재생 중지
            setIsSongPlaying(false);
            console.log('곡 재생 중지:', selectedSong.title);
            // MIDI 재생 중지 로직은 추후 구현
        } else {
            // 곡 재생 시작
            setIsSongPlaying(true);
            console.log('곡 재생 시작:', selectedSong.title);

            try {
                // MIDI 트랙에서 노트 추출 및 재생
                const tracks = midiData.tracks || [];
                let allNotes: any[] = [];

                tracks.forEach((track: any) => {
                    if (track.notes) {
                        allNotes = allNotes.concat(track.notes.map((note: any) => ({
                            time: note.time,
                            duration: note.duration,
                            midi: note.midi,
                            noteName: note.name,
                            velocity: note.velocity
                        })));
                    }
                });

                // 시간순으로 정렬
                allNotes.sort((a, b) => a.time - b.time);

                console.log('추출된 노트 수:', allNotes.length);

                // 간단한 재생 로직 (실제로는 더 복잡한 타이밍 로직 필요)
                let delay = 0;
                const bpm = midiData.header?.tempos?.[0]?.bpm || 120;
                const startTime = performance.now();

                for (const note of allNotes.slice(0, 20)) { // 처음 20개 노트만 테스트
                    const noteTime = (note.time * 60) / bpm * 1000; // ms 단위로 변환
                    const playDelay = noteTime - delay;

                    if (playDelay > 0) {
                        await new Promise(resolve => setTimeout(resolve, playDelay));
                    }

                    // 핸드판 노트로 변환하여 재생
                    const handpanNote = convertMidiNoteToHandpan(note.midi);
                    if (handpanNote) {
                        playNote(handpanNote);
                        console.log('노트 재생:', handpanNote, '원본 MIDI:', note.midi);
                    }

                    delay = noteTime;
                }

            } catch (error) {
                console.error('곡 재생 에러:', error);
                setIsSongPlaying(false);
            }
        }
    };

    // MIDI 노트를 핸드판 노트로 변환하는 헬퍼 함수
    const convertMidiNoteToHandpan = (midiNote: number): string | null => {
        // 간단한 MIDI to 노트 변환 (실제로는 더 정확한 매핑 필요)
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const octave = Math.floor(midiNote / 12) - 1;
        const noteIndex = midiNote % 12;
        const noteName = noteNames[noteIndex] + octave;

        // 현재 스케일에 포함된 노트인지 확인
        const currentScaleNotes = [
            targetScale.notes.ding,
            ...targetScale.notes.top,
            ...targetScale.notes.bottom
        ];

        return currentScaleNotes.includes(noteName) ? noteName : null;
    };

    // Recording Handlers
    const handleRecordingComplete = (blob: Blob) => {
        // 1. Stop all live audio immediately
        setIsDrumPlaying(false);
        setIsChordPlaying(false);
        Tone.Transport.stop();
        Tone.Transport.position = 0;

        // 2. Process Recording
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
            hideTouchText: false, // Keep mounted to avoid remount flash
            showTouchText: false, // Disable idle Ready/Set/Touch cycle
            useCountdownText: true, // ★ Use lightweight CountdownText instead of TouchText
            // externalTouchText REMOVED - now using HTML overlay to prevent 3D re-render
            recordingCropMode: layoutMode === 'square' ? 'square' as 'square' : 'full' as 'full',
            enableZoom: false, // 마우스 휠 줌인/줌아웃 비활성화
            enablePan: false, // 카메라 이동(Pan) 비활성화
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

                                {/* Spacer equivalent to keep flex layout consistent */}
                                <div className="flex-1 min-h-[100px]" />

                                {/* Footer Skeleton - matches real footer (px-6 py-8 pb-6, min-h-[180px], max-w-[380px] justify-between) */}
                                <footer className="w-full px-6 py-8 pb-6 bg-gradient-to-t from-black/95 to-transparent min-h-[180px] flex flex-col justify-end items-center gap-6">
                                    {/* Timer badge placeholder (invisible in idle state, keeps spacing) */}
                                    <div className="h-8 opacity-0" />
                                    {/* Button group placeholder */}
                                    <div className="w-full flex items-center justify-between max-w-[380px] relative">
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

                {/* === Layer 2.5: Recording Countdown Overlay (HTML - prevents 3D re-render flash) === */}
                <AnimatePresence>
                    {recordCountdown && (
                        <motion.div
                            key="countdown-overlay"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            className="absolute inset-0 flex items-center justify-center z-[25] pointer-events-none"
                        >
                            <span
                                className={`text-8xl font-bold drop-shadow-2xl ${recordCountdown === 'Touch!'
                                    ? 'text-red-600'
                                    : 'text-yellow-400'
                                    }`}
                                style={{}}
                            >
                                {recordCountdown}
                            </span>
                        </motion.div>
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

                            {/* 악보 표시 버튼 - 선택된 곡에 악보가 있을 때만 표시 */}
                            {selectedSong?.xmlSrc && (
                                <button
                                    onClick={() => setShowScore(!showScore)}
                                    className={`absolute right-4 w-10 h-10 rounded-full backdrop-blur-md border border-white/10 flex items-center justify-center transition-all hover:bg-white/20 ${showScore ? 'bg-white/20' : 'bg-white/10'
                                        }`}
                                >
                                    <FileText size={18} className={showScore ? 'text-white' : 'text-white/60'} />
                                </button>
                            )}

                            <motion.button
                                onClick={() => setShowScaleSelector(true)}
                                disabled={isRecording || !!recordCountdown}
                                key={selectedSong ? selectedSong.id : targetScale.id}
                                initial={{ y: -10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className={`flex flex-col items-center justify-center transition-all ${isRecording || !!recordCountdown ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105 active:scale-95'}`}
                            >
                                <div className="flex items-center gap-1.5">
                                    <h1 className="text-white font-normal text-xl tracking-normal drop-shadow-md group-hover:text-white/80 transition-colors">
                                        {selectedSong ? selectedSong.title : targetScale.name}
                                    </h1>
                                    <ChevronDown size={18} className="text-white/60 group-hover:text-white/80 transition-colors mt-0.5" />
                                </div>
                            </motion.button>
                        </header>

                        {/* 악보 표시 영역 */}
                        <AnimatePresence>
                            {showScore && selectedSong?.xmlSrc && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: '15%' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="w-full bg-white overflow-hidden border-b border-black/5 z-[5]"
                                >
                                    <OSMDScore
                                        musicXmlUrl={selectedSong.xmlSrc}
                                        drawCredits={false}
                                        autoResize={true}
                                        zoom={0.8}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="flex-1 min-h-[100px]" />

                        <footer className="w-full px-6 py-8 pb-6 bg-gradient-to-t from-black/95 to-transparent pointer-events-auto min-h-[180px] flex flex-col justify-end items-center gap-6">

                            {/* 하단 버튼 그룹 */}
                            <div className="w-full flex items-center justify-between max-w-[380px] relative">
                                {/* 1. Label Toggle */}
                                <button
                                    onClick={() => setViewMode(prev => prev === 2 ? 3 : 2)}
                                    className={`w-12 h-12 rounded-full backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-white/20 transition-all active:scale-95 ${viewMode === 2 ? 'bg-white/20' : 'bg-white/10'}`}
                                >
                                    <Type size={18} className={`${viewMode === 2 ? 'text-white' : 'text-white/40'}`} />
                                </button>

                                {/* 2. Layout Mode (Disabled during recording) */}
                                <button
                                    onClick={toggleLayout}
                                    disabled={isRecording || !!recordCountdown}
                                    className={`w-12 h-12 rounded-full backdrop-blur-md border border-white/10 flex items-center justify-center transition-all active:scale-95
                                    ${isRecording || !!recordCountdown
                                            ? 'bg-white/5 opacity-30 cursor-not-allowed'
                                            : 'bg-white/10 hover:bg-white/20'
                                        }`}
                                >
                                    <span className="text-[10px] font-bold text-white tracking-widest">{layoutMode === 'reel' ? "9:16" : "1:1"}</span>
                                </button>

                                {/* Recording Timer Badge (Centered above Record Button - Screen Center) */}
                                <motion.div
                                    initial={false}
                                    animate={{
                                        opacity: recordState === 'recording' ? 1 : 0,
                                        y: recordState === 'recording' ? 0 : -10,
                                    }}
                                    transition={{ duration: 0.3 }}
                                    className={`absolute -top-12 left-0 right-0 mx-auto w-fit flex items-center justify-center gap-2 px-4 py-1.5 rounded-full backdrop-blur-md border transition-all duration-300 pointer-events-none z-50
                                    ${recordState === 'recording'
                                            ? 'bg-red-500/20 border-red-500/50'
                                            : 'bg-black/20 border-white/10 opacity-0'}
                                `}
                                >
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                                    <span className="text-black font-mono text-sm font-medium tracking-wider">{formatTime(recordTimer)}</span>
                                </motion.div>

                                {/* 3. Record Button (Center) - 🔴 Main Record Toggle Button */}
                                <div className="relative group z-10 flex justify-center mx-2">
                                    <div className={`absolute inset-0 bg-red-500 rounded-full blur-2xl transition-opacity duration-500 ${recordState === 'recording' ? 'opacity-60 animate-pulse' : 'opacity-0 group-hover:opacity-30'}`} />
                                    <button
                                        onClick={initiateRecordingProcess}
                                        disabled={!!recordCountdown}
                                        className={`relative transition-all duration-300 hover:scale-105 active:scale-95 ${recordCountdown ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                                    disabled={!isDrumSynthReady}
                                    className={`w-12 h-12 rounded-full backdrop-blur-md border border-white/10 flex flex-col items-center justify-center transition-all active:scale-90 relative overflow-hidden group
                                         ${!isDrumSynthReady
                                            ? 'bg-white/5 opacity-50 cursor-not-allowed'
                                            : isDrumPlaying
                                                ? 'bg-orange-500/40 border-orange-500/50'
                                                : 'bg-white/10 hover:bg-white/20'
                                        }
                                     `}
                                    title={!isDrumSynthReady ? '초기화 중...' : '드럼 반주 토글 (길게 누르면 설정)'}
                                >
                                    <Drum size={20} className={!isDrumSynthReady ? 'text-white/20' : isDrumPlaying ? 'text-orange-200' : 'text-white/40'} />
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
                                    disabled={!isChordSynthReady}
                                    className={`w-12 h-12 rounded-full backdrop-blur-md border border-white/10 flex items-center justify-center transition-all active:scale-95 relative overflow-hidden group ${!isChordSynthReady
                                        ? 'bg-white/5 opacity-50 cursor-not-allowed'
                                        : isChordPlaying
                                            ? 'bg-purple-500/30 border-purple-500/50'
                                            : 'bg-white/10 hover:bg-white/20'
                                        }`}
                                    title={!isChordSynthReady ? '초기화 중...' : '화음 반주 토글 (길게 누르면 설정)'}
                                >
                                    <Music2 size={18} className={!isChordSynthReady ? 'text-white/20' : isChordPlaying ? 'text-purple-300' : 'text-white/40'} />
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
                                                        // 2. [UX 개선] 즉시 재생 (Audition Mode)
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
                                        <span className="text-xs font-bold text-white/40 uppercase tracking-widest px-1">Current Chord Progression</span>
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
                                        <span className="text-xs font-bold text-white/40 uppercase tracking-widest px-1">Chord Progression Type</span>
                                        <div className="grid grid-cols-1 gap-2">
                                            {['Cinematic', 'Hopeful Pop', 'Emotional Sad', 'Nostalgic Story'].map((prog) => (
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
                            <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between">
                                <h2 className="text-white font-bold text-sm tracking-[0.25em] uppercase opacity-90">
                                    Select Scale
                                </h2>
                                <button
                                    onClick={() => setShowScaleSelector(false)}
                                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all border border-white/[0.05]"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar flex flex-col gap-4">
                                {/* Search & Filter Controls - Scale Mode Only */}
                                {selectorMode === 'scale' && (
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
                                )}

                                {/* Scales or Songs List */}
                                <div className="grid grid-cols-1 gap-3 pb-20">
                                    {selectorMode === 'scale' ? (
                                        <>
                                            {/* Current Selected Scale - First in List */}
                                            {(() => {
                                                const currentScale = processedScales.find(s => s.id === targetScale.id);
                                                if (!currentScale) return null;
                                                const isDisabled = currentScale.id === 'e_amara_18';

                                                return (
                                                    <div key={currentScale.id} className="mb-2">
                                                        <div className="text-[12px] font-black uppercase tracking-[0.3em] text-white/30 mb-2 px-2">CURRENT SELECTED</div>
                                                        <div
                                                            role="button"
                                                            tabIndex={isDisabled ? -1 : 0}
                                                            onClick={() => !isDisabled && handleScaleSelect(currentScale)}
                                                            onKeyDown={(e) => { if (!isDisabled && (e.key === 'Enter' || e.key === ' ')) handleScaleSelect(currentScale); }}
                                                            className={`p-4 rounded-[32px] text-left transition-all duration-300 flex items-center justify-between group relative overflow-hidden border ${isDisabled
                                                                ? 'cursor-default bg-slate-300/[0.02] backdrop-blur-md border-slate-300/10 opacity-50 pointer-events-none'
                                                                : 'cursor-pointer bg-slate-300/[0.06] backdrop-blur-md border-slate-300/30 hover:bg-slate-300/10 hover:border-slate-200/50'
                                                                }`}
                                                        >
                                                            <div className="flex items-center z-10 flex-1 min-w-0 pr-4">
                                                                <span className={`font-black text-xl tracking-tight truncate ${isDisabled ? 'text-white/40' : 'text-white'}`}>
                                                                    {currentScale.name}
                                                                </span>
                                                                {isDisabled && (
                                                                    <span className="ml-3 text-xs font-medium text-white/30 uppercase tracking-wider">
                                                                        Under Maintenance
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {!isDisabled && (
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
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })()}

                                            {/* Other Scales */}
                                            {processedScales.filter(scale => scale.id !== targetScale.id).map((scale) => {
                                                const isDisabled = scale.id === 'e_amara_18';
                                                return (
                                                    <div
                                                        key={scale.id}
                                                        role="button"
                                                        tabIndex={isDisabled ? -1 : 0}
                                                        onClick={() => !isDisabled && handleScaleSelect(scale)}
                                                        onKeyDown={(e) => { if (!isDisabled && (e.key === 'Enter' || e.key === ' ')) handleScaleSelect(scale); }}
                                                        className={`p-4 rounded-[32px] text-left transition-all duration-300 flex items-center justify-between group relative overflow-hidden border ${isDisabled
                                                            ? 'cursor-default bg-white/[0.01] border-white/[0.02] text-white/40 opacity-50 pointer-events-none'
                                                            : 'cursor-pointer bg-white/[0.02] border-white/[0.05] text-white hover:bg-slate-300/[0.08] hover:border-slate-300/30'
                                                            }`}
                                                    >
                                                        <div className="flex items-center z-10 flex-1 min-w-0 pr-4">
                                                            <span className={`font-black text-xl tracking-tight truncate ${isDisabled ? 'text-white/40' : 'text-white/90'}`}>
                                                                {scale.name}
                                                            </span>
                                                            {isDisabled && (
                                                                <span className="ml-3 text-xs font-medium text-white/30 uppercase tracking-wider">
                                                                    Under Maintenance
                                                                </span>
                                                            )}
                                                        </div>

                                                        {!isDisabled && (
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
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </>
                                    ) : (
                                        /* Songs List */
                                        <>
                                            {/* Current Selected Song - First in List */}
                                            {selectedSong && (
                                                <div className="mb-2">
                                                    <div className="text-[12px] font-black uppercase tracking-[0.3em] text-white/30 mb-2 px-2">CURRENT SELECTED</div>
                                                    <div className="p-4 rounded-[32px] text-left transition-all duration-300 flex items-center justify-between group relative overflow-hidden border cursor-pointer bg-slate-300/[0.06] backdrop-blur-md border-slate-300/30">
                                                        <div className="flex items-center z-10 flex-1 min-w-0 pr-4">
                                                            <div className="flex items-center gap-3">
                                                                <FileText size={20} className="text-white/60" />
                                                                <span className="font-black text-xl tracking-tight truncate text-white">
                                                                    {selectedSong.title}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3 z-10 shrink-0">
                                                            <button
                                                                onClick={toggleSongPlayback}
                                                                disabled={!selectedSong.midiSrc}
                                                                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg ${selectedSong.midiSrc
                                                                    ? 'bg-slate-300/25 hover:bg-slate-300/40 text-slate-100 border border-slate-200/30'
                                                                    : 'bg-gray-500/25 text-gray-400 border border-gray-500/30 cursor-not-allowed'
                                                                    } backdrop-blur-sm`}
                                                            >
                                                                {isSongPlaying ? (
                                                                    <Volume2 size={20} className="animate-pulse" />
                                                                ) : (
                                                                    <Play size={22} fill="currentColor" className="ml-1" />
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Other Songs */}
                                            {REELPAN_SONGS.filter(song => !selectedSong || song.id !== selectedSong.id).map((song) => (
                                                <div
                                                    key={song.id}
                                                    role="button"
                                                    tabIndex={0}
                                                    onClick={() => handleSongSelect(song)}
                                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSongSelect(song); }}
                                                    className="p-4 rounded-[32px] text-left transition-all duration-300 flex items-center justify-between group relative overflow-hidden border cursor-pointer bg-white/[0.02] border-white/[0.05] text-white hover:bg-slate-300/[0.08] hover:border-slate-300/30"
                                                >
                                                    <div className="flex items-center z-10 flex-1 min-w-0 pr-4">
                                                        <div className="flex items-center gap-3">
                                                            <FileText size={20} className="text-white/60" />
                                                            <div>
                                                                <span className="font-black text-xl tracking-tight truncate text-white/90 block">
                                                                    {song.title}
                                                                </span>
                                                                <span className="text-sm text-white/50 block mt-1">
                                                                    {song.scaleName}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3 z-10 shrink-0">
                                                        {song.midiSrc && (
                                                            <div className="flex items-center gap-2 text-xs text-white/40">
                                                                <Music size={12} />
                                                                <span>MIDI</span>
                                                            </div>
                                                        )}
                                                        {song.xmlSrc && (
                                                            <div className="flex items-center gap-2 text-xs text-white/40">
                                                                <FileText size={12} />
                                                                <span>Score</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </>
                                    )}
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
