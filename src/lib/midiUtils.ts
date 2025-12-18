import { Midi } from '@tonejs/midi';
import { ProcessedSong, ProcessedTrack, TrackRole, MatchResult } from '@/store/useMidiStore';
import { SCALES } from '../data/handpanScales';

// --- Constants & Helpers ---

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const getPitchClass = (noteName: string) => {
    return noteName.replace(/[0-9]/g, '');
};

export const getNoteIndex = (note: string) => {
    const pc = getPitchClass(note);
    return NOTE_NAMES.indexOf(pc);
};

export const getScaleNotes = (root: string, type: 'Major' | 'Minor'): string[] => {
    const rootIndex = NOTE_NAMES.indexOf(root);
    if (rootIndex === -1) return [];

    const intervals = type === 'Major'
        ? [0, 2, 4, 5, 7, 9, 11]
        : [0, 2, 3, 5, 7, 8, 10]; // Natural Minor

    return intervals.map(interval => NOTE_NAMES[(rootIndex + interval) % 12]);
};

export const transposeNote = (note: string, semitones: number): string => {
    const pc = getPitchClass(note);
    const index = NOTE_NAMES.indexOf(pc);
    if (index === -1) return note;

    let newIndex = (index + semitones) % 12;
    if (newIndex < 0) newIndex += 12;
    return NOTE_NAMES[newIndex];
};

export const transposeNoteWithOctave = (note: string, semitones: number): string => {
    const pc = getPitchClass(note);
    const octave = parseInt(note.replace(/\D/g, ''), 10) || 0;
    const index = NOTE_NAMES.indexOf(pc);
    if (index === -1) return note;

    let newIndexRaw = index + semitones;
    let octaveShift = Math.floor(newIndexRaw / 12);
    let newIndex = newIndexRaw % 12;
    if (newIndex < 0) {
        newIndex += 12;
        // Correct octave shift logic for negative crossing:
        // if raw is -1, 
        // floor(-1/12) = -1.  Actual octave shift needed is -1.
        // if raw is -13,
        // floor(-13/12) = -2.
    }
    return `${NOTE_NAMES[newIndex]}${octave + octaveShift}`;
};

/**
 * Enhanced Scale Matching Logic with Octave Folding & Weighted Scoring
 */
