import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text3D, Center } from '@react-three/drei';
import * as THREE from 'three';

interface TouchTextProps {
    isIdle: boolean;
    suppressExplosion?: boolean; // viewMode 토글 등 UI 버튼 클릭 시 폭발 효과 억제
    overrideText?: string | null; // For Castling Countdown
    interactionTrigger?: number; // New: Explicit trigger signal
}

const SEQUENCE = [
    { text: 'Ready', duration: 5000 },
    { text: 'Set', duration: 4000 },
    { text: 'Touch!', duration: 2000 }
];

// [Fine-tuning] Independent Themes for different modes
// Idle Sequence Themes
const IDLE_THEMES: Record<string, { color: string; emissive: string }> = {
    'Ready': { color: '#2ecc71', emissive: '#006400' }, // Green (Emerald)
    'Set': { color: '#FFFF00', emissive: '#FFD700' },   // Yellow
    'Touch!': { color: '#FF0000', emissive: '#CC0000' } // Red
};

// Reel Recording Countdown Themes (4, 3, 2, 1, Touch!)
const REEL_COUNTDOWN_THEMES: Record<string, { color: string; emissive: string }> = {
    '4': { color: '#FFFF00', emissive: '#FFD700' },
    '3': { color: '#FFFF00', emissive: '#FFD700' },
    '2': { color: '#FFFF00', emissive: '#FFD700' },
    '1': { color: '#FFFF00', emissive: '#FFD700' },
    'Touch!': { color: '#FF0000', emissive: '#CC0000' }
};

// [Effect] Explosion Particles (Reused from CyberBoat)
// [Effect] Explosion Particles (Optimized with InstancedMesh)
const ExplosionParticles = ({ active, position }: { active: boolean; position: THREE.Vector3 }) => {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const PARTICLE_COUNT = 150;
    const dummy = useMemo(() => new THREE.Object3D(), []);

    // Particle State
    const particles = useMemo(() => {
        return new Array(PARTICLE_COUNT).fill(0).map(() => ({
            pos: new THREE.Vector3(0, 0, 0),
            vel: new THREE.Vector3(
                (Math.random() - 0.5) * 3,
                (Math.random() - 0.5) * 3,
                (Math.random() - 0.5) * 3
            ),
            scale: Math.random() * 1.5 + 0.5,
            life: 1.0,
            color: new THREE.Color(Math.random() > 0.5 ? '#FFD700' : '#FFFFFF')
        }));
    }, []);

    const [isVisible, setIsVisible] = useState(true); // Start true for Warm-up
    const isWarmedUp = useRef(false);

    // Warm-up & Trigger Logic
    useEffect(() => {
        if (!isWarmedUp.current) {
            // Frame 0: Mount -> Render (Scale 0) -> Compile Shader
            // Frame 1: Timer runs -> Hide
            const timer = setTimeout(() => {
                isWarmedUp.current = true;
                setIsVisible(false); // Hide after warm-up
            }, 100);
            return () => clearTimeout(timer);
        }

        if (active) {
            setIsVisible(true);
            particles.forEach(p => {
                p.pos.copy(position);
                p.vel.set(
                    (Math.random() - 0.5) * 4,
                    (Math.random() - 0.5) * 4,
                    (Math.random() - 0.5) * 4
                );
                p.life = 1.0 + Math.random() * 0.5;
            });
            const timer = setTimeout(() => setIsVisible(false), 1500);
            return () => clearTimeout(timer);
        }
    }, [active, position, particles]);

    useFrame((state, delta) => {
        if (!meshRef.current || !isVisible) return;

        // If warming up (active=false but visible=true), keep scale 0
        const isWarming = !isWarmedUp.current;

        particles.forEach((p, i) => {
            if (active && p.life > 0) {
                p.pos.add(p.vel.clone().multiplyScalar(delta * 10));
                p.life -= delta * 1.5;
                dummy.position.copy(p.pos);
                dummy.scale.setScalar(p.scale * p.life);
                dummy.rotation.x += delta * 2;
                dummy.rotation.y += delta * 2;
            } else if (isWarming) {
                // Warm-up: Render at 0,0,0 with scale 0 (Forces GPU Buffer Upload)
                dummy.position.set(0, 0, 0);
                dummy.scale.setScalar(0.0001); // Non-zero to ensure draw call happens
            } else {
                // Dead/Hidden
                dummy.scale.setScalar(0);
            }

            dummy.updateMatrix();
            meshRef.current!.setMatrixAt(i, dummy.matrix);
            // Color updates require instanceColor buffer or just grouping by material. 
            // For simplicity in InstancedMesh basic usage without color buffer attrs, we assume single color or uniform.
            // But we want Gold/White.
            // Option: Use meshRef.current.setColorAt(i, p.color)
            meshRef.current!.setColorAt(i, p.color);
        });

        meshRef.current.instanceMatrix.needsUpdate = true;
        if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, PARTICLE_COUNT]} visible={isVisible}>
            <icosahedronGeometry args={[0.6, 0]} />
            <meshBasicMaterial transparent opacity={0.9} toneMapped={false} />
        </instancedMesh>
    );
};

