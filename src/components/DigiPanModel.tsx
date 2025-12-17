
'use client';

import React from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls, Sphere, Text } from '@react-three/drei';

interface DigiPanModelProps {
    scaleId: string;
    isAutoPlay?: boolean;
}

/**
 * DigiPanModel (Placeholder Mode)
 * 
 * As requested, this component has been disconnected from the complex Digipan3D/AutoPlayer logic.
 * It now renders a "Visual Stage" with a single, static, high-quality sphere to represent the Handpan,
 * ensuring no broken visual artifacts or crashes while preserving the data flow in the parent.
 */
export default function DigiPanModel({ scaleId, isAutoPlay = false }: DigiPanModelProps) {

    // We intentionally ignore scaleId and isAutoPlay for the visual rendering.
    // The parent (page.tsx) still calculates and logs data based on them.

    return (
        <div className="w-full h-full bg-black relative rounded-lg border border-neutral-800 overflow-hidden">
            {/* Header Label (Static Status) */}
            <div className="absolute top-4 right-4 z-10">
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-1 text-xs font-bold rounded shadow-lg backdrop-blur-sm">
                    Static Visual Mode
                </span>
            </div>

            <Canvas camera={{ position: [0, 0, 4.5], fov: 45 }}>
                <color attach="background" args={['#FFFFFF']} />

                {/* Lighting */}
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1.5} />
                <Environment preset="city" />

                {/* Controls */}
                <OrbitControls
                    makeDefault
                    enableZoom={true}
                    enableRotate={false}
                    enablePan={false}
                    minDistance={1}
                    maxDistance={20}
                    target={[0, 0, 0]}
                />

                {/* Axes Helper at (0,0,0) */}
                <axesHelper args={[5]} />

                {/* Coordinate Label */}
                <Text
                    position={[0, 0.1, 0]}
                    color="black"
                    fontSize={0.1}
                    anchorX="center"
                    anchorY="bottom"
                >
                    (0, 0, 0)
                </Text>



                {/* Optional: Simple Grid to show "Coordinates" */}
                {/* <gridHelper args={[10, 10, 0x444444, 0x222222]} rotation={[Math.PI/2, 0, 0]} /> */}
            </Canvas>
        </div>
    );
}
