
'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Environment, OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import * as Tone from 'tone';
import { HANDPAN_REGISTRY } from '../data/handpanRegistry';
import { Scale } from '../data/handpanScales';

// --- Isolated Helper: Tone.js Audio ---
// We do not import useHandpanAudio hook strictly to keep isolation if requested,
// OR we can minimalist inline it. Let's inline a simple Synth for robust independence.
const playSynthNote = (pitch: string) => {
    const synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "sine" },
        envelope: { attack: 0.05, decay: 0.3, sustain: 0.4, release: 1.2 }
    }).toDestination();
    synth.triggerAttackRelease(pitch, "8n");
};

// --- Isolated Helper: Coordinate Mapping ---
const svgTo3D = (x: number, y: number) => {
    // Basic mapping: 500,500 is center. Scale ~0.06 to fit 3D view.
    const SCALE = 0.06;
    return {
        x: (x - 500) * SCALE,
        y: -(y - 500) * SCALE
    };
};

// --- Sub-Component: Simple Tonefield Mesh ---
const SimpleTonefield = ({ note, onClick }: { note: any, onClick: (pitch: string) => void }) => {
    const { x, y } = svgTo3D(note.cx, note.cy);
    const [hovered, setHovered] = useState(false);
    const [active, setActive] = useState(false);

    // Visual feedback on click
    const handleClick = (e: any) => {
        e.stopPropagation();
        setActive(true);
        onClick(note.pitch);
        setTimeout(() => setActive(false), 200);
    };

    return (
        <group position={[x, y, note.type === 'bottom' ? -2 : 0.5]} rotation={[0, 0, -THREE.MathUtils.degToRad(note.rotate)]}>
            {/* Invisible Hit Area (Larger) */}
            <mesh onClick={handleClick} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
                <ellipseCurve args={[0, 0, 3 * note.scaleX, 2 * note.scaleY, 0, 2 * Math.PI, false, 0]} />
                {/* Visual Representation: Glowing Ring */}
                <mesh position={[0, 0, 0]}>
                    <ringGeometry args={[2.5 * note.scaleX, 2.8 * note.scaleX, 32]} />
                    <meshStandardMaterial
                        color={active ? "#00FF00" : (hovered ? "#FFFFFF" : "#888888")}
                        emissive={active ? "#00FF00" : "#000000"}
                        emissiveIntensity={active ? 2 : 0}
                        transparent
                        opacity={active ? 1 : 0.3}
                        side={THREE.DoubleSide}
                    />
                </mesh>
            </mesh>

            {/* Simple Body (Flattened Sphere) for visuals */}
            <mesh position={[0, 0, -0.2]} scale={[note.scaleX, note.scaleY, 0.5]}>
                <sphereGeometry args={[2.5, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshStandardMaterial color="#443322" wireframe />
            </mesh>
        </group>
    );
};

// --- Main Container: DigipanAutoPlayer ---
interface DigipanAutoPlayerProps {
    scaleId: string; // "d_kurd_10" etc.
    scale?: Scale; // Optional for labels if needed
}

const DigipanAutoPlayer = ({ scaleId }: DigipanAutoPlayerProps) => {
    // Lookup Registry or Fallback
    const config = HANDPAN_REGISTRY[scaleId] || HANDPAN_REGISTRY["d_kurd_10"];

    // Auto-Rotate State
    // No UI for buttons, but maybe scene auto-rotates slowly?

    return (
        <div className="w-full h-full bg-black relative">
            <Canvas camera={{ position: [0, 0, 60], fov: 45 }}>
                <color attach="background" args={['#111111']} />

                {/* Lighting */}
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} />
                <Environment preset="city" />
                <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

                <OrbitControls enableZoom={true} enablePan={true} maxPolarAngle={Math.PI} minDistance={20} maxDistance={100} />

                {/* Handpan Body (Generic Sphere) */}
                <mesh position={[0, 0, -2]} scale={[1, 0.4, 1]}>
                    <sphereGeometry args={[28, 64, 32]} />
                    <meshStandardMaterial
                        color={config.baseColor || "#8B5A2B"}
                        metalness={0.9}
                        roughness={0.2}
                    />
                </mesh>

                {/* Tonefields */}
                {config.notes.map((note, i) => (
                    <SimpleTonefield key={i} note={note} onClick={playSynthNote} />
                ))}

            </Canvas>

            {/* Minimal Info Overlay (Optional, user said NO BUTTONS, but maybe title?) */}
            {/* User said: "버튼 없는 깨끗한 화면". But showing the Scale Name is probably good? 
                "F# Low Pygmy ... 오직 핸드팬만 영롱하게" -> Okay, no text.
            */}
        </div>
    );
};

export default DigipanAutoPlayer;
