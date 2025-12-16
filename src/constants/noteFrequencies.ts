export const NOTE_FREQUENCIES: Record<string, number> = {
    // C# Amara 9 Notes
    'C#3': 138.59,
    'G#3': 207.65,
    'B3': 246.94,
    'C#4': 277.18,
    'D#4': 311.13,
    'E4': 329.63,
    'F#4': 369.99,
    'G#4': 415.30,
    'B4': 493.88,
    // D Kurd 10 Notes
    'D3': 146.83,
    'A3': 220.00,
    'Bb3': 233.08,
    'D4': 293.66,
    'F4': 349.23,
    'G4': 392.00,
    'A4': 440.00,
    'C4': 261.63,
    'C5': 523.25,
    // Extensions/Common
    'C3': 130.81,
    'E3': 164.81,
    'F3': 174.61,
    'G3': 196.00,
    'Eb3': 155.56,
    'Db3': 138.59, // Same as C#3
    'Ab3': 207.65, // Same as G#3
    'F#3': 185.00,
    'Eb4': 311.13, // Same as D#4
    'Ab4': 415.30, // Same as G#4
    'Bb4': 466.16,
    'Db4': 277.18, // Same as C#4
    'Db5': 554.37, // C#5
    'D5': 587.33,
    'Eb5': 622.25,
    'E5': 659.25,
    'F5': 698.46,
    'F#5': 739.99,
    'G5': 783.99
};

// Helper: Note Name to Frequency Calculation (A4 = 440Hz base)
// Format: "C#4", "Bb3", "D5"
export const getNoteFrequency = (note: string): number => {
    // 1. Check Map
    if (NOTE_FREQUENCIES[note]) return NOTE_FREQUENCIES[note];

    // 2. Fallback Calculation
    const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    // Handle Flats
    const sanitized = note.replace('b', '#').replace('Db', 'C#').replace('Eb', 'D#').replace('Gb', 'F#').replace('Ab', 'G#').replace('Bb', 'A#');

    const match = sanitized.match(/([A-G]#?)(\d)/);
    if (!match) return 440; // Default

    const name = match[1];
    const octave = parseInt(match[2], 10);

    const semitonesFromC0 = NOTE_NAMES.indexOf(name) + (octave * 12);
    // A4 is 57 semitones from C0 (C0=0, C4=48, A4=48+9=57)
    // A4 = 440Hz
    const semitonesFromA4 = semitonesFromC0 - 57;

    return 440 * Math.pow(2, semitonesFromA4 / 12);
};
