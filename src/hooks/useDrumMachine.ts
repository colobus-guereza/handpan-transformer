import { useState, useRef, useEffect, useCallback } from 'react';

export const useDrumMachine = (bpm: number = 100, durationSeconds: number = 30, kickBaseFreq: number = 40, providedCtx: AudioContext | null = null) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    // Master Gain for easy stopping
    const masterDrumGainRef = useRef<GainNode | null>(null);

    // 컴포넌트 마운트 시 AudioContext 준비
    useEffect(() => {
        if (providedCtx) {
            audioCtxRef.current = providedCtx;
        } else if (typeof window !== 'undefined' && !audioCtxRef.current) {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            audioCtxRef.current = new AudioContext();
        }

        return () => {
            // If providedCtx is used, do NOT close it here.
            if (!providedCtx && audioCtxRef.current) {
                audioCtxRef.current.close();
            }
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [providedCtx]);

    // --- 사운드 합성 함수들 ---

    const createNoiseBuffer = (ctx: AudioContext) => {
        const bufferSize = ctx.sampleRate * 2; // 2초 분량
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        return buffer;
    };

    const playKick = (ctx: AudioContext, destination: AudioNode, time: number, baseFreq: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(destination);

        // Dynamic Frequency from Prop
        // If baseFreq is provided (~50-300Hz for Ding), we use it. 
        // But 40Hz was our "Heavy Bass" target. 
        // If the Ding is A3 (220Hz), playing 220Hz kick is too high.
        // We likely want the Kick to be Sub-Harmonic or related.
        // Rule: If baseFreq is High (>100), Drop Octaves until it's 'Kick-like' (<60Hz)?
        // Or simply: Start at baseFreq and drop deep?
        // User said: "Ding value check -> equal to Ding pitch Hz value".
        // If Ding is 200Hz, Kick starts at 200Hz.
        // Ramp will drop to 40Hz? Or ramp to 0.01?
        // Let's rely on Start Value = Ding Freq.

        osc.frequency.setValueAtTime(baseFreq, time);
        // Deep drop for punch
        osc.frequency.exponentialRampToValueAtTime(40, time + 0.5);

        // Envelope
        gain.gain.setValueAtTime(1, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);

        osc.start(time);
        osc.stop(time + 0.5);
    };

    const playSnare = (ctx: AudioContext, destination: AudioNode, time: number, noiseBuffer: AudioBuffer) => {
        // Tone: Stiff 'Steel' Body (Higher pitch triangle)
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        osc.connect(oscGain);
        oscGain.connect(destination);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(250, time); // Was 100, raised for 'tight metal' tone
        oscGain.gain.setValueAtTime(0.7, time);
        oscGain.gain.exponentialRampToValueAtTime(0.01, time + 0.1); // Short decay (0.1s)
        osc.start(time);
        osc.stop(time + 0.1);

        // Noise: Sharp Snap
        const noise = ctx.createBufferSource();
        const noiseFilter = ctx.createBiquadFilter();
        const noiseGain = ctx.createGain();

        noise.buffer = noiseBuffer;
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.value = 3000; // Was 1000, crisper snap

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(destination);

        noiseGain.gain.setValueAtTime(1, time);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.15); // Shorter decay for 'sticky' feel

        noise.start(time);
        noise.stop(time + 0.15);
    };

    const playHiHat = (ctx: AudioContext, destination: AudioNode, time: number, noiseBuffer: AudioBuffer, volume: number = 0.2) => {
        const source = ctx.createBufferSource();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        source.buffer = noiseBuffer;

        // Lighter Friction: Higher frequency cut
        filter.type = 'highpass';
        filter.frequency.value = 8000;

        source.connect(filter);
        filter.connect(gain);
        gain.connect(destination);

        // Dynamic Volume (Velocity)
        gain.gain.setValueAtTime(volume, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);

        source.start(time);
        source.stop(time + 0.03);
    };

    const stopBeat = useCallback(() => {
        const ctx = audioCtxRef.current;
        if (!ctx) return;

        // Stop by disconnecting Master Gain
        if (masterDrumGainRef.current) {
            // Fade out slightly to avoid click?
            // Since we want immediate stop, just disconnect.
            masterDrumGainRef.current.disconnect();
            masterDrumGainRef.current = null;
        }

        // Do NOT suspend context as it is shared
        // ctx.suspend(); 

        setIsPlaying(false);

        if (timerRef.current) clearTimeout(timerRef.current);
    }, []);

    // --- [핵심 수정] 그루브가 적용된 시퀀서 로직 ---
    const startBeat = useCallback(() => {
        const ctx = audioCtxRef.current;
        if (!ctx) return;

        if (ctx.state === 'suspended') ctx.resume();

        // Setup Master Gain for this session
        const masterGain = ctx.createGain();
        masterGain.gain.value = 1.0;
        masterGain.connect(ctx.destination);
        masterDrumGainRef.current = masterGain;

        setIsPlaying(true);
        // Vinyl Noise skipped or can be added if playVinylNoise function exists
        // playVinylNoise(ctx); 

        const startTime = ctx.currentTime + 0.1;

        // BPM 100 Force Update
        const currentBPM = 100;
        const sixteenthTime = (60 / currentBPM) / 4;

        // 16 Bars * 16 sixteenths = 256 steps
        const totalBars = 16;
        const totalSixteenths = totalBars * 16;
        // Sync Duration for Timer: 38.4 seconds
        const seqDuration = totalSixteenths * sixteenthTime;

        // ★ Groove Constants
        const SWING_AMOUNT = 0.035;
        const SNARE_LAG = 0.020;
        const HUMAN_JITTER = 0.006;

        // Standard Pattern (2 Bars / 32 steps) loop
        const stdKick = [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0];
        const stdSnare = [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0];
        const stdHat = [1, 0, 1, 0, 1, 0, 1, 0, 1, 2, 1, 0, 1, 0, 1, 2, 1, 0, 1, 0, 1, 2, 1, 0, 1, 0, 1, 0, 1, 2, 1, 2];

        // [New Pattern 1] Lo-fi Fill (Bar 4 & 12) - "Chill Hop Stutter"
        // Syncopated Kicks & Ghost Snares to keep the groove flowing but interesting
        const fillSimpleKick = [1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0]; // Kicks on off-beats
        const fillSimpleSnare = [0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1]; // Snares with ghost notes
        const fillSimpleHat = [1, 0, 1, 0, 1, 2, 1, 2, 1, 0, 1, 0, 1, 2, 0, 0]; // Dynamic hats

        // [New Pattern 2] Half-time Fill (Bar 8) - "Drunk Breakdown"
        // Broken beat feel, very sparse
        const fillHalfKick = [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0]; // Kick interaction
        const fillHalfSnare = [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0]; // Snare on 3 (Half time) + Ghost
        const fillHalfHat = [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0]; // Drifting hats

        // [New Pattern 3] Ending Fill (Bar 16) - "Heartbeat Finale"
        // Kick Only. Beat 1: "Kung", Beat 3: "Kung-Kung".
        const fillEndKick = [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0]; // Beat 1, Beat 3(Double)
        const fillEndSnare = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; // No Snare
        const fillEndHat = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; // No Hat

        const noiseBuffer = createNoiseBuffer(ctx);

        for (let i = 0; i < totalSixteenths; i++) {
            // Determine current bar (0-15) and step in bar (0-15)
            const currentBar = Math.floor(i / 16);
            const stepInBar = i % 16;

            const patternIndex32 = i % 32;

            let time = startTime + i * sixteenthTime;

            if (i % 2 !== 0) {
                time += SWING_AMOUNT;
            }

            const jitter = (Math.random() - 0.5) * HUMAN_JITTER;
            time += jitter;

            // Select Pattern Logic
            let kVal = 0, sVal = 0, hVal = 0;

            if (currentBar === 15) {
                // [Bar 16] Ending
                kVal = fillEndKick[stepInBar];
                sVal = fillEndSnare[stepInBar];
                hVal = fillEndHat[stepInBar];
            }
            else if (currentBar === 7) {
                // [Bar 8] Half-time
                kVal = fillHalfKick[stepInBar];
                sVal = fillHalfSnare[stepInBar];
                hVal = fillHalfHat[stepInBar];
            }
            else if (currentBar === 3 || currentBar === 11) {
                // [Bar 4, 12] Simple Fill
                kVal = fillSimpleKick[stepInBar];
                sVal = fillSimpleSnare[stepInBar];
                hVal = fillSimpleHat[stepInBar];
            }
            else {
                // [Standard]
                kVal = stdKick[patternIndex32];
                sVal = stdSnare[patternIndex32];
                hVal = stdHat[patternIndex32];
            }

            // --- Instrument Triggering ---

            // 1. Kick
            if (kVal && masterDrumGainRef.current) {
                playKick(ctx, masterDrumGainRef.current, time, kickBaseFreq);
            }

            // 2. Snare
            if (sVal && masterDrumGainRef.current) {
                playSnare(ctx, masterDrumGainRef.current, time + SNARE_LAG, noiseBuffer);
            }

            // 3. Hi-hat
            if (hVal > 0 && masterDrumGainRef.current) {
                const volume = hVal === 1 ? 0.2 : 0.08;
                const extraLag = (hVal === 2) ? 0.01 : 0;
                playHiHat(ctx, masterDrumGainRef.current, time + extraLag, noiseBuffer, volume);
            }
        }

        timerRef.current = setTimeout(() => {
            setIsPlaying(false);
        }, seqDuration * 1000);
    }, [kickBaseFreq]); // removed durationSeconds prop dependency as we calculate it internally now

    // Expose Calculated Duration (16 Bars @ 100 BPM = 38.4s)
    const totalDuration = (16 * 4 * 60) / 100; // 38.4

    return { isPlaying, startBeat, stopBeat, totalDuration };
};
