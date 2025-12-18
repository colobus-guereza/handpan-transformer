// Imports removed as logic is copied inline

// --- COPY OF LOGIC FOR VERIFICATION (Updated with New Logic) ---

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const getPitchClass = (noteName: string) => {
    return noteName.replace(/[0-9]/g, '');
};

const getNoteIndex = (note: string) => {
    const pc = getPitchClass(note);
    return NOTE_NAMES.indexOf(pc);
};

const transposeNoteWithOctave = (note: string, semitones: number): string => {
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

// Simplified Scale Mock
const MOCK_SCALES = [
    {
        id: "d_asha_9",
        name: "D Asha 9",
        notes: {
            ding: "D3",
            top: ["G3", "A3", "B3", "C#4", "D4", "E4", "F#4", "A4"],
            bottom: []
        },
        vector: { rarePopular: 0.9 }, // popular
        noteCount: 9
    },
    {
        id: "c_major_10",
        name: "C Major 10",
        notes: {
            ding: "C3",
            top: ["G3", "A3", "B3", "C4", "D4", "E4", "F4", "G4", "A4"],
            bottom: []
        },
        vector: { rarePopular: 0.6 },
        noteCount: 10
    }
];

const detectKeyInternal = (notes: any[]): string => {
    if (!notes || notes.length === 0) return "Unknown";

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
        let corrMajor = 0;
        for (let j = 0; j < 12; j++) {
            corrMajor += normalizedWeights[(i + j) % 12] * majorProfile[j];
        }
        if (corrMajor > bestCorrelation) {
            bestCorrelation = corrMajor;
            bestKey = `${NOTE_NAMES[i]} Major`;
        }

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

const runTest = () => {
    // Test Case 1: E Major Melody (Titanic-ish)
    // E F# G# A B C# D# E
    // Note: Use full note objects for Key Detection
    const eMajorNotes = [
        { name: 'E4', duration: 1 }, { name: 'F#4', duration: 1 }, { name: 'G#4', duration: 1 },
        { name: 'A4', duration: 1 }, { name: 'B4', duration: 1 }, { name: 'C#5', duration: 1 },
        { name: 'D#5', duration: 1 }, { name: 'E5', duration: 1 }
    ];

    // For Matching Logic (String array)
    const uniqueFullNotes = eMajorNotes.map(n => n.name);
    const uniqueMidiNotes = Array.from(new Set(uniqueFullNotes.map(n => getPitchClass(n))));

    console.log("Detecting Key for E Major Notes:");
    const detectedKey = detectKeyInternal(eMajorNotes);
    console.log(`Detected Key: ${detectedKey}`);

    const detectedKeyRoot = detectedKey.split(' ')[0];

    console.log("\n--- Matching E Major Input (New Algorithm) ---");

    const candidates: any[] = [];

    MOCK_SCALES.forEach(scale => {
        const playableNotesSet = new Set<string>();
        playableNotesSet.add(scale.notes.ding);
        scale.notes.top.forEach(n => playableNotesSet.add(n));
        scale.notes.bottom.forEach(n => playableNotesSet.add(n));

        const scalePCsSet = new Set<string>();
        playableNotesSet.forEach(n => scalePCsSet.add(getPitchClass(n)));

        const scaleRoot = getPitchClass(scale.notes.ding);

        for (let t = -6; t <= 6; t++) {
            let exactMatchesCount = 0;
            let foldedMatchesCount = 0;
            const matchedFullNotes: string[] = [];

            uniqueFullNotes.forEach(fullNote => {
                const shiftedFull = transposeNoteWithOctave(fullNote, t);
                const shiftedPC = getPitchClass(shiftedFull);

                if (playableNotesSet.has(shiftedFull)) {
                    exactMatchesCount += 1.0;
                    matchedFullNotes.push(shiftedFull);
                } else if (scalePCsSet.has(shiftedPC)) {
                    foldedMatchesCount += 0.8;
                }
            });

            const totalScoreRaw = exactMatchesCount + foldedMatchesCount;
            const coverage = totalScoreRaw / uniqueFullNotes.length;

            let transposePenalty = 0;
            if (t === 0) transposePenalty = 0;
            else if ([5, 7, -5, -7].includes(t)) transposePenalty = 5;
            else transposePenalty = 15;

            let keyBonus = 0;
            if (t === 0 && detectedKeyRoot === scaleRoot) {
                keyBonus += 10;
            }

            let finalScore = (coverage * 100) - transposePenalty + keyBonus;
            if ((scale.vector?.rarePopular ?? 0) >= 0.7) finalScore += 3;

            candidates.push({
                scaleName: scale.name,
                transposition: t,
                score: Math.max(0, finalScore),
                exact: exactMatchesCount,
                folded: foldedMatchesCount,
                matchedNotes: matchedFullNotes
            });
        }
    });

    candidates.sort((a, b) => b.score - a.score);
    console.log("Top 3 Candidates:");
    candidates.slice(0, 3).forEach(c => {
        console.log(`${c.scaleName} (T=${c.transposition}): Score ${c.score.toFixed(2)} (Exact: ${c.exact}, Folded: ${c.folded.toFixed(1)})`);
        console.log(`Matched Notes: ${c.matchedNotes.join(', ')}`);
    });
};

runTest();
