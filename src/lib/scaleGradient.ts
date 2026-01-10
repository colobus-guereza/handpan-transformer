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
 * 제목(별명)의 핵심 단어에서 연상되는 색상을 추출하여 매핑하는 로직
 */
function getSemanticHue(nickname: string): number | null {
    const keywords: Record<string, number> = {
        '열정': 0,      // Red
        '붉은': 5,      // Red
        '사막': 35,     // Orange/Sand
        '희망': 50,     // Gold/Yellow
        '태양': 45,     // Gold
        '숲': 110,      // Forest Green
        '초록': 120,     // Green
        '오로라': 170,   // Teal/Aurora
        '인어': 190,     // Sea Blue
        '바다': 200,     // Blue
        '하늘': 210,     // Sky Blue
        '밤': 240,       // Deep Blue
        '새벽': 260,     // Dark Violet
        '몽환': 285,     // Dreamy Purple
        '신비': 275,     // Mystery Purple
        '쓸쓸함': 220,    // Muted Blue
        '우울': 230,     // Muted Blue
    };

    for (const [key, hue] of Object.entries(keywords)) {
        if (nickname.includes(key)) return hue;
    }
    return null;
}

/**
 * 스케일의 vector 값을 기반으로 더욱 풍부하고 구체적인 HSL 색상 쌍을 생성
 */
export function getScaleColors(scale: Scale): { primary: string; secondary: string } {
    const { minorMajor, pureSpicy, rarePopular } = scale.vector;
    const nickname = scale.nickname || '';

    // 1. Base Hue: vector (minorMajor) 기반 생성
    let vectorHue: number;
    if (minorMajor <= -0.5) vectorHue = 240 + ((minorMajor + 1) / 0.5) * 40;
    else if (minorMajor <= 0) vectorHue = 280 - ((minorMajor + 0.5) / 0.5) * 100;
    else if (minorMajor <= 0.5) vectorHue = 180 - (minorMajor / 0.5) * 60;
    else vectorHue = 120 - ((minorMajor - 0.5) / 0.5) * 75;

    // 2. Semantic Hue: 제목 키워드 기반 색상 추출
    const semanticHue = getSemanticHue(nickname);

    // 두 색상 결합: 키워드가 있으면 키워드 색상을 70% 반영하여 분위기 결정
    let finalHue = vectorHue;
    if (semanticHue !== null) {
        finalHue = (vectorHue * 0.3) + (semanticHue * 0.7);
    }

    // 3. Saturation: pureSpicy 기반 (60% ~ 95%)
    const saturation = 60 + pureSpicy * 35;

    // 4. Lightness: rarePopular 기반 (35% ~ 60%)
    const lightness = 35 + (1 - rarePopular) * 25;

    const hash = hashString(scale.id);
    const hueVariation = (hash % 20) - 10;

    finalHue = (finalHue + hueVariation + 360) % 360;
    const finalSat = Math.min(100, Math.max(40, saturation));

    // 5. Alpha (투명도): 35%로 상향 조정 (시인성 확보)
    const alpha = 0.35;

    // Primary: 기본 색상
    const primary = `hsla(${finalHue}, ${finalSat}%, ${lightness}%, ${alpha})`;

    // Secondary: 색상환에서 30~50도 떨어진 보조 색상 (그라데이션용)
    const secondaryHue = (finalHue + 40 + (hash % 20)) % 360;
    const secondarySat = Math.max(30, finalSat * 0.7);
    const secondaryLight = Math.max(25, lightness - 10);
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
        "ellipse at 50% 20%",
        "circle at 20% 80%",
    ];
    const pos = positions[hash % positions.length];

    return `radial-gradient(${pos}, ${primary} 0%, ${secondary} 100%)`;
}

/**
 * 호버 시 투명도를 살짝 높여 시인성 확보
 */
export function generateScaleGradientHover(scale: Scale): string {
    const colors = getScaleColors(scale);
    const hash = hashString(scale.id);

    const hoverAlpha = 0.4; // 호버 시에는 조금 더 선명하게

    const makeHover = (hsla: string) => hsla.replace(/[\d.]+\)$/, `${hoverAlpha})`);

    const hPrimary = makeHover(colors.primary);
    const hSecondary = makeHover(colors.secondary);

    const positions = [
        "circle at 30% 30%",
        "circle at 70% 30%",
        "circle at 50% 50%",
        "ellipse at 50% 20%",
        "circle at 20% 80%",
    ];
    const pos = positions[hash % positions.length];

    return `radial-gradient(${pos}, ${hPrimary} 0%, ${hSecondary} 100%)`;
}

