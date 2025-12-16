import React, { useState, useRef, useEffect } from 'react';
import { Text } from '@react-three/drei';

// ... (previous code)

// (Moved Text logic inside component)
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { NoteData } from '@/data/handpanScales';
import { getTonefieldDimensions, svgTo3D } from './Digipan3D';
import { HANDPAN_CONFIG, TONEFIELD_CONFIG } from '../../constants/handpanConfig';

// Re-export needed constants/functions if they were local to Digipan3D but are now needed here
// I'll import them from Digipan3D assuming they are exported there.
// If Digipan3D helper functions are not exported, I must export them first.

const ToneFieldMesh = React.memo(({
    note,
    centerX = 500,
    centerY = 500,
    onClick,
    viewMode = 0, // 0: All, 1: No Labels, 2: No Mesh inside, 3: Interaction Only
    demoActive = false,
    playNote,
    offset,
    hovered: externalHovered,
    onHoverChange
}: {
    note: NoteData;
    centerX?: number;
    centerY?: number;
    onClick?: (id: number) => void;
    viewMode?: 0 | 1 | 2 | 3 | 4;
    demoActive?: boolean;
    playNote?: (noteName: string, volume?: number) => void;
    offset?: [number, number, number];
    hovered?: boolean;
    onHoverChange?: (hovered: boolean) => void;
}) => {
    const [internalHovered, setInternalHovered] = useState(false);
    const hovered = externalHovered ?? internalHovered;
    const [pulsing, setPulsing] = useState(false);

    // Calculate position
    const cx = note.cx ?? 500;
    const cy = note.cy ?? 500;
    const pos = svgTo3D(cx, cy, centerX, centerY);

    // Apply Offset
    const [offX, offY, offZ] = offset || [0, 0, 0];
    const finalPosX = pos.x + offX;
    const finalPosY = pos.y + offY;
    const finalPosZ = 0 + offZ;

    // Rotation
    const rotationZ = -THREE.MathUtils.degToRad(note.rotate || 0);

    // Ding logic
    const isDing = note.id === 0;
    const isBottom = note.position === 'bottom';

    // Dimensions Calculation
    const visualHz = note.visualFrequency ?? (note.frequency || 440);
    const dimensions = getTonefieldDimensions(visualHz, isDing);

    const rx = dimensions.width;
    const ry = dimensions.height;

    const radiusX = rx / 2;
    const radiusY = ry / 2;

    const dimpleRatio = (isDing || (visualHz) <= TONEFIELD_CONFIG.RATIOS.F_SHARP_3_HZ)
        ? TONEFIELD_CONFIG.RATIOS.DIMPLE_LARGE
        : TONEFIELD_CONFIG.RATIOS.DIMPLE_SMALL;

    const dimpleRadiusX = radiusX * dimpleRatio;
    const dimpleRadiusY = ry * dimpleRatio;

    // Apply Overrides (Multipliers)
    const scaleXMult = note.scaleX ?? 1;
    const scaleYMult = note.scaleY ?? 1;

    const finalRadiusX = radiusX * scaleXMult;
    const finalRadiusY = radiusY * scaleYMult;

    // Z-position: Place on the 0,0 coordinate plane (Top of dome)
    const zPos = finalPosZ;

    // Trigger Demo Effect
    useEffect(() => {
        if (demoActive) {
            // Play Sound logic handled by parent if needed? 
            // In original code: playNote(note.label) was called here.
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
        sphere: {
            color: '#00FF00',        // Green
            baseSize: 1.05,
            maxOpacity: 0.1,
            scalePulse: 0.15,
        },
        ring: {
            color: '#000000',        // Black
            maxOpacity: 0.4,
            duration: 0.3,
            expandScale: 1.5,
        },
        timing: {
            duration: 1.2,
            attackPhase: 0.15,
        }
    };

    // Animation State logic
    const effectMeshRef = useRef<THREE.Mesh>(null);
    const effectMaterialRef = useRef<THREE.MeshBasicMaterial>(null);
    const impactRingRef = useRef<THREE.Mesh>(null);
    const impactMaterialRef = useRef<THREE.MeshBasicMaterial>(null);
    const animState = useRef({ active: false, time: 0 });

    const SUSTAIN_DURATION = CLICK_EFFECT_CONFIG.timing.duration;

    useFrame((_state: any, delta: number) => {
        if (!animState.current.active) return;
        if (!effectMeshRef.current || !effectMaterialRef.current) return;

        animState.current.time += delta;
        const progress = Math.min(animState.current.time / SUSTAIN_DURATION, 1);

        // === EFFECT 1: Main Sphere (Breathing Glow) ===
        const attackPhase = CLICK_EFFECT_CONFIG.timing.attackPhase;
        let breathCurve: number;

        if (progress < attackPhase) {
            const attackProgress = progress / attackPhase;
            breathCurve = Math.sin(attackProgress * Math.PI / 2);
        } else {
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
                const ringCurve = Math.cos(ringProgress * Math.PI / 2);
                const ringOpacity = CLICK_EFFECT_CONFIG.ring.maxOpacity * ringCurve;
                const ringScale = 1 + (CLICK_EFFECT_CONFIG.ring.expandScale - 1) * ringProgress;

                impactMaterialRef.current.opacity = ringOpacity;
                impactRingRef.current.scale.set(
                    finalRadiusX * ringScale,
                    finalRadiusY * ringScale,
                    1
                );
            } else {
                impactMaterialRef.current.opacity = 0;
            }
        }

        if (progress >= 1) {
            animState.current.active = false;
            setPulsing(false);
        }
    });

    const triggerPulse = () => {
        animState.current = { active: true, time: 0 };
        setPulsing(true);

        if (effectMaterialRef.current) {
            effectMaterialRef.current.opacity = 0;
        }
    };

    const handlePointerDown = (e: any) => {
        e.stopPropagation();
        onClick?.(note.id);
        if (playNote) playNote(note.label);
        triggerPulse();
    };

    return (
        <group position={[finalPosX, finalPosY, zPos]}>
            <group rotation={[0, 0, rotationZ]}>
                {/* 1-a. Interaction Mesh (Invisible Hit Box) */}
                <mesh
                    onPointerDown={handlePointerDown}
                    onPointerOver={() => {
                        document.body.style.cursor = 'pointer';
                        if (onHoverChange) onHoverChange(true);
                        else setInternalHovered(true);
                    }}
                    onPointerOut={() => {
                        document.body.style.cursor = 'auto';
                        if (onHoverChange) onHoverChange(false);
                        else setInternalHovered(false);
                    }}
                    rotation={[Math.PI / 2, 0, 0]}
                    scale={[finalRadiusX, 0.05, finalRadiusY]}
                    position={[0, 0, 0.2]}
                    visible={true}
                >
                    <sphereGeometry args={[1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
                    <meshBasicMaterial transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
                </mesh>

                {/* 1-b. Visual Mesh (Wireframe) */}
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

                {/* 1-c. Bottom Dot Visual */}
                {isBottom && !note.hideGuide && (
                    <mesh
                        position={[0, 0, 0.1]}
                        scale={[1.5 * (note.scaleX ?? 1), 1.5 * (note.scaleX ?? 1), 1.5 * (note.scaleX ?? 1)]}
                        visible={viewMode === 4}
                    >
                        <sphereGeometry args={[1, 16, 16]} />
                        <meshStandardMaterial
                            color={hovered ? "#60A5FA" : "#A0522D"}
                            emissive={hovered ? "#1E40AF" : "#000000"}
                            emissiveIntensity={hovered ? 0.5 : 0}
                            roughness={0.4}
                            transparent={true}
                            opacity={0.9}
                        />
                    </mesh>
                )}

                {/* === CLICK EFFECTS === */}
                {/* EFFECT 1: Impact Ring */}
                <mesh
                    ref={impactRingRef}
                    position={[0, 0, 0.6]}
                    scale={[finalRadiusX, finalRadiusY, 1]}
                    visible={pulsing}
                    renderOrder={1000}
                >
                    <sphereGeometry args={[1, 32, 16]} />
                    <meshBasicMaterial
                        ref={impactMaterialRef}
                        color={CLICK_EFFECT_CONFIG.ring.color}
                        transparent opacity={0} toneMapped={false} depthWrite={false} depthTest={false} side={2}
                    />
                </mesh>

                {/* EFFECT 2: Main Sphere */}
                <mesh
                    ref={effectMeshRef}
                    position={[0, 0, 0.5]}
                    scale={[finalRadiusX * CLICK_EFFECT_CONFIG.sphere.baseSize, finalRadiusY * CLICK_EFFECT_CONFIG.sphere.baseSize, 1]}
                    visible={pulsing}
                    renderOrder={999}
                >
                    <sphereGeometry args={[1, 32, 16]} />
                    <meshBasicMaterial
                        ref={effectMaterialRef}
                        color={CLICK_EFFECT_CONFIG.sphere.color}
                        transparent opacity={0} toneMapped={false} depthWrite={false} depthTest={false} side={2}
                    />
                </mesh>

                {/* 2. Dimple - Wireframe */}
                {!isBottom && (
                    <mesh
                        position={[0, 0, 0.01]}
                        rotation={[isDing ? Math.PI / 2 : -Math.PI / 2, 0, 0]}
                        scale={[dimpleRadiusX, 0.05, dimpleRadiusY]}
                        visible={viewMode === 0 || viewMode === 1}
                    >
                        <sphereGeometry args={[1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
                        <meshStandardMaterial
                            color={hovered ? "#93C5FD" : "#E5E7EB"}
                            emissive={hovered ? "#1E40AF" : "#000000"}
                            emissiveIntensity={hovered ? 0.3 : 0}
                            roughness={0.6}
                            metalness={0.1}
                            wireframe={true}
                            toneMapped={false}
                            transparent={true}
                            opacity={0.6}
                        />
                    </mesh>
                )}

                {/* 3. Text Label */}
                {/* 3. Text Label */}
                {(viewMode === 0 || viewMode === 2) && (
                    <group position={[0, 0, 0.5]} rotation={[THREE.MathUtils.degToRad(90), 0, 0]}>
                        {/* Pitch Label */}
                        <Text
                            position={[0, 0.2, 0]} // Slightly up
                            fontSize={0.8}
                            color={note.textColor || (hovered ? "#FFFFFF" : "#000000")}
                            anchorX="center"
                            anchorY="middle"
                            outlineWidth={0.02}
                            outlineColor={note.outlineColor || "#FFFFFF"}
                        >
                            {note.label}
                        </Text>

                        {/* Number Label */}
                        <Text
                            position={[0, -0.6, 0]} // Slightly down
                            fontSize={0.5}
                            color={note.textColor || (hovered ? "#E5E7EB" : "#4B5563")}
                            anchorX="center"
                            anchorY="middle"
                        >
                            {note.subLabel || (note.id === 0 ? "Ding" : note.id.toString())}
                        </Text>
                    </group>
                )}
            </group>
        </group>
    );
});

export default ToneFieldMesh;
