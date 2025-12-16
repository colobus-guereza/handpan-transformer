
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface HoloCoreProps {
    isIdle: boolean;
}

const HoloCore = ({ isIdle }: HoloCoreProps) => {
    const groupRef = useRef<THREE.Group>(null);
    const outerRef = useRef<THREE.Mesh>(null);
    const innerRef = useRef<THREE.Mesh>(null);

    // 상태 전환 시 부드러운 애니메이션을 위한 변수
    // 목표 스케일: idle일 때 1, 아닐 때 0
    const targetScale = isIdle ? 1 : 0;

    useFrame((state, delta) => {
        if (!groupRef.current) return;

        // 1. 부드러운 등장/퇴장 (Linear Interpolation)
        const currentScale = groupRef.current.scale.x;
        const nextScale = THREE.MathUtils.lerp(currentScale, targetScale, 0.1);

        // 스케일이 거의 0이면 렌더링을 꺼서 성능 최적화
        if (nextScale < 0.01) {
            groupRef.current.visible = false;
            // Target is 0, so we can skip the rest if we are effectively hidden
            if (targetScale === 0) return;
        } else {
            groupRef.current.visible = true;
        }

        groupRef.current.scale.set(nextScale, nextScale, nextScale);

        // 2. 움직임 및 색상 애니메이션
        const t = state.clock.getElapsedTime();

        // [움직임] 부유 및 회전 
        // Adapted for Digipan Z-up coordinate system
        // Original: y = 2 + sin... -> Z = 30 + sin... * 5
        groupRef.current.position.z = 30 + Math.sin(t * 1.5) * 5;
        // Reset others
        groupRef.current.position.x = 0;
        groupRef.current.position.y = 0;

        if (outerRef.current) {
            outerRef.current.rotation.x = t * 0.2;
            outerRef.current.rotation.y = t * 0.3;
        }

        if (innerRef.current) {
            // 안쪽 물체는 좀 더 빠르게 회전
            innerRef.current.rotation.x = t * 0.5;
            innerRef.current.rotation.z = -t * 0.3;

            // [색상 변경 핵심 코드]
            // 시간(t)에 따라 Hue(색상) 값을 0~1 사이로 계속 순환시킴
            // HSL(Hue, Saturation, Lightness) -> (t % 1, 100%, 50%)
            const hue = (t * 0.2) % 1;

            const mat = innerRef.current.material as THREE.MeshStandardMaterial;
            if (mat && mat.color && mat.emissive) {
                mat.color.setHSL(hue, 1, 0.5);
                // 발광 색상도 같이 변경하여 빛 자체가 변하는 느낌
                mat.emissive.setHSL(hue, 1, 0.5);
            }
        }
    });

    return (
        <group ref={groupRef} position={[0, 0, 30]}>
            {/* 포인트 라이트: 내핵 색상에 맞춰 같이 변하게 할 수 있지만, 은은한 cyan으로 고정 (선택 사항) */}
            <pointLight distance={50} intensity={isIdle ? 1.5 : 0} color="#00ffff" />

            {/* [외피] 유리 같은 느낌의 20면체 (Icosahedron) */}
            <mesh ref={outerRef}>
                {/* Scaled x15 from original 0.8 -> 12 */}
                <icosahedronGeometry args={[12, 0]} />
                <meshPhysicalMaterial
                    color="#aaddff"
                    transparent
                    opacity={0.2}
                    roughness={0}
                    metalness={0.8}
                    wireframe={true}
                />
            </mesh>

            {/* [내핵] 형상 변경 및 재질 설정 */}
            <mesh ref={innerRef}>
                {/* 더 복잡하고 유기적인 형태인 'TorusKnot'(매듭) 사용 */}
                {/* Scaled x15 from [0.3, 0.1, 64, 8, 2, 3] -> [4.5, 1.5, 64, 8, 2, 3] */}
                <torusKnotGeometry args={[4.5, 1.5, 64, 8, 2, 3]} />
                <meshStandardMaterial
                    color="#ffffff"
                    emissiveIntensity={1.5}
                    roughness={0.2}
                    metalness={0.8}
                />
            </mesh>
        </group>
    );
};

export default HoloCore;
