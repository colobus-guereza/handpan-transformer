'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// All available notes in the handpan sound library
const normalizeNote = (note: string): string => {
    // Map common aliases to the filenames we likely have
    const map: Record<string, string> = {
        'A#3': 'Bb3', 'A#4': 'Bb4', 'A#5': 'Bb5',
        'C#3': 'C#3', 'Db3': 'C#3', // Prefer C# if both exist or just standardizing
        'C#4': 'C#4', 'Db4': 'C#4',
        'C#5': 'C#5', 'Db5': 'C#5',
        'D#3': 'D#3', 'Eb3': 'D#3', // Standardize to Sharp or Flat based on ALL_NOTES?
        'D#4': 'D#4', 'Eb4': 'D#4',
        'D#5': 'D#5', 'Eb5': 'D#5',
        'F#3': 'F#3', 'Gb3': 'F#3',
        'F#4': 'F#4', 'Gb4': 'F#4',
        'F#5': 'F#5', 'Gb5': 'F#5',
        'G#3': 'G#3', 'Ab3': 'G#3',
        'G#4': 'G#4', 'Ab4': 'G#4',
        'G#5': 'G#5', 'Ab5': 'G#5',
        'SnareL': 'Snare',
        'SnareR': 'Snare',
    };
    if (map[note]) return map[note];
    return note;
};

// All available notes in the handpan sound library
// Adjusted to match the likely file existence and normalization
const ALL_NOTES = [
    'A3', 'A4', 'A5',
    'Bb3', 'Bb4', 'Bb5', // A# mapped here
    'B3', 'B4', 'B5',
    'C3', 'C4', 'C5', 'C6',
    'C#3', 'C#4', 'C#5', // Db mapped here
    'D3', 'D4', 'D5',
    'D#3', 'D#4', 'D#5', // Eb mapped here
    'E3', 'E4', 'E5',
    'F3', 'F4', 'F5',
    'F#3', 'F#4', 'F#5', // Gb mapped here
    'G3', 'G4', 'G5',
    'G#3', 'G#4', 'G#5', // Ab mapped here
    'Snare', 'Snare2', 'Snare3', // Custom Snare Sounds
];

export interface UseHandpanAudioReturn {
    isLoaded: boolean;
    loadingProgress: number;
    playNote: (noteName: string, volume?: number) => void;
    resumeAudio: () => void;
    getAudioContext: () => any; // Returns AudioContext
    getMasterGain: () => any; // Returns Head Master Gain
    preloadScaleNotes: (notes: string[]) => Promise<void>; // Preload specific notes for a scale
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
 */
// Global Cache State (Singleton)
const GLOBAL_SOUND_CACHE: Record<string, any> = {};
let IS_GLOBAL_LOAD_INITIATED = false;
let GLOBAL_LOADING_PROGRESS = 0;
let IS_GLOBAL_LOADED = false;
// Global Howler Reference
let GLOBAL_HOWLER: any = null;
const OBSERVERS: ((progress: number, isLoaded: boolean) => void)[] = [];

// ★ First Touch Performance Debugging
let IS_FIRST_TOUCH = true;

// Helper to notify all hooks of progress
const notifyObservers = () => {
    OBSERVERS.forEach(cb => cb(GLOBAL_LOADING_PROGRESS, IS_GLOBAL_LOADED));
};

export const useHandpanAudio = (): UseHandpanAudioReturn => {
    const [isLoaded, setIsLoaded] = useState(IS_GLOBAL_LOADED);
    const [loadingProgress, setLoadingProgress] = useState(GLOBAL_LOADING_PROGRESS);

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
                GLOBAL_HOWLER = Howler;

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
                    let filename = note.replace('#', '%23');
                    if (note === 'Snare') filename = 'snare1';
                    if (note === 'Snare2') filename = 'snare2';
                    if (note === 'Snare3') filename = 'snare3';

                    GLOBAL_SOUND_CACHE[note] = new Howl({
                        src: [`/sounds/${filename}.mp3`],
                        format: ['mp3'],
                        preload: true,
                        html5: false,
                        volume: 0.6,
                        pool: 10, // 동시 재생 인스턴스 10개 확보 (빠른 연타 대응)
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
        }
    }, []);

    const resumeAudio = useCallback(() => {
        if (GLOBAL_HOWLER?.ctx?.state === 'suspended') {
            GLOBAL_HOWLER.ctx.resume();
        }
    }, []);

    // Global Ref to track if we've already tried to resume context on this interaction
    // (This helps avoid repeated calls to resume() which can be expensive)
    const contextResumedRef = useRef(false);

    const playNote = useCallback((noteName: string, volume: number = 0.6) => {
        // --- [Latency Optimization] ---
        // 1. Resume AudioContext optimistically only once per interaction cycle if needed
        if (GLOBAL_HOWLER?.ctx?.state === 'suspended' && !contextResumedRef.current) {
            GLOBAL_HOWLER.ctx.resume();
            contextResumedRef.current = true;
            // Reset ref after a short delay to allow re-checking in future independent interactions
            setTimeout(() => { contextResumedRef.current = false; }, 100);
        }

        // 2. Fast Cache Lookup (Try direct access first)
        let sound = GLOBAL_SOUND_CACHE[noteName];

        // 3. Normalize if miss (A# -> Bb)
        if (!sound) {
            const normalized = normalizeNote(noteName);
            sound = GLOBAL_SOUND_CACHE[normalized];

            // 4. Fallback (rare)
            if (!sound) {
                // Determine filename (handle # for URL)
                const filename = normalized.replace('#', '%23');
                const audio = new Audio(`/sounds/${filename}.mp3`);
                audio.volume = volume;
                audio.play().catch(() => { }); // Silent catch
                return;
            }
        }

        // 5. Play with Howler (Optimized path)
        try {
            sound.volume(volume);
            sound.play();
        } catch (e) {
            // Silent catch to prevent main thread blocking on logging
        }
    }, []);

    const getAudioContext = useCallback(() => {
        return GLOBAL_HOWLER?.ctx;
    }, []);

    const getMasterGain = useCallback(() => {
        return GLOBAL_HOWLER?.masterGain;
    }, []);

    // Preload specific notes for a scale (ensures they're decoded and ready)
    const preloadScaleNotes = useCallback(async (notes: string[]): Promise<void> => {
        if (!notes || notes.length === 0) return;

        const promises: Promise<void>[] = [];

        notes.forEach(note => {
            const normalized = normalizeNote(note);
            const sound = GLOBAL_SOUND_CACHE[normalized];

            if (sound && sound.state() !== 'loaded') {
                // Wait for this sound to finish loading
                promises.push(new Promise<void>((resolve) => {
                    const checkState = () => {
                        if (sound.state() === 'loaded') {
                            resolve();
                        } else {
                            setTimeout(checkState, 50);
                        }
                    };
                    checkState();
                }));
            }
        });

        if (promises.length > 0) {
            await Promise.all(promises);
            console.log(`[useHandpanAudio] Preloaded ${notes.length} scale notes`);
        }
    }, []);

    return { isLoaded, loadingProgress, playNote, resumeAudio, getAudioContext, getMasterGain, preloadScaleNotes };
};
