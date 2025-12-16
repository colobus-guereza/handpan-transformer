
import { findBestMatchScale } from './midiUtils';
// Mocking the environment for standalone execution if needed, 
// but since we rely on `SCALES` import which might have issues in clean node node, 
// we will assume tsx handles the imports or we just run it.

const mockBillieJeanNotes = [
    { name: "F#1" }, { name: "C#2" }, { name: "F#2" }, // Bass
    { name: "F#3" }, { name: "G#3" }, { name: "A3" }, { name: "B3" }, { name: "C#4" }, { name: "D4" }, { name: "E4" } // Melody
];

// Mock Tracks
const mockTracks: any[] = [
    {
        id: 1,
        role: 'melody',
        name: 'Vocal',
        notes: mockBillieJeanNotes,
        instrumentFamily: 'piano'
    }
];

console.log("--- Testing Standard Mode (Waterfall) ---");
const standardResult = findBestMatchScale(mockTracks, 'standard');
console.log(`Result: ${standardResult.matchResult?.scaleName} (Score: ${standardResult.matchResult?.score.toFixed(1)})`);

console.log("\n--- Testing Pro Mode (Raw Score) ---");
const proResult = findBestMatchScale(mockTracks, 'pro');
console.log(`Result: ${proResult.matchResult?.scaleName} (Raw Score: ${proResult.matchResult?.rawScore?.toFixed(1)})`);

// Expected:
// Standard -> D Kurd 10 (or 9) because it's Tier 1 and coverage is high.
// Pro -> F# Low Pygmy 14 because it covers more notes (including bass maybe?) or just perfect match.
