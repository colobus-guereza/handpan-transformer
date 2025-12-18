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

// --- Middleware: MIDI Pre-processing Pipeline ---

/**
 * 1. Format Normalization
 * Ensure one instrument per track. Use channel splitting if forced.
 * Note: @tonejs/midi usually handles Format 0 by splitting tracks automatically.
 * We perform a sanity check here.
 */
const normalizeTracks = (midi: Midi): any[] => {
    // If we have 1 track with mixed channels, we might want to split.
    // However, tonejs/midi tracks usually encapsulate channel. 
    // If the parser works correctly, midi.tracks is already normalized.
    // This function can be expanded if we detect raw separate channel events invalidly merged.
    return midi.tracks;
};

/**
 * 2. Track Filtering
 * Remove ghost tracks, empty tracks, and Drum (Ch 10) tracks.
 */
const filterTracks = (tracks: any[]): any[] => {
    return tracks.filter((track: any, index: number) => {
        // Rule A: Remove empty tracks or very few notes (artifacts)
        if (track.notes.length < 5) {
            console.log(`[Filter] Removing Track ${index} (Too few notes: ${track.notes.length})`);
            return false;
        }

        // Rule B: Remove Drum Channel (Ch 10 => Index 9 in 0-based, or often labeled percussion)
        // tonejs/midi track.instrument.percussion is a good flag
        if (track.instrument?.percussion || track.channel === 9) {
            console.log(`[Filter] Removing Track ${index} (Percussion/Drum)`);
            return false;
        }

        return true;
    });
};

/**
 * 3. Melody Extraction (Heuristic Scoring)
 * Identify the 'MainTrack' based on Activity, Range, and Variance.
 */
const detectMainTrack = (tracks: ProcessedTrack[]): number => {
    let bestIndex = -1;
    let maxScore = -Infinity;

    tracks.forEach((track, index) => {
        let score = 0;

        // Criterion 1: Activity (Note Count)
        score += Math.log(track.noteCount + 1) * 20;

        // Criterion 2: Range (C3-C6 Preference)
        // Calculate average pitch
        let totalPitch = 0;
        track.notes.forEach((n: any) => totalPitch += n.midi);
        const avgPitch = totalPitch / track.noteCount;

        const C3 = 48;
        const C6 = 84;

        if (avgPitch >= C3 && avgPitch <= C6) {
            score += 30; // Bonus for good melody range
        } else if (avgPitch < C3) {
            score -= 20; // Too low (Bass)
        } else {
            score -= 10; // Too high
        }

        // Criterion 3: Variance (Unique Pitches)
        const uniquePitches = new Set(track.notes.map((n: any) => n.midi)).size;
        score += Math.log(uniquePitches + 1) * 10;

        // Debug Log
        console.log(`[Melody Score] Track ${track.name || index}: ${score.toFixed(1)} (Notes: ${track.noteCount}, AvgPitch: ${avgPitch.toFixed(1)})`);

        if (score > maxScore) {
            maxScore = score;
            bestIndex = index;
        }
    });

    return bestIndex;
};

/**
 * 4. Quantization
 * Snap notes to nearest 1/16th grid.
 */
const quantizeNotes = (notes: any[], ppq: number, bpm: number) => {
    if (!ppq || !bpm) return notes;

    // Grid in ticks: (PPQ * 4) / 16 = PPQ / 4. 
    // Standard MIDI PPQ is usually 480 or 960. 1 Quarter Note = PPQ. 1/16th = 1/4 Quarter = PPQ/4.
    const gridTicks = ppq / 4;

    // Grid in Seconds (for updating time)
    // 60 / BPM = Duration of Quarter Note
    // (60 / BPM) / 4 = Duration of 16th Note
    const gridSeconds = (60 / bpm) / 4;

    notes.forEach(note => {
        // Snap Ticks
        const originalTicks = note.ticks;
        const snappedTicks = Math.round(originalTicks / gridTicks) * gridTicks;
        note.ticks = snappedTicks;

        // Snap Time (Force sync with ticks-ish or just snap time directly)
        // We'll snap time directly to be safe for visualizers using seconds
        const originalTime = note.time;
        const snappedTime = Math.round(originalTime / gridSeconds) * gridSeconds;
        note.time = snappedTime;

        // Snap Duration
        // Let's just round duration logic too.
        const snappedDurationTicks = Math.round(note.durationTicks / gridTicks) * gridTicks;
        note.durationTicks = Math.max(gridTicks / 2, snappedDurationTicks); // Min duration half-16th
        note.duration = Math.max(gridSeconds / 2, Math.round(note.duration / gridSeconds) * gridSeconds);
    });
};

