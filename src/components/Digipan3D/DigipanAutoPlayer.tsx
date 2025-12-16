'use client';

import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { Scale, NoteData } from '../../data/handpanScales';
import ToneFieldMesh from './ToneFieldMesh';
import { HANDPAN_CONFIG } from '../../constants/handpanConfig';
import { svgTo3D } from './Digipan3D';

// --- Reusing Helper Components (Since they were small) ---
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

const HandpanImage = ({ backgroundImage, centerX = 500, centerY = 500 }: { backgroundImage?: string | null; centerX?: number; centerY?: number; }) => {
    if (!backgroundImage) return null;
    const pos = svgTo3D(500, 500, centerX, centerY);
    return <HandpanImageRenderer url={backgroundImage} position={[pos.x, pos.y, -0.5]} />;
};

interface DigipanAutoPlayerProps {
    notes: NoteData[];
    scale?: Scale | null;
    centerX?: number;
    centerY?: number;
    backgroundImage?: string | null;
    playNote?: (noteName: string) => void;
    // AutoPlayer specific
    demoActiveNoteId?: number | null;
}

const DigipanAutoPlayer = ({
    notes,
    scale,
    centerX = 500,
    centerY = 500,
    backgroundImage,
    playNote,
    demoActiveNoteId
}: DigipanAutoPlayerProps) => {

    return (
        <Canvas camera={{ position: [0, 0, 100], zoom: 12 }} orthographic>
            {/* Lighting */}
            <ambientLight intensity={0.8} />
            <pointLight position={[10, 10, 10]} intensity={1} />

            {/* Background Image */}
            <HandpanImage backgroundImage={backgroundImage} centerX={centerX} centerY={centerY} />

            {/* Render ToneFields */}
            {notes.map((note) => (
                <ToneFieldMesh
                    key={note.id}
                    note={note}
                    centerX={centerX}
                    centerY={centerY}
                    viewMode={0} // Force View All (Mesh + Labels)
                    demoActive={demoActiveNoteId === note.id}
                    playNote={playNote}
                />
            ))}

            {/* Controls */}
            <OrbitControls enableRotate={false} enableZoom={true} enablePan={true} minZoom={5} maxZoom={50} />
        </Canvas>
    );
};

export default DigipanAutoPlayer;
