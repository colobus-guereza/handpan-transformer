'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text3D, Center } from '@react-three/drei';
import * as THREE from 'three';

interface CountdownTextProps {
    text: string | null; // "3", "2", "1", "Touch!", or null
}

// Countdown Themes (Yellow for numbers, Red for Touch!)
const THEMES: Record<string, { color: string; emissive: string }> = {
    '4': { color: '#FFFF00', emissive: '#FFD700' },
    '3': { color: '#FFFF00', emissive: '#FFD700' },
    '2': { color: '#FFFF00', emissive: '#FFD700' },
    '1': { color: '#FFFF00', emissive: '#FFD700' },
    'Touch!': { color: '#FF0000', emissive: '#CC0000' }
};

const CountdownText = ({ text }: CountdownTextProps) => {
    const groupRef = useRef<THREE.Group>(null);
    const materialRef = useRef<THREE.MeshPhysicalMaterial>(null);
    const prevTextRef = useRef<string | null>(null);

    // Position (Center, Floating above)
    const initialPos = new THREE.Vector3(0, 0, 30);

    // Get theme for current text
    const theme = text ? (THEMES[text] || THEMES['Touch!']) : THEMES['Touch!'];

    // Debug: Log text changes
    useEffect(() => {
        if (prevTextRef.current !== text) {
            console.log(`[CountdownTextDebug] ${Date.now()} text changed: "${prevTextRef.current}" -> "${text}"`);
            prevTextRef.current = text;
        }
    }, [text]);

    // Animation: Breathing + Color Pulse
    useFrame((state) => {
        if (!groupRef.current) return;

        const time = state.clock.getElapsedTime();

        // Visibility
        if (text) {
            if (!groupRef.current.visible) {
                console.log(`[CountdownTextDebug] ${Date.now()} Setting visible=true`);
            }
            groupRef.current.visible = true;
            // Scale up smoothly
            const targetScale = 1;
            const currentScale = groupRef.current.scale.x;
            groupRef.current.scale.setScalar(
                THREE.MathUtils.lerp(currentScale, targetScale, 0.15)
            );
        } else {
            // Scale down smoothly
            const currentScale = groupRef.current.scale.x;
            const nextScale = THREE.MathUtils.lerp(currentScale, 0, 0.2);
            groupRef.current.scale.setScalar(nextScale);
            if (nextScale < 0.01) {
                if (groupRef.current.visible) {
                    console.log(`[CountdownTextDebug] ${Date.now()} Setting visible=false (scale: ${nextScale.toFixed(4)})`);
                }
                groupRef.current.visible = false;
            }
        }

        // Breathing Effect (Subtle)
        const breathSpeed = 2.0;
        const breathAmp = 0.01;
        const breath = 1.0 + Math.sin(time * breathSpeed) * breathAmp;
        if (text && groupRef.current.visible) {
            groupRef.current.scale.multiplyScalar(breath);
        }

        // Bobbing Motion
        const bobOffset = Math.sin(time * 2) * 2;
        groupRef.current.position.set(
            initialPos.x,
            initialPos.y,
            initialPos.z + bobOffset
        );

        // Color Pulse
        if (materialRef.current && text) {
            const pulseSpeed = 3.0;
            const pulse = Math.sin(time * pulseSpeed) * 0.5 + 0.5;
            const finalEmissiveIntensity = 0.5 + pulse * 0.5;

            materialRef.current.color.set(theme.color);
            materialRef.current.emissive.set(theme.emissive);
            materialRef.current.emissiveIntensity = finalEmissiveIntensity;
        }
    });

    return (
        <group ref={groupRef} position={[initialPos.x, initialPos.y, initialPos.z]}>
            {text && (
                <Center>
                    <Text3D
                        font="/fonts/helvetiker_bold.typeface.json"
                        size={['4', '3', '2', '1'].includes(text) ? 14.4 : 12}
                        height={2}
                        curveSegments={12}
                        bevelEnabled
                        bevelThickness={0.5}
                        bevelSize={0.3}
                        bevelOffset={0}
                        bevelSegments={5}
                    >
                        {text}
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
    );
};

export default CountdownText;
