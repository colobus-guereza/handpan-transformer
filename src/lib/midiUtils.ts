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

    // 2. Extract Unique Pitch Classes from MIDI
    const midiNotesMap = new Set<string>();
    melodyTrack.notes.forEach((n: any) => {
        if (n.name) midiNotesMap.add(getPitchClass(n.name));
    });

    const uniqueMidiNotes = Array.from(midiNotesMap);
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
            let currentScore = coverage * 100;

            // Small penalty for transposition distance (prefer 0 shift if possible)
            currentScore -= Math.abs(t) * 0.1;

            // Economy Penalty (Standard Mode Logic, but calculated for all)
            // (Notes - 9) * 1.5
            // Note: This penalty is applied differently based on mode in the selection phase? 
            // Wait, the user request implied the score calculation itself stays similar but the SELECTION logic changes.
            // However, "Economy Score" was requested as a penalty.
            // Let's implement the penalty in the score for Standard Mode sorting purposes or apply it generally?
            // User Prompt: "Implement 'Economy Score'... Penalty = (ScaleTotalNotes - 9) * 1.5".
            // AND "Add 'Popularity Bonus' +3".

            // We'll calculate a "StandardScore" and a "RawScore".
            // Since the function signatures are usually singular, we'll store metadata in the candidate.

            /* 
               Actually, the Waterfall logic uses "Score" thresholds. 
               The user said Pro Mode = "Raw Score". 
               Standard Mode = "Waterfall" (Tier 1 check score >= 85).
               
               Crucial: Does the "85" threshold include the penalty? 
               The prompt says: "FinalScore = MatchScore - Penalty". 
               So yes, for Standard Mode, we use the penalized score.
               For Pro Mode, we use the raw coverage score.
            */

            // --- Popularity Bonus ---
            // If scale is popular (rarePopular >= 0.7), +3 points.
            // This applies to both modes generally as a "quality" bias, but mostly for Standard.
            // Let's apply it to the base score for now, but keep Raw pure Coverage?
            // "Standard Mode: ... 9~10 note preferred ... slightly wrong is ok"
            // "Pro Mode: ... 100% precision ... mutant ok"

            // We will calculate a 'FinalScore' used for sorting/thresholds.
            let finalScore = currentScore;

            // Popularity Bonus
            const isPopular = (scale.vector?.rarePopular ?? 0) >= 0.7;
            if (isPopular) finalScore += 3;

            // Economy Penalty (Only meaningfully affects ranking if we subtract it)
            // But the Waterfall logic separates by TIER (Note Count), so we don't necessarily need to subtract penalty 
            // from the score IF we use the Waterfall steps. 
            // HOWEVER, the user asked to "Implement Economy Score". 
            // Let's apply valid penalties to the score used for Standard Mode.

            const economyPenalty = Math.max(0, (scaleTotalNotes - 9) * 1.5);
            const standardScore = finalScore - economyPenalty; // Score for Standard Mode

            candidates.push({
                scaleName: scale.name,
                scaleNotes: scaleNotesArray,
                transposition: t,
                score: standardScore, // Default 'score' field uses Standard Score
                rawScore: finalScore, // Store raw (coverage + pop) for Pro Mode or debug
                inputNotes: uniqueMidiNotes,
                shiftedNotes: currentShiftedNotes,
                matchedNotes,
                missedNotes,
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

    // 2. Intelligent Classification Logic (Updated)
    let bestCandidateIndex = -1;
    let maxWeightedScore = -1;

    processedTracks.forEach((track, i) => {
        // A. Detect Rhythm
        const nameLower = track.name.toLowerCase();
        if (track.isPercussion || nameLower.includes('drum') || nameLower.includes('perc')) {
            track.role = 'rhythm';
            track.color = '#ef4444'; // Red
            return;
        }

        // B. Weighted Melody Detection
        let score = track.noteCount; // Base score

        // Penalty: Bass
        if (track.instrumentFamily === 'bass' || nameLower.includes('bass')) {
            score *= 0.1; // Heavy penalty
        }

        // Bonus: Vocal / Melody keywords
        if (nameLower.includes('vocal') || nameLower.includes('melody') || nameLower.includes('lead')) {
            score *= 2.0;
        }

        // Bonus: Melodic Instrument Families
        const melodicFamilies = ['piano', 'organ', 'synth', 'strings', 'brass', 'reed', 'pipe'];
        if (melodicFamilies.includes(track.instrumentFamily)) {
            score *= 1.2;
        }

        if (score > maxWeightedScore) {
            maxWeightedScore = score;
            bestCandidateIndex = i;
        }
    });

    // Assign Melody Role
    if (bestCandidateIndex !== -1) {
        processedTracks[bestCandidateIndex].role = 'melody';
        processedTracks[bestCandidateIndex].color = '#10b981'; // Emerald/Green
    }

    // 3. Find Best Scale
    const { suggestedScale, matchResult } = (() => {
        const result = findBestMatchScale(processedTracks, mode);
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
