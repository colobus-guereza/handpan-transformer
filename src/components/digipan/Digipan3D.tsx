'use client';

import React, { useState, useRef, useMemo, Suspense, useEffect, useCallback } from 'react';
import * as Tone from 'tone';

// Shared mobile button style for consistent size and appearance
const btnMobile = "w-[38.4px] h-[38.4px] flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-full border border-slate-200 hover:bg-white transition-all duration-200";
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { Text, OrbitControls, Center, Line, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { Scale } from '@/data/handpanScales';
import { Lock, Unlock, Camera, Check, Eye, EyeOff, MinusCircle, PlayCircle, Play, Ship, Pointer, Disc, Square, Drum, Music, Music2, Download, Trash2 } from 'lucide-react';
import { HANDPAN_CONFIG, getDomeHeight, TONEFIELD_CONFIG } from '@/constants/handpanConfig';
import { DIGIPAN_VIEW_CONFIG, DIGIPAN_LABEL_POS_FACTOR } from '@/constants/digipanViewConfig';
import html2canvas from 'html2canvas';
import { useHandpanAudio } from '@/hooks/useHandpanAudio';
import { usePathname } from 'next/navigation';
import TouchText from './TouchText';
import { useOctaveResonance, ResonanceSettings } from '@/hooks/useOctaveResonance';
import { DEFAULT_HARMONIC_SETTINGS, DigipanHarmonicConfig } from '@/constants/harmonicDefaults';
import { useDigipanRecorder } from '@/hooks/useDigipanRecorder';
import { useJamSession } from '@/hooks/useJamSession';
import { calculateChordProgression, ChordSet } from '@/utils/ChordCalculator';

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

import { SCALES, NoteData } from '@/data/handpanScales';

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
    hideTouchText?: boolean; // New Prop to hide Ready/Set/Touch text
    onRecordingComplete?: (blob: Blob) => void; // New: Callback when recording finishes
    disableRecordingUI?: boolean; // New: Disable internal recording finished overlay
    recordingCropMode?: 'full' | 'square'; // NEW: 녹화 시 크롭 모드
    externalTouchText?: string | null; // NEW: 외부에서 주입하는 터치 텍스트 (카운트다운용)
    showTouchText?: boolean; // New: Toggle for idle Ready/Set/Touch cycle
    disableJamSession?: boolean; // NEW: Disable internal useJamSession audio engine
}

export interface Digipan3DHandle {
    handleCapture: () => Promise<void>;
    handleDemoPlay: () => Promise<void>;
    handleRecordToggle: () => Promise<void>;
    toggleViewMode: () => void;
    toggleIdleBoat: () => void;
    toggleTouchText: () => void;
    triggerNote: (noteId: number) => void;
}

// Constants & Types
// -----------------------------------------------------------------------------

const TONEFIELD_RATIO_X = 0.3;
const TONEFIELD_RATIO_Y = 0.425;



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

