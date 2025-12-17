'use client';

import React, { useState, useRef, useMemo, Suspense, useEffect, useCallback } from 'react';
import * as Tone from 'tone';

// Shared mobile button style for consistent size and appearance
const btnMobile = "w-[38.4px] h-[38.4px] flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-full border border-slate-200 hover:bg-white transition-all duration-200";
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { Text, OrbitControls, Center, Line, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { Scale } from '../../data/handpanScales';
import { Lock, Unlock, Camera, Check, Eye, EyeOff, Play, Ship, Pointer, Disc, Square, Drum, Music, Music2, Download, Trash2 } from 'lucide-react';
import { HANDPAN_CONFIG, getDomeHeight, TONEFIELD_CONFIG } from '../../constants/handpanConfig';
import { DIGIPAN_VIEW_CONFIG, DIGIPAN_LABEL_POS_FACTOR } from '../../constants/digipanViewConfig';
import html2canvas from 'html2canvas';
import { useHandpanAudio } from '../../hooks/useHandpanAudio';
import { usePathname } from 'next/navigation';
{/* Scale Info Panel Removed for Portability */ }
{/* {isDevPage && (
                <ScaleInfoPanel
                    scale={scale}
                    // ... props
                />
            )} */}
import TouchText from './TouchText';
import CyberBoat from './CyberBoat';
import ToneFieldMesh from './ToneFieldMesh'; // Imported Reusable Component
import { useOctaveResonance, ResonanceSettings } from '../../hooks/useOctaveResonance';
import { DEFAULT_HARMONIC_SETTINGS, DigipanHarmonicConfig } from '../../constants/harmonicDefaults';
import { useDigipanRecorder } from '../../hooks/useDigipanRecorder';
import { useJamSession } from '../../hooks/useJamSession';
import { calculateChordProgression, ChordSet } from '../../lib/ChordCalculator';

const CameraHandler = ({
    isLocked,
    enableZoom = true,
    enablePan = true,
    sceneSize = { width: 60, height: 60 },
    cameraTargetY = 0,
    cameraZoom = 12 // Default base zoom
}: {
    isLocked: boolean;
    enableZoom?: boolean;
    enablePan?: boolean;
    sceneSize?: { width: number; height: number; };
    cameraTargetY?: number;
    cameraZoom?: number;
}) => {
    const { camera, gl, size } = useThree();
    const controlsRef = useRef<any>(null);

    React.useEffect(() => {
        const updateZoom = () => {
            if (isLocked) {
                // Smart Auto-Fit Logic
                // Calculate zoom needed to fit width and height
                // Orthographic Camera Zoom = (Screen Dimension / World Dimension) / 2? No.
                // For R3F Orthographic Camera (default zoom=1 matches 1 unit = 1 pixel?), no.
                // Standard R3F Orthographic: zoom is a multiplier.
                // With basic setup, zoom=1 means top=height/2, bottom=-height/2?
                // Actually Digipan3D uses: <Canvas orthographic camera={{ zoom: 12 ... }}>
                // This suggests custom handling.
                // Let's rely on ratio:
                // Current '12' fits ~60 units into ~700px?
                // If Screen Width 700 / 12 = 58 units.
                // So Zoom ~ ScreenDimension / WorldDimension.

                const zoomX = size.width / sceneSize.width;
                const zoomY = size.height / sceneSize.height;

                // Use the smaller zoom to ensure BOTH dimensions fit (contain)
                // Multiply by 0.9 for safety margin (padding)
                // Apply User Requested Zoom Factor (Relative to Base 12)
                const zoomFactor = cameraZoom / 12;
                const targetZoom = Math.min(zoomX, zoomY) * 0.9 * zoomFactor;

                // Apply
                camera.position.set(0, cameraTargetY, 100);
                camera.lookAt(0, cameraTargetY, 0);
                camera.zoom = targetZoom;
                camera.updateProjectionMatrix();

                if (controlsRef.current) {
                    controlsRef.current.target.set(0, cameraTargetY, 0);
                    controlsRef.current.update();
                }
            }
        };

        // Update on params change or resize
        updateZoom();
    }, [isLocked, camera, size.width, size.height, sceneSize.width, sceneSize.height, cameraZoom]);

    return (
        <OrbitControls
            ref={controlsRef}
            enableRotate={!isLocked}
            enableZoom={enableZoom}
            enablePan={enablePan}
            minZoom={2} // Allow zooming out more for large vertical stacks
            maxZoom={50}
        />
    );
};

// ... (HandpanBody, ToneFieldMesh components remain the same)

import { NoteData, SCALES } from '@/data/handpanScales';

interface Digipan3DProps {
    notes: NoteData[];
    scale?: Scale | null;
    centerX?: number;
    centerY?: number;
    onNoteClick?: (noteId: number) => void;
    isCameraLocked?: boolean;
    onScaleSelect?: (scale: Scale) => void;
    backgroundImage?: string | null;
    extraControls?: React.ReactNode;
    noteCountFilter?: number; // Optional filter for scale list
    enableZoom?: boolean;
    enablePan?: boolean;
    showControls?: boolean;
    showInfoPanel?: boolean;
    initialViewMode?: 0 | 1 | 2 | 3 | 4;
    viewMode?: 0 | 1 | 2 | 3 | 4;
    onViewModeChange?: (mode: 0 | 1 | 2 | 3 | 4) => void;
    showLabelToggle?: boolean;
    forceCompactView?: boolean;
    backgroundContent?: React.ReactNode;
    tonefieldOffset?: [number, number, number];
    hideStaticLabels?: boolean;
    sceneSize?: { width: number; height: number }; // New Prop for Auto-Fit
    cameraTargetY?: number;
    showAxes?: boolean; // Show/hide x, y, z axes and coordinates
    harmonicSettings?: DigipanHarmonicConfig; // Optional override for harmonics
    onIsRecordingChange?: (isRecording: boolean) => void;
    cameraZoom?: number; // Optional override for initial camera zoom
    isAutoPlay?: boolean; // New: Clean AutoPlayer View Mode
    demoActiveNoteId?: number | null; // New: External control for note highlighting
}

export interface Digipan3DHandle {
    handleCapture: () => Promise<void>;
    handleDemoPlay: () => Promise<void>;
    handleRecordToggle: () => Promise<void>;
    toggleViewMode: () => void;
    toggleIdleBoat: () => void;
    toggleTouchText: () => void;
}

// Constants & Types
// -----------------------------------------------------------------------------

const TONEFIELD_RATIO_X = 0.3;
const TONEFIELD_RATIO_Y = 0.425;

// NoteData interface moved to handpanScales.ts "Bottom Guide" sienna mesh
// ... other props optional for now


// Duplicate interface removed

// -----------------------------------------------------------------------------
// Helper Functions
// ----------------------------------------------------------------------------- 


// Convert SVG coordinates (Top-Left origin) to 3D coordinates (Center origin, cm units)
// SVG ViewBox: -400 -1100 1800 3200
// SVG Center: 500, 500
// SVG Radius: ~480
// Real Radius: 28.5 cm
export const svgTo3D = (x: number, y: number, centerX: number = 500, centerY: number = 500) => {
    const svgScale = HANDPAN_CONFIG.PAN_RADIUS / 480; // Map 480px to 28.5cm
    return {
        x: (x - centerX) * svgScale,
        y: -(y - centerY) * svgScale,
    };
};

// Helper to calculate parametric tonefield dimensions
export const getTonefieldDimensions = (hz: number, isDing: boolean) => {
    const { DING, NORMAL, RATIOS } = TONEFIELD_CONFIG;
    const refConfig = isDing ? DING : NORMAL;

    // 1. Calculate size based on frequency ratio (Exponential scaling)
    // Formula: Size = RefSize * (RefHz / TargetHz) ^ ScalingFactor
    const ratio = Math.pow((refConfig.REF_HZ / hz), refConfig.SCALING_FACTOR);
    const height = refConfig.REF_HEIGHT * ratio; // cm

    // 2. Calculate width based on aspect ratio
    const width = height * RATIOS.ASPECT_W_H; // cm

    // 3. Determine dimple scale
    // Condition: Ding OR Frequency <= F#3 (185Hz) -> Large Dimple (0.45)
    // Else -> Small Dimple (0.40)
    const useLargeDimple = isDing || hz <= RATIOS.F_SHARP_3_HZ;
    const dimpleRatio = useLargeDimple ? RATIOS.DIMPLE_LARGE : RATIOS.DIMPLE_SMALL;

    return {
        width,
        height,
        dimpleWidth: width * dimpleRatio,
        dimpleHeight: height * dimpleRatio
    };
};

// -----------------------------------------------------------------------------
// Sub-Components
// -----------------------------------------------------------------------------

// Image Component
const HandpanImage = ({ backgroundImage, centerX = 500, centerY = 500 }: { backgroundImage?: string | null; centerX?: number; centerY?: number; }) => {
    if (!backgroundImage) return null;

    // Calculate Image Position to adjust for Center Offset
    // We want the SVG Center (500, 500) to align with the calculated 3D position
    // If centerX/Y is different from 500, the origin (0,0) moves to that point.
    // The Image (centered at 500,500) must move relative to the new origin.
    const pos = svgTo3D(500, 500, centerX, centerY);

    return <HandpanImageRenderer url={backgroundImage} position={[pos.x, pos.y, -0.5]} />;
};

const HandpanImageRenderer = ({ url, position }: { url: string; position: [number, number, number] }) => {
    const texture = useTexture(url);
    const size = HANDPAN_CONFIG.OUTER_RADIUS * 2;
    return (
        <mesh position={position} rotation={[0, 0, 0]}>
            <planeGeometry args={[size, size]} />
            <meshBasicMaterial map={texture} transparent opacity={1} />
        </mesh>
    );
};

// Reusable ToneFieldMesh imported above
// (Orphaned ToneFieldMesh code removed)

const Digipan3D = React.forwardRef<Digipan3DHandle, Digipan3DProps>(({
    notes,
    onNoteClick,
    isCameraLocked = false,
    scale,
    centerX = 500,
    centerY = 500,
    onScaleSelect,
    backgroundImage,
    extraControls,
    noteCountFilter = 10,
    // Defaults for Dev Mode (Show All)
    showControls = true,
    showInfoPanel = true,
    initialViewMode = 0,
    viewMode: controlledViewMode, // New Prop for Controlled Mode
    onViewModeChange,
    enableZoom = true,
    enablePan = true,
    showLabelToggle = false,
    forceCompactView = false,
    backgroundContent,
    tonefieldOffset = [0, 0, 0],
    hideStaticLabels = false,
    sceneSize = { width: 60, height: 60 }, // Default for Single Pan
    cameraTargetY = 0, // Vertical Shift Target
    showAxes = false, // Default to false, will be controlled by parent
    harmonicSettings, // Optional Override
    onIsRecordingChange,
    cameraZoom, // Destructure new prop
    isAutoPlay = false,
    demoActiveNoteId: externalDemoNoteId // Destructure external demo control
}, ref) => {
    const pathname = usePathname();
    // ScaleInfoPanel은 /digipan-3d-test 경로에서만 표시
    const isDevPage = pathname === '/digipan-3d-test';

    const [isCameraLockedState, setIsCameraLocked] = useState(isCameraLocked);
    const [copySuccess, setCopySuccess] = useState(false);
    // Default expanded unless forced compact
    const [isInfoExpanded, setIsInfoExpanded] = useState(!forceCompactView);
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);
    const [demoNoteId, setDemoNoteId] = useState<number | null>(null);
    const activeHighlightId = externalDemoNoteId ?? demoNoteId; // Prefer external if present, else internal
    const [isPlaying, setIsPlaying] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [drumTimer, setDrumTimer] = useState<number | null>(null);

    // Recording State Management
    const [currentBlob, setCurrentBlob] = useState<Blob | null>(null);

    // Audio Hook
    const { isLoaded: isAudioLoaded, loadingProgress, playNote, getAudioContext, getMasterGain } = useHandpanAudio();

    // Recorder Hook
    // Note: We need access to the CANVAS DOM element.
    // R3F Canvas creates a canvas inside the div containerRef.
    // We can try to query it or use gl.domElement if we had access here (we don't outer ref).
    // Alternative: Use a ref on the Canvas? R3F forwards refs to the canvas element since v8?
    // Let's rely on querying the canvas from the container for now as a robust fallback.
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Workaround: Capture the canvas reference once mounted
    useEffect(() => {
        if (containerRef.current) {
            const canvasEl = containerRef.current.querySelector('canvas');
            if (canvasEl) {
                // We can't assign to current directly on a generic ref if type doesn't match?
                // Actually we can cast.
                (canvasRef as any).current = canvasEl;
            }
        }
    }, []);

    // Determine if we're in mobile mode (either preview or embedded)
    // Also consider User Agent for logic branching (Behavioral)
    const isMobileButtonLayout = forceCompactView || showLabelToggle;

    // Save/Share Logic Helpers (Moved up for Hook usage)
    const downloadFile = (blob: Blob, name: string) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();

        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    };

    const handleSaveRecording = async (filename: string, directBlob?: Blob) => {
        const blobToUse = directBlob || currentBlob;
        if (!blobToUse) return;

        // Ensure extension matches mimeType
        const ext = blobToUse.type.includes('mp4') ? 'mp4' : 'webm';
        const fullFilename = `${filename}.${ext}`;
        const file = new File([blobToUse], fullFilename, { type: blobToUse.type });

        // Method A: Try Web Share API (Mobile Native Experience)
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    files: [file],
                    title: 'Digipan Performance',
                    text: 'Check out my handpan performance!',
                });
            } catch (err: any) {
                if (err.name !== 'AbortError') {
                    downloadFile(blobToUse, fullFilename);
                }
            }
        } else {
            // Method B: Desktop Download (System Dialog)
            downloadFile(blobToUse, fullFilename);
        }

        // Only clear if we were using the state blob
        if (!directBlob) {
            setCurrentBlob(null);
        }
    };

    const handleRecordingComplete = useCallback((blob: Blob) => {
        // Detect Mobile Environment:
        // Strictly rely on User Agent to distinct PC vs Mobile Behavior.
        // We do NOT use isMobileButtonLayout here because we want PC users (even with small windows) to get direct download.
        const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isMobileContext = isMobileUA;

        if (isMobileContext) {
            // Mobile: Show Popup (Set State)
            setCurrentBlob(blob);
        } else {
            // Web: Immediate Save (Restore Legacy Behavior)
            try {
                handleSaveRecording(`digipan-performance-${Date.now()}`, blob);
            } catch (err) {
                console.error("Auto-save failed:", err);
                // Fallback to popup if auto-save fails? 
                setCurrentBlob(blob);
            }
        }
    }, []);

    const { isRecording, startRecording, stopRecording } = useDigipanRecorder({
        canvasRef: canvasRef as React.RefObject<HTMLCanvasElement>,
        getAudioContext,
        getMasterGain,
        onRecordingComplete: handleRecordingComplete
    });

    // Sync Recording State with Parent
    useEffect(() => {
        if (onIsRecordingChange) {
            onIsRecordingChange(isRecording);
        }
    }, [isRecording, onIsRecordingChange]);


    // AudioContext is handled by Tone.js internally now.
    // We don't need manual polling for Tone.js integration.

    // === Unified Jam Session Hook ===
    const dingNote = notes.find(n => n.id === 0)?.label || "D3";
    const scaleNoteNames = useMemo(() => notes.map(n => n.label), [notes]);
    const { togglePlay: toggleJam, isPlaying: isJamPlaying, introCountdown, onInteraction } = useJamSession({
        bpm: 100,
        rootNote: dingNote,
        scaleNotes: scaleNoteNames
    });

    // Legacy timer for visual countdown (optional)
    // Note: drumTimer state is declared at line 759
    const totalDuration = 38.4; // 16 bars at 100 BPM

    const toggleDrum = () => {
        // Now using unified Jam Session (Drum + Chord)
        toggleJam();

        // Update visual timer
        if (drumTimer !== null) {
            setDrumTimer(null);
        } else {
            setDrumTimer(Math.ceil(totalDuration));
        }
    };
    // Update Timer Effect to handle float duration smoothly if needed,
    // but existing logic uses integer decrement.
    // We probably want to sync the circle animation to exactly totalDuration.
    // The previous logic:
    /*
        if (drumTimer === null || drumTimer <= 0) { ... }
        interval sets timer - 1 every 1000ms.
    */
    // If we start at 39, it counts down 39, 38...
    // The ring SVG uses `drumTimer / 30`. We should update that divisor.

    // IN JSX (Around Line 1360):
    /*
        strokeDashoffset={drumTimer !== null
            ? `${2 * Math.PI * 18 * (1 - drumTimer / totalDuration)}`  <-- Update 30 to totalDuration
            : 0
        }
    */
    // ==========================================

    // View Mode Toggle Helper
    const handleViewModeToggle = () => {
        setViewMode(prev => prev === 0 ? 2 : 0);
    };

    const [isIdle, setIsIdle] = useState(true); // Default to True
    const [showIdleBoat, setShowIdleBoat] = useState(false); // Default to OFF for DigiBall
    // Default showTouchText to true unless isAutoPlay is active
    const [showTouchText, setShowTouchText] = useState(!isAutoPlay);

    const lastInteractionTime = useRef(Date.now() - 6000); // Allow immediate idle
    const IDLE_TIMEOUT = 5000; // 5 seconds
    const idleCheckInterval = useRef<NodeJS.Timeout | null>(null);

    const resetIdleTimer = useCallback((delayOverhead = 0) => {
        // Reset timer to Current Time + Delay Overhead (e.g. Sound Duration)
        // This effectively postpones the "5s check" until the sound finishes
        lastInteractionTime.current = Date.now() + delayOverhead;
        setIsIdle(prev => prev ? false : prev);
    }, []);

    useEffect(() => {
        // Start Interval to check idle state
        idleCheckInterval.current = setInterval(() => {
            const now = Date.now();
            if (now - lastInteractionTime.current > IDLE_TIMEOUT) {
                setIsIdle(true);
            }
        }, 1000); // Check every second

        return () => {
            if (idleCheckInterval.current) clearInterval(idleCheckInterval.current);
        };
    }, [isIdle]);

    // 드럼 타이머 로직
    useEffect(() => {
        if (drumTimer === null || drumTimer <= 0) {
            if (drumTimer === 0) {
                setDrumTimer(null); // 0이 되면 드럼 아이콘으로 복귀
                // 타이머 종료 시 재생 중이면 중단 (Safety)
                if (isJamPlaying) {
                    toggleJam();
                }
            }
            return;
        }

        const interval = setInterval(() => {
            setDrumTimer(prev => {
                if (prev === null || prev <= 1) {
                    return null;
                }
                return prev - 1;
            });
        }, 1000); // 1초마다 감소

        return () => clearInterval(interval);
    }, [drumTimer, isJamPlaying, toggleJam]);

    // View Mode: 0 = Default (All), 1 = No Labels, 2 = No Mesh (Levels Only), 3 = Hidden (Interaction Only), 4 = Guide (Image + Dots)
    // Initialize with controlled prop if available, else initialViewMode
    const [internalViewMode, setInternalViewMode] = useState<0 | 1 | 2 | 3 | 4>(
        controlledViewMode !== undefined ? controlledViewMode : initialViewMode
    );

    // Sync state with controlled prop if it changes
    useEffect(() => {
        if (controlledViewMode !== undefined) {
            setInternalViewMode(controlledViewMode);
        }
    }, [controlledViewMode]);

    const viewMode = controlledViewMode !== undefined ? controlledViewMode : internalViewMode;

    const setViewMode = (modeOrFn: 0 | 1 | 2 | 3 | 4 | ((prev: 0 | 1 | 2 | 3 | 4) => 0 | 1 | 2 | 3 | 4)) => {
        let newMode: 0 | 1 | 2 | 3 | 4;
        if (typeof modeOrFn === 'function') {
            newMode = modeOrFn(viewMode);
        } else {
            newMode = modeOrFn;
        }

        if (onViewModeChange) {
            onViewModeChange(newMode);
        } else {
            setInternalViewMode(newMode);
        }
    };

    // Audio Preloader Hook - Loaded above

    // Digital Harmonics Engine (Global)
    // Pass shared AudioContext and MasterGain (Limiter) to single unification source
    const { playResonantNote, preloadNotes } = useOctaveResonance({ getAudioContext, getMasterGain });

    // Merge provided settings with defaults, or use defaults if none provided
    // NOTE: In JS, spread merges shallowly. We want to respect nested overrides if partial...
    // But typically we pass the FULL config object from Leva.
    // If harmonicSettings is passed (from DigipanDM), use it entirely. If not, use DEFAULT.
    const activeHarmonicConfig = harmonicSettings || DEFAULT_HARMONIC_SETTINGS;

    const containerRef = useRef<HTMLDivElement>(null);

    // Auto-collapse panel when switching to compact view (Mobile Preview)
    useEffect(() => {
        if (forceCompactView) {
            setIsInfoExpanded(false);
        }
    }, [forceCompactView]);

    // Sync internal camera lock state with prop from parent
    useEffect(() => {
        setIsCameraLocked(isCameraLocked);
    }, [isCameraLocked]);


    // Pre-calculate Resonance Map (Optimization: Move logic out of click handler)
    const resonanceMap = useMemo(() => {
        const map: Record<number, { label: string; settings: ResonanceSettings }[]> = {};
        notes.forEach(sourceNote => {
            if (!sourceNote.frequency) return;
            const targets: { label: string; settings: ResonanceSettings }[] = [];

            notes.forEach(targetNote => {
                if (targetNote.id === sourceNote.id) return;
                if (!targetNote.frequency || !sourceNote.frequency) return;

                const ratio = targetNote.frequency / sourceNote.frequency;
                const tolerance = 0.03;

                // Octave (x2, x4)
                if ((Math.abs(ratio - 2.0) < tolerance || Math.abs(ratio - 4.0) < tolerance) && activeHarmonicConfig.octave.active) {
                    targets.push({
                        label: targetNote.label,
                        settings: {
                            trimStart: activeHarmonicConfig.octave.trim,
                            fadeInDuration: activeHarmonicConfig.octave.fade,
                            fadeInCurve: activeHarmonicConfig.octave.curve,
                            delayTime: activeHarmonicConfig.octave.latency,
                            masterGain: activeHarmonicConfig.octave.gain
                        }
                    });
                }

                // Fifth (x3)
                if (Math.abs(ratio - 3.0) < tolerance && activeHarmonicConfig.fifth.active) {
                    targets.push({
                        label: targetNote.label,
                        settings: {
                            trimStart: activeHarmonicConfig.fifth.trim,
                            fadeInDuration: activeHarmonicConfig.fifth.fade,
                            fadeInCurve: activeHarmonicConfig.fifth.curve,
                            delayTime: activeHarmonicConfig.fifth.latency,
                            masterGain: activeHarmonicConfig.fifth.gain
                        }
                    });
                }
            });
            if (targets.length > 0) map[sourceNote.id] = targets;
        });
        return map;
    }, [notes, activeHarmonicConfig]);

    // Smart Preloading: When Scale (notes) changes, preload all sounds immediately
    useEffect(() => {
        if (!notes || notes.length === 0) return;

        // 1. Get all unique note labels in the current scale
        const uniqueNotes = new Set<string>();
        notes.forEach(n => uniqueNotes.add(n.label));

        // 2. Preload them all in parallel
        preloadNotes(Array.from(uniqueNotes));
    }, [notes, preloadNotes]);

    // Interaction Trigger for Visual Effects
    const [interactionCount, setInteractionCount] = useState(0);

    // Optimized Click Handler (Stable Callback)
    const handleToneFieldClick = useCallback((id: number) => {
        // 1. Audio Priority: Play immediately
        // Note: playNote is handled inside ToneFieldMesh for instant feedback? 
        // No, ToneFieldMesh calls playNote via prop.
        // Wait, ToneFieldMesh implementation:
        // handlePointerDown -> onClick(id) -> playNote(label)
        // See lines 1127-1133 of Digipan3D.tsx (ToneFieldMesh)
        // It calls onClick THEN playNote.
        // So handleToneFieldClick runs BEFORE main note audio? No, inside onClick.
        // Javascript is single threaded.
        // To be safe, Resonance should be triggered asap.

        // 2. Play Resonant Notes (Lookup Map - O(1))
        const resonantTargets = resonanceMap[id];
        if (resonantTargets) {
            resonantTargets.forEach(target => {
                playResonantNote(target.label, target.settings);
            });
        }

        // 3. Logic & State Updates
        resetIdleTimer(3500);
        setInteractionCount(prev => prev + 1); // Trigger visual feedback

        if (onNoteClick) onNoteClick(id);

        // Notify Castling Session (if active)
        if (isJamPlaying) {
            onInteraction();
        }

    }, [resonanceMap, playResonantNote, onNoteClick, resetIdleTimer, isJamPlaying, onInteraction]);

    // Dynamic Scale Filter based on noteCountFilter and Search Query
    const filteredScales = useMemo(() => {
        return SCALES.filter(s => {
            const totalNotes = 1 + s.notes.top.length + s.notes.bottom.length;
            const matchesCount = totalNotes === noteCountFilter;
            const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCount && matchesSearch;
        }).sort((a, b) => a.name.localeCompare(b.name));
    }, [noteCountFilter, searchQuery]);

    const handleCapture = async () => {
        if (!containerRef.current) return;

        try {
            const controls = containerRef.current.querySelector('.controls-container') as HTMLElement;
            if (controls) controls.style.display = 'none';

            const canvas = await html2canvas(containerRef.current, {
                backgroundColor: '#FFFFFF',
                logging: false,
                useCORS: true
            });

            if (controls) controls.style.display = 'flex';

            canvas.toBlob(async (blob) => {
                if (!blob) return;
                try {
                    await navigator.clipboard.write([
                        new ClipboardItem({
                            'image/png': blob
                        })
                    ]);
                    setCopySuccess(true);
                    setTimeout(() => setCopySuccess(false), 2000);
                } catch (err) {
                    console.error('Failed to copy to clipboard:', err);
                }
            });
        } catch (err) {
            console.error('Failed to capture canvas:', err);
        }
    };

    const handleDemoPlay = async () => {
        if (isPlaying) return;
        setIsPlaying(true);

        // Sort ALL notes by frequency (Low -> High)
        // This handles both cases:
        // - Type 1 (D Kurd 12): Ding is lowest, starts from Ding
        // - Type 2 (E Equinox 12): Bottom notes are lower than Ding, starts from bottom
        const sortedNotes = [...notes].filter(n => n.frequency).sort((a, b) => (a.frequency || 0) - (b.frequency || 0));

        // The LOWEST frequency note gets the root emphasis (not necessarily Ding)
        const lowestNoteId = sortedNotes.length > 0 ? sortedNotes[0].id : -1;

        // Helper to trigger a single note
        const playNote = async (id: number, duration: number) => {
            setDemoNoteId(id);
            // Add slight random variation (Rubato)
            const rubato = Math.random() * 30;
            await new Promise(resolve => setTimeout(resolve, duration + rubato));

            setDemoNoteId(null);
            // Minimal gap for clean pulse
            await new Promise(resolve => setTimeout(resolve, 30));
        };

        // Reset Timer for the total duration of the Demo
        // Rough estimate: ~12 notes * ~500ms avg = 6000ms
        // We act conservatively: just reset on start, and maybe at end?
        // Better: Reset with large overhead or keep resetting. 
        // Simple approach: Reset at start with LONG overhead.
        resetIdleTimer(10000); // Assume demo takes ~10s

        // 1. Ascending (Low -> High)
        for (let i = 0; i < sortedNotes.length; i++) {
            const id = sortedNotes[i].id;
            const isRoot = id === lowestNoteId; // Root = Lowest frequency note
            const isTop = i === sortedNotes.length - 1;

            // Timing Logic:
            // - Root (Lowest): 500ms (Heavy start)
            // - Top Note: 800ms (Fermata/Peak linger)
            // - Others: 180ms (Fluid flow)
            let baseTime = isRoot ? 500 : 180;
            if (isTop) baseTime = 800; // Linger at the peak

            await playNote(id, baseTime);

            // Root Emphasis: Add breath after the first (lowest) note
            if (isRoot) {
                await new Promise(resolve => setTimeout(resolve, 600));
            }
        }

        // Explicit Pause/Breath at the Top before descending
        await new Promise(resolve => setTimeout(resolve, 400));

        // 2. Descending (High -> Low)
        for (let i = sortedNotes.length - 1; i >= 0; i--) {
            const id = sortedNotes[i].id;
            const isRoot = id === lowestNoteId;

            // Ending Emphasis: Add breath before the final (lowest) note
            if (isRoot) {
                await new Promise(resolve => setTimeout(resolve, 600));
            }

            // Standard flow for descent, Root lasts longer at the end
            const baseTime = isRoot ? 800 : 180;

            await playNote(id, baseTime);
        }

        setIsPlaying(false);
        // 재생이 끝나면 5초 후에 버튼이 다시 나타나도록 타이머 리셋
        resetIdleTimer(5000);
    };

    // Mobile determination moved to top of component

    // Save/Share Logic triggered Directly from UI (Mobile)
    const handleSaveAction = async () => {
        if (!currentBlob) return;
        const filename = `digipan-performance-${Date.now()}`;
        await handleSaveRecording(filename, currentBlob);

        // Mobile UX: After tapping "Save to Album", we retain or clear?
        // User asked: "녹화취소 버튼 누르면 녹화로직 초기화" (Cancel -> Reset).
        // "앨범에 저장 누르면... 저장" (Save -> Save).
        // Usually, after saving, we should probably close the popup to let them record again or view it?
        // Let's close it to imply "Done".
        // If share fails, they can try again?
        // handleSaveRecording does NOT throw usually (catches internally).
        setCurrentBlob(null);
    };

    // Auto-save Effect for Mobile
    useEffect(() => {
        if (currentBlob && isMobileButtonLayout) {
            handleSaveAction();
        }
    }, [currentBlob, isMobileButtonLayout, handleSaveAction]);

    const handleDiscardAction = () => {
        setCurrentBlob(null);
    };

    // Recording Handler
    const handleRecordToggle = async () => {
        if (isRecording) {
            stopRecording();
            // Do NOT save automatically here.
            // The hook will trigger onRecordingComplete -> sets currentBlob -> shows UI
        } else {
            startRecording();
        }
    };

    // Expose methods via ref
    React.useImperativeHandle(ref, () => ({
        handleCapture,
        handleDemoPlay,
        handleRecordToggle,
        toggleViewMode: () => {
            setViewMode(prev => (prev + 1) % 5 as 0 | 1 | 2 | 3 | 4);
        },
        toggleIdleBoat: () => setShowIdleBoat(prev => !prev),
        toggleTouchText: () => setShowTouchText(prev => !prev)
    }));

    return (
        <div
            ref={containerRef}
            className="w-full h-full relative"
            style={{ background: '#FFFFFF', touchAction: 'pan-y' }}
        > {/* White Background, Allow vertical scroll */}

            {/* Mobile Layout: Bottom Corner Buttons */}
            {isMobileButtonLayout && (
                <>
                    {/* Top-Right: Extra Controls (e.g., Mode Switcher) - Positioned below status bar */}
                    {showControls && extraControls && (
                        <div className="controls-container absolute top-12 right-4 z-50 flex flex-col gap-2 items-center">
                            {extraControls}
                        </div>
                    )}

                </>
            )}

            {/* Home Screen Only: Top-Right - 피치/번호, 자동재생, 캐슬링(세로: 녹화) */}
            {/* AutoPlay Only: Hide ALL Buttons */}
            {!isDevPage && !isAutoPlay && (
                <div className={`absolute ${isMobileButtonLayout ? 'top-2' : 'top-4'} right-4 z-50 flex flex-row items-start gap-2`}>
                    {/* 1. View Mode Toggle (피치/순서 표시/숨김) */}
                    <button
                        onClick={() => {
                            setViewMode(prev => prev === 3 ? 2 : 3);
                            // resetIdleTimer(0);
                        }}
                        className={`${btnMobile} text-slate-700`}
                        title={viewMode === 3 ? "Show Labels" : "Hide Labels"}
                    >
                        {viewMode === 3 ? <EyeOff size={16} className="opacity-50" /> : <Eye size={16} />}
                    </button>

                    {/* 2. 자동재생 버튼 */}
                    <button
                        onClick={handleDemoPlay}
                        disabled={isPlaying}
                        className={`${btnMobile} ${isPlaying ? 'text-slate-400 cursor-not-allowed' : 'text-red-600'
                            }`}
                        title="Play Scale Demo"
                    >
                        <Play
                            size={24}
                            fill="currentColor"
                            className="pl-1"
                        />
                    </button>

                    {/* 3. 캐슬링 버튼과 녹화 버튼 (세로 배열) */}
                    <div className="flex flex-col gap-2">
                        {/* 캐슬링 버튼 */}
                        <button
                            onClick={toggleDrum}
                            className={`${btnMobile} relative ${isJamPlaying ? 'animate-heartbeat' : ''}`}
                            style={{ color: '#0066FF' }}
                            title={isJamPlaying ? "Castling 중지" : "Castling 시작"}
                        >
                            <span className="text-3xl font-black leading-none relative z-10">C</span>
                        </button>
                        {/* 녹화 버튼 */}
                        <button
                            onClick={handleRecordToggle}
                            className={`${btnMobile} text-red-600 ${isRecording ? 'animate-pulse ring-2 ring-red-100 border-red-400' : ''}`}
                            title={isRecording ? "Stop Recording" : "Start Recording"}
                        >
                            {isRecording ? (
                                <Square size={16} fill="currentColor" />
                            ) : (
                                <Disc size={16} fill="currentColor" />
                            )}
                        </button>
                    </div>
                </div>
            )}

            <Canvas
                orthographic
                dpr={isDevPage ? [1, 2.5] : [1, 2.0]}
                gl={{ preserveDrawingBuffer: true }}
                camera={{
                    zoom: cameraZoom || 12, // Adjusted default or override
                    position: [0, 0, 100],
                    near: 0.1,
                    far: 2000
                }}
            >
                {/* Fixed White Background for Recording */}
                <color attach="background" args={['#ffffff']} />

                {/* Lighting - Adjusted for Blueprint look */}
                <ambientLight intensity={1.0} /> {/* Bright ambient for flat look */}
                <pointLight position={[0, 0, 100]} intensity={0.2} color="#ffffff" />
                <directionalLight position={[-50, 100, 100]} intensity={0.5} />

                <CameraHandler
                    isLocked={isCameraLockedState}
                    enableZoom={enableZoom}
                    enablePan={enablePan}
                    sceneSize={sceneSize}
                    cameraTargetY={cameraTargetY}
                    cameraZoom={cameraZoom} // Pass the prop down
                />

                <group>
                    {/* CyberBoat (Tech Sailboat) - always mounted, handles its own vis/anim */}
                    {/* Pass combined idle state: Only true if system is idle AND user wants to show it */}
                    <CyberBoat isIdle={isIdle && showIdleBoat} />
                    <TouchText
                        isIdle={isIdle && !isJamPlaying && showTouchText && !isAutoPlay} // Hide in AutoPlay
                        suppressExplosion={false}
                        overrideText={introCountdown}
                        interactionTrigger={interactionCount}
                    />
                    <Suspense fallback={null}>
                        {backgroundContent ? backgroundContent : <HandpanImage backgroundImage={backgroundImage} centerX={centerX} centerY={centerY} />}
                    </Suspense>

                    {/* Center Point and Axes (only in dev page and when showAxes is true) */}
                    {isDevPage && showAxes && (
                        <>
                            {/* Center Point */}
                            <mesh position={[0, 0, 0]}>
                                <sphereGeometry args={[0.5, 16, 16]} />
                                <meshBasicMaterial color="#ff0000" />
                            </mesh>

                            {/* Center Coordinates Label */}
                            <Text
                                position={[0, -1.5, 0]}
                                fontSize={1}
                                color="#000000"
                                anchorX="center"
                                anchorY="middle"
                            >
                                (0, 0, 0)
                            </Text>

                            {/* X-axis (Blue - Right) */}
                            <mesh position={[10, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
                                <cylinderGeometry args={[0.1, 0.1, 20, 8]} />
                                <meshBasicMaterial color="#0000ff" />
                            </mesh>
                            <mesh position={[20, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
                                <coneGeometry args={[0.3, 1, 8]} />
                                <meshBasicMaterial color="#0000ff" />
                            </mesh>
                            <Text
                                position={[21, 0, 0]}
                                fontSize={0.8}
                                color="#0000ff"
                                anchorX="left"
                                anchorY="middle"
                            >
                                X
                            </Text>

                            {/* Y-axis (Red - Up) */}
                            <mesh position={[0, 10, 0]}>
                                <cylinderGeometry args={[0.1, 0.1, 20, 8]} />
                                <meshBasicMaterial color="#ff0000" />
                            </mesh>
                            <mesh position={[0, 20, 0]}>
                                <coneGeometry args={[0.3, 1, 8]} />
                                <meshBasicMaterial color="#ff0000" />
                            </mesh>
                            <Text
                                position={[0, 21, 0]}
                                fontSize={0.8}
                                color="#ff0000"
                                anchorX="center"
                                anchorY="bottom"
                            >
                                Y
                            </Text>

                            {/* Z-axis (Green - Depth) */}
                            <mesh position={[0, 0, 10]} rotation={[Math.PI / 2, 0, 0]}>
                                <cylinderGeometry args={[0.1, 0.1, 20, 8]} />
                                <meshBasicMaterial color="#00ff00" />
                            </mesh>
                            <mesh position={[0, 0, 20]} rotation={[Math.PI / 2, 0, 0]}>
                                <coneGeometry args={[0.3, 1, 8]} />
                                <meshBasicMaterial color="#00ff00" />
                            </mesh>
                            <Text
                                position={[0, 0, 21]}
                                fontSize={0.8}
                                color="#00ff00"
                                anchorX="center"
                                anchorY="middle"
                            >
                                Z
                            </Text>
                        </>
                    )}

                    {/* Tone Fields */}
                    {notes.map((note) => (
                        <ToneFieldMesh
                            key={note.id}
                            note={note}
                            centerX={centerX}
                            centerY={centerY}
                            onClick={handleToneFieldClick}
                            viewMode={viewMode}
                            demoActive={activeHighlightId === note.id}
                            playNote={playNote}
                            offset={note.offset || tonefieldOffset} // Prefer note offset, fallback to global
                        />
                    ))}
                </group>
            </Canvas>



            {/* Scale Info Panel - Bottom Right Overlay (only shown in /digipan-3d-test dev page) */}
            {/* {isDevPage && scale && !forceCompactView && showInfoPanel && (
                <ScaleInfoPanel
                    scale={scale}
                    onScaleSelect={onScaleSelect}
                    noteCountFilter={noteCountFilter} // Still passed, but overridden by showAllScales
                    className="" // Managed by DraggablePanel
                    isMobileButtonLayout={isMobileButtonLayout}
                    defaultExpanded={true}
                    showAllScales={true} // Forcing Global List Logic
                />
            )} */}

            {/* Recording Finished Overlay - Only show if NOT mobile (Mobile auto-saves) */}
            {currentBlob && !isMobileButtonLayout && (
                <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl p-6 shadow-2xl flex flex-col items-center gap-4 max-w-[90%] w-[320px]">
                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 mb-2">
                            <Check size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">Recording Finished</h3>
                        <p className="text-gray-500 text-center text-sm mb-4">
                            Your performance is ready. <br />Save it to your device or share it.
                        </p>

                        <div className="flex flex-row gap-3 w-full">
                            <button
                                onClick={handleDiscardAction}
                                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-red-100 text-red-600 font-semibold hover:bg-red-200 transition-colors whitespace-nowrap"
                            >
                                <Trash2 size={18} />
                                Remove
                            </button>
                            <button
                                onClick={handleSaveAction}
                                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 whitespace-nowrap"
                            >
                                <Download size={18} />
                                Save in Album
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
});

export default Digipan3D;

