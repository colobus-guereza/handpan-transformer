import React from 'react';
import * as THREE from 'three';

interface VisualTonefieldProps {
    position: [number, number, number];
    rotationZ: number;
    radiusX: number;
    radiusY: number;
    color?: string;
    opacity?: number;
    fillOpacity?: number;
    dimpleFillOpacity?: number;
    dimpleScale?: number;
}

export const VisualTonefield: React.FC<VisualTonefieldProps> = ({
    position,
    rotationZ,
    radiusX,
    radiusY,
    color = "#A0522D",
    opacity = 0.6,
    fillOpacity = 0.2,
    dimpleFillOpacity = 0.5,
    dimpleScale = 0.4
}) => {
    return (
        <group position={position}>
            <group rotation={[0, 0, rotationZ]}>
                {/* 1. Main Tonefield Fill */}
                <mesh
                    position={[0, 0, -0.001]} // Slightly behind outline
                    scale={[radiusX, radiusY, 1]}
                >
                    <circleGeometry args={[0.98, 64]} />
                    <meshBasicMaterial
                        color={color}
                        transparent={true}
                        opacity={fillOpacity}
                        side={THREE.DoubleSide}
                    />
                </mesh>

                {/* 2. Main Tonefield Outline */}
                <mesh
                    scale={[radiusX, radiusY, 1]}
                >
                    <ringGeometry args={[0.98, 1, 64]} />
                    <meshBasicMaterial
                        color={color}
                        transparent={true}
                        opacity={opacity}
                        side={THREE.DoubleSide}
                    />
                </mesh>

                {/* 3. Inner Dimple Outline */}
                <mesh
                    position={[0, 0, 0.01]}
                    scale={[radiusX * dimpleScale, radiusY * dimpleScale, 1]}
                >
                    <ringGeometry args={[0.95, 1, 64]} />
                    <meshBasicMaterial
                        color={color}
                        transparent={true}
                        opacity={opacity}
                        side={THREE.DoubleSide}
                    />
                </mesh>

                {/* 4. Inner Dimple Fill */}
                <mesh
                    position={[0, 0, 0.009]} // Just behind dimple outline
                    scale={[radiusX * dimpleScale, radiusY * dimpleScale, 1]}
                >
                    <circleGeometry args={[0.95, 64]} />
                    <meshBasicMaterial
                        color={color}
                        transparent={true}
                        opacity={dimpleFillOpacity}
                        side={THREE.DoubleSide}
                    />
                </mesh>
            </group>
        </group>
    );
};
