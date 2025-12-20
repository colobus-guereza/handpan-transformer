"use client";

import { Canvas } from "@react-three/fiber";
import { Environment, Float, OrbitControls } from "@react-three/drei";
import ReelPanDigiball from "./ReelPanDigiball";

export default function ReelPanLogo3D() {
    return (
        <div className="w-full h-56 md:h-72 flex items-center justify-center relative -my-4 z-20 pointer-events-none">
            <div className="w-full h-full pointer-events-auto">
                <Canvas
                    camera={{
                        position: [0, 0, 60],
                        fov: 50,
                        near: 0.1,
                        far: 1000
                    }}
                    gl={{ preserveDrawingBuffer: true, alpha: true }}
                >
                    {/* Lighting */}
                    <ambientLight intensity={0.5} />
                    <pointLight position={[10, 10, 50]} intensity={1.0} color="#ffffff" />
                    <pointLight position={[-20, -10, 30]} intensity={0.5} color="#00e5ff" />

                    {/* Reflections */}
                    <Environment preset="city" />

                    {/* Main Digiball Content */}
                    <group scale={0.5}>
                        <ReelPanDigiball />
                    </group>

                    {/* Allow user to rotate view if they want */}
                    <OrbitControls enableZoom={false} enablePan={false} />
                </Canvas>
            </div>
        </div>
    );
}
