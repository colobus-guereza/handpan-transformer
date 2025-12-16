import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface DigiBallProps {
    isIdle: boolean;
}

const PARTICLE_COUNT = 90;

// [Effect] Explosion Particles (Keep existing logic)
const ExplosionParticles = ({ active, position }: { active: boolean; position: THREE.Vector3 }) => {
    const groupRef = useRef<THREE.Group>(null);
    const particles = useMemo(() => {
        return new Array(PARTICLE_COUNT).fill(0).map(() => ({
            pos: new THREE.Vector3(0, 0, 0),
            vel: new THREE.Vector3(
                (Math.random() - 0.5) * 1.5,
                (Math.random() - 0.5) * 1.5,
                (Math.random() - 0.5) * 1.5
            ),
            color: Math.random() > 0.5 ? '#FFD700' : '#FFFFFF',
            scale: Math.random() * 0.8 + 0.2,
            life: 1.0
        }));
    }, []);

    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (active) {
            setIsVisible(true);
            particles.forEach(p => {
                p.pos.copy(position);
                p.vel.set(
                    (Math.random() - 0.5) * 2,
                    (Math.random() - 0.5) * 2,
                    (Math.random() - 0.5) * 2
                );
                p.life = 1.0;
            });
            const timer = setTimeout(() => setIsVisible(false), 1000);
            return () => clearTimeout(timer);
        }
    }, [active, position, particles]);

    useFrame((state, delta) => {
        if (!isVisible || !groupRef.current) return;
        groupRef.current.children.forEach((child, i) => {
            const p = particles[i];
            if (p.life > 0) {
                p.pos.add(p.vel.clone().multiplyScalar(delta * 10));
                p.life -= delta * 1.5;
                child.position.copy(p.pos);
                child.scale.setScalar(p.scale * p.life);
                (child as THREE.Mesh).visible = true;
            } else {
                (child as THREE.Mesh).visible = false;
            }
        });
    });

    if (!isVisible) return null;

    return (
        <group ref={groupRef}>
            {particles.map((p, i) => (
                <mesh key={i}>
                    <icosahedronGeometry args={[0.5, 0]} />
                    <meshBasicMaterial color={p.color} transparent opacity={0.8} />
                </mesh>
            ))}
        </group>
    );
};

// =============================================================================
// DIGIBALL COMPONENT
// =============================================================================

type BallState = 'SPAWNING' | 'DECIDING' | 'MOVING' | 'HOVERING' | 'TELEPORT_OUT' | 'TELEPORT_IN' | 'PATTERN_INFINITY' | 'PATTERN_HELIX';

