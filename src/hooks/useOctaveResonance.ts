import { useRef, useEffect, useCallback } from 'react';

export interface ResonanceSettings {
    trimStart: number;      // Seconds to cut from start (Attack removal)
    fadeInDuration: number; // Seconds for fade-in
    fadeInCurve: number;    // Exponential factor (1 = linear, 5 = very steep)
    delayTime: number;      // Seconds to delay playback (Latency)
    masterGain: number;     // Volume of the harmonic
}

// Global Cache for AudioBuffers (Persists across component unmounts)
const globalAudioBuffers = new Map<string, AudioBuffer>();

interface UseOctaveResonanceProps {
    getAudioContext?: () => AudioContext | null;
    getMasterGain?: () => GainNode | null;
}

export const useOctaveResonance = ({ getAudioContext, getMasterGain }: UseOctaveResonanceProps = {}) => {
    // We no longer strictly need a local ref if we use the getter, 
    // but for fallback we might still want one? 
    // Actually, to fix the mobile issue, we should AVOID creating a local context if one is supplied.
    const localAudioContextRef = useRef<AudioContext | null>(null);

    // Helper to get the active context (Shared or Local)
    const getContext = useCallback(() => {
        if (getAudioContext) {
            const ctx = getAudioContext();
            if (ctx) return ctx;
        }
        return localAudioContextRef.current;
    }, [getAudioContext]);

    // Initialize Local AudioContext ONLY if no shared getter is provided (Legacy fallback)
    useEffect(() => {
        if (!getAudioContext) {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContextClass) {
                localAudioContextRef.current = new AudioContext();
            }
        }
        return () => {
            if (localAudioContextRef.current) {
                localAudioContextRef.current.close().catch(e => console.warn("Failed to close AC", e));
            }
        };
    }, [getAudioContext]);

    // Load Audio Buffer (Global Cache)
    const loadBuffer = useCallback(async (noteName: string) => {
        // Return existing from Global Cache if available
        if (globalAudioBuffers.has(noteName)) {
            return globalAudioBuffers.get(noteName)!;
        }

        const ctx = getContext();
        if (!ctx) return null;

        try {
            const fileName = noteName.replace('#', '%23'); // Simple manual encode for #
            const response = await fetch(`/sounds/${fileName}.mp3`);
            const arrayBuffer = await response.arrayBuffer();

            // decoding audio data requires a context
            const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

            globalAudioBuffers.set(noteName, audioBuffer);
            return audioBuffer;
        } catch (error) {
            console.error(`Failed to load resonance audio: ${noteName}`, error);
            return null;
        }
    }, [getContext]);

    const playResonantNote = useCallback(async (noteName: string, settings: ResonanceSettings) => {
        const ctx = getContext();
        if (!ctx) return;

        // Resume context if suspended (browser autoplay policy)
        if (ctx.state === 'suspended') {
            await ctx.resume();
        }

        const buffer = await loadBuffer(noteName);
        if (!buffer) return;

        const source = ctx.createBufferSource();
        source.buffer = buffer;

        // Create Gain Node for Envelope Control
        const gainNode = ctx.createGain();
        source.connect(gainNode);

        // --- CRITICAL FIX: Route to Shared Master Gain (Limiter) ---
        // If masterGainGetter is provided, connect to it. Otherwise connect to destination.
        // This ensures harmonics go through the same Limiter as main notes.
        const masterGain = getMasterGain ? getMasterGain() : null;
        if (masterGain) {
            gainNode.connect(masterGain);
        } else {
            gainNode.connect(ctx.destination);
        }

        // Schedule Timing
        const now = ctx.currentTime;
        const startTime = now + settings.delayTime;

        // 1. Attack Trim (Offset start position)

        // 2. Fade In (Exponential Ramp)
        // Initial silence
        gainNode.gain.setValueAtTime(0, startTime);

        if (settings.fadeInCurve > 1) {
            // WebAudio implementation:
            gainNode.gain.linearRampToValueAtTime(0.01, startTime); // Prevent 0 error for exp
            gainNode.gain.exponentialRampToValueAtTime(settings.masterGain, startTime + settings.fadeInDuration);
        } else {
            // Linear
            gainNode.gain.linearRampToValueAtTime(settings.masterGain, startTime + settings.fadeInDuration);
        }

        // Play
        // start(when, offset, duration)
        source.start(startTime, settings.trimStart);

        // Stop after buffer duration (optional, garbage collection handles it)
    }, [getContext, loadBuffer, getMasterGain]);

    // Smart Preloading Function
    const preloadNotes = useCallback(async (noteNames: string[]) => {
        // Initialize local if needed and no shared
        if (!getAudioContext && !localAudioContextRef.current) {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContextClass) {
                localAudioContextRef.current = new AudioContext();
            }
        }

        // Parallel loading without blocking
        noteNames.forEach(note => {
            // Only load if not already in global cache
            if (!globalAudioBuffers.has(note)) {
                loadBuffer(note).catch(err => console.warn(`[Resonance] Preload failed for ${note}`, err));
            }
        });
    }, [loadBuffer, getAudioContext]);

    return {
        playResonantNote,
        preloadNotes
    };
};
