import { useEffect, useRef, useState, useCallback } from 'react';
import * as Tone from 'tone';
import { calculateChordProgression, ChordSet } from '@/utils/ChordCalculator';

interface JamSessionProps {
    bpm?: number;
    rootNote: string;      // e.g., "D3" (스케일 Ding)
    scaleNotes: string[];  // 전체 스케일 노트
    enabled?: boolean;     // NEW: If false, all audio logic is disabled
}

export const useJamSession = ({
    bpm = 100,
    rootNote,
    scaleNotes,
    enabled = true  // Default: enabled
}: JamSessionProps) => {
    const [isPlaying, setIsPlaying] = useState(false);

    // === Synth Refs ===
    const padSynthRef = useRef<Tone.PolySynth | null>(null);
    const kickRef = useRef<Tone.MembraneSynth | null>(null);
    const snareRef = useRef<Tone.NoiseSynth | null>(null);
    const hatRef = useRef<Tone.NoiseSynth | null>(null);

    // === Sequence/Part Refs ===
    const chordPartRef = useRef<Tone.Part | null>(null);
    const drumLoopIdRef = useRef<number | null>(null);

    // === Effect Chain Refs (for cleanup) ===
    const effectsRef = useRef<Tone.ToneAudioNode[]>([]);
    const masterGainRef = useRef<Tone.Gain | null>(null);
    const reverbRef = useRef<Tone.Reverb | null>(null);
    const delayRef = useRef<Tone.PingPongDelay | null>(null);

    // === Dynamic Refs ===
    const currentStepRef = useRef(-32);
    const kickPitchRef = useRef(40);
    const chordSetsRef = useRef<ChordSet[]>([]);

    // === [1] 악기 초기화 (한 번만 실행) ===
    useEffect(() => {
        // ★ If disabled, do NOT initialize any audio resources
        if (!enabled) return;
        // Master Bus
        const limiter = new Tone.Limiter(-1).toDestination();
        const masterGain = new Tone.Gain(0.225).connect(limiter); // Drum master (lowered 10%)

        // --- PAD SYNTH (from useDreamyPad) ---
        const reverb = new Tone.Reverb({
            decay: 10,
            wet: 0.5,
            preDelay: 0.2
        }).connect(masterGain);

        const delay = new Tone.PingPongDelay({
            delayTime: "4n.",
            feedback: 0.35,
            wet: 0.25
        }).connect(reverb);

        const chorus = new Tone.Chorus({
            frequency: 0.3,
            delayTime: 4.5,
            depth: 0.7,
            spread: 180
        }).connect(delay).start();

        const autoFilter = new Tone.AutoFilter({
            frequency: 0.1,
            baseFrequency: 400,
            octaves: 2,
            filter: { type: "lowpass", rolloff: -24, Q: 1 }
        }).connect(chorus).start();

        padSynthRef.current = new Tone.PolySynth(Tone.Synth, {
            oscillator: {
                type: "fattriangle",
                count: 3,
                spread: 40
            },
            envelope: {
                attack: 2.5,
                decay: 2.0,
                sustain: 1.0,
                release: 4.0,
                attackCurve: "exponential"
            },
            volume: -16 // Pad volume (raised 10%)
        });
        padSynthRef.current.maxPolyphony = 6;
        padSynthRef.current.connect(autoFilter);

        // --- DRUM SYNTHS (from useToneDrum) ---
        kickRef.current = new Tone.MembraneSynth({
            pitchDecay: 0.05,
            octaves: 6,
            oscillator: { type: "sine" },
            envelope: {
                attack: 0.001,
                decay: 0.4,
                sustain: 0.01,
                release: 1.4,
                attackCurve: "exponential"
            },
            volume: -4
        }).connect(masterGain);

        snareRef.current = new Tone.NoiseSynth({
            noise: { type: "white" },
            envelope: { attack: 0.005, decay: 0.1, sustain: 0 },
            volume: -6
        }).connect(masterGain);

        // Soft Hi-Hat: NoiseSynth with Bandpass Filter (No metallic harshness)
        const hatFilter = new Tone.Filter({
            type: "bandpass",
            frequency: 1200,    // Center around 1.2kHz (mellow, low-pitched)
            rolloff: -24,
            Q: 1.5              // Narrow band for focused tone
        }).connect(masterGain);

        hatRef.current = new Tone.NoiseSynth({
            noise: { type: "pink" },  // Pink noise = softer than white
            envelope: {
                attack: 0.002,
                decay: 0.05,          // Short, tight decay
                sustain: 0,
                release: 0.01
            },
            volume: -14               // Slightly louder to compensate for filtering
        }).connect(hatFilter);

        // Store effects for cleanup
        effectsRef.current = [limiter, masterGain, reverb, delay, chorus, autoFilter, hatFilter];
        masterGainRef.current = masterGain;
        reverbRef.current = reverb;
        delayRef.current = delay;

        return () => {
            padSynthRef.current?.dispose();
            kickRef.current?.dispose();
            snareRef.current?.dispose();
            hatRef.current?.dispose();
            effectsRef.current.forEach(e => e.dispose());
            if (drumLoopIdRef.current !== null) {
                Tone.Transport.clear(drumLoopIdRef.current);
            }
            chordPartRef.current?.dispose();
        };
    }, []);

    // === Ref to track previous scale for change detection ===
    const prevScaleRef = useRef<string>("");

    // === [2] 스케일 변경 시 데이터 업데이트 + 자동 중지 ===
    useEffect(() => {
        // ★ If disabled, skip ALL logic (Mobile Optimization for /practice)
        if (!enabled) {
            return;
        }

        if (!rootNote || scaleNotes.length < 5) return;

        // 스케일 변경 감지를 위한 키 생성
        const scaleKey = `${rootNote}-${scaleNotes.join(',')}`;
        const scaleChanged = prevScaleRef.current !== "" && prevScaleRef.current !== scaleKey;
        prevScaleRef.current = scaleKey;

        // ★ 스케일이 실제로 변경되었을 때만 재생 중지 (Transport 상태로 확인)
        if (scaleChanged && Tone.Transport.state === "started") {
            Tone.Transport.stop();
            Tone.Transport.position = 0;
            padSynthRef.current?.releaseAll();
            currentStepRef.current = -32;
            if (drumLoopIdRef.current !== null) {
                Tone.Transport.clear(drumLoopIdRef.current);
                drumLoopIdRef.current = null;
            }
            if (chordPartRef.current) {
                chordPartRef.current.dispose();
                chordPartRef.current = null;
            }
            setIsPlaying(false);
            console.log(`[JamSession] Scale changed - auto-stopped playback`);
        }

        // A. 킥 피치 튜닝: Root -24 semitones (2 octaves down)
        kickPitchRef.current = Tone.Frequency(rootNote).transpose(-24).toFrequency();

        // B. 화성 진행 계산
        chordSetsRef.current = calculateChordProgression(scaleNotes);

        console.log(`[JamSession] Scale Updated: Root=${rootNote}, KickHz=${kickPitchRef.current.toFixed(1)}`);
        console.log(`[JamSession] Chords:`, chordSetsRef.current);

    }, [enabled, rootNote, scaleNotes]); // ★ enabled 추가 - disabled 시 재실행 방지


    const [introCountdown, setIntroCountdown] = useState<string | null>(null);

    const hasInteractedRef = useRef(false);

    const onInteraction = useCallback(() => {
        hasInteractedRef.current = true;
    }, []);

    // === [3] 시퀀스 스케줄링 ===
    const scheduleSession = useCallback(() => {
        const chordSets = chordSetsRef.current;
        if (chordSets.length < 4 || !padSynthRef.current) return;

        Tone.Transport.bpm.value = bpm;

        // --- CHORD PART ---
        // 인트로 2마디(총 8박자/32 steps) 고려하여 2마디 뒤로 밀어서 스케줄링
        if (chordPartRef.current) {
            chordPartRef.current.dispose();
        }

        chordPartRef.current = new Tone.Part((time, value) => {
            const chord = value as ChordSet;
            padSynthRef.current?.triggerAttackRelease(chord.notes, "4m", time);
            console.log(`[Chord] Bar ${chord.barStart}: ${chord.role}`, chord.notes);
        }, [
            ["2:0:0", chordSets[0]],   // Bar 1 starts at 2:0:0 due to 2-bar intro
            ["6:0:0", chordSets[1]],   // Bar 5 -> 6:0:0
            ["10:0:0", chordSets[2]],  // Bar 9 -> 10:0:0
            ["14:0:0", chordSets[3]]   // Bar 13 -> 14:0:0
        ]);
        chordPartRef.current.start(0);
        chordPartRef.current.loop = false; // 한 번만 재생

        // --- DRUM LOOP (16n Grid) ---
        // Intro 2 bars + Main 16 bars = Total 18 bars logic roughly, 
        // but we handle it by starting step count from negative.
        if (drumLoopIdRef.current !== null) {
            Tone.Transport.clear(drumLoopIdRef.current);
        }

        // Start from -32 (2 bars before 0)
        // Bar -2: Intro 1 (Minimal)
        // Bar -1: Intro 2 (Fill-in)
        // Bar 0+: Main Loop
        currentStepRef.current = -32;
        setIntroCountdown(null); // Reset countdown on start schedule

        // Patterns (from useToneDrum)
        const stdKick = [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0];
        const stdSnare = [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0];
        const stdHat = [1, 0, 1, 0, 1, 0, 1, 0, 1, 2, 1, 0, 1, 0, 1, 2, 1, 0, 1, 0, 1, 2, 1, 0, 1, 0, 1, 0, 1, 2, 1, 2];
        const fillSimpleKick = [1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0];
        const fillSimpleSnare = [0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1];
        const fillHalfKick = [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0];
        const fillHalfSnare = [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0];
        const fillEndKick = [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0];

        drumLoopIdRef.current = Tone.Transport.scheduleRepeat((time) => {
            const currentStep = currentStepRef.current;

            let kVal = 0, sVal = 0, hVal = 0;

            // === VISUAL COUNTDOWN LOGIC ===
            let countdownText: string | null = null;

            // Reset Interaction Flag at start of Touch window (approx Step -3)
            if (currentStep === -3) {
                hasInteractedRef.current = false;
            }

            if (currentStep >= -32 && currentStep < -24) countdownText = "4";
            else if (currentStep >= -24 && currentStep < -16) countdownText = "3";
            else if (currentStep >= -16 && currentStep < -8) countdownText = "2";
            else if (currentStep >= -8 && currentStep < -3) countdownText = "1";
            else if (currentStep >= -3 && currentStep < 4) countdownText = "Touch!";
            else {
                countdownText = null;
            }

            // Schedule UI update on Animation Frame
            Tone.Draw.schedule(() => {
                if (Tone.Transport.state === 'started') {
                    setIntroCountdown(countdownText);
                }
            }, time);


            if (currentStep < 0) {
                // === INTRO PHASE ===
                // Bar -2 (steps -32 to -17) or Bar -1 (steps -16 to -1)

                // Map negative step to 0-31 index
                // -32 -> 0, -1 -> 31
                const introIndex = currentStep + 32;
                const introBarIndex = Math.floor(introIndex / 16); // 0 or 1
                const stepInBar = introIndex % 16;
                const patternIndex32 = introIndex % 32;

                if (introBarIndex === 1) {
                    // Intro Bar 2: Use Fill End Kick only (Kung KungKung) - Same as 16th Bar Fill
                    kVal = fillEndKick[stepInBar];
                    sVal = 0;
                    hVal = 0;
                } else {
                    // Intro Bar 1: Simple Minimal
                    kVal = stdKick[patternIndex32];
                    sVal = stdSnare[patternIndex32];
                    hVal = stdHat[patternIndex32];
                }

            } else {
                // === MAIN LOOP PHASE (Existing Logic) ===
                const step = currentStep % 256;
                const barIndex = Math.floor(step / 16);
                const stepInBar = step % 16;
                const patternIndex32 = step % 32;

                if (barIndex === 15) {
                    kVal = fillEndKick[stepInBar];
                } else if (barIndex === 7) {
                    kVal = fillHalfKick[stepInBar];
                    sVal = fillHalfSnare[stepInBar];
                } else if (barIndex === 3 || barIndex === 11) {
                    kVal = fillSimpleKick[stepInBar];
                    sVal = fillSimpleSnare[stepInBar];
                } else {
                    kVal = stdKick[patternIndex32];
                    sVal = stdSnare[patternIndex32];
                    hVal = stdHat[patternIndex32];
                }
            }

            // Play drums
            if (kVal && kickRef.current) {
                kickRef.current.triggerAttackRelease(kickPitchRef.current, "8n", time);
            }
            if (sVal && snareRef.current) {
                const lag = Math.random() * 0.02;
                snareRef.current.triggerAttackRelease("8n", time + lag);
            }
            if (hVal && hatRef.current) {
                const vel = hVal === 1 ? -18 : -26;
                hatRef.current.volume.value = vel;
                hatRef.current.triggerAttackRelease("32n", time);
            }

            currentStepRef.current++;

            // Auto-stop after 16 bars (Main loop done)
            // Main loop is 256 steps. So stop at 256.
            if (currentStepRef.current >= 256) {
                Tone.Transport.stop();
                padSynthRef.current?.releaseAll();
                setIsPlaying(false);
                currentStepRef.current = -32; // Reset to intro start for next play
                setIntroCountdown(null); // Reset text on auto-stop
            }
        }, "16n");

    }, [bpm]);


    // === [4] 통합 재생 제어 ===
    const togglePlay = useCallback(async () => {
        // ★ If disabled, do nothing
        if (!enabled) return;
        await Tone.start();

        // React 상태 대신 Tone.Transport 실제 상태로 확인 (더 신뢰성 있음)
        const isCurrentlyPlaying = Tone.Transport.state === "started";

        if (isCurrentlyPlaying) {
            // STOP - 완전 초기화
            Tone.Transport.stop();
            Tone.Transport.cancel();  // 모든 스케줄된 이벤트 완전 취소
            Tone.Transport.position = 0;

            // 부드러운 컷오프 (500ms) - 틱 소리 방지 + 이펙트 wet 0 (복구는 START에서)
            const now = Tone.now();
            if (masterGainRef.current) {
                masterGainRef.current.gain.cancelScheduledValues(now);
                masterGainRef.current.gain.setValueAtTime(masterGainRef.current.gain.value, now);
                masterGainRef.current.gain.linearRampToValueAtTime(0, now + 0.5);
            }
            if (reverbRef.current) {
                reverbRef.current.wet.cancelScheduledValues(now);
                reverbRef.current.wet.setValueAtTime(reverbRef.current.wet.value, now);
                reverbRef.current.wet.linearRampToValueAtTime(0, now + 0.5);
            }
            if (delayRef.current) {
                delayRef.current.wet.cancelScheduledValues(now);
                delayRef.current.wet.setValueAtTime(delayRef.current.wet.value, now);
                delayRef.current.wet.linearRampToValueAtTime(0, now + 0.5);
            }

            padSynthRef.current?.releaseAll();
            currentStepRef.current = -32;
            if (drumLoopIdRef.current !== null) {
                Tone.Transport.clear(drumLoopIdRef.current);
                drumLoopIdRef.current = null;
            }
            if (chordPartRef.current) {
                chordPartRef.current.dispose();
                chordPartRef.current = null;
            }
            setIsPlaying(false);
            setIntroCountdown(null); // Fix: Reset countdown on manual stop
        } else {
            // START - 게인/이펙트 값 복구 후 재생
            if (masterGainRef.current) masterGainRef.current.gain.value = 0.225;
            if (reverbRef.current) reverbRef.current.wet.value = 0.5;
            if (delayRef.current) delayRef.current.wet.value = 0.25;

            Tone.Transport.cancel();
            Tone.Transport.position = 0;
            currentStepRef.current = -32;
            scheduleSession();
            Tone.Transport.start();
            setIsPlaying(true);
        }
    }, [scheduleSession]); // isPlaying 의존성 제거 (Transport.state 사용)

    return { togglePlay, isPlaying, introCountdown, onInteraction };
};