const DigiBall = ({ isIdle }: DigiBallProps) => {
    const groupRef = useRef<THREE.Group>(null);
    const sphereMatRef = useRef<THREE.MeshPhysicalMaterial>(null);

    // Global State
    const [exploding, setExploding] = useState(false);
    const [lastPos, setLastPos] = useState(new THREE.Vector3(0, 0, 30));
    const wasIdle = useRef(isIdle);

    // Movement State Machine
    const state = useRef<BallState>('SPAWNING');
    const stateTimer = useRef(0);

    // Movement Logic Refs
    const currentPos = useRef(new THREE.Vector3(0, 0, 30));
    const targetPos = useRef(new THREE.Vector3(0, 0, 30));
    const startPos = useRef(new THREE.Vector3(0, 0, 30));
    const controlPoint = useRef(new THREE.Vector3(0, 0, 30)); // For Bezier

    // Animation Refs
    const moveDuration = useRef(2.0);
    const moveProgress = useRef(0);
    const hoverBaseY = useRef(0); // Base Z height for hovering
    const teleportSpeed = useRef(0.1); // Speed of teleport fade in/out
    const patternCenter = useRef(new THREE.Vector3(0, 0, 0)); // Center for special patterns

    // Constants
    const BOUNDARY_RADIUS = 20; // Reduced range to prevent clipping
    const FLY_HEIGHT_MIN = 25;
    const FLY_HEIGHT_MAX = 45;

    // Helper: Random Position in Cylinder
    const getRandomPosition = () => {
        const r = BOUNDARY_RADIUS * Math.sqrt(Math.random());
        const theta = Math.random() * 2 * Math.PI;
        const x = r * Math.cos(theta);
        const y = r * Math.sin(theta);
        const z = FLY_HEIGHT_MIN + Math.random() * (FLY_HEIGHT_MAX - FLY_HEIGHT_MIN);
        return new THREE.Vector3(x, y, z);
    };

    // Helper: Select Next State
    const pickNextState = (): BallState => {
        const rand = Math.random();
        // 5% Teleport
        if (rand < 0.05) return 'TELEPORT_OUT';

        // 10% Special Patterns (5% Infinity, 5% Helix)
        if (rand < 0.10) return 'PATTERN_INFINITY';
        if (rand < 0.15) return 'PATTERN_HELIX';

        // 45% Hover (Remaining) -> Total 60% with prev
        if (rand < 0.60) return 'HOVERING';

        // 40% Move (Remaining)
        return 'MOVING';
    };

    // Handle System Idle Changes (Appearance/Explosion)
    useEffect(() => {
        if (wasIdle.current && !isIdle) {
            // User Became Active -> Explode & Hide
            if (groupRef.current) {
                setLastPos(groupRef.current.position.clone());
            }
            setExploding(true);
            setTimeout(() => setExploding(false), 1000);

            // Reset Internal State
            state.current = 'SPAWNING';
        } else if (!wasIdle.current && isIdle) {
            // User Became Idle -> Appear
            state.current = 'SPAWNING';
            // Start near centerish or random
            currentPos.current = new THREE.Vector3(0, 0, 30);
            if (groupRef.current) groupRef.current.position.copy(currentPos.current);
        }
        wasIdle.current = isIdle;
    }, [isIdle]);

    useFrame((threeState, delta) => {
        if (!groupRef.current) return;

        // 1. System Visibility Logic (Global Scale)
        const targetGlobalScale = isIdle ? 1 : 0;
        const currentGlobalScale = groupRef.current.scale.x;
        const lerpRate = isIdle ? 0.05 : 0.3;
        let nextGlobalScale = THREE.MathUtils.lerp(currentGlobalScale, targetGlobalScale, lerpRate);

        if (isIdle) {
            // Ensure visible when active
            if (nextGlobalScale > 0.01) {
                groupRef.current.visible = true;
            }

            // =========================================================
            // STATE MACHINE LOOP
            // =========================================================

            switch (state.current) {
                case 'SPAWNING':
                    // Just a transitional state to ensure we start full scale
                    nextGlobalScale = THREE.MathUtils.lerp(currentGlobalScale, 1.0, 0.05);
                    if (Math.abs(nextGlobalScale - 1) < 0.01) {
                        state.current = 'DECIDING';
                    }
                    break;

                case 'DECIDING':
                    const next = pickNextState();
                    state.current = next;
                    stateTimer.current = 0;

                    if (next === 'MOVING') {
                        // Setup Bezier Move
                        startPos.current.copy(currentPos.current);
                        targetPos.current = getRandomPosition();

                        // Calculate Control Point (Midpoint + Random Offset)
                        const mid = new THREE.Vector3().addVectors(startPos.current, targetPos.current).multiplyScalar(0.5);
                        const offset = new THREE.Vector3(
                            (Math.random() - 0.5) * 40,
                            (Math.random() - 0.5) * 40,
                            (Math.random() - 0.5) * 15
                        );
                        controlPoint.current.addVectors(mid, offset);

                        // Variable Speed: 1.5s (Fast) to 4.5s (Slow)
                        moveDuration.current = 1.5 + Math.random() * 3.0;
                        moveProgress.current = 0;
                    }
                    else if (next === 'HOVERING') {
                        // Setup Hover
                        hoverBaseY.current = currentPos.current.z;
                        moveDuration.current = 3.0 + Math.random() * 3.0; // Hover for 3~6s
                    } else if (next === 'TELEPORT_OUT') {
                        // Random Teleport Speed: 0.05 (Slow fade) to 0.4 (Fast pop)
                        teleportSpeed.current = 0.05 + Math.random() * 0.35;
                    } else if (next === 'PATTERN_INFINITY') {
                        // Setup Infinity (Figure 8)
                        patternCenter.current.copy(currentPos.current);
                        moveDuration.current = 6.0; // 6 seconds for full loop
                        moveProgress.current = 0;
                    } else if (next === 'PATTERN_HELIX') {
                        // Setup Helix (Spiral Scan)
                        moveDuration.current = 8.0; // 8 seconds scan
                        moveProgress.current = 0;
                        // Start high up in center
                        startPos.current.set(0, 0, 50);
                    }
                    break;

                case 'MOVING':
                    moveProgress.current += delta / moveDuration.current;
                    if (moveProgress.current >= 1) {
                        state.current = 'DECIDING';
                        currentPos.current.copy(targetPos.current);
                    } else {
                        // Quadratic Bezier: (1-t)^2 P0 + 2(1-t)t P1 + t^2 P2
                        const t = moveProgress.current;

                        // SmoothStep for ease-in-out
                        const easeT = t * t * (3 - 2 * t);

                        const p0 = startPos.current;
                        const p1 = controlPoint.current;
                        const p2 = targetPos.current;

                        const x = (1 - easeT) * (1 - easeT) * p0.x + 2 * (1 - easeT) * easeT * p1.x + easeT * easeT * p2.x;
                        const y = (1 - easeT) * (1 - easeT) * p0.y + 2 * (1 - easeT) * easeT * p1.y + easeT * easeT * p2.y;
                        const z = (1 - easeT) * (1 - easeT) * p0.z + 2 * (1 - easeT) * easeT * p1.z + easeT * easeT * p2.z;

                        currentPos.current.set(x, y, z);
                    }
                    break;

                case 'HOVERING':
                    stateTimer.current += delta;
                    if (stateTimer.current > moveDuration.current) {
                        state.current = 'DECIDING';
                    } else {
                        // Bobbing Motion
                        const bobOffset = Math.sin(threeState.clock.getElapsedTime() * 2) * 2;
                        currentPos.current.setZ(hoverBaseY.current + bobOffset);
                    }
                    break;

                case 'PATTERN_INFINITY':
                    moveProgress.current += delta / moveDuration.current;
                    if (moveProgress.current >= 1) {
                        state.current = 'DECIDING';
                    } else {
                        // Lissajous Figure (Figure 8)
                        // x = A * sin(t), y = B * sin(2t)
                        const t = moveProgress.current * Math.PI * 2; // Full cycle
                        const width = 15;
                        const height = 15;

                        // Relative to where it started (or center?)
                        // Let's do relative to center of screen for dramatic effect, or current pos.
                        // Let's use patternCenter + offset
                        // Actually, 'Infinity' looks best if it's horizontal.

                        const x = Math.sin(t) * width;
                        const y = Math.sin(t * 2) * (width * 0.5);

                        // Conserve Z but bob slightly
                        const z = patternCenter.current.z + Math.cos(t) * 2;

                        currentPos.current.set(
                            patternCenter.current.x + x,
                            patternCenter.current.y + y,
                            z
                        );
                    }
                    break;

                case 'PATTERN_HELIX':
                    moveProgress.current += delta / moveDuration.current;
                    if (moveProgress.current >= 1) {
                        state.current = 'DECIDING';
                    } else {
                        // Spiral Down and Up
                        const t = moveProgress.current; // 0 to 1

                        // Radius shrinks then grows? Or constant?
                        // Let's do constant radius spiral
                        const radius = 15;
                        const turns = 3;
                        const angle = t * Math.PI * 2 * turns;

                        const x = Math.cos(angle) * radius;
                        const y = Math.sin(angle) * radius;

                        // Z goes down then up (PingPong)
                        // 0 -> 0.5 (Down) -> 1.0 (Up)
                        // Map t 0..0.5 to 50..20, t 0.5..1 to 20..50
                        let z = 0;
                        if (t < 0.5) {
                            z = THREE.MathUtils.lerp(50, 20, t * 2);
                        } else {
                            z = THREE.MathUtils.lerp(20, 50, (t - 0.5) * 2);
                        }

                        currentPos.current.set(x, y, z);
                    }
                    break;

                case 'TELEPORT_OUT':
                    // Shrink to 0 with variable speed
                    nextGlobalScale = THREE.MathUtils.lerp(currentGlobalScale, 0, teleportSpeed.current);
                    if (nextGlobalScale < 0.05) {
                        // Position Reset
                        currentPos.current = getRandomPosition();
                        groupRef.current.position.copy(currentPos.current);
                        state.current = 'TELEPORT_IN';
                    }
                    break;

                case 'TELEPORT_IN':
                    // Grow to 1 with variable speed
                    nextGlobalScale = THREE.MathUtils.lerp(currentGlobalScale, 1, teleportSpeed.current);
                    if (Math.abs(nextGlobalScale - 1) < 0.01) {
                        state.current = 'DECIDING';
                    }
                    break;
            }
        } else {
            // !isIdle scale down logic
            if (nextGlobalScale < 0.01) {
                groupRef.current.visible = false;
            } else {
                groupRef.current.visible = true;
            }
        }

        // Breathing Effect (Organic Scale Oscillation)
        const time = threeState.clock.getElapsedTime();
        const isMoving = state.current === 'MOVING';

        const breathSpeed = isMoving ? 6.0 : 2.0; // Fast breath when moving
        const breathAmp = isMoving ? 0.05 : 0.02; // Deeper breath when moving
        const breath = 1.0 + Math.sin(time * breathSpeed) * breathAmp;

        // Apply Transforms (Scale moves from nextGlobalScale * breath)
        groupRef.current.scale.setScalar(nextGlobalScale * breath);
        groupRef.current.position.copy(currentPos.current);

        // Dynamic Rotation (Banking/Spinning)
        if (isMoving) {
            // Spin faster to simulate activity/banking
            groupRef.current.rotation.x += delta * 2.0;
            groupRef.current.rotation.y += delta * 1.5;
        } else {
            // Slow idle drift
            groupRef.current.rotation.x += delta * 0.2;
            groupRef.current.rotation.y += delta * 0.3;
        }

        // Color Animation (Rainbow HSL with Heartbeat Pulse)
        if (sphereMatRef.current) {
            const hue = (time * 0.1) % 1;

            // Pulse Intensity Logic
            const pulseSpeed = isMoving ? 8.0 : 3.0;
            const baseIntensity = isMoving ? 0.4 : 0.2;
            const pulseAmp = isMoving ? 0.4 : 0.2;

            const pulse = Math.sin(time * pulseSpeed) * 0.5 + 0.5; // 0~1
            const finalIntensity = baseIntensity + pulse * pulseAmp;

            sphereMatRef.current.color.setHSL(hue, 1.0, 0.5);
            sphereMatRef.current.emissive.setHSL(hue, 1.0, finalIntensity);
        }
    });

    return (
        <>
            <group ref={groupRef}>
                {/* [DigiBall Sphere] */}
                <mesh>
                    <sphereGeometry args={[2.5, 64, 64]} />
                    <meshPhysicalMaterial
                        ref={sphereMatRef}
                        roughness={0.1}
                        metalness={0.2}
                        transmission={0.1}
                        thickness={1}
                        clearcoat={1}
                        clearcoatRoughness={0}
                    />
                </mesh>
            </group>

            {/* Explosion Effect (Triggered on Exit) */}
            <ExplosionParticles active={exploding} position={lastPos} />
        </>
    );
};

export default DigiBall;