const ToneFieldMesh = React.memo(({
    note,
    centerX = 500,
    centerY = 500,
    onClick,
    viewMode = 0, // 0: All, 1: No Labels, 2: No Mesh inside, 3: Interaction Only
    demoActive = false,
    playNote,
    offset
}: {
    note: NoteData;
    centerX?: number;
    centerY?: number;
    onClick?: (id: number) => void;
    viewMode?: 0 | 1 | 2 | 3 | 4;
    demoActive?: boolean;
    playNote?: (noteName: string, volume?: number) => void;
    offset?: [number, number, number];
}) => {
    const [hovered, setHovered] = useState(false);
    const [pulsing, setPulsing] = useState(false);

    // Calculate position
    const cx = note.cx ?? 500;
    const cy = note.cy ?? 500;
    const pos = svgTo3D(cx, cy, centerX, centerY);

    // Apply Offset
    const [offX, offY, offZ] = offset || [0, 0, 0];
    const finalPosX = pos.x + offX;
    const finalPosY = pos.y + offY;
    const finalPosZ = 0 + offZ; // zPos logic moved here

    // Calculate size (Converted to cm)

    // Rotation
    const rotationZ = -THREE.MathUtils.degToRad(note.rotate || 0);

    // Ding logic
    const isDing = note.id === 0;
    const isBottom = note.position === 'bottom';

    // Dimensions Calculation
    // We use Frequency-based calculation to maintain consistency with the original tuning logic.
    // If visualFrequency is provided (e.g. for Digipan 9 fixed layout), use it. Otherwise use the audio frequency.
    const visualHz = note.visualFrequency ?? (note.frequency || 440);
    const dimensions = getTonefieldDimensions(visualHz, isDing);

    const rx = dimensions.width;
    const ry = dimensions.height;

    const radiusX = rx / 2;
    const radiusY = ry / 2;

    // Calculate Dimple Radius
    // Condition: Ding OR Frequency <= F#3 (185Hz) -> Large Dimple (0.45)
    // Else -> Small Dimple (0.40)
    // Note: When using fixed layout (note.scale), we don't strictly have frequency driving the size, 
    // but we can still use the note's frequency property to determine dimple ratio.
    const dimpleRatio = (isDing || (visualHz) <= TONEFIELD_CONFIG.RATIOS.F_SHARP_3_HZ)
        ? TONEFIELD_CONFIG.RATIOS.DIMPLE_LARGE
        : TONEFIELD_CONFIG.RATIOS.DIMPLE_SMALL;

    const dimpleRadiusX = radiusX * dimpleRatio;
    const dimpleRadiusY = ry * dimpleRatio;

    // Apply Overrides (Multipliers)
    // If scaleX/Y are provided, they multiply the calculated radius (or base unit).
    const scaleXMult = note.scaleX ?? 1;
    const scaleYMult = note.scaleY ?? 1;

    const finalRadiusX = radiusX * scaleXMult;
    const finalRadiusY = radiusY * scaleYMult;

    // Z-position: Place on the 0,0 coordinate plane (Top of dome)
    const zPos = finalPosZ; // Use offset Z

    // Trigger Demo Effect
    React.useEffect(() => {
        if (demoActive) {
            // Play Sound via preloaded Howler (instant playback)
            if (playNote) {
                playNote(note.label);
            }

            // Trigger Visual Pulse
            triggerPulse();
        }
    }, [demoActive, note.label, playNote]);

    // ========================================
    // CLICK EFFECT CONFIGURATION
    // ========================================
    const CLICK_EFFECT_CONFIG = {
        // Main Sphere Effect (Breathing Glow)
        sphere: {
            color: '#00FF00',        // Green - TEST
            baseSize: 1.05,          // 5% larger than tonefield
            maxOpacity: 0.1,         // 10% opacity at peak
            scalePulse: 0.15,        // 15% scale variation
        },
        // Impact Ring Effect (Initial strike)
        ring: {
            color: '#000000',        // Black - TEST
            maxOpacity: 0.4,         // 40% opacity at start
            duration: 0.3,           // Quick 0.3s flash
            expandScale: 1.5,        // Expands to 150%
        },
        // Timing
        timing: {
            duration: 1.2,           // Total duration (1.2 seconds)
            attackPhase: 0.15,       // Fast attack (15% of duration)
        }
    };

    // Animation State logic
    const effectMeshRef = useRef<THREE.Mesh>(null);
    const effectMaterialRef = useRef<THREE.MeshBasicMaterial>(null);
    const impactRingRef = useRef<THREE.Mesh>(null);
    const impactMaterialRef = useRef<THREE.MeshBasicMaterial>(null);
    const animState = useRef({ active: false, time: 0 });

    // Sound Breathing Configuration
    const SUSTAIN_DURATION = CLICK_EFFECT_CONFIG.timing.duration;

    // Frame Loop for Click Effects Animation
    useFrame((_state: any, delta: number) => {
        if (!animState.current.active || !effectMeshRef.current || !effectMaterialRef.current) {
            return;
        }

        animState.current.time += delta;
        const progress = Math.min(animState.current.time / SUSTAIN_DURATION, 1);

        // === EFFECT 1: Main Sphere (Breathing Glow) ===
        const attackPhase = CLICK_EFFECT_CONFIG.timing.attackPhase;
        let breathCurve: number;

        if (progress < attackPhase) {
            // Very fast fade-in: 0 → 1 in first 15%
            const attackProgress = progress / attackPhase;
            breathCurve = Math.sin(attackProgress * Math.PI / 2);
        } else {
            // Faster fade-out: 1 → 0 in remaining 85%
            const decayProgress = (progress - attackPhase) / (1 - attackPhase);
            breathCurve = Math.cos(decayProgress * Math.PI / 2);
        }

        const opacity = CLICK_EFFECT_CONFIG.sphere.maxOpacity * breathCurve;
        effectMaterialRef.current.opacity = opacity;

        const scaleMultiplier = 1 + CLICK_EFFECT_CONFIG.sphere.scalePulse * breathCurve;
        effectMeshRef.current.scale.set(
            finalRadiusX * CLICK_EFFECT_CONFIG.sphere.baseSize * scaleMultiplier,
            finalRadiusY * CLICK_EFFECT_CONFIG.sphere.baseSize * scaleMultiplier,
            1
        );

        // === EFFECT 2: Impact Ring (Initial Strike Flash) ===
        if (impactRingRef.current && impactMaterialRef.current) {
            const ringDuration = CLICK_EFFECT_CONFIG.ring.duration;
            const ringProgress = Math.min(animState.current.time / ringDuration, 1);

            if (ringProgress < 1) {
                // Quick fade-out with expansion
                const ringCurve = Math.cos(ringProgress * Math.PI / 2); // 1 → 0
                const ringOpacity = CLICK_EFFECT_CONFIG.ring.maxOpacity * ringCurve;
                const ringScale = 1 + (CLICK_EFFECT_CONFIG.ring.expandScale - 1) * ringProgress;

                impactMaterialRef.current.opacity = ringOpacity;

                impactRingRef.current.scale.set(
                    finalRadiusX * ringScale,
                    finalRadiusY * ringScale,
                    1
                );
            } else {
                // Hide ring after duration
                impactMaterialRef.current.opacity = 0;
            }
        }

        if (progress >= 1) {
            animState.current.active = false;
            setPulsing(false);
        }
    });

    // Initialize opacity - DISABLED for testing (JSX now sets opacity={1.0})
    // useEffect(() => {
    //     if (effectMaterialRef.current) {
    //         effectMaterialRef.current.opacity = 0;
    //     }
    // }, []);

    const triggerPulse = () => {
        // Start animation
        animState.current = { active: true, time: 0 };
        setPulsing(true);

        // Initialize at 0 (animation will fade in)
        if (effectMaterialRef.current) {
            effectMaterialRef.current.opacity = 0;
        }
    };

    const handlePointerDown = (e: any) => {
        e.stopPropagation();
        onClick?.(note.id);

        // Play Sound via preloaded Howler (instant playback, no network delay)
        if (playNote) {
            playNote(note.label);
        }

        // Trigger Sound Breathing effect
        triggerPulse();
    };

    return (
        <group position={[finalPosX, finalPosY, zPos]}>
            <group rotation={[0, 0, rotationZ]}>
                {/* 1. Tone Field Body */}
                {/* 1-a. Interaction Mesh (Invisible Hit Box) - Always handles events */}
                {/* Placed at z=0.2 to be IN FRONT of the visual dot (z=0.1) for reliable interaction */}
                <mesh
                    onPointerDown={handlePointerDown}
                    onPointerOver={() => {
                        document.body.style.cursor = 'pointer';
                        setHovered(true);
                    }}
                    onPointerOut={() => {
                        document.body.style.cursor = 'auto';
                        setHovered(false);
                    }}
                    rotation={[Math.PI / 2, 0, 0]}
                    scale={[finalRadiusX, 0.05, finalRadiusY]} // Flattened
                    position={[0, 0, 0.2]} // Moved forward to ensure it captures clicks
                    visible={true} // Must be visible to receive raycast events
                >
                    <sphereGeometry args={[1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
                    <meshBasicMaterial
                        transparent={true}
                        opacity={0} // Invisible
                        depthWrite={false}
                        side={THREE.DoubleSide}
                    />
                </mesh>

                {/* 1-b. Visual Mesh (Wireframe) - Standard Tonefields */}
                {/* Visible in Modes 0 (1) and 1 (2) for ALL notes (including Bottom) */}
                <mesh
                    rotation={[Math.PI / 2, 0, 0]}
                    scale={[finalRadiusX, 0.05, finalRadiusY]}
                    visible={viewMode === 0 || viewMode === 1}
                >
                    <sphereGeometry args={[1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
                    <meshStandardMaterial
                        color={hovered ? "#60A5FA" : "#FFFFFF"}
                        emissive={hovered ? "#1E40AF" : "#000000"}
                        emissiveIntensity={hovered ? 0.5 : 0}
                        roughness={0.9}
                        metalness={0.0}
                        wireframe={true}
                        toneMapped={false}
                        transparent={true}
                        opacity={1}
                    />
                </mesh>

                {/* 1-c. Bottom Dot Visual (Sienna Guide) */}
                {/* Visible ONLY in Guide Mode (Mode 4 / UI Mode 5) */}
                {isBottom && !note.hideGuide && (
                    <mesh
                        position={[0, 0, 0.1]} // Behind interaction mesh (z=0.1)
                        rotation={[0, 0, 0]}
                        scale={[1.5 * (note.scaleX ?? 1), 1.5 * (note.scaleX ?? 1), 1.5 * (note.scaleX ?? 1)]} // Scaled Spherical Dot
                        visible={viewMode === 4} // Only visible in 5th mode
                    >
                        <sphereGeometry args={[1, 16, 16]} />
                        <meshStandardMaterial
                            color={hovered ? "#60A5FA" : "#A0522D"} // Hover Blue, Default Sienna
                            emissive={hovered ? "#1E40AF" : "#000000"}
                            emissiveIntensity={hovered ? 0.5 : 0}
                            roughness={0.4}
                            metalness={0.0}
                            transparent={true}
                            opacity={0.9}
                        />
                    </mesh>
                )}

                {/* === CLICK EFFECTS === */}

                {/* EFFECT 1: Impact Ring (White Flash) */}
                <mesh
                    ref={impactRingRef}
                    position={[0, 0, 0.6]} // Above the main sphere
                    scale={[finalRadiusX, finalRadiusY, 1]}
                    visible={pulsing}
                    renderOrder={1000} // Above main sphere
                >
                    <sphereGeometry args={[1, 32, 16]} />
                    <meshBasicMaterial
                        ref={impactMaterialRef}
                        color={CLICK_EFFECT_CONFIG.ring.color}
                        transparent={true}
                        opacity={0}
                        toneMapped={false}
                        depthWrite={false}
                        depthTest={false}
                        side={2}
                    />
                </mesh>

                {/* EFFECT 2: Main Sphere (Breathing Glow) */}
                <mesh
                    ref={effectMeshRef}
                    position={[0, 0, 0.5]} // Slightly above tonefield
                    scale={[
                        finalRadiusX * CLICK_EFFECT_CONFIG.sphere.baseSize,
                        finalRadiusY * CLICK_EFFECT_CONFIG.sphere.baseSize,
                        1
                    ]}
                    visible={pulsing}
                    renderOrder={999}
                >
                    <sphereGeometry args={[1, 32, 16]} />
                    <meshBasicMaterial
                        ref={effectMaterialRef}
                        color={CLICK_EFFECT_CONFIG.sphere.color}
                        transparent={true}
                        opacity={0}
                        toneMapped={false}
                        depthWrite={false}
                        depthTest={false}
                        side={2}
                    />
                </mesh>

                {/* 2. Dimple - Wireframe (Standard Only) */}
                {!isBottom && (
                    <mesh
                        position={[0, 0, 0.01]}
                        rotation={[isDing ? Math.PI / 2 : -Math.PI / 2, 0, 0]}
                        scale={[dimpleRadiusX, 0.05, dimpleRadiusY]}
                        // Visible in 0 (All) and 1 (No Labels). Hidden in 2 (Labels Only) and 3 (Interaction Only)
                        visible={viewMode === 0 || viewMode === 1}
                    >
                        <sphereGeometry args={[1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
                        <meshStandardMaterial
                            color="#FFFFFF"
                            roughness={0.9}
                            metalness={0.0}
                            wireframe={true}
                            transparent={true}
                            opacity={1} // Was opacity conditional, now controlled by visible prop
                        />
                    </mesh>
                )}
            </group>

            {/* 3. Labels (Separated from rotation group to stay upright) */}
            <group position={[0, 0, 1]}> {/* Lifted slightly above mesh */}
                {/* Helper to calculate bottom point of rotated ellipse */}
                {(() => {
                    const calculateBottomOffset = (rx: number, ry: number, rotZ: number) => {
                        // We want to find the point on the ellipse with the lowest Y value (Visual Bottom)
                        // Ellipse parametric: x = rx*cos(t), y = ry*sin(t)
                        // Rotated: 
                        // x' = x*cos(rot) - y*sin(rot)
                        // y' = x*sin(rot) + y*cos(rot)
                        // We want deriv(y', t) = 0

                        // Note: rotationZ in this component is already in radians
                        const phi = rotZ;

                        // tan(t) = (ry/rx) * cot(phi)
                        let t1;
                        if (Math.abs(Math.sin(phi)) < 0.001) {
                            // If rotation is near 0 or 180, bottom is at t = -PI/2 (270 deg)
                            t1 = -Math.PI / 2;
                        } else {
                            // deriv y' wrt t: -rx*sin(t)*sin(phi) + ry*cos(t)*cos(phi) = 0
                            // ry*cos(t)*cos(phi) = rx*sin(t)*sin(phi)
                            // tan(t) = (ry/rx) * cot(phi)
                            const val = (ry / rx) / Math.tan(phi);
                            t1 = Math.atan(val);
                        }
                        const t2 = t1 + Math.PI;

                        const getP = (t: number) => ({
                            x: rx * Math.cos(t) * Math.cos(phi) - ry * Math.sin(t) * Math.sin(phi),
                            y: rx * Math.cos(t) * Math.sin(phi) + ry * Math.sin(t) * Math.cos(phi)
                        });

                        const p1 = getP(t1);
                        const p2 = getP(t2);

                        // In 3D (Y-up), bottom is Lowest Y
                        return p1.y < p2.y ? p1 : p2;
                    };

                    // Calculate position for Number Label (Visual Bottom)
                    // We use a reduced radius (e.g. 20%) to bring the text closer to the center (Pitch Label)
                    // instead of placing it at the absolute edge.
                    const LABEL_POS_FACTOR = DIGIPAN_LABEL_POS_FACTOR;
                    const bottomPos = calculateBottomOffset(
                        finalRadiusX * LABEL_POS_FACTOR,
                        finalRadiusY * LABEL_POS_FACTOR,
                        rotationZ
                    );

                    // Show labels only if viewMode is 0 (All Visible) or 2 (Labels Only/No Mesh)
                    // Mode 1 = Mesh Only (No Labels) and Mode 3 = Interaction Only (No Labels, No Mesh)
                    // if (viewMode === 1 || viewMode === 3) return null; // Removed early return to keep components mounted

                    const areLabelsVisible = viewMode === 0 || viewMode === 2;

                    return (
                        <>
                            {/* Pitch Label (Center) - Remains at 0,0 but upright */}
                            {(() => {
                                // Use black color for bottom position notes (white background outside pan)
                                const pitchLabelColor = note.textColor || (note.position === 'bottom' ? '#333333' : '#FFFFFF');
                                const outlineColor = note.outlineColor || (note.position === 'bottom' ? '#CCCCCC' : '#000000');
                                return (
                                    <Text
                                        visible={areLabelsVisible}
                                        position={[0, 0, 0]}
                                        fontSize={3.0}
                                        color={pitchLabelColor}
                                        anchorX="center"
                                        anchorY="middle"
                                        fontWeight="bold"
                                        outlineWidth={0.05}
                                        outlineColor={outlineColor}
                                    >
                                        {note.label}
                                    </Text>
                                );
                            })()}

                            {/* Number Label (Visual Bottom / 6 o'clock) */}
                            {/* Determine Display Label: Use subLabel if present, otherwise ID (or 'D' for ID 0) */}
                            {(() => {
                                const displayText = note.subLabel ? note.subLabel : (note.id + 1).toString();
                                // Use black color for bottom position notes (white background outside pan)
                                const labelColor = note.textColor || (note.position === 'bottom' ? '#333333' : '#FFFFFF');
                                return (
                                    <Text
                                        visible={areLabelsVisible}
                                        position={[bottomPos.x, bottomPos.y - 0.05, 0]}
                                        fontSize={2.0}
                                        color={labelColor}
                                        anchorX="center"
                                        anchorY="top"
                                        fontWeight="bold"
                                        outlineWidth={0.05} // Added outline to subLabel for consistency if needed, strictly requested for Pitch but let's see
                                        outlineColor={note.outlineColor || (note.position === 'bottom' ? '#CCCCCC' : '#000000')}
                                    >
                                        {displayText}
                                    </Text>
                                );
                            })()}
                        </>
                    );
                })()}
            </group>

            {/* Markers - White */}


        </group >
    );
});

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
    hideTouchText = false, // Default to false (Show text)
    onRecordingComplete, // Destructure new prop
    disableRecordingUI = false, // Default to false (Show UI)
    recordingCropMode = 'full', // Default to full (전체 캔버스 녹화)
    externalTouchText = null, // Default null
    showTouchText: showTouchTextProp,
    disableJamSession = false, // Default: enabled (false = NOT disabled)
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
    const canvasRef = useRef<HTMLCanvasElement>(null!);

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
        // 1. Notify Parent
        if (onRecordingComplete) {
            onRecordingComplete(blob);
        }

        // 2. If UI is disabled, stop here (Parent handles the rest)
        if (disableRecordingUI) {
            return;
        }

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
    }, [onRecordingComplete, disableRecordingUI]);

    const { isRecording, startRecording, stopRecording } = useDigipanRecorder({
        canvasRef,
        getAudioContext,
        getMasterGain,
        onRecordingComplete: handleRecordingComplete,
        cropMode: recordingCropMode
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
        scaleNotes: scaleNoteNames,
        enabled: !disableJamSession // ★ Disable audio when controlled externally
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
    // showTouchText is now a prop or calculated from prop
    const showTouchText = showTouchTextProp !== undefined ? showTouchTextProp : false;
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
                if (!targetNote.frequency) return;

                const ratio = targetNote.frequency! / sourceNote.frequency!;
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
        const sortedNotes = [...notes].sort((a, b) => (a.frequency || 0) - (b.frequency || 0));

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
        toggleTouchText: () => { /* Now controlled via showTouchText prop in reelpan */ },
        triggerNote: (noteId: number) => {
            // Visual feedback - This sets demoActive=true for the matching ToneFieldMesh
            // ToneFieldMesh's useEffect will then automatically play the audio
            setDemoNoteId(noteId);
            setTimeout(() => setDemoNoteId(null), 150);

            // NOTE: Do NOT call playNote here!
            // ToneFieldMesh listens to `demoActive` prop (demoNoteId === note.id)
            // and its useEffect (line 307-317) already calls playNote when demoActive becomes true.
            // Calling playNote here would cause DOUBLE audio playback and distortion!
        }
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

            {/* Home Screen Only: Top-Right - 피치/번호, 자동재생, 녹화, 캐슬링 (가로 한줄) - 현재 숨김 처리 (hidden) */}
            {!isDevPage && (
                <div className={`absolute ${isMobileButtonLayout ? 'top-2' : 'top-4'} right-4 z-50 flex flex-row items-center gap-2 hidden`}>
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

                    {/* 3. 녹화 버튼 */}
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

                    {/* 4. 캐슬링 버튼 */}
                    <button
                        onClick={toggleDrum}
                        className={`${btnMobile} relative ${isJamPlaying ? 'animate-heartbeat' : ''}`}
                        style={{ color: '#0066FF' }}
                        title={isJamPlaying ? "Castling 중지" : "Castling 시작"}
                    >
                        <span className="text-3xl font-black leading-none relative z-10">C</span>
                    </button>
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
                    {/* CyberBoat removed */}
                    {/* Touch Text - Hidden on Home Screen if ViewMode is 2 (Labels Visible) to avoid obscuring pitch info */}
                    {!hideTouchText && (
                        <TouchText
                            isIdle={isIdle && !isJamPlaying && showTouchText}
                            suppressExplosion={false}
                            overrideText={externalTouchText || introCountdown}
                            interactionTrigger={interactionCount}
                        />
                    )}
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
                            demoActive={demoNoteId === note.id}
                            playNote={playNote}
                            offset={Array.isArray(note.offset) ? note.offset : typeof note.offset === 'number' ? [0, 0, note.offset] : tonefieldOffset}
                        />
                    ))}
                </group>
            </Canvas>



            {/* Scale Info Panel - Bottom Right Overlay (only shown in /digipan-3d-test dev page) */}
            {/* ScaleInfoPanel removed */}

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