const TouchText = ({ isIdle, suppressExplosion = false, overrideText, interactionTrigger = 0 }: TouchTextProps) => {
    const groupRef = useRef<THREE.Group>(null);
    const materialRef = useRef<THREE.MeshPhysicalMaterial>(null);

    // Global State
    const [exploding, setExploding] = useState(false);
    const [lastPos, setLastPos] = useState(new THREE.Vector3(0, 0, 30));

    // Sequential Text Cycling
    const [stepIndex, setStepIndex] = useState(0);
    const [displayedText, setDisplayedText] = useState<string | null>('Ready');

    // Logic: Sync displayedText based on state
    // Separation: overrideText (Recording) takes absolute priority and silences the idle cycle.
    useEffect(() => {
        if (overrideText) {
            setDisplayedText(overrideText);
        } else if (isIdle) {
            setDisplayedText(SEQUENCE[stepIndex].text);
        } else {
            setDisplayedText(null);
        }
    }, [overrideText, isIdle, stepIndex]);

    const currentText = displayedText;

    // Ref to track current text for effects without triggering re-runs
    const currentTextRef = useRef(currentText);
    currentTextRef.current = currentText; // Update synchronously


    const wasIdle = useRef(isIdle);

    useEffect(() => {
        // Only run sequence timer if NOT overriding AND IS IDLE
        if (overrideText || !isIdle) return;

        const step = SEQUENCE[stepIndex];
        const timeoutId = setTimeout(() => {
            setStepIndex((prev) => (prev + 1) % SEQUENCE.length);
        }, step.duration);

        return () => clearTimeout(timeoutId);
    }, [stepIndex, overrideText, isIdle]);

    // Added: Reset to "Ready" (0) immediately when override ends (IF RETURNING TO IDLE)
    useEffect(() => {
        if (!overrideText && isIdle) {
            setStepIndex(0);
        }
    }, [overrideText, isIdle]);

    // Initial Position (Center, Floating above)
    // DigiBall Fly Height Min is 25. Let's put Text around 30.
    const initialPos = new THREE.Vector3(0, 0, 30);

    // Internal Explosion Logic (Safe to call from effects)
    const triggerExplosion = useCallback(() => {
        const text = currentTextRef.current;
        if (!text) return; // guard null
        // Exception: Don't explode if showing Countdown Numbers
        if (['4', '3', '2', '1'].includes(text)) {
            return;
        }

        // Fix: Only explode if there is something visible to explode!
        // Prevents continuous explosions on every touch after text is gone.
        if (!groupRef.current || !groupRef.current.visible || groupRef.current.scale.x < 0.1) {
            return;
        }

        if (!suppressExplosion) {
            setLastPos(groupRef.current.position.clone());
            setExploding(true);
            setTimeout(() => setExploding(false), 1000);
        }
    }, [suppressExplosion]);

    // Effect 1: Handle System Idle Changes (Start of Interaction)
    // Removed triggerExplosion from dependency to avoid re-run on text change
    // Using wasIdle ref to detect edge
    useEffect(() => {
        if (wasIdle.current && !isIdle) {
            // User Became Active -> Do nothing specific visually (Just let visibility logic handle it)
            // Previously triggered explosion here, which caused issues with GUI button clicks.
        } else if (!wasIdle.current && isIdle) {
            // User Became Idle (Text Reappears) -> Reset to Start
            setStepIndex(0);
        }
        wasIdle.current = isIdle;
    }, [isIdle]);

    // Effect 2: Handle Explicit Interaction Triggers (Continuous Interaction)
    const prevInteractionTrigger = useRef(interactionTrigger);
    useEffect(() => {
        if (interactionTrigger && interactionTrigger > (prevInteractionTrigger.current || 0)) {
            triggerExplosion();
        }
        prevInteractionTrigger.current = interactionTrigger;
    }, [interactionTrigger, triggerExplosion]);

    // Theme Resolution:
    // 1. Check Recording themes first if override is active
    // 2. Check Idle themes if in idle cycle
    // 3. Fallback
    const lookupKey = currentText || 'Ready';
    let theme = overrideText ? REEL_COUNTDOWN_THEMES[lookupKey] : IDLE_THEMES[lookupKey];

    if (!theme) {
        if (currentText && ['4', '3', '2', '1'].includes(currentText)) {
            theme = REEL_COUNTDOWN_THEMES['1'];
        } else if (currentText === 'Touch!') {
            theme = REEL_COUNTDOWN_THEMES['Touch!'];
        } else {
            theme = IDLE_THEMES['Ready']; // Ultimate fallback
        }
    }

    useFrame((state, delta) => {
        if (!groupRef.current || !currentText) return;

        // Optimize Disappearance: Instant Hide on Explosion
        if (exploding) {
            groupRef.current.scale.setScalar(0);
            groupRef.current.visible = false;
            return;
        }

        // Visibility Logic
        // Force visible if overrideText is present, or if Idle (and currentText exists)
        const hasText = !!currentText;
        const targetGlobalScale = (hasText && (isIdle || !!overrideText)) ? 1 : 0;
        const currentGlobalScale = groupRef.current.scale.x;

        let lerpRate = isIdle ? 0.08 : 0.1; // Standard rates
        // [Effect] Fast Fade Out for "Touch!" (Castling Intro)
        if (targetGlobalScale === 0 && currentText === 'Touch!') {
            lerpRate = 0.25; // Much faster fade out
        }

        const nextGlobalScale = THREE.MathUtils.lerp(currentGlobalScale, targetGlobalScale, lerpRate);

        if (isIdle || overrideText) {
            // Always show if idle OR if overriding (even if active)
            if (nextGlobalScale > 0.01) groupRef.current.visible = true;
        } else {
            if (nextGlobalScale < 0.01) groupRef.current.visible = false;
        }

        // Breathing Effect (Organic Scale Oscillation)
        const time = state.clock.getElapsedTime();
        const breathSpeed = 2.0;
        const breathAmp = 0.01; // Reduced from 0.02 to 0.01 for subtler breathing
        const breath = 1.0 + Math.sin(time * breathSpeed) * breathAmp;

        // Apply Transforms
        groupRef.current.scale.setScalar(nextGlobalScale * breath);

        // Bobbing Motion (Hovering)
        const bobOffset = Math.sin(time * 2) * 2;
        groupRef.current.position.set(
            initialPos.x,
            initialPos.y,
            initialPos.z + bobOffset
        );

        // Color Animation (Pulse Intensity only, keep Hue fixed)
        if (materialRef.current) {
            const pulseSpeed = 3.0;
            const pulse = Math.sin(time * pulseSpeed) * 0.5 + 0.5;

            // Lerp color slightly for gradient feel or aliveness
            const baseColor = new THREE.Color(theme.color);
            const targetEmissive = new THREE.Color(theme.emissive);

            // Pulse emissive intensity
            const finalEmissiveIntensity = 0.5 + pulse * 0.5;

            materialRef.current.color.copy(baseColor);
            materialRef.current.emissive.copy(targetEmissive);
            materialRef.current.emissiveIntensity = finalEmissiveIntensity;
        }
    });

    return (
        <>
            <group ref={groupRef} position={[initialPos.x, initialPos.y, initialPos.z]}>
                {currentText && (
                    <Center key={currentText}>
                        <Text3D
                            font="/fonts/helvetiker_bold.typeface.json"
                            size={['4', '3', '2', '1'].includes(currentText) ? 14.4 : 12}
                            height={2}
                            curveSegments={12}
                            bevelEnabled
                            bevelThickness={0.5}
                            bevelSize={0.3}
                            bevelOffset={0}
                            bevelSegments={5}
                        >
                            {currentText}
                            <meshPhysicalMaterial
                                ref={materialRef}
                                roughness={0.2}
                                metalness={0.1}
                                transmission={0.0}
                                thickness={1}
                                clearcoat={0.5}
                                clearcoatRoughness={0.1}
                            />
                        </Text3D>
                    </Center>
                )}
            </group>

            {/* Explosion Effect */}
            <ExplosionParticles active={exploding} position={lastPos} />
        </>
    );
};

export default TouchText;
