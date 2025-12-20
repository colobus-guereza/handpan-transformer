"use client";

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Constants - Adjusted for smaller view area
const BOUNDARY_RADIUS = 8;
const FLY_HEIGHT_MIN = -4;
const FLY_HEIGHT_MAX = 4;
const PARTICLE_COUNT = 90;

// [Effect] Explosion Particles
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

export default function ReelPanDigiball() {
    // Force active state for this playground usage
    const isIdle = false;

    const groupRef = useRef<THREE.Group>(null);
    const sphereMatRef = useRef<THREE.MeshPhysicalMaterial>(null);

    // Global State
    const [exploding, setExploding] = useState(false);
    const [lastPos, setLastPos] = useState(new THREE.Vector3(0, 0, 0)); // Start at center

    // Movement State Machine
    const state = useRef<BallState>('SPAWNING');
    const stateTimer = useRef(0);

    // Movement Logic Refs
    const currentPos = useRef(new THREE.Vector3(0, 0, 0));
    const targetPos = useRef(new THREE.Vector3(0, 0, 0));
    const startPos = useRef(new THREE.Vector3(0, 0, 0));
    const controlPoint = useRef(new THREE.Vector3(0, 0, 0));

    // Animation Refs
    const moveDuration = useRef(2.0);
    const moveProgress = useRef(0);
    const hoverBaseY = useRef(0);
    const teleportSpeed = useRef(0.1);
    const patternCenter = useRef(new THREE.Vector3(0, 0, 0));

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
        // Removed TELEPORT_OUT to prevents disappearing

        if (rand < 0.15) return 'PATTERN_INFINITY';
        if (rand < 0.25) return 'PATTERN_HELIX';
        if (rand < 0.70) return 'HOVERING';
        return 'MOVING';
    };

    useFrame((threeState, delta) => {
        if (!groupRef.current) return;

        // Ensure visible
        groupRef.current.visible = true;

        // =========================================================
        // STATE MACHINE LOOP
        // =========================================================

        switch (state.current) {
            case 'SPAWNING':
                // Immediate transition to deciding for this standalone version
                state.current = 'DECIDING';
                break;

            case 'DECIDING':
                const next = pickNextState();
                state.current = next;
                stateTimer.current = 0;

                if (next === 'MOVING') {
                    startPos.current.copy(currentPos.current);
                    targetPos.current = getRandomPosition();

                    const mid = new THREE.Vector3().addVectors(startPos.current, targetPos.current).multiplyScalar(0.5);
                    const offset = new THREE.Vector3(
                        (Math.random() - 0.5) * 20, // Reduced offset
                        (Math.random() - 0.5) * 20,
                        (Math.random() - 0.5) * 8
                    );
                    controlPoint.current.addVectors(mid, offset);

                    moveDuration.current = 1.5 + Math.random() * 3.0;
                    moveProgress.current = 0;
                }
                else if (next === 'HOVERING') {
                    hoverBaseY.current = currentPos.current.z;
                    moveDuration.current = 3.0 + Math.random() * 3.0;
                } else if (next === 'PATTERN_INFINITY') {
                    patternCenter.current.copy(currentPos.current);
                    moveDuration.current = 6.0;
                    moveProgress.current = 0;
                } else if (next === 'PATTERN_HELIX') {
                    moveDuration.current = 8.0;
                    moveProgress.current = 0;
                    startPos.current.set(0, 0, 5); // Start closer to center
                }
                break;

            case 'MOVING':
                moveProgress.current += delta / moveDuration.current;
                if (moveProgress.current >= 1) {
                    state.current = 'DECIDING';
                    currentPos.current.copy(targetPos.current);
                } else {
                    const t = moveProgress.current;
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
                    const bobOffset = Math.sin(threeState.clock.getElapsedTime() * 2) * 2;
                    currentPos.current.setZ(hoverBaseY.current + bobOffset);
                }
                break;

            case 'PATTERN_INFINITY':
                moveProgress.current += delta / moveDuration.current;
                if (moveProgress.current >= 1) {
                    state.current = 'DECIDING';
                } else {
                    const t = moveProgress.current * Math.PI * 2;
                    const width = 8; // Reduced width
                    // const height = 15;

                    const x = Math.sin(t) * width;
                    const y = Math.sin(t * 2) * (width * 0.5);
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
                    const t = moveProgress.current;
                    const radius = 8; // Reduced radius
                    const turns = 3;
                    const angle = t * Math.PI * 2 * turns;
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;
                    let z = 0;
                    if (t < 0.5) {
                        z = THREE.MathUtils.lerp(8, -8, t * 2);
                    } else {
                        z = THREE.MathUtils.lerp(-8, 8, (t - 0.5) * 2);
                    }
                    currentPos.current.set(x, y, z);
                }
                break;

            // Removed TELEPORT cases
        }

        // Apply Position
        groupRef.current.position.copy(currentPos.current);

        // Dynamic Rotation
        const isMoving = state.current === 'MOVING';
        if (isMoving) {
            groupRef.current.rotation.x += delta * 2.0;
            groupRef.current.rotation.y += delta * 1.5;
        } else {
            groupRef.current.rotation.x += delta * 0.2;
            groupRef.current.rotation.y += delta * 0.3;
        }

        // Breathing
        const time = threeState.clock.getElapsedTime();
        const breathSpeed = isMoving ? 6.0 : 2.0;
        const breathAmp = isMoving ? 0.05 : 0.02;
        const breath = 1.0 + Math.sin(time * breathSpeed) * breathAmp;
        groupRef.current.scale.setScalar(breath);


        // Color Animation
        if (sphereMatRef.current) {
            const time = threeState.clock.getElapsedTime();
            const hue = (time * 0.1) % 1;
            const pulseSpeed = isMoving ? 8.0 : 3.0;
            const baseIntensity = isMoving ? 0.4 : 0.2;
            const pulseAmp = isMoving ? 0.4 : 0.2;
            const pulse = Math.sin(time * pulseSpeed) * 0.5 + 0.5;
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
                    <sphereGeometry args={[1.5, 64, 64]} />
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

            {/* Explosion Effect (Triggered on Exit - though mostly unused here as isIdle is always false) */}
            <ExplosionParticles active={exploding} position={lastPos} />
        </>
    );
}