export const findBestMatchScale = (tracks: ProcessedTrack[], mode: 'standard' | 'pro' = 'standard', detectedKey?: string): { scaleId: string, matchResult?: MatchResult } => {
    // 1. Identify Melody Track
    const melodyTrack = tracks.find(t => t.role === 'melody') || tracks.find(t => t.role !== 'rhythm' && t.role !== 'ignore');

    if (!melodyTrack) return { scaleId: SCALES[0].id };

    const uniqueMidiNotes = Array.from(new Set(melodyTrack.notes.map((n: any) => getPitchClass(n.name))));
    const uniqueFullNotes = Array.from(new Set(melodyTrack.notes.map((n: any) => n.name))); // Unique full notes

    if (uniqueMidiNotes.length === 0) return { scaleId: SCALES[0].id };

    // Parse detected key root (e.g. "E Major" -> "E")
    const detectedKeyRoot = detectedKey ? detectedKey.split(' ')[0] : null;

    // 2. Score Calculation for ALL Candidates
    const candidates: MatchResult[] = [];

    SCALES.forEach((scale) => {
        // Playable Notes Set (Full Note Names)
        const playableNotesSet = new Set<string>();
        playableNotesSet.add(scale.notes.ding);
        scale.notes.top.forEach(n => playableNotesSet.add(n));
        scale.notes.bottom.forEach(n => playableNotesSet.add(n));

        // Pitch Class Set for Folding Check
        const scalePCsSet = new Set<string>();
        playableNotesSet.forEach(n => scalePCsSet.add(getPitchClass(n)));

        const scaleRoot = getPitchClass(scale.notes.ding); // Assume Ding is Root

        // Try Transpositions from -6 to +6
        for (let t = -6; t <= 6; t++) {
            let exactMatchesCount = 0;
            let foldedMatchesCount = 0;
            const matchedFullNotes: string[] = [];
            const foldedFullNotes: string[] = [];
            const missedFullNotes: string[] = [];

            // Analyze each input note
            uniqueFullNotes.forEach(fullNote => {
                const shiftedFull = transposeNoteWithOctave(fullNote, t);
                const shiftedPC = getPitchClass(shiftedFull);

                if (playableNotesSet.has(shiftedFull)) {
                    // Exact Match (Playable)
                    exactMatchesCount += 1.0;
                    // Show "Original -> Shifted" if transposed, otherwise just Original (which is same as Shifted)
                    // If t=0, shiftedFull == fullNote. 
                    // But wait, we want to show the NOTE THAT IS TRIGGERED on the handpan.
                    // If I play B4 and it triggers C5. The UI shows "Matched: C5". User says "I played B4".
                    // Better to show "B4→C5".
                    // If t=0, show "B4".
                    matchedFullNotes.push(t !== 0 ? `${fullNote}→${shiftedFull}` : fullNote);
                } else if (scalePCsSet.has(shiftedPC)) {
                    // Octave Folding (Harmonically correct, but diff octave)
                    foldedMatchesCount += 0.8; // Partial credit
                    // Find the representative note in scale (e.g., input A5 -> match A4)
                    const closestMatch = Array.from(playableNotesSet).find(n => getPitchClass(n) === shiftedPC);
                    if (closestMatch) {
                        // Display: "Original -> Target"
                        // e.g. "A5→A4" (if 0 transpose)
                        // e.g. "G4→A4" (if transposed)
                        foldedFullNotes.push(`${fullNote}→${closestMatch}`);
                    }
                } else {
                    missedFullNotes.push(fullNote); // Show original missed note
                }
            });

            // Calculate Base Match Score
            // Note: We divide by total UNIQUE notes to get coverage %
            const totalScoreRaw = exactMatchesCount + foldedMatchesCount;
            const coverage = totalScoreRaw / uniqueFullNotes.length;

            // Penalties
            let transposePenalty = 0;
            if (t === 0) transposePenalty = 0;
            else if ([5, 7, -5, -7].includes(t)) transposePenalty = 5; // Perfect 4th/5th
            else transposePenalty = 15; // Other transpositions

            // Key Bonus
            let keyBonus = 0;
            // Get shifted root of scale? No, we check if Scale Root == Detected Key Root (adjusted for transpose?)
            // Actually, we want to know if the TRANSPOSED scale matches the Original Key.
            // If Transpose is 0, and Scale Root == Detected Key Root, we are preserving Original Key.
            // Since we shift MIDI by `t`, `t=0` means preservation.
            // If scale.ding is 'D3', and detected key is 'D Major', and t=0 => Bonus.
            // If detected key is 'E Major', and we transposed MIDI by -2 (to D), we are technically playing in D?
            // Wait, logic reversal:
            // - We transpose MIDI by `t`.
            // - If t=0, we are playing in Original Key. 
            // - If Scale Root == Detected Key Root, that's a bonus for t=0.
            if (t === 0 && detectedKeyRoot === scaleRoot) {
                keyBonus += 10;
            }

            let finalScore = (coverage * 100) - transposePenalty + keyBonus;

            // Popularity Bonus (Small tie-breaker)
            if ((scale.vector?.rarePopular ?? 0) >= 0.7) finalScore += 3;

            candidates.push({
                scaleName: scale.name,
                scaleNotes: Array.from(playableNotesSet),
                transposition: t,
                score: Math.max(0, finalScore),
                inputNotes: uniqueMidiNotes,
                shiftedNotes: [], // Not really needed anymore but kept for interface
                matchedNotes: matchedFullNotes.sort(sortNotes),
                foldedNotes: foldedFullNotes.sort(),
                missedNotes: missedFullNotes.sort(sortNotes),
                originalKeyNotes: uniqueMidiNotes,
                details: {
                    exactMatches: exactMatchesCount,
                    foldedMatches: foldedMatchesCount,
                    transposePenalty,
                    keyBonus
                }
            });
        }
    });

    // 3. Selection Strategy (Tiered)
    candidates.sort((a, b) => b.score - a.score);

    const bestMatch = candidates[0];

    // Logging for Debug
    if (bestMatch) {
        console.log(`[Matching] Winner: ${bestMatch.scaleName} (Score: ${bestMatch.score.toFixed(1)})`);
        console.log(`DETAILS: Exact: ${bestMatch.details?.exactMatches}, Folded: ${bestMatch.details?.foldedMatches}, T-Penalty: ${bestMatch.details?.transposePenalty}`);
    }

    return {
        scaleId: bestMatch ? SCALES.find(s => s.name === bestMatch.scaleName)?.id || SCALES[0].id : SCALES[0].id,
        matchResult: bestMatch
    };
};

const sortNotes = (a: string, b: string) => {
    const getVal = (n: string) => {
        const pc = getPitchClass(n);
        const oct = parseInt(n.replace(/\D/g, ''), 10) || 0;
        return oct * 12 + NOTE_NAMES.indexOf(pc);
    };
    return getVal(a) - getVal(b);
};

