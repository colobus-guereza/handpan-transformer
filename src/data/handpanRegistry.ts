
// Handpan Data Registry
// Pure Data for the Isolated AutoPlayer
// Coordinates extracted from Digipan Layouts

export interface RegistryNote {
    id: number;
    pitch: string; // "D3", "A3", etc.
    cx: number; // SVG X (0-1000)
    cy: number; // SVG Y (0-1000)
    rotate: number; // Degrees
    scaleX: number;
    scaleY: number;
    type: "center" | "top" | "bottom";
}

export interface HandpanModelConfig {
    id: string; // "d_kurd_10", "f_low_pygmy_14", etc.
    name: string;
    notes: RegistryNote[];
    baseColor: string;
    backgroundImage?: string; // Optional for reference
}

export const HANDPAN_REGISTRY: Record<string, HandpanModelConfig> = {
    // 1. D Kurd 10 (Standard)
    "d_kurd_10": {
        id: "d_kurd_10",
        name: "D Kurd 10",
        baseColor: "#8B5A2B", // Copper/Bronze
        notes: [
            { id: 0, pitch: "D3", cx: 508, cy: 515, rotate: 89, scaleX: 1.36, scaleY: 1.16, type: "center" },
            { id: 1, pitch: "A3", cx: 639, cy: 811, rotate: 66, scaleX: 1, scaleY: 0.89, type: "top" },
            { id: 2, pitch: "Bb3", cx: 356, cy: 811, rotate: 103, scaleX: 0.98, scaleY: 0.9, type: "top" },
            { id: 3, pitch: "C4", cx: 822, cy: 626, rotate: 194, scaleX: 1, scaleY: 0.93, type: "top" },
            { id: 4, pitch: "D4", cx: 178, cy: 609, rotate: 163, scaleX: 0.99, scaleY: 0.91, type: "top" },
            { id: 5, pitch: "E4", cx: 832, cy: 391, rotate: 158, scaleX: 0.94, scaleY: 0.82, type: "top" },
            { id: 6, pitch: "F4", cx: 184, cy: 367, rotate: 28, scaleX: 0.97, scaleY: 0.85, type: "top" },
            { id: 7, pitch: "G4", cx: 703, cy: 215, rotate: 142, scaleX: 1.02, scaleY: 0.8, type: "top" },
            { id: 8, pitch: "A4", cx: 314, cy: 200, rotate: 57, scaleX: 0.98, scaleY: 0.83, type: "top" },
            { id: 9, pitch: "C5", cx: 508, cy: 143, rotate: 138, scaleX: 1.07, scaleY: 0.79, type: "top" }
        ]
    },

    // 2. D Asha 9 (Standard)
    "d_asha_9": {
        id: "d_asha_9",
        name: "D Asha 9",
        baseColor: "#2F4F4F", // Dark Slate Gray
        notes: [
            { "id": 0, "pitch": "D3", "cx": 513, "cy": 528, "rotate": 89, "scaleX": 1.43, "scaleY": 1.22, "type": "center" },
            { "id": 1, "pitch": "A3", "cx": 662, "cy": 808, "rotate": 66, "scaleX": 1.00, "scaleY": 0.89, "type": "top" },
            { "id": 2, "pitch": "C4", "cx": 349, "cy": 810, "rotate": 107, "scaleX": 1.04, "scaleY": 0.87, "type": "top" },
            { "id": 3, "pitch": "D4", "cx": 843, "cy": 589, "rotate": 187, "scaleX": 0.89, "scaleY": 0.91, "type": "top" },
            { "id": 4, "pitch": "E4", "cx": 172, "cy": 599, "rotate": 154, "scaleX": 1.10, "scaleY": 0.91, "type": "top" },
            { "id": 5, "pitch": "F4", "cx": 788, "cy": 316, "rotate": 145, "scaleX": 1.03, "scaleY": 0.94, "type": "top" },
            { "id": 6, "pitch": "G4", "cx": 201, "cy": 350, "rotate": 148, "scaleX": 1.20, "scaleY": 0.79, "type": "top" },
            { "id": 7, "pitch": "A4", "cx": 594, "cy": 184, "rotate": 188, "scaleX": 1.27, "scaleY": 0.77, "type": "top" },
            { "id": 8, "pitch": "C5", "cx": 370, "cy": 195, "rotate": 144, "scaleX": 1.18, "scaleY": 0.78, "type": "top" }
        ]
    },

    // 3. F# Low Pygmy 14 (Mutant)
    "f_low_pygmy_14": {
        id: "f_low_pygmy_14",
        name: "F# Low Pygmy 14",
        baseColor: "#DAA520", // Goldenrod
        notes: [
            // Top (same as 10 except pitch mapping changes in Scale def, here we assume registry defines positions)
            // Wait, Registry defines positions. Scale Defines PITCH.
            // But this Registry hardcodes pitches for the specific SCALE.
            // We'll map the positions from Digipan14 (baseNotes10 + 4 bottom)
            { "id": 0, "pitch": "F#3", "cx": 508, "cy": 515, "rotate": 89, "scaleX": 1.36, "scaleY": 1.16, "type": "center" },
            // ... Top 9 mapped ...
            { "id": 1, "pitch": "A3", "cx": 639, "cy": 811, "rotate": 66, "scaleX": 1, "scaleY": 0.89, "type": "top" },
            { "id": 2, "pitch": "B3", "cx": 356, "cy": 811, "rotate": 103, "scaleX": 0.98, "scaleY": 0.9, "type": "top" }, // Example Mapping
            { "id": 3, "pitch": "C#4", "cx": 822, "cy": 626, "rotate": 194, "scaleX": 1, "scaleY": 0.93, "type": "top" },
            { "id": 4, "pitch": "E4", "cx": 178, "cy": 609, "rotate": 163, "scaleX": 0.99, "scaleY": 0.91, "type": "top" },
            { "id": 5, "pitch": "F#4", "cx": 832, "cy": 391, "rotate": 158, "scaleX": 0.94, "scaleY": 0.82, "type": "top" },
            { "id": 6, "pitch": "G#4", "cx": 184, "cy": 367, "rotate": 28, "scaleX": 0.97, "scaleY": 0.85, "type": "top" },
            { "id": 7, "pitch": "A4", "cx": 703, "cy": 215, "rotate": 142, "scaleX": 1.02, "scaleY": 0.8, "type": "top" },
            { "id": 8, "pitch": "C#5", "cx": 314, "cy": 200, "rotate": 57, "scaleX": 0.98, "scaleY": 0.83, "type": "top" },
            { "id": 9, "pitch": "E5", "cx": 508, "cy": 142, "rotate": 138, "scaleX": 1.07, "scaleY": 0.79, "type": "top" },
            // Bottom 4
            { "id": 10, "pitch": "D3", "cx": 0, "cy": 762, "rotate": 158, "scaleX": 1.29, "scaleY": 1.61, "type": "bottom" },
            { "id": 11, "pitch": "E3", "cx": 998, "cy": 762, "rotate": 21, "scaleX": 1.24, "scaleY": 1.48, "type": "bottom" },
            { "id": 12, "pitch": "F#5", "cx": 386, "cy": -21, "rotate": 76, "scaleX": 0.9, "scaleY": 0.9, "type": "bottom" },
            { "id": 13, "pitch": "G#5", "cx": 635, "cy": -14, "rotate": 101, "scaleX": 0.85, "scaleY": 0.85, "type": "bottom" }
        ]
    }
    // Add others as needed or fallback logic
};
