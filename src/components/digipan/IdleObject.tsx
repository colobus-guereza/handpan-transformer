
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Text } from '@react-three/drei';
import * as THREE from 'three';

const IdleObject = () => {
    const meshRef = useRef<THREE.Group>(null);

    useFrame((state, delta) => {
        if (meshRef.current) {
            // Continuous rotation
            meshRef.current.rotation.y += delta * 0.5;
            meshRef.current.rotation.x += delta * 0.2;
        }
    });

    return (
        <group ref={meshRef} position={[0, 0, 30]}>
            <Float
                speed={2} // Animation speed, defaults to 1
                rotationIntensity={1} // XYZ rotation intensity, defaults to 1
                floatIntensity={2} // Up/down float intensity, defaults to 1
            >
                {/* Main Geometric Shape - Icosahedron */}
                <mesh>
                    <icosahedronGeometry args={[10, 0]} />
                    <meshBasicMaterial color="#4f46e5" wireframe transparent opacity={0.3} />
                </mesh>

                {/* Inner Shape - Octahedron */}
                <mesh rotation={[0.5, 0.5, 0]}>
                    <octahedronGeometry args={[5, 0]} />
                    <meshBasicMaterial color="#ec4899" wireframe transparent opacity={0.5} />
                </mesh>

                {/* Floating Particles or Rings could be added here */}
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <torusGeometry args={[15, 0.1, 16, 100]} />
                    <meshBasicMaterial color="#ffffff" transparent opacity={0.1} />
                </mesh>

                <Text
                    position={[0, -15, 0]}
                    fontSize={2}
                    color="#64748b"
                    anchorX="center"
                    anchorY="middle"
                    fillOpacity={0.5}
                >
                    Touch to Activate
                </Text>
            </Float>
        </group>
    );
};

export default IdleObject;
