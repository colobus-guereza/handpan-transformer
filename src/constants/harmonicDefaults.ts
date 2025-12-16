export interface HarmonicSetting {
    active: boolean;
    trim: number;
    fade: number;
    curve: number;
    latency: number;
    gain: number;
}

export interface DigipanHarmonicConfig {
    octave: HarmonicSetting;
    fifth: HarmonicSetting;
}

// "Golden Settings" tuned by User (2025-12-13)
export const DEFAULT_HARMONIC_SETTINGS: DigipanHarmonicConfig = {
    octave: {
        active: true,
        trim: 0.05,
        fade: 1.07,
        curve: 8.2,
        latency: 0.04,
        gain: 0.55
    },
    fifth: {
        active: true,
        trim: 0.05,
        fade: 1.07,
        curve: 10.0,
        latency: 0.02,
        gain: 0.30
    }
};
