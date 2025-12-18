// Handpan Data Registry
// Pure Data for the Isolated AutoPlayer
// Coordinates extracted from Digipan Layouts and Assets moved to /images/digipan/

export interface RegistryNote {
    id: number;
    pitch?: string; // Optional because logic might just use index if Scale not provided
    cx: number; // SVG X (0-1000)
    cy: number; // SVG Y (0-1000)
    rotate: number; // Degrees
    scaleX: number;
    scaleY: number;
    type: "center" | "top" | "bottom";
    visual?: boolean; // If true, rendering a visual ring is required (not on image)
}

export interface HandpanModelConfig {
    id: string; // "d_kurd_10", "f_low_pygmy_14", etc.
    name: string;
    image: string; // Path to background texture (e.g. /images/digipan/10notes.png)
    baseColor: string;
    notes: RegistryNote[];
}

export const HANDPAN_REGISTRY: Record<string, HandpanModelConfig> = {
    // 1. D Kurd 10 (Standard)
    "d_kurd_10": {
        id: "d_kurd_10",
        name: "D Kurd 10",
        image: "/images/digipan/10notes.png",
        baseColor: "#8B5A2B",
        notes: [
            { id: 0, cx: 508, cy: 515, rotate: 89, scaleX: 1.36, scaleY: 1.16, type: "center" },
            { id: 1, cx: 639, cy: 811, rotate: 66, scaleX: 1, scaleY: 0.89, type: "top" },
            { id: 2, cx: 356, cy: 811, rotate: 103, scaleX: 0.98, scaleY: 0.9, type: "top" },
            { id: 3, cx: 822, cy: 626, rotate: 194, scaleX: 1, scaleY: 0.93, type: "top" },
            { id: 4, cx: 178, cy: 609, rotate: 163, scaleX: 0.99, scaleY: 0.91, type: "top" },
            { id: 5, cx: 832, cy: 391, rotate: 158, scaleX: 0.94, scaleY: 0.82, type: "top" },
            { id: 6, cx: 184, cy: 367, rotate: 28, scaleX: 0.97, scaleY: 0.85, type: "top" },
            { id: 7, cx: 703, cy: 215, rotate: 142, scaleX: 1.02, scaleY: 0.8, type: "top" },
            { id: 8, cx: 314, cy: 200, rotate: 57, scaleX: 0.98, scaleY: 0.83, type: "top" },
            { id: 9, cx: 508, cy: 143, rotate: 138, scaleX: 1.07, scaleY: 0.79, type: "top" }
        ]
    },

    // 2. D Asha 9 (Standard)
    "d_asha_9": {
        id: "d_asha_9",
        name: "D Asha 9",
        image: "/images/digipan/9notes.png",
        baseColor: "#2F4F4F",
        notes: [
            { id: 0, cx: 513, cy: 528, rotate: 89, scaleX: 1.43, scaleY: 1.22, type: "center" },
            { id: 1, cx: 662, cy: 808, rotate: 66, scaleX: 1.00, scaleY: 0.89, type: "top" },
            { id: 2, cx: 349, cy: 810, rotate: 107, scaleX: 1.04, scaleY: 0.87, type: "top" },
            { id: 3, cx: 843, cy: 589, rotate: 187, scaleX: 0.89, scaleY: 0.91, type: "top" },
            { id: 4, cx: 172, cy: 599, rotate: 154, scaleX: 1.10, scaleY: 0.91, type: "top" },
            { id: 5, cx: 788, cy: 316, rotate: 145, scaleX: 1.03, scaleY: 0.94, type: "top" },
            { id: 6, cx: 201, cy: 350, rotate: 148, scaleX: 1.20, scaleY: 0.79, type: "top" },
            { id: 7, cx: 594, cy: 184, rotate: 188, scaleX: 1.27, scaleY: 0.77, type: "top" },
            { id: 8, cx: 370, cy: 195, rotate: 144, scaleX: 1.18, scaleY: 0.78, type: "top" }
        ]
    },

    // 3. F# Low Pygmy 14 (Mutant)
    "f_low_pygmy_14": {
        id: "f_low_pygmy_14",
        name: "F# Low Pygmy 14",
        image: "/images/digipan/10notes.png", // Reuses 10notes background!
        baseColor: "#DAA520",
        notes: [
            // Base 10 Notes (Invisible - on Image)
            { id: 0, cx: 508, cy: 515, rotate: 89, scaleX: 1.36, scaleY: 1.16, type: "center" },
            { id: 1, cx: 639, cy: 811, rotate: 66, scaleX: 1, scaleY: 0.89, type: "top" },
            { id: 2, cx: 356, cy: 811, rotate: 103, scaleX: 0.98, scaleY: 0.9, type: "top" },
            { id: 3, cx: 822, cy: 626, rotate: 194, scaleX: 1, scaleY: 0.93, type: "top" },
            { id: 4, cx: 178, cy: 609, rotate: 163, scaleX: 0.99, scaleY: 0.91, type: "top" },
            { id: 5, cx: 832, cy: 391, rotate: 158, scaleX: 0.94, scaleY: 0.82, type: "top" },
            { id: 6, cx: 184, cy: 367, rotate: 28, scaleX: 0.97, scaleY: 0.85, type: "top" },
            { id: 7, cx: 703, cy: 215, rotate: 142, scaleX: 1.02, scaleY: 0.8, type: "top" },
            { id: 8, cx: 314, cy: 200, rotate: 57, scaleX: 0.98, scaleY: 0.83, type: "top" },
            { id: 9, cx: 508, cy: 142, rotate: 138, scaleX: 1.07, scaleY: 0.79, type: "top" }, // Typos in source 142 vs 143, trusting 14

            // Bottom 4 Notes (Visual = True, because they are NOT on the base image)
            { id: 10, cx: 0, cy: 762, rotate: 158, scaleX: 1.29, scaleY: 1.61, type: "bottom", visual: true },
            { id: 11, cx: 998, cy: 762, rotate: 21, scaleX: 1.24, scaleY: 1.48, type: "bottom", visual: true },
            { id: 12, cx: 386, cy: -21, rotate: 76, scaleX: 0.9, scaleY: 0.9, type: "bottom", visual: true },
            { id: 13, cx: 635, cy: -14, rotate: 101, scaleX: 0.85, scaleY: 0.85, type: "bottom", visual: true }
        ]
    }
};
