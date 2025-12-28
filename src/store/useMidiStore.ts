import { create } from 'zustand';

export type TrackRole = 'melody' | 'rhythm' | 'harmony' | 'ignore';

export interface ProcessedTrack {
    id: number;
    name: string;
    instrumentFamily: string;
    role: TrackRole;
    notes: any[]; // Tone.js Midi Note JSON
    color?: string;
    channel: number;
    noteCount: number;
    isPercussion: boolean;
}


export interface MatchResult {
    scaleName: string;
    scaleNotes: string[];
    transposition: number;
    score: number;
    inputNotes: string[]; // Original pitch classes
    shiftedNotes: string[]; // Transposed pitch classes
    matchedNotes: string[]; // Exact matches (Full Note Name e.g., "A4")
    foldedNotes: string[]; // Octave folded matches (Full Note Name e.g., "A5" -> displayed as "A5→A4" in UI)
    missedNotes: string[]; // No match
    originalKeyNotes: string[];
    noteCount?: number;
    rawScore?: number;
    originalKey?: string;

    // Detailed Score Breakdown
    details?: {
        exactMatches: number;
        foldedMatches: number;
        transposePenalty: number;
        keyBonus: number;
    }
}

export interface ProcessedSong {
    midiName: string;
    bpm: number;
    duration: number;
    tracks: ProcessedTrack[];
    suggestedScale?: string;
    matchResult?: MatchResult;
    // For precise sync
    tempos?: { bpm: number; ticks: number; time?: number }[];
    ppq?: number;
}

interface MidiState {
    midiData: ProcessedSong | null;
    matchingAlgorithm: 'standard' | 'pro';
    setMidiData: (data: ProcessedSong) => void;
    setMatchingAlgorithm: (algo: 'standard' | 'pro') => void;
    updateTrackRole: (trackId: number, newRole: TrackRole) => void;
    reset: () => void;
}

export const useMidiStore = create<MidiState>((set) => ({
    midiData: null,
    matchingAlgorithm: 'standard', // Default
    setMidiData: (data) => set({ midiData: data }),
    setMatchingAlgorithm: (algo) => set({ matchingAlgorithm: algo }),
    updateTrackRole: (trackId, newRole) =>
        set((state) => {
            if (!state.midiData) return {};
            const updatedTracks = state.midiData.tracks.map((track) =>
                track.id === trackId ? { ...track, role: newRole } : track
            );
            return { midiData: { ...state.midiData, tracks: updatedTracks } };
        }),
    reset: () => set({ midiData: null, matchingAlgorithm: 'standard' }),
}));
