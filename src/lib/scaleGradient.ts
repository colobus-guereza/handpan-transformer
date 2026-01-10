import { Scale } from '@/data/handpanScales';

/**
 * 간단한 문자열 해시 함수 (일관된 "랜덤" 값 생성)
 */
function hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // 32bit 정수로 변환
    }
    return Math.abs(hash);
}

/**
 * 스케일의 vector 값을 기반으로 HSL 색상 쌍을 생성
 * 
 * minorMajor → Hue (색조)
 * - -1.0 (Deep Minor): 차가운 색상 (파랑/보라 220-280°)
 * - +1.0 (Bright Major): 따뜻한 색상 (노랑/오렌지 30-60°)
 * 
 * pureSpicy → Saturation (채도)
 * - 0.0 (Pure): 낮은 채도 40-55%
 * - 1.0 (Spicy): 높은 채도 65-85%
 * 
 * rarePopular → Lightness (명도)
 * - 0.0 (Rare): 어두운 15-22%
 * - 1.0 (Popular): 밝은 22-32%
 */
export function getScaleColors(scale: Scale): { primary: string; secondary: string } {
    const { minorMajor, pureSpicy, rarePopular } = scale.vector;

    // Hue: minorMajor 기반
    // -1 → 250 (보라/파랑), 0 → 180 (청록), +1 → 40 (골드/오렌지)
    const normalizedMM = (minorMajor + 1) / 2; // 0 ~ 1
    let hue: number;
    if (normalizedMM < 0.5) {
        // Minor side: 280 → 200 (보라 → 시안)
        hue = 280 - (normalizedMM * 2) * 80;
    } else {
        // Major side: 60 → 30 (노랑 → 오렌지)
        hue = 60 - ((normalizedMM - 0.5) * 2) * 30;
    }

    // Saturation: pureSpicy 기반 (30% ~ 55%) - pastel range
    const saturation = 30 + pureSpicy * 25;

    // Lightness: rarePopular 기반 (75% ~ 88%) - high lightness for pastel
    const lightness = 75 + rarePopular * 13;

    // Hash for variation: 동일 스케일에 일관된 변형
    const hash = hashString(scale.id);
    const hueVariation = (hash % 16) - 8; // -8 ~ +8
    const satVariation = (hash % 8) - 4;  // -4 ~ +4

    const finalHue = (hue + hueVariation + 360) % 360;
    const finalSat = Math.min(60, Math.max(25, saturation + satVariation));

    // Transparency: semi-transparent for background visibility
    const alpha = 0.65;

    // Primary: 기본 색상
    const primary = `hsla(${finalHue}, ${finalSat}%, ${lightness}%, ${alpha})`;

    // Secondary: 살짝 다른 색조 (그라데이션용)
    const secondaryHue = (finalHue + 25 + (hash % 15)) % 360;
    const secondaryLightness = Math.max(65, lightness - 10);
    const secondary = `hsla(${secondaryHue}, ${finalSat * 0.9}%, ${secondaryLightness}%, ${alpha})`;

    return { primary, secondary };
}

/**
 * 스케일에 대한 완전한 CSS 그라데이션 문자열 생성 (방사형, 선형 등 다양화)
 */
export function generateScaleGradient(scale: Scale): string {
    const { primary, secondary } = getScaleColors(scale);
    const hash = hashString(scale.id);

    // 0: Linear, 1: Radial
    const typeChoice = hash % 2;

    if (typeChoice === 0) {
        // Diagonal Linear
        const angles = [45, 135, 225, 315, 160, 200];
        const angle = angles[hash % angles.length];
        return `linear-gradient(${angle}deg, ${primary} 0%, ${secondary} 100%)`;
    } else {
        // Radial
        const positions = [
            "circle at top left",
            "circle at center",
            "circle at bottom right",
            "ellipse at top",
            "circle at 30% 30%",
        ];
        const pos = positions[hash % positions.length];
        return `radial-gradient(${pos}, ${primary} 0%, ${secondary} 100%)`;
    }
}

/**
 * 스케일에 대한 호버 시 사용할 약간 더 선명한 파스텔 그라데이션 생성
 */
export function generateScaleGradientHover(scale: Scale): string {
    const { primary, secondary } = getScaleColors(scale);
    const hash = hashString(scale.id);

    // Hover state: increase opacity and slightly adjust lightness
    const hoverAlpha = 0.85;

    // Helper to adjust alpha in hsla string
    const makeHover = (hsla: string) => hsla.replace(/[\d.]+\)$/, `${hoverAlpha})`);

    const hPrimary = makeHover(primary);
    const hSecondary = makeHover(secondary);

    const typeChoice = hash % 2;

    if (typeChoice === 0) {
        const angles = [45, 135, 225, 315, 160, 200];
        const angle = angles[hash % angles.length];
        return `linear-gradient(${angle}deg, ${hPrimary} 0%, ${hSecondary} 100%)`;
    } else {
        const positions = [
            "circle at top left",
            "circle at center",
            "circle at bottom right",
            "ellipse at top",
            "circle at 30% 30%",
        ];
        const pos = positions[hash % positions.length];
        return `radial-gradient(${pos}, ${hPrimary} 0%, ${hSecondary} 100%)`;
    }
}