// --- Key Detection Logic (Improved) ---
const detectKeyInternal = (notes: any[], metadataKey?: any): string => {
    // 0. Metadata Check (Fallback Only - Don't trust blindly)
    // We only use metadata if it's high confidence, but standard MIDI metadata is notoriously unreliable (defaults to C Maj).
    // So we will calculate first, and maybe use metadata as tie-breaker or ignore it.

    if (!notes || notes.length === 0) return "Unknown";

    // Krumhansl-Schmuckler Profiles
    const majorProfile = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
    const minorProfile = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

    const durationWeights = new Array(12).fill(0);
    let totalDuration = 0;

    notes.forEach(note => {
        const pc = getNoteIndex(note.name); // 0-11
        if (pc !== -1) {
            const weight = note.duration > 0 ? note.duration : 1;
            durationWeights[pc] += weight;
            totalDuration += weight;
        }
    });

    if (totalDuration === 0) return "Unknown";
    const normalizedWeights = durationWeights.map(w => w / totalDuration);

    let bestKey = "";
    let bestCorrelation = -Infinity;

    for (let i = 0; i < 12; i++) {
        // Major
        let corrMajor = 0;
        for (let j = 0; j < 12; j++) {
            corrMajor += normalizedWeights[(i + j) % 12] * majorProfile[j];
        }
        if (corrMajor > bestCorrelation) {
            bestCorrelation = corrMajor;
            bestKey = `${NOTE_NAMES[i]} Major`;
        }

        // Minor
        let corrMinor = 0;
        for (let j = 0; j < 12; j++) {
            corrMinor += normalizedWeights[(i + j) % 12] * minorProfile[j];
        }
        if (corrMinor > bestCorrelation) {
            bestCorrelation = corrMinor;
            bestKey = `${NOTE_NAMES[i]} Minor`;
        }
    }

    return bestKey;
};


export const parseMidi = async (arrayBuffer: ArrayBuffer, fileName: string, mode: 'standard' | 'pro' = 'standard'): Promise<ProcessedSong> => {
    const midi = new Midi(arrayBuffer);
    const processedTracks: ProcessedTrack[] = [];

    // 1. Initial Processing & Metadata Extraction
    midi.tracks.forEach((track, index) => {
        const isPercussion = track.instrument.percussion || (track.channel === 9);
        const noteCount = track.notes.length;
        if (noteCount < 3) return;

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
            color: isPercussion ? '#ef4444' : '#3b82f6',
        });
    });

    // 2. Intelligent Classification Logic
    let bestCandidateIndex = -1;
    let maxWeightedScore = -Infinity;

    processedTracks.forEach((track, i) => {
        const nameLower = track.name.toLowerCase();
        if (track.isPercussion || nameLower.includes('drum') || nameLower.includes('perc') || track.channel === 9) {
            track.role = 'rhythm';
            track.color = '#ef4444';
            return;
        }

        let score = 0;
        const keywords = ['melody', 'vocal', 'vox', 'lead', 'solo', 'voice', 'sing'];
        if (keywords.some(k => nameLower.includes(k))) score += 1000;

        score += Math.log(track.noteCount + 1) * 20;

        const melodicFamilies = ['piano', 'organ', 'synth', 'strings', 'brass', 'reed', 'pipe'];
        if (melodicFamilies.includes(track.instrumentFamily)) score += 50;

        if (track.instrumentFamily === 'bass' || nameLower.includes('bass')) score -= 500;

        if (score > maxWeightedScore) {
            maxWeightedScore = score;
            bestCandidateIndex = i;
        }
    });

    let melodyTrackNodes: any[] = [];
    if (bestCandidateIndex !== -1) {
        processedTracks[bestCandidateIndex].role = 'melody';
        processedTracks[bestCandidateIndex].color = '#10b981';
        melodyTrackNodes = processedTracks[bestCandidateIndex].notes;
    }

    // 3. Key Detection (On Melody Track)
    const detectedKey = detectKeyInternal(melodyTrackNodes);

    // 4. Find Best Scale
    const { scaleId: suggestedScale, matchResult } = findBestMatchScale(processedTracks, mode, detectedKey);

    return {
        midiName: fileName,
        bpm: midi.header.tempos[0]?.bpm || 120,
        duration: midi.duration,
        tracks: processedTracks,
        suggestedScale,
        matchResult: { ...matchResult!, originalKey: detectedKey } as MatchResult
    };
};
