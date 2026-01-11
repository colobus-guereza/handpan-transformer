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

    // 3. Saturation: pureSpicy 기반 (70% ~ 100%) - 상향 조정
    const saturation = 70 + pureSpicy * 30;

    // 4. Lightness: rarePopular 기반 (50% ~ 75%) - 상향 조정 (너무 어둡지 않게)
    const lightness = 50 + (1 - rarePopular) * 25;

    const hash = hashString(scale.id);
    const hueVariation = (hash % 20) - 10;

    finalHue = (finalHue + hueVariation + 360) % 360;
    const finalSat = Math.min(100, Math.max(50, saturation));

    // 5. Alpha (투명도): 0.85로 상향 조정 (배경이 비쳐서 어두워지는 현상 방지)
    const alpha = 0.85;

    // [Fine-tuning] D Kurd: Midnight Serenity (고요한 한밤중) - 밝기 상향
    if (scale.name.includes('D Kurd')) {
        const primary = `hsla(227, 55%, 35%, ${alpha})`;   // 중심: Deep Navy -> 조금 더 밝게
        const secondary = `hsla(191, 75%, 75%, ${alpha})`; // 외곽: Moonlight Blue -> 더 밝게
        return { primary, secondary };
    }

    // [Fine-tuning] E Equinox: Twilight Horizon (여명의 지평선 - 매직 아워)
    if (scale.name.includes('E Equinox')) {
        const primary = `hsla(247, 70%, 63%, ${alpha})`;   // 중심: Soft Iris (#6c5ce7)
        const secondary = `hsla(339, 97%, 74%, ${alpha})`; // 외곽: Dawn Pink (#fd79a8)
        return { primary, secondary };
    }

    // [Fine-tuning] Deep Ethnic: 신비롭고 이국적인 붉은 보라 ~ 와인빛 (기본 베이스)
    if (scale.name.includes('Rasavali')) {
        const primary = `hsla(347, 88%, 37%, ${alpha})`;   // 중심: Chili Red (#b20a2c) - Spicy Masala 테마
        const secondary = `hsla(48, 89%, 50%, ${alpha})`;  // 외곽: Turmeric Gold (#f1c40f)
        return { primary, secondary };
    }

    if (scale.name.includes('Saladin')) {
        const primary = `hsla(22, 100%, 41%, ${alpha})`;   // 중심: Burnt Sienna (#d35400) - Ancient Sand 테마
        const secondary = `hsla(28, 80%, 52%, ${alpha})`;  // 외곽: Sand Dune (#e67e22)
        return { primary, secondary };
    }

    if (scale.name.includes('La Sirena')) {
        const primary = `hsla(245, 39%, 28%, ${alpha})`;   // 중심: Deep Violet Blue (#302b63) - Mystic Ocean 테마
        const secondary = `hsla(187, 72%, 50%, ${alpha})`;  // 외곽: Mermaid Scales (#24c6dc)
        return { primary, secondary };
    }

    if (scale.name.includes('Romanian Hijaz')) {
        const primary = `hsla(335, 65%, 55%, ${alpha})`;   // 신비로운 와인 레드
        const secondary = `hsla(355, 60%, 40%, ${alpha})`; // 깊은 딥 레드
        return { primary, secondary };
    }

    // [Fine-tuning] Sapphire: Royal Blue Gem (로열 블루 사파이어) - Brightness Boost
    if (scale.name.includes('Sapphire')) {
        const primary = `hsla(220, 90%, 30%, ${alpha})`;   // 중심: Royal Blue (너무 어둡지 않게 8% -> 30%)
        const secondary = `hsla(190, 100%, 60%, ${alpha})`; // 외곽: Cyan Sparkle (50% -> 60%)
        return { primary, secondary };
    }

    // [Fine-tuning] Annaziska: Mystic Violet (신비의 보라)
    if (scale.name.includes('Annaziska')) {
        const primary = `hsla(296, 85%, 35%, ${alpha})`;   // 신비로운 임페리얼 바이올렛
        const secondary = `hsla(312, 45%, 65%, ${alpha})`;  // 몽환적인 연보라
        return { primary, secondary };
    }

    // [Fine-tuning] Hijaz: Desert Sunset (사막의 붉은 노을)
    if (scale.name.includes('Hijaz')) {
        const primary = `hsla(0, 85%, 35%, ${alpha})`;    // 뜨거운 블러드 레드
        const secondary = `hsla(28, 90%, 55%, ${alpha})`;  // 사막의 황토빛/사프란
        return { primary, secondary };
    }

    // [Fine-tuning] Amara: Celtic Mist (켈틱의 안개) - Brightness Boost
    if (scale.name.includes('Amara')) {
        const primary = `hsla(220, 15%, 40%, ${alpha})`;   // 중심: Slate Grey (24% -> 40%)
        const secondary = `hsla(217, 89%, 70%, ${alpha})`; // 외곽: Misty Blue (61% -> 70%)
        return { primary, secondary };
    }

    // [Fine-tuning] Aegean: Mediterranean Aqua (지중해의 물빛)
    if (scale.name.includes('Aegean')) {
        const primary = `hsla(201, 80%, 55%, ${alpha})`;   // 청량한 마린 블루
        const secondary = `hsla(177, 85%, 85%, ${alpha})`;  // 외곽: Foam White/Aqua Mint (#b9f2f0)
        return { primary, secondary };
    }

    // [Fine-tuning] Yunsl: Sparkling Ocean (빛나는 바다) - Ocean Blue to Sunlit Reflection
    if (scale.name.includes('Yunsl')) {
        const primary = `hsla(213, 100%, 50%, ${alpha})`;  // 중심: Bright Ocean (#0072ff)
        const secondary = `hsla(60, 100%, 95%, ${alpha})`; // 외곽: Sunlit Reflection (#fffde4)
        return { primary, secondary };
    }

    // [Fine-tuning] Annapurna: Himalayan Sky (히말라야의 하늘) - Ice Blue to Pale Sky
    if (scale.name.includes('Annapurna')) {
        const primary = `hsla(204, 64%, 44%, ${alpha})`;   // 중심: Deep Sky Blue (#2980b9)
        const secondary = `hsla(195, 92%, 70%, ${alpha})`; // 외곽: Ice/Light Sky Blue (#6dd5fa)
        return { primary, secondary };
    }

    // [Fine-tuning] D Asha Group: Radiant Sunshine (찬란한 햇살) - Vivid Gold to Lemon White
    if (scale.name.includes('D Asha')) {
        const primary = `hsla(48, 100%, 55%, ${alpha})`;  // 중심: Vivid Gold (해바라기색)
        const secondary = `hsla(60, 100%, 90%, ${alpha})`; // 외곽: Lemon White (빛이 폭발하는 느낌)
        return { primary, secondary };
    }

    // [Fine-tuning] C Major 10: Fresh Mint (상쾌한 민트)
    if (scale.name.includes('C Major')) {
        const primary = `hsla(175, 80%, 33%, ${alpha})`;   // 중심: Teal/Blue-Green (#11998e)
        const secondary = `hsla(143, 85%, 58%, ${alpha})`; // 외곽: Spring Green/Lime (#38ef7d)
        return { primary, secondary };
    }


    // [Fine-tuning] Blues Group: Neon Tension (네온 텐션) - Tritone Vibe
    if (scale.name.includes('Blues')) {
        const primary = `hsla(260, 100%, 44%, ${alpha})`;  // 중심: Deep Burgundy/Purple (#4a00e0)
        const secondary = `hsla(324, 100%, 50%, ${alpha})`; // 외곽: Hot Pink/Neon (#ff0099)
        return { primary, secondary };
    }

    // [Fine-tuning] Eb Muju: Winds of Muju (무주의 바람) - Nature Green
    if (scale.name.includes('Muju')) {
        const primary = `hsla(85, 85%, 65%, ${alpha})`;   // 상큼한 연두 (Fresh Lime)
        const secondary = `hsla(110, 80%, 55%, ${alpha})`; // 싱그러운 풀색 (Fresh Grass)
        return { primary, secondary };
    }


    // [Fine-tuning] Pygmy Group: Misty Deep Forest (안개 낀 심연의 숲)
    if (scale.name.includes('Pygmy')) {
        const pAlpha = 0.6; // 피그미 그룹만 투명도 상향 (색감 강조)
        const primary = `hsla(194, 55%, 25%, ${pAlpha})`;   // 채도 상향 (35% -> 55%)
        const secondary = `hsla(198, 50%, 35%, ${pAlpha})`; // 채도 상향 (38% -> 50%)
        return { primary, secondary };
    }

    // [Fine-tuning] Aeolian Group: Vintage Burgundy & Amber - Brightness Boost
    if (scale.name.includes('Aeolian')) {
        const primary = `hsla(337, 50%, 35%, ${alpha})`;   // 중심: Deep Merlot (20% -> 35%)
        const secondary = `hsla(32, 70%, 75%, ${alpha})`;  // 외곽: Muted Gold (70% -> 75%)
        return { primary, secondary };
    }

    // [Fine-tuning] Nordlys: Aurora Borealis (오로라 보레알리스) - Balanced for visibility
    if (scale.name.includes('Nordlys')) {
        const primary = `hsla(152, 80%, 40%, ${alpha})`;   // 중심: Neon Aurora -> Deeper Green (100% -> 80% Sat, 50% -> 40% Light)
        const secondary = `hsla(186, 85%, 65%, ${alpha})`;  // 외곽: Cyan Glow -> Soft Cyan (100% -> 85% Sat, 69% -> 65% Light)
        return { primary, secondary };
    }

    // [Fine-tuning] Deepasia: Ink Wash (수묵담채) - Brightness Boost
    if (scale.name.includes('Deepasia')) {
        const primary = `hsla(0, 0%, 40%, ${alpha})`;    // 중심: Charcoal (26% -> 40%)
        const secondary = `hsla(230, 20%, 98%, ${alpha})`; // 외곽: Rice Paper
        return { primary, secondary };
    }

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

    // E Equinox 특수 비율 적용 (청보라 비율 상향)
    if (scale.name.includes('E Equinox')) {
        return `radial-gradient(${pos}, ${primary} 0%, ${primary} 40%, ${secondary} 100%)`;
    }

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

    // E Equinox 특수 비율 적용 (청보라 비율 상향)
    if (scale.name.includes('E Equinox')) {
        return `radial-gradient(${pos}, ${hPrimary} 0%, ${hPrimary} 40%, ${hSecondary} 100%)`;
    }

    return `radial-gradient(${pos}, ${hPrimary} 0%, ${hSecondary} 100%)`;
}

