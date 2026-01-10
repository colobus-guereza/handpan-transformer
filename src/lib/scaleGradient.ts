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
/**
 * 스케일의 vector 값을 기반으로 더욱 풍부하고 구체적인 HSL 색상 쌍을 생성
 */
export function getScaleColors(scale: Scale): { primary: string; secondary: string } {
    const { minorMajor, pureSpicy, rarePopular } = scale.vector;

    // 1. Hue (색조): minorMajor (-1.0 ~ 1.0) 기반으로 넓은 스펙트럼 매핑
    // -1.0 (Deep Minor): 240 (Deep Blue)
    // -0.5 (Melancholic): 280 (Violet/Purple)
    //  0.0 (Neutral/Hybrid): 180 (Teal/Emerald)
    //  0.5 (Major): 120 (Soft Green)
    //  1.0 (Bright Major): 45 (Gold/Warm Orange)

    let hue: number;
    if (minorMajor <= -0.5) {
        // -1.0 to -0.5: Deep Blue to Violet
        const t = (minorMajor + 1) / 0.5; // 0 to 1
        hue = 240 + t * 40;
    } else if (minorMajor <= 0) {
        // -0.5 to 0: Violet to Teal
        const t = (minorMajor + 0.5) / 0.5; // 0 to 1
        hue = 280 - t * 100;
    } else if (minorMajor <= 0.5) {
        // 0 to 0.5: Teal to Green
        const t = minorMajor / 0.5; // 0 to 1
        hue = 180 - t * 60;
    } else {
        // 0.5 to 1.0: Green to Gold
        const t = (minorMajor - 0.5) / 0.5; // 0 to 1
        hue = 120 - t * 75;
    }

    // 2. Saturation (채도): pureSpicy (0.0 ~ 1.0) 기반 (50% ~ 95%)
    // 소리가 화려할수록(Spicy) 더 선명한 색상
    const saturation = 50 + pureSpicy * 45;

    // 3. Lightness (명도): rarePopular (0.0 ~ 1.0) 기반 (40% ~ 65%)
    // 파스텔톤에서 벗어나 색상 고유의 농도가 느껴지도록 하향 조절
    const lightness = 40 + (1 - rarePopular) * 25;

    // Hash for consistent variation
    const hash = hashString(scale.id);
    const hueVariation = (hash % 20) - 10; // -10 ~ +10

    const finalHue = (hue + hueVariation + 360) % 360;
    const finalSat = Math.min(100, Math.max(30, saturation));

    // 4. Alpha (투명도): 전체 배경이 잘 보이도록 하향 조절 (0.3 ~ 0.4)
    const alpha = 0.35;

    // Primary: 기본 색상
    const primary = `hsla(${finalHue}, ${finalSat}%, ${lightness}%, ${alpha})`;

    // Secondary: 색상환에서 약간 떨어진 색상 (풍부한 그라데이션을 위해)
    const secondaryHue = (finalHue + 40 + (hash % 30)) % 360;
    const secondarySat = Math.max(40, finalSat * 0.8);
    const secondaryLight = Math.max(30, lightness - 15);
    const secondary = `hsla(${secondaryHue}, ${secondarySat}%, ${secondaryLight}%, ${alpha})`;

    return { primary, secondary };
}

/**
 * 스케일에 대한 방사형(Radial) 그라데이션 생성
 */
export function generateScaleGradient(scale: Scale): string {
    const { primary, secondary } = getScaleColors(scale);
    const hash = hashString(scale.id);

    const positions = [
        "circle at 30% 30%",
        "circle at 70% 30%",
        "circle at 50% 50%",
        "ellipse at 50% 0%",
        "circle at 20% 80%",
    ];
    const pos = positions[hash % positions.length];

    return `radial-gradient(${pos}, ${primary} 0%, ${secondary} 100%)`;
}

/**
 * 스케일에 대한 호버 시 더욱 선명한 방사형 그라데이션 생성
 */
export function generateScaleGradientHover(scale: Scale): string {
    const colors = getScaleColors(scale);
    const hash = hashString(scale.id);

    // Hover state: increase opacity and slightly increase saturation/lightness
    const hoverAlpha = 0.6;

    const makeHover = (hsla: string) => hsla.replace(/[\d.]+\)$/, `${hoverAlpha})`);

    const hPrimary = makeHover(colors.primary);
    const hSecondary = makeHover(colors.secondary);

    const positions = [
        "circle at 30% 30%",
        "circle at 70% 30%",
        "circle at 50% 50%",
        "ellipse at 50% 0%",
        "circle at 20% 80%",
    ];
    const pos = positions[hash % positions.length];

    return `radial-gradient(${pos}, ${hPrimary} 0%, ${hSecondary} 100%)`;
}

