import { useEffect, useRef, useState, useCallback } from 'react';
import * as Tone from 'tone';

export const useToneDrum = (bpm: number = 100, kickBaseFreq: number = 40) => {
    const [isPlaying, setIsPlaying] = useState(false);

    // Synths Refs
    const kickRef = useRef<Tone.MembraneSynth | null>(null);
    const snareRef = useRef<Tone.NoiseSynth | null>(null);
    const hatRef = useRef<Tone.MetalSynth | null>(null);
    const loopRef = useRef<Tone.Loop | null>(null);
    const currentBarRef = useRef(0);
    // Dynamic Frequency Ref to allow updates without restarting loop
    const kickFreqRef = useRef(kickBaseFreq);

    // Sync Ref with Prop
    useEffect(() => {
        kickFreqRef.current = kickBaseFreq;
    }, [kickBaseFreq]);

    // Initialization
    useEffect(() => {
        // [New] Master Bus
        const limiter = new Tone.Limiter(-1).toDestination();
        const masterGain = new Tone.Gain(0.2).connect(limiter); // Global Volume Control (Lowered to 0.2)

        // 1. Kick (Deep, Punchy)
        kickRef.current = new Tone.MembraneSynth({
            pitchDecay: 0.05,
            octaves: 6, // Reduced from 10 for less 'click', more 'thud'
            oscillator: { type: "sine" },
            envelope: {
                attack: 0.001,
                decay: 0.4,
                sustain: 0.01,
                release: 1.4,
                attackCurve: "exponential",
            },
            volume: -2 // Restore individual mix balance
        }).connect(masterGain);

        // 2. Snare (Crisp Noise)
        snareRef.current = new Tone.NoiseSynth({
            noise: { type: "white" },
            envelope: { attack: 0.005, decay: 0.1, sustain: 0 },
            volume: -2 // Restore individual mix balance
        }).connect(masterGain);

        // 3. Hi-Hat (Metallic)
        hatRef.current = new Tone.MetalSynth({
            envelope: { attack: 0.001, decay: 0.05, release: 0.01 },
            harmonicity: 5.1,
            modulationIndex: 32,
            resonance: 4000,
            octaves: 1.5
        }).connect(masterGain);
        hatRef.current.volume.value = -15;

        return () => {
            kickRef.current?.dispose();
            snareRef.current?.dispose();
            hatRef.current?.dispose();
            loopRef.current?.dispose();
            masterGain.dispose();
            limiter.dispose();
        };
    }, []);

    // Pattern Logic
    const scheduleRepeat = useCallback(() => {
        // Stop old loop if exists
        if (loopRef.current) loopRef.current.dispose();

        currentBarRef.current = 0;

        // Define Patterns (Same as before)
        const stdKick = [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0]; // 2 Bars
        const stdSnare = [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0];
        const stdHat = [1, 0, 1, 0, 1, 0, 1, 0, 1, 2, 1, 0, 1, 0, 1, 2, 1, 0, 1, 0, 1, 2, 1, 0, 1, 0, 1, 0, 1, 2, 1, 2];

        // Fills
        const fillSimpleKick = [1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0];
        const fillSimpleSnare = [0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1];
        const fillHalfKick = [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0];
        const fillHalfSnare = [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0];
        const fillEndKick = [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0];

        // 16th note loop
        // Legacy Loop block removed


        // Better approach: Tone.Sequence or simple recurring event
        // We will use Tone.Transport.scheduleRepeat

        const loopId = Tone.Transport.scheduleRepeat((time) => {
            const step = currentBarRef.current % 256; // 16 bars * 16 steps
            const barIndex = Math.floor(step / 16);
            const stepInBar = step % 16;
            const patternIndex32 = step % 32;

            let kVal = 0, sVal = 0, hVal = 0;

            // Pattern Selector
            if (barIndex === 15) { // Bar 16 (End)
                kVal = fillEndKick[stepInBar];
                // No snare/hat
            } else if (barIndex === 7) { // Bar 8 (Half)
                kVal = fillHalfKick[stepInBar];
                sVal = fillHalfSnare[stepInBar];
                // Hat logic for half?
            } else if (barIndex === 3 || barIndex === 11) { // Bar 4, 12 (Simple Fill)
                kVal = fillSimpleKick[stepInBar];
                sVal = fillSimpleSnare[stepInBar];
                // hat
            } else { // Standard
                kVal = stdKick[patternIndex32];
                sVal = stdSnare[patternIndex32];
                hVal = stdHat[patternIndex32];
            }

            // Play Sounds
            if (kVal && kickRef.current) {
                // Use Ref for dynamic pitch update
                kickRef.current.triggerAttackRelease(kickFreqRef.current, "8n", time);
            }
            if (sVal && snareRef.current) {
                // Humanize Snare
                const lag = (Math.random() * 0.02);
                snareRef.current.triggerAttackRelease("8n", time + lag);
            }
            if (hVal && hatRef.current) {
                const vel = hVal === 1 ? -15 : -25; // dB
                hatRef.current.volume.value = vel;
                // Explicitly pass frequency (200Hz) as first arg
                hatRef.current.triggerAttackRelease(200, "32n", time);
            }

            // Increment
            currentBarRef.current++;

            // Auto-stop after 16 bars?
            if (currentBarRef.current >= 256) {
                // Stop at end of bar
                Tone.Transport.stop();
                setIsPlaying(false);
                currentBarRef.current = 0;
            }

        }, "16n");

        loopRef.current = { dispose: () => Tone.Transport.clear(loopId) } as any;

    }, []); // Empty dependency: Loop logic doesn't need recreation on freq change now


    const startBeat = async () => {
        await Tone.start();
        Tone.Transport.bpm.value = bpm;
        scheduleRepeat();
        Tone.Transport.start();
        setIsPlaying(true);
    };

    const stopBeat = () => {
        Tone.Transport.stop();
        if (loopRef.current) loopRef.current.dispose();
        currentBarRef.current = 0;
        setIsPlaying(false);
    };

    return { isPlaying, startBeat, stopBeat };
};
