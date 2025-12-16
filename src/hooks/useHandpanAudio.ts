'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// All available notes in the handpan sound library
const ALL_NOTES = [
    'A3', 'A4', 'A5',
    'Ab3', 'Ab4',
    'B3', 'B4', 'B5',
    'Bb3', 'Bb4', 'Bb5',
    'C3', 'C4', 'C5', 'C6',
    'C#3', 'C#4', 'C#5',
    'D3', 'D4', 'D5',
    'Db3', 'Db4', 'Db5',
    'D#3', 'D#4', 'D#5',
    'E3', 'E4', 'E5',
    'Eb3', 'Eb4', 'Eb5',
    'F3', 'F4', 'F5',
    'F#3', 'F#4', 'F#5',
    'G3', 'G4', 'G5',
    'G#3', 'G#4', 'G#5',
];

export interface UseHandpanAudioReturn {
    isLoaded: boolean;
    loadingProgress: number;
    playNote: (noteName: string, volume?: number) => void;
    getAudioContext: () => any; // Returns AudioContext
    getMasterGain: () => any; // Returns Head Master Gain
}

// Type for Howl instance (avoid importing at top level for SSR compatibility)
type HowlInstance = {
    play: () => void;
    volume: (vol: number) => void;
    unload: () => void;
    state: () => string;
};

/**
 * Custom hook for preloading and playing handpan sounds using Howler.js
 * 
 * Key features:
 * - Preloads all sounds on mount for instant playback
 * - Uses Web Audio API (html5: false) for zero-latency playback
 * - Supports polyphony (overlapping sounds for natural reverb)
 * - Dynamic import to avoid SSR issues with Next.js
 * - Fallback to HTML5 Audio if Howler fails
 */
// Global Cache State (Singleton)
const GLOBAL_SOUND_CACHE: Record<string, any> = {};
let IS_GLOBAL_LOAD_INITIATED = false;
let GLOBAL_LOADING_PROGRESS = 0;
let IS_GLOBAL_LOADED = false;
const OBSERVERS: ((progress: number, isLoaded: boolean) => void)[] = [];

// Helper to notify all hooks of progress
const notifyObservers = () => {
    OBSERVERS.forEach(cb => cb(GLOBAL_LOADING_PROGRESS, IS_GLOBAL_LOADED));
};

export const useHandpanAudio = (): UseHandpanAudioReturn => {
    const [isLoaded, setIsLoaded] = useState(IS_GLOBAL_LOADED);
    const [loadingProgress, setLoadingProgress] = useState(GLOBAL_LOADING_PROGRESS);
    const howlerGlobalRef = useRef<any>(null);

    // Subscribe to global progress updates
    useEffect(() => {
        const handler = (progress: number, loaded: boolean) => {
            setLoadingProgress(progress);
            setIsLoaded(loaded);
        };
        OBSERVERS.push(handler);
        return () => {
            const index = OBSERVERS.indexOf(handler);
            if (index > -1) OBSERVERS.splice(index, 1);
        };
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Initialize Howler & Preload ONLY ONCE
        if (!IS_GLOBAL_LOAD_INITIATED) {
            IS_GLOBAL_LOAD_INITIATED = true;

            import('howler').then(({ Howl, Howler }) => {
                howlerGlobalRef.current = Howler;

                // --- Audio Context & Limiter Logic (Same as before) ---
                const resumeAudioContext = () => {
                    if (Howler && Howler.ctx && Howler.ctx.state === 'suspended') {
                        Howler.ctx.resume().then(() => console.log('[useHandpanAudio] AudioContext resumed'));
                    }
                };

                // Limiter Implementation
                if (Howler && Howler.ctx && Howler.masterGain) {
                    try {
                        const ctx = Howler.ctx as AudioContext;
                        const masterGain = Howler.masterGain as GainNode;
                        const limiter = ctx.createDynamicsCompressor();
                        limiter.threshold.value = -2.0;
                        limiter.knee.value = 0.0;
                        limiter.ratio.value = 20.0;
                        limiter.attack.value = 0.001;
                        limiter.release.value = 0.1;
                        masterGain.disconnect();
                        masterGain.connect(limiter);
                        limiter.connect(ctx.destination);
                        console.log('[useHandpanAudio] Limiter applied');
                    } catch (err) { console.warn('[useHandpanAudio] Limiter failed:', err); }
                }

                // Global Resume Listeners
                ['touchstart', 'touchend', 'click', 'keydown'].forEach(event => {
                    document.addEventListener(event, resumeAudioContext, { passive: true });
                });

                // --- Loading Sounds ---
                const totalSounds = ALL_NOTES.length;
                let loadedCount = 0;

                ALL_NOTES.forEach((note) => {
                    const filename = note.replace('#', '%23');
                    GLOBAL_SOUND_CACHE[note] = new Howl({
                        src: [`/sounds/${filename}.mp3`],
                        preload: true,
                        html5: false,
                        volume: 0.6,
                        onload: () => {
                            loadedCount++;
                            GLOBAL_LOADING_PROGRESS = Math.round((loadedCount / totalSounds) * 100);
                            notifyObservers();

                            if (loadedCount === totalSounds) {
                                IS_GLOBAL_LOADED = true;
                                GLOBAL_LOADING_PROGRESS = 100;
                                notifyObservers();
                                console.log('[useHandpanAudio] All sounds preloaded (Singleton)');
                            }
                        },
                        onloaderror: (_id: number, error: unknown) => {
                            console.error(`[useHandpanAudio] Failed ${note}`, error);
                            loadedCount++; // Count anyway to avoid stuck state
                            if (loadedCount === totalSounds) {
                                IS_GLOBAL_LOADED = true;
                                notifyObservers();
                            }
                        }
                    });
                });

            }).catch(err => console.error('[useHandpanAudio] Howler import failed', err));
        } else {
            // If already initiated, try to capture Howler ref if possible (lazy)
            // Ideally we just trust global Howler exists on window if loaded.
            import('howler').then(({ Howler }) => {
                howlerGlobalRef.current = Howler;
            });
        }
    }, []);

    const playNote = useCallback((noteName: string, volume: number = 0.6) => {
        // Resume check
        import('howler').then(({ Howler }) => {
            if (Howler?.ctx?.state === 'suspended') Howler.ctx.resume();
        });

        const sound = GLOBAL_SOUND_CACHE[noteName];
        if (sound) {
            try {
                sound.volume(volume);
                sound.play();
                return;
            } catch (e) {
                // Fallback
            }
        }

        // Fallback Logic
        const filename = noteName.replace('#', '%23');
        const audio = new Audio(`/sounds/${filename}.mp3`);
        audio.volume = volume;
        audio.play().catch(e => console.error(e));
    }, []);

    const getAudioContext = useCallback(() => {
        // Accessing global Howler context requires import or cached ref
        // We can't guarantee synchronous return if import is needed, 
        // but typically Howler attaches to window.
        // For safety, return null or try to find it.
        return (window as any).Howler?.ctx;
    }, []);

    const getMasterGain = useCallback(() => {
        return (window as any).Howler?.masterGain;
    }, []);

    return { isLoaded, loadingProgress, playNote, getAudioContext, getMasterGain };
};