/**
 * Main Middleware Function
 */
const preprocessMidi = (midi: Midi): ProcessedSong => {
    console.log('[Middleware] Pre-processing MIDI...');

    const processedTracks: ProcessedTrack[] = [];

    // 1. Normalize & 2. Filter
    // Note: midi.tracks are Tone.js Track objects.
    const rawTracks = normalizeTracks(midi);
    const filteredTracks = filterTracks(rawTracks);

    // Initial ProcessedTrack Conversion
    filteredTracks.forEach((track: any, index: number) => {
        const role: TrackRole = 'harmony'; // Default
        const isPercussion = track.instrument?.percussion || false;

        const pTrack: ProcessedTrack = {
            id: index, // Re-index after filter? Or keep original? Re-indexing is cleaner for UI list.
            name: track.name || `Track ${index + 1}`,
            instrumentFamily: track.instrument?.family || 'unknown',
            role,
            notes: track.notes, // Reference
            channel: track.channel,
            noteCount: track.notes.length,
            isPercussion,
            color: '#3b82f6' // Default Blue
        };
        processedTracks.push(pTrack);
    });

    if (processedTracks.length === 0) {
        console.warn('[Middleware] No tracks remained after filtering!');
        // Return empty and let UI handle error.
        return { midiName: midi.name, bpm: 120, duration: 0, tracks: [] };
    }

    // 3. Melody Detection
    const mainTrackIndex = detectMainTrack(processedTracks);
    if (mainTrackIndex !== -1) {
        processedTracks[mainTrackIndex].role = 'melody';
        processedTracks[mainTrackIndex].color = '#10b981'; // Green
        console.log(`[Middleware] Selected Main Melody: ${processedTracks[mainTrackIndex].name}`);
    }

    // 4. Quantization (Apply to Main Track)
    // Let's apply to MainTrack to fix "worm" visual.
    if (mainTrackIndex !== -1) {
        const bpm = midi.header.tempos[0]?.bpm || 120;
        const ppq = midi.header.ppq || 480;
        console.log(`[Middleware] Quantizing Main Track (BPM: ${bpm}, PPQ: ${ppq})`);
        quantizeNotes(processedTracks[mainTrackIndex].notes, ppq, bpm);
    }

    return {
        midiName: midi.name,
        bpm: midi.header.tempos[0]?.bpm || 120,
        duration: midi.duration,
        tracks: processedTracks
    };
};


