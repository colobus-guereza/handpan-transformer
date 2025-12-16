export const HANDPAN_CONFIG = {
    pan_diameter_outer: 57, // cm (Total)
    shell_diameter: 55,     // cm (Dome only)
    rim_width: 1,           // cm
    get PAN_RADIUS() { return this.shell_diameter / 2; }, // 27.5 cm (Used for Dome)
    get OUTER_RADIUS() { return this.pan_diameter_outer / 2; }, // 28.5 cm (Used for Rim)
    DOME_HEIGHT_RATIO: 0.35, // Height / Diameter
};

// Tonefield Sizing Configuration (Dual-Anchor)
export const TONEFIELD_CONFIG = {
    DING: {
        REF_HZ: 138.59,  // C#3
        REF_HEIGHT: 18.27, // cm (20.3 * 0.9 for 10% decrease)
        SCALING_FACTOR: 0.6 // Tuning variable
    },
    NORMAL: {
        REF_HZ: 220.00,  // A3
        REF_HEIGHT: 14.36, // cm (15.12 * 0.95 for 5% decrease)
        SCALING_FACTOR: 0.35 // Reduced from 0.5 to flatten size reduction curve
    },
    RATIOS: {
        ASPECT_W_H: 0.6 / 0.85, // Width / Height
        DIMPLE_LARGE: 0.45,     // F#3 or lower, or DING
        DIMPLE_SMALL: 0.40,     // Higher than F#3
        F_SHARP_3_HZ: 185.00    // Boundary Frequency
    }
};

// Helper to calculate dome height
// Helper to calculate dome height
export const getDomeHeight = () => HANDPAN_CONFIG.shell_diameter * HANDPAN_CONFIG.DOME_HEIGHT_RATIO;
