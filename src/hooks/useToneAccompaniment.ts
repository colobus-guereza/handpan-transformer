import { useRef, useEffect } from 'react';
import * as Tone from 'tone';

export const useToneAccompaniment = () => {
    const synthRef = useRef<Tone.PolySynth | null>(null);
    const reverbRef = useRef<Tone.Reverb | null>(null);
    const filterRef = useRef<Tone.Filter | null>(null);

    useEffect(() => {
        // 1. Reverb (Space)
        reverbRef.current = new Tone.Reverb({
            decay: 4,
            preDelay: 0.1,
            wet: 0.5
        }).toDestination();

        // 2. Filter (Warmth)
        filterRef.current = new Tone.Filter(800, "lowpass").connect(reverbRef.current);

        // 3. PolySynth (Pad)
        synthRef.current = new Tone.PolySynth(Tone.Synth, {
            oscillator: {
                type: "sawtooth" // Rich harmonics
            },
            envelope: {
                attack: 1, // Slow fade in
                decay: 0.5,
                sustain: 0.8,
                release: 2 // Long tail
            }
        }).connect(filterRef.current);

        // Volume adjustment
        synthRef.current.volume.value = -12;

        return () => {
            synthRef.current?.dispose();
            filterRef.current?.dispose();
            reverbRef.current?.dispose();
        };
    }, []);

    const playDrone = (freq: number) => {
        if (synthRef.current) {
            // Trigger Ding and Sub-Octave
            const notes = [freq, freq / 2];
            synthRef.current.triggerAttack(notes);
            console.log("[useToneAccompaniment] Drone Started:", notes);
        }
    };

    const stopDrone = () => {
        if (synthRef.current) {
            synthRef.current.releaseAll();
            console.log("[useToneAccompaniment] Drone Stopped");
        }
    };

    return { playDrone, stopDrone };
};