// --- Original Scale Matching Logic (Preserved) ---
export const findBestMatchScale = (tracks: ProcessedTrack[], mode: 'standard' | 'pro' = 'standard'): { scaleId: string, matchResult?: MatchResult } => {
    const melodyTrack = tracks.find(t => t.role === 'melody') || tracks.find(t => t.role !== 'rhythm' && t.role !== 'ignore');
    if (!melodyTrack) return { scaleId: SCALES[0].id };

    const midiNotesMap = new Set<string>();
    const midiFullNotesMap = new Set<string>();

    melodyTrack.notes.forEach((n: any) => {
        if (n.name) {
            midiNotesMap.add(getPitchClass(n.name));
            midiFullNotesMap.add(n.name);
        }
    });

    const uniqueMidiNotes = Array.from(midiNotesMap);
    const uniqueFullNotes = Array.from(midiFullNotesMap);

    if (uniqueMidiNotes.length === 0) return { scaleId: SCALES[0].id };

    const candidates: MatchResult[] = [];

    SCALES.forEach((scale) => {
        const scaleNotesSet = new Set<string>();
        scaleNotesSet.add(getPitchClass(scale.notes.ding));
        scale.notes.top.forEach(n => scaleNotesSet.add(getPitchClass(n)));
        scale.notes.bottom.forEach(n => scaleNotesSet.add(getPitchClass(n)));

        const scaleTotalNotes = 1 + scale.notes.top.length + scale.notes.bottom.length;
        const scaleNotesArray = Array.from(scaleNotesSet);

        for (let t = -6; t <= 6; t++) {
            const currentShiftedNotes = uniqueMidiNotes.map(n => transposeNote(n, t));
            const matchedFullNotes: string[] = [];
            const missedFullNotes: string[] = [];

            uniqueFullNotes.forEach(fullNote => {
                const shiftedFull = transposeNoteWithOctave(fullNote, t);
                const shiftedPC = getPitchClass(shiftedFull);

                if (scaleNotesSet.has(shiftedPC)) {
                    matchedFullNotes.push(shiftedFull);
                } else {
                    missedFullNotes.push(shiftedFull);
                }
            });

            const matchedPCs = currentShiftedNotes.filter(n => scaleNotesSet.has(n));
            const coverage = matchedPCs.length / uniqueMidiNotes.length;
            let currentScore = coverage * 100;
            currentScore -= Math.abs(t) * 0.1;

            let finalScore = currentScore;
            const isPopular = (scale.vector?.rarePopular ?? 0) >= 0.7;
            if (isPopular) finalScore += 3;

            const economyPenalty = Math.max(0, (scaleTotalNotes - 9) * 1.5);
            const standardScore = Math.max(0, Math.min(100, finalScore - economyPenalty));

            candidates.push({
                scaleName: scale.name,
                scaleNotes: scaleNotesArray,
                transposition: t,
                score: standardScore,
                rawScore: finalScore,
                inputNotes: uniqueMidiNotes,
                shiftedNotes: currentShiftedNotes,
                matchedNotes: matchedFullNotes.sort((a, b) => {
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
                noteCount: scaleTotalNotes
            } as any);
        }
    });

    let bestMatch: MatchResult | undefined;
    const byStandardScore = (a: any, b: any) => b.score - a.score;

    if (mode === 'pro') {
        candidates.sort((a: any, b: any) => {
            if (Math.abs(b.rawScore - a.rawScore) > 0.1) return b.rawScore - a.rawScore;
            return a.noteCount - b.noteCount;
        });
        bestMatch = candidates[0];
    }
    else {
        const tier1 = candidates.filter((c: any) => c.noteCount <= 10);
        tier1.sort(byStandardScore);
        const bestTier1 = tier1[0];

        const tier2 = candidates.filter((c: any) => c.noteCount <= 13);
        tier2.sort(byStandardScore);
        const bestTier2 = tier2[0];

        candidates.sort(byStandardScore);
        const bestOverall = candidates[0];

        if (bestTier1 && bestTier1.score >= 85) {
            bestMatch = bestTier1;
        }
        else if (bestTier2 && bestTier2.score >= 90) {
            bestMatch = bestTier2;
        }
        else {
            bestMatch = bestOverall;
        }
    }

    return {
        scaleId: bestMatch ? SCALES.find(s => s.name === bestMatch?.scaleName)?.id || SCALES[0].id : SCALES[0].id,
        matchResult: bestMatch
    };
};

/**
 * Main Entry Point: Parse and Process MIDI
 */
export const parseMidi = async (arrayBuffer: ArrayBuffer, fileName: string, mode: 'standard' | 'pro' = 'standard'): Promise<ProcessedSong> => {
    const midi = new Midi(arrayBuffer);

    // Run Middleware Pipeline
    const processedSong = preprocessMidi(midi);

    // Assign Meta
    processedSong.midiName = fileName;

    // Key Detection (On the Melody Track)
    const melodyTrack = processedSong.tracks.find(t => t.role === 'melody');
    const detectKey = (notes: any[]): string => {
        if (!notes || notes.length === 0) return "Unknown";

        // Metadata Check
        if (midi.header.keySignatures && midi.header.keySignatures.length > 0) {
            const ks = midi.header.keySignatures[0];
            if (ks.key && ks.scale) {
                return `${ks.key.toUpperCase()} ${ks.scale.charAt(0).toUpperCase() + ks.scale.slice(1)}`;
            }
        }

        // Krumhansl-Schmuckler
        const majorProfile = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
        const minorProfile = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];
        const durationWeights = new Array(12).fill(0);
        let totalDuration = 0;

        notes.forEach(note => {
            const pc = getNoteIndex(note.name);
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
            let corrMajor = 0, corrMinor = 0;
            for (let j = 0; j < 12; j++) {
                corrMajor += normalizedWeights[(i + j) % 12] * majorProfile[j];
                corrMinor += normalizedWeights[(i + j) % 12] * minorProfile[j];
            }
            if (corrMajor > bestCorrelation) { bestCorrelation = corrMajor; bestKey = `${NOTE_NAMES[i]} Major`; }
            if (corrMinor > bestCorrelation) { bestCorrelation = corrMinor; bestKey = `${NOTE_NAMES[i]} Minor`; }
        }
        return bestKey;
    };

    const detectedKey = melodyTrack ? detectKey(melodyTrack.notes) : "Unknown";

    // 5. Handpan Scale Matching
    const { suggestedScale, matchResult } = findBestMatchScale(processedSong.tracks, mode);

    // Attach Scale Data
    processedSong.suggestedScale = suggestedScale;
    processedSong.matchResult = { ...matchResult!, originalKey: detectedKey } as MatchResult;

    return processedSong;
};
