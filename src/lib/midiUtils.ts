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
    }
    return `${NOTE_NAMES[newIndex]}${octave + octaveShift}`;
};

/**
 * Dual Mode Scale Matching Logic
 * - Standard Mode (Waterfall): Prioritizes 9-10 note scales (Tier 1) if score >= 85, then Tier 2 (<=13) if score >= 90.
 * - Pro Mode: Pure Max Score (Complexity allowed).
 */
export const findBestMatchScale = (tracks: ProcessedTrack[], mode: 'standard' | 'pro' = 'standard'): { scaleId: string, matchResult?: MatchResult } => {
    // 1. Identify Melody Track
    // Priority: Explicit 'melody' role > 'vocal/melody' name > weighted scoring
    const melodyTrack = tracks.find(t => t.role === 'melody') || tracks.find(t => t.role !== 'rhythm' && t.role !== 'ignore');

    // Default fallback
    if (!melodyTrack) return { scaleId: SCALES[0].id };

    // 2. Extract Unique Pitch Classes AND Full Notes from MIDI
    const midiNotesMap = new Set<string>(); // Pitch Classes
    const midiFullNotesMap = new Set<string>(); // Full Notes (C3, F#4)

    melodyTrack.notes.forEach((n: any) => {
        if (n.name) {
            midiNotesMap.add(getPitchClass(n.name));
            midiFullNotesMap.add(n.name);
        }
    });

    const uniqueMidiNotes = Array.from(midiNotesMap);
    const uniqueFullNotes = Array.from(midiFullNotesMap); // Unique full notes

    if (uniqueMidiNotes.length === 0) return { scaleId: SCALES[0].id };

    // 3. Score Calculation for ALL Candidates
    const candidates: MatchResult[] = [];

    SCALES.forEach((scale) => {
        // Prepare Scale Notes Set
        const scaleNotesSet = new Set<string>();
        scaleNotesSet.add(getPitchClass(scale.notes.ding));
        scale.notes.top.forEach(n => scaleNotesSet.add(getPitchClass(n)));
        scale.notes.bottom.forEach(n => scaleNotesSet.add(getPitchClass(n)));

        // Count total notes (Ding + Top + Bottom) for Economy Logic
        const scaleTotalNotes = 1 + scale.notes.top.length + scale.notes.bottom.length;
        const scaleNotesArray = Array.from(scaleNotesSet);

        // Try Transpositions from -6 to +6
        for (let t = -6; t <= 6; t++) {
            // Scoring uses Pitch Classes
            const currentShiftedNotes = uniqueMidiNotes.map(n => transposeNote(n, t));

            // Display Results use Full Notes (with Octaves)
            const matchedFullNotes: string[] = [];
            const missedFullNotes: string[] = [];

            // We iterate over the full notes to correctly categorize each specific note instance
            uniqueFullNotes.forEach(fullNote => {
                const shiftedFull = transposeNoteWithOctave(fullNote, t);
                const shiftedPC = getPitchClass(shiftedFull);

                if (scaleNotesSet.has(shiftedPC)) {
                    matchedFullNotes.push(shiftedFull);
                } else {
                    missedFullNotes.push(shiftedFull);
                }
            });

            // Calculate 'PC Matches' for Score (Legacy Logic) to keep scoring consistent
            const matchedPCs = currentShiftedNotes.filter(n => scaleNotesSet.has(n));

            // Score Calculation
            // Base: Coverage % (Using Pitch Classes)
            const coverage = matchedPCs.length / uniqueMidiNotes.length;
            let currentScore = coverage * 100;

            // Small penalty for transposition distance (prefer 0 shift if possible)
            currentScore -= Math.abs(t) * 0.1;

            // We will calculate a 'FinalScore' used for sorting/thresholds.
            let finalScore = currentScore;

            // Popularity Bonus
            const isPopular = (scale.vector?.rarePopular ?? 0) >= 0.7;
            if (isPopular) finalScore += 3;

            // Normalize to max 100 and Min 0
            const economyPenalty = Math.max(0, (scaleTotalNotes - 9) * 1.5);
            const standardScore = Math.max(0, Math.min(100, finalScore - economyPenalty)); // Score for Standard Mode

            candidates.push({
                scaleName: scale.name,
                scaleNotes: scaleNotesArray,
                transposition: t,
                score: standardScore, // Default 'score' field uses Standard Score
                rawScore: finalScore, // Store raw (coverage + pop) for Pro Mode or debug
                inputNotes: uniqueMidiNotes,
                shiftedNotes: currentShiftedNotes,
                matchedNotes: matchedFullNotes.sort((a, b) => {
                    // Custom sort for notes: C3 < C#3 ... < C4
                    const getVal = (n: string) => {
                        const pc = getPitchClass(n);
                        const oct = parseInt(n.replace(/\D/g, ''), 10) || 0;
                        return oct * 12 + NOTE_NAMES.indexOf(pc);
                    };
                    return getVal(a) - getVal(b);
                }),
                missedNotes: missedFullNotes.sort((a, b) => {
                    const getVal = (n: string) => {
                        const pc = getPitchClass(n);
                        const oct = parseInt(n.replace(/\D/g, ''), 10) || 0;
                        return oct * 12 + NOTE_NAMES.indexOf(pc);
                    };
                    return getVal(a) - getVal(b);
                }),
                originalKeyNotes: uniqueMidiNotes,
                noteCount: scaleTotalNotes // Needed for Waterfall
            } as any); // Type assertion for extra fields
        }
    });

    // 4. Selection Strategy
    let bestMatch: MatchResult | undefined;

    // Use TypeScript 'any' casting for the extended properties if not in interface yet
    // Or we should update the interface. For now, we trust the flow.

    // Sort Helper
    const byStandardScore = (a: any, b: any) => b.score - a.score;
    const byRawScore = (a: any, b: any) => b.rawScore - a.rawScore;

    if (mode === 'pro') {
        // [Pro Mode]: Highest Raw Score wins.
        // If tied, prefer popular, then fewer notes (tie-breaker).
        candidates.sort((a: any, b: any) => {
            if (Math.abs(b.rawScore - a.rawScore) > 0.1) return b.rawScore - a.rawScore;
            // Tie-breaker
            return a.noteCount - b.noteCount;
        });
        bestMatch = candidates[0];
        console.log(`[Matching] Pro Mode selected: ${bestMatch?.scaleName} (Raw: ${bestMatch?.rawScore?.toFixed(1)})`);
    }
    else {
        // [Standard Mode]: Waterfall Logic

        // Tier 1: <= 10 notes
        const tier1 = candidates.filter((c: any) => c.noteCount <= 10);
        tier1.sort(byStandardScore);
        const bestTier1 = tier1[0];

        // Tier 2: <= 13 notes
        const tier2 = candidates.filter((c: any) => c.noteCount <= 13);
        tier2.sort(byStandardScore);
        const bestTier2 = tier2[0];

        // Global best (fallback)
        candidates.sort(byStandardScore);
        const bestOverall = candidates[0];

        // Logic
        if (bestTier1 && bestTier1.score >= 85) {
            bestMatch = bestTier1;
            console.log(`[Matching] Standard Mode: Tier 1 Winner (${bestTier1.scaleName}, Score: ${bestTier1.score.toFixed(1)})`);
        }
        else if (bestTier2 && bestTier2.score >= 90) {
            bestMatch = bestTier2;
            console.log(`[Matching] Standard Mode: Tier 2 Winner (${bestTier2.scaleName}, Score: ${bestTier2.score.toFixed(1)})`);
        }
        else {
            bestMatch = bestOverall;
            console.log(`[Matching] Standard Mode: Fallback Winner (${bestOverall?.scaleName}, Score: ${bestOverall?.score.toFixed(1)})`);
        }
    }

    return {
        scaleId: bestMatch ? SCALES.find(s => s.name === bestMatch?.scaleName)?.id || SCALES[0].id : SCALES[0].id,
        matchResult: bestMatch
    };
};

