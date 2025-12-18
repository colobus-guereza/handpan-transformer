
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface PlanetCoreProps {
    isIdle: boolean;
}

const PlanetCore = ({ isIdle }: PlanetCoreProps) => {
    const groupRef = useRef<THREE.Group>(null);
    const coreRef = useRef<THREE.Mesh>(null);
    const ring1Ref = useRef<THREE.Mesh>(null);
    const ring2Ref = useRef<THREE.Mesh>(null);

    // 상태 전환 애니메이션 목표값
    const targetScale = isIdle ? 1 : 0;

    useFrame((state, delta) => {
        if (!groupRef.current) return;

        // 1. [등장/퇴장] 부드러운 스케일링 (Lerp)
        const currentScale = groupRef.current.scale.x;
        // 0.1 속도로 목표 크기로 접근
        const nextScale = THREE.MathUtils.lerp(currentScale, targetScale, 0.1);

        // 최적화: 너무 작아지면 렌더링 끄기
        if (nextScale < 0.01) {
            groupRef.current.visible = false;
            if (targetScale === 0) return;
        } else {
            groupRef.current.visible = true;
        }
        groupRef.current.scale.set(nextScale, nextScale, nextScale);

        // 2. [움직임 & 색상] 애니메이션 로직
        const t = state.clock.getElapsedTime();

        // A. 전체 그룹 부유 효과 (둥둥 뜨기)
        // Adapted for Digipan (Z-up altitude)
        // Base Z: 30, Amp: 5
        groupRef.current.position.z = 30 + Math.sin(t * 1.5) * 5;
        groupRef.current.position.x = 0;
        groupRef.current.position.y = 0;

        // B. 색상 순환 (Core) - 살아있는 느낌
        if (coreRef.current) {
            // 코어 자체 회전
            coreRef.current.rotation.y = t * 0.5;

            // 색상 변경: 시간(t)에 따라 색조(Hue) 360도 회전
            const hue = (t * 0.15) % 1;
            const color = new THREE.Color().setHSL(hue, 1, 0.6); // 채도 100%, 명도 60%

            const mat = coreRef.current.material as THREE.MeshStandardMaterial;
            if (mat) {
                mat.color = color;
                mat.emissive = color;
            }
        }

        // C. 궤도(Ring) 회전 - 첨단 기술 느낌
        // 고리들은 서로 다른 축과 속도로 회전시켜 입체감 극대화
        if (ring1Ref.current) {
            ring1Ref.current.rotation.x = Math.sin(t * 0.5) * 0.5; // X축으로 끄덕거리듯 회전
            ring1Ref.current.rotation.y = t * 0.4; // Y축 회전
        }

        if (ring2Ref.current) {
            ring2Ref.current.rotation.x = Math.PI / 2 + Math.cos(t * 0.5) * 0.5; // 90도 꺾인 상태에서 흔들림
            ring2Ref.current.rotation.y = -t * 0.3; // 반대 방향 회전
        }
    });

    return (
        <group ref={groupRef} position={[0, 0, 30]}>
            {/* 주변을 은은하게 밝히는 광원 (코어 색상과 별개로 cyan 유지 or 제거 가능) 
                User requested white light in snippet
            */}
            <pointLight distance={50} intensity={isIdle ? 1.5 : 0} color="#ffffff" decay={2} />

            {/* 1. [Core] 행성 본체 (구) */}
            <mesh ref={coreRef}>
                {/* SphereGeometry args: [반지름, 가로세그먼트, 세로세그먼트] */}
                {/* Scaled x15: 0.35 -> 5.5 */}
                <sphereGeometry args={[5.5, 32, 32]} />
                <meshStandardMaterial
                    roughness={0.3}
                    metalness={0.8}
                    emissiveIntensity={1.2} // 자체 발광 강도
                />
            </mesh>

            {/* 2. [Ring 1] 첫 번째 궤도 */}
            <mesh ref={ring1Ref}>
                {/* TorusGeometry args: [고리반지름, 튜브두께, 방사형세그먼트, 튜브세그먼트] */}
                {/* Scaled x15: 0.6 -> 9, 0.015 -> 0.25 */}
                <torusGeometry args={[9, 0.25, 16, 100]} />
                <meshStandardMaterial
                    color="#ffffff"
                    emissive="#ffffff"
                    emissiveIntensity={0.5}
                    roughness={0}
                    metalness={1}
                />
            </mesh>

            {/* 3. [Ring 2] 두 번째 궤도 (약간 더 크게) */}
            <mesh ref={ring2Ref}>
                {/* Scaled x15: 0.8 -> 12, 0.01 -> 0.15 */}
                <torusGeometry args={[12, 0.15, 16, 100]} />
                <meshStandardMaterial
                    color="#aaddff"
                    transparent
                    opacity={0.6}
                    roughness={0}
                    metalness={1}
                />
            </mesh>
        </group>
    );
};

export default PlanetCore;
