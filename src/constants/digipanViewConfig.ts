// Centralized configuration for Digipan Camera View Settings
// Defines Camera Zoom and Vertical Offset (TargetY) for each template
//
// targetY:
// - 0: Center (Default)
// - Positive (>0): Move Object DOWN (Camera looks up) -> Used for 14M/15M/18M to give headroom
// - Negative (<0): Move Object UP (Camera looks down) -> Use to fix "Top Heavy" margin issues (Digipan 9/10/11/12)

export interface DigipanViewSettings {
    zoom: number;
    targetY: number;
}

export const DIGIPAN_VIEW_CONFIG: Record<string, DigipanViewSettings> = {
    '9': { zoom: 13.5, targetY: 0 },
    '10': { zoom: 13.5, targetY: 0 },
    '11': { zoom: 12, targetY: 0 },
    '12': { zoom: 12, targetY: 0 },
    '14': { zoom: 12, targetY: 0 },
    '14M': { zoom: 12, targetY: 0 },
    '15M': { zoom: 12, targetY: 0 },
    '18M': { zoom: 12, targetY: 0 },
    'DM': { zoom: 12, targetY: 0 },
};

// Independent Scale-Specific Overrides
// Use this to fine-tune specific scales without affecting the entire template group
export const DIGIPAN_SCALE_OVERRIDES: Record<string, DigipanViewSettings> = {
    'e_equinox_14': { zoom: 12, targetY: 2 },
};

export const DIGIPAN_LABEL_POS_FACTOR = 0.20;