export const parseMidi = async (arrayBuffer: ArrayBuffer, fileName: string, mode: 'standard' | 'pro' = 'standard'): Promise<ProcessedSong> => {
    const midi = new Midi(arrayBuffer);
    const processedTracks: ProcessedTrack[] = [];

    // 1. Initial Processing & Metadata Extraction
    midi.tracks.forEach((track, index) => {
        // Basic info
        const isPercussion = track.instrument.percussion || (track.channel === 9); // Channel 10 is index 9
        const noteCount = track.notes.length;

        // Skip mostly empty tracks (often artifacts, keyswitches, or automation ghosts)
        // However, short solos might be valid. Let's say < 3 notes is likely garbage.
        if (noteCount < 3) return;

        // Temporary placeholder
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

    // 2. Intelligent Classification Logic (Updated)
    let bestCandidateIndex = -1;
    let maxWeightedScore = -Infinity;

    processedTracks.forEach((track, i) => {
        // A. Detect Rhythm
        const nameLower = track.name.toLowerCase();
        // Check for Standard MIDI Drum Channel (10 -> Index 9) or keywords
        if (track.isPercussion || nameLower.includes('drum') || nameLower.includes('perc') || track.channel === 9) {
            track.role = 'rhythm';
            track.color = '#ef4444'; // Red
            return;
        }

        // B. Weighted Melody Detection
        let score = 0;

        // 1. Keyword Bonus (The Semantic Layer) - Huge Weight
        const keywords = ['melody', 'vocal', 'vox', 'lead', 'solo', 'voice', 'sing'];
        const isKeywordMatch = keywords.some(k => nameLower.includes(k));
        if (isKeywordMatch) {
            score += 1000;
        }

        // 2. Note Activity Score (The Data Layer)
        // Logarithmic scale so 1000 notes isn't 10x better than 100 notes
        score += Math.log(track.noteCount + 1) * 20;

        // 3. Instrument Family Bonus
        const melodicFamilies = ['piano', 'organ', 'synth', 'strings', 'brass', 'reed', 'pipe'];
        if (melodicFamilies.includes(track.instrumentFamily)) {
            score += 50;
        }

        // 4. Penalty: Bass
        if (track.instrumentFamily === 'bass' || nameLower.includes('bass')) {
            score -= 500; // Almost never melody in this context
        }

        // 5. Penalty: High Polyphony (Chords = Harmony)
        // Calculate average notes playing simultaneously?
        // Simple heuristic: If noteCount is high but range is small? No.
        // Let's check a few sample points.
        // If track name contains "strings" but NO keyword "solo/lead", it's likely pads (Harmony).
        // If track name is just "piano" without "lead", might be accompaniment.
        // But if it's the *only* track, it should win.

        // Keyword Match acts as the "Kingmaker". 
        // If multiple keyword matches exist (e.g. Lead Vox vs Lead Guitar), note count breaks tie.

        // Update Winner
        if (score > maxWeightedScore) {
            maxWeightedScore = score;
            bestCandidateIndex = i;
        }
    });

    // Assign Melody Role
    let melodyTrackNodes: any[] = [];
    if (bestCandidateIndex !== -1) {
        processedTracks[bestCandidateIndex].role = 'melody';
        processedTracks[bestCandidateIndex].color = '#10b981'; // Emerald/Green
        melodyTrackNodes = processedTracks[bestCandidateIndex].notes;
    }

    // --- Key Detection Logic ---
    const detectKey = (notes: any[]): string => {
        // 0. Metadata Check (Fast Path)
        if (midi.header.keySignatures && midi.header.keySignatures.length > 0) {
            const ks = midi.header.keySignatures[0];
            // Format constraint: We need "C Major" or "A Minor"
            // midi.header.keySignatures typically returns objects like { key: "C", scale: "major" }
            if (ks.key && ks.scale) {
                const noteName = ks.key.toUpperCase();
                const scaleName = ks.scale.charAt(0).toUpperCase() + ks.scale.slice(1);
                return `${noteName} ${scaleName}`;
            }
        }

        if (!notes || notes.length === 0) return "Unknown";

        // Krumhansl-Schmuckler Profiles
        const majorProfile = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
        const minorProfile = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

        const durationWeights = new Array(12).fill(0);
        let totalDuration = 0;

        notes.forEach(note => {
            const pc = getNoteIndex(note.name); // 0-11
            if (pc !== -1) {
                const weight = note.duration > 0 ? note.duration : 1; // Fallback to 1 if duration is 0 (or missing)
                durationWeights[pc] += weight;
                totalDuration += weight;
            }
        });

        // Normalize weights
        if (totalDuration === 0) return "Unknown";
        const normalizedWeights = durationWeights.map(w => w / totalDuration);

        // Correlate
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

    const detectedKey = detectKey(melodyTrackNodes);

    // 3. Find Best Scale
    const { suggestedScale, matchResult } = (() => {
        const result = findBestMatchScale(processedTracks, mode);
        // Inject original key into matchResult if possible, or we perform a merge logic
        // But matchResult type is in store. We can attach it to processedSong top level.
        return { suggestedScale: result.scaleId, matchResult: result.matchResult };
    })();

    return {
        midiName: fileName,
        bpm: midi.header.tempos[0]?.bpm || 120,
        duration: midi.duration,
        tracks: processedTracks,
        suggestedScale,
        matchResult: { ...matchResult!, originalKey: detectedKey } as MatchResult // Force cast/inject
    };
};
