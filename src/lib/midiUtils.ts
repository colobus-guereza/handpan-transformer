import { Midi } from '@tonejs/midi';
import { ProcessedSong, ProcessedTrack, TrackRole } from '@/store/useMidiStore';
import { SCALES, Scale } from '../data/handpanScales';

// Helper to get pitch class (e.g., "C#4" -> "C#")
const getPitchClass = (noteName: string) => {
    return noteName.replace(/[0-9]/g, '');
};


import { MatchResult } from '@/store/useMidiStore';

// Note definitions for transposition
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const getNoteIndex = (note: string) => {
    const pc = getPitchClass(note);
    return NOTE_NAMES.indexOf(pc);
};

const transposeNote = (note: string, semitones: number): string => {
    const pc = getPitchClass(note);
    const index = NOTE_NAMES.indexOf(pc);
    if (index === -1) return note; // Should not happen for valid notes

    let newIndex = (index + semitones) % 12;
    if (newIndex < 0) newIndex += 12;

    return NOTE_NAMES[newIndex];
};

const findBestMatchScale = (tracks: ProcessedTrack[]): { scaleId: string, matchResult?: MatchResult } => {
    // 1. Identify Melody Track
    const melodyTrack = tracks.find(t => t.role === 'melody') || tracks.find(t => t.role !== 'rhythm' && t.role !== 'ignore');

    // Default fallback
    if (!melodyTrack) return { scaleId: SCALES[0].id };

    // 2. Extract Unique Pitch Classes from MIDI
    const midiNotesMap = new Set<string>();
    melodyTrack.notes.forEach((n: any) => {
        if (n.name) midiNotesMap.add(getPitchClass(n.name));
    });

    const uniqueMidiNotes = Array.from(midiNotesMap);
    if (uniqueMidiNotes.length === 0) return { scaleId: SCALES[0].id };

    // 3. Brute Force Simulation: Check all Scales x all Transpositions (-6 to +6)
    let bestMatch: MatchResult | null = null;
    let bestScore = -1;

    SCALES.forEach((scale) => {
        // Prepare Scale Notes Set
        const scaleNotesSet = new Set<string>();
        scaleNotesSet.add(getPitchClass(scale.notes.ding));
        scale.notes.top.forEach(n => scaleNotesSet.add(getPitchClass(n)));
        scale.notes.bottom.forEach(n => scaleNotesSet.add(getPitchClass(n)));
        const scaleNotesArray = Array.from(scaleNotesSet);

        // Try Transpositions from -6 to +6
        for (let t = -6; t <= 6; t++) {
            const currentShiftedNotes = uniqueMidiNotes.map(n => transposeNote(n, t));

            // Check Intersection
            const matchedNotes: string[] = [];
            const missedNotes: string[] = [];

            currentShiftedNotes.forEach(shiftedNote => {
                if (scaleNotesSet.has(shiftedNote)) {
                    matchedNotes.push(shiftedNote);
                } else {
                    missedNotes.push(shiftedNote);
                }
            });

            // Score Calculation
            // Base: Coverage %
            const coverage = matchedNotes.length / uniqueMidiNotes.length;

            // Weighted Score: Coverage (Main) + Scale Popularity (Tie-breaker)
            // We prioritize coverage heavily (x100)
            let currentScore = coverage * 100;

            // Small bonus for "popular" scales to break ties
            if (scale.vector?.rarePopular) {
                currentScore += scale.vector.rarePopular * 5;
            }

            // Small penalty for transposition distance (prefer 0 shift if possible)
            currentScore -= Math.abs(t) * 0.1;

            // Normalize to max 100
            currentScore = Math.min(100, currentScore);

            if (currentScore > bestScore) {
                bestScore = currentScore;
                bestMatch = {
                    scaleName: scale.name,
                    scaleNotes: scaleNotesArray,
                    transposition: t,
                    score: currentScore,
                    inputNotes: uniqueMidiNotes,         // Original
                    shiftedNotes: currentShiftedNotes,   // Transposed
                    matchedNotes,
                    missedNotes,
                    originalKeyNotes: uniqueMidiNotes,
                };
            }
        }
    });

    if (bestMatch) {
        console.log(`[ScaleMatch] Best: ${bestMatch.scaleName} (${bestMatch.transposition > 0 ? '+' : ''}${bestMatch.transposition}) Score: ${bestScore.toFixed(1)}`);
    } else {
        console.log(`[ScaleMatch] No match found.`);
    }

    return {
        scaleId: bestMatch ? SCALES.find(s => s.name === bestMatch?.scaleName)?.id || SCALES[0].id : SCALES[0].id,
        matchResult: bestMatch || undefined
    };
};

export const parseMidi = async (arrayBuffer: ArrayBuffer, fileName: string): Promise<ProcessedSong> => {
    const midi = new Midi(arrayBuffer);
    const processedTracks: ProcessedTrack[] = [];

    // 1. Initial Processing & Metadata Extraction
    midi.tracks.forEach((track, index) => {
        // Basic info
        const isPercussion = track.instrument.percussion || (track.channel === 9); // Channel 10 is index 9
        const noteCount = track.notes.length;

        // Skip completely empty tracks
        if (noteCount === 0) return;

        // Temporary placeholder for role, will be determined in step 2
        const role: TrackRole = 'harmony';

        processedTracks.push({
            id: index,
            name: track.name || `Track ${index + 1}`,
            instrumentFamily: track.instrument.family,
            role,
            notes: track.notes,
            channel: track.channel,
            noteCount,
            isPercussion,
            color: isPercussion ? '#ef4444' : '#3b82f6', // Red for drums, Blue for others
        });
    });

    // 2. Intelligent Classification Logic
    let melodyCandidateIndex = -1;
    let maxNoteCount = -1;

    processedTracks.forEach((track, i) => {
        // A. Detect Rhythm
        const nameLower = track.name.toLowerCase();
        if (track.isPercussion || nameLower.includes('drum') || nameLower.includes('perc')) {
            track.role = 'rhythm';
            track.color = '#ef4444'; // Red
            return;
        }

        // B. Find Melody Candidate (Max Notes)
        if (track.noteCount > maxNoteCount) {
            maxNoteCount = track.noteCount;
            melodyCandidateIndex = i;
        }
    });

    // Assign Melody Role
    if (melodyCandidateIndex !== -1) {
        processedTracks[melodyCandidateIndex].role = 'melody';
        processedTracks[melodyCandidateIndex].color = '#10b981'; // Emerald/Green
    }

    // 3. Find Best Scale
    const { suggestedScale, matchResult } = (() => {
        const result = findBestMatchScale(processedTracks);
        return { suggestedScale: result.scaleId, matchResult: result.matchResult };
    })();

    return {
        midiName: fileName,
        bpm: midi.header.tempos[0]?.bpm || 120,
        duration: midi.duration,
        tracks: processedTracks,
        suggestedScale,
        matchResult // Pass details to store
    };
};
