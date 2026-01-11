# 🎨 무드 팔레트 스케일 컬러 매칭 현황
*(Mood Palette Scale Color Matching Status)*

이 문서는 '무드 팔레트'의 각 스케일 카드에 적용된 그라데이션 색상 테마와 로직을 정의합니다.
모든 색상은 `src/lib/scaleGradient.ts` 파일에서 관리됩니다.

---

## 1. 그라데이션 로직 (Gradient Logic)

모든 스케일 카드는 **방사형 그라데이션 (Radial Gradient)**을 기본으로 사용합니다.

```css
background: radial-gradient(
  circle at [Position],  /* 5가지 랜덤 위치 중 하나 (좌상단, 우상단, 중앙 등) */
  [Primary Color] 0%,    /* 중심 색상 */
  [Secondary Color] 100% /* 외곽/배경 색상 */
);
```

*   **기본 투명도 (Alpha)**: `0.85` (별도 표기 없는 경우)
*   **랜덤 위치**: 스케일 ID를 해싱하여 5구역 중 한 곳에 하이라이트가 맺히도록 하여 시각적 단조로움을 피함.

---

## 2. 스케일 그룹별 컬러 테마 (Color Themes)

### 🔵 Blue & Navy Group (차분함, 깊이)

| 스케일 그룹 | 테마명 (Theme) | Primary (중심) | Secondary (외곽) | 비고 |
| :--- | :--- | :--- | :--- | :--- |
| **D Kurd** | *Midnight Serenity* (고요한 한밤중) | **Deep Navy** (짙은 네이비)<br>명도 35% | **Moonlight Blue** (달빛 블루)<br>명도 75% | 깊은 밤하늘 느낌 |
| **Sapphire** | *Royal Blue Gem* (로열 블루 사파이어) | **Royal Blue** (로열 블루)<br>명도 30% | **Cyan Sparkle** (밝은 청록)<br>명도 60% | 보석의 영롱함 강조 |
| **La Sirena** | *Mystic Ocean* (신비의 바다) | **Deep Violet Blue** (보라빛 바다) | **Mermaid Scales** (인어 비늘 청록) | 심해의 신비로움 |
| **Yunsl** | *Sparkling Ocean* (빛나는 바다) | **Bright Ocean** (쨍한 바다색) | **Sunlit Reflection** (윤슬)<br>연한 노랑 | 햇살 비치는 바다 표면 |
| **Annapurna** | *Himalayan Sky* (히말라야의 하늘) | **Deep Sky Blue** (깊은 하늘색) | **Ice Sky Blue** (시린 하늘색) | 고지대의 맑은 공기 |
| **Aegean** | *Mediterranean Aqua* (지중해의 물빛) | **Marine Blue** (마린 블루) | **Aqua Mint** (아쿠아 민트) | 지중해의 청량함 |
| **Amara** | *Celtic Mist* (켈틱의 안개) | **Slate Grey** (슬레이트 그레이)<br>명도 40% | **Misty Blue** (안개 낀 파랑) | 북유럽의 차가운 안개 |

### 🟣 Purple & Pink Group (신비, 몽환)

| 스케일 그룹 | 테마명 (Theme) | Primary (중심) | Secondary (외곽) | 비고 |
| :--- | :--- | :--- | :--- | :--- |
| **E Equinox** | *Twilight Horizon* (여명의 지평선) | **Soft Iris** (연한 붓꽃색)<br>*0%~40% 넓게 분포* | **Dawn Pink** (새벽 핑크) | 해 뜨기 직전의 매직아워 |
| **Annaziska** | *Mystic Violet* (신비의 보라) | **Imperial Violet** (황제 보라) | **Muted Lilac** (몽환적 연보라) | 신비롭고 몽환적인 분위기 |
| **Romanian Hijaz**| *Mystic Wine* (신비로운 와인) | **Mystic Wine Red** (와인 레드) | **Deep Red** (깊은 적색) | 고혹적인 와인빛 |
| **Aeolian** | *Vintage Burgundy* (빈티지 버건디) | **Deep Merlot** (메를로 와인)<br>명도 35% | **Muted Gold** (바랜 금색) | 빛바랜 고풍스러운 느낌 |
| **Blues** | *Neon Tension* (네온 텐션) | **Deep Burgundy** (깊은 버건디) | **Hot Pink** (핫핑크/네온) | 도시적인 긴장감, 재즈 |

### 🔴 Red & Orange Group (열정, 이국적)

| 스케일 그룹 | 테마명 (Theme) | Primary (중심) | Secondary (외곽) | 비고 |
| :--- | :--- | :--- | :--- | :--- |
| **Rasavali** | *Spicy Masala* (스파이시 마살라) | **Chili Red** (칠리 레드) | **Turmeric Gold** (강황 골드) | 인도 향신료의 강렬함 |
| **Saladin** | *Ancient Sand* (고대의 모래) | **Burnt Sienna** (구운 황토) | **Sand Dune** (모래 언덕) | 중동 사막의 모래 |
| **Hijaz** | *Desert Sunset* (사막의 붉은 노을) | **Blood Red** (블러드 레드) | **Saffron Gold** (사프란 골드) | 타오르는 사막의 석양 |

### 🟢 Green & Yellow Group (자연, 희망)

| 스케일 그룹 | 테마명 (Theme) | Primary (중심) | Secondary (외곽) | 비고 |
| :--- | :--- | :--- | :--- | :--- |
| **Pygmy** | *Misty Deep Forest* (안개 낀 숲) | **Deep Forest Green** (깊은 숲)<br>*투명도 0.6* | **Misty Mint** (안개 낀 민트) | 울창한 원시림 |
| **Nordlys** | *Aurora Borealis* (오로라) | **Neon Aurora** (오로라 초록)<br>*Sat 80%, Light 40%* | **Cyan Glow** (형광 시안)<br>*Sat 85%, Light 65%* | 밤하늘의 오로라 (밸런스 조정) |
| **C Major 10** | *Fresh Mint* (상쾌한 민트) | **Teal Green** (청록색) | **Spring Lime** (봄 라임색) | 긍정적이고 상쾌한 기분 |
| **D Major** | *Bright Major* (싱그러운 숲) | **Lime Green** (라임 그린) | **Fresh Green** (푸른 풀색) | 밝고 명랑한 느낌 |
| **D Asha** | *Radiant Sunshine* (찬란한 햇살) | **Vivid Gold** (해바라기색) | **Lemon White** (레몬 화이트) | 희망찬 햇살, 빛 |

### ⚫️ Monochrome Group (무채색, 동양적)

| 스케일 그룹 | 테마명 (Theme) | Primary (중심) | Secondary (외곽) | 비고 |
| :--- | :--- | :--- | :--- | :--- |
| **Deepasia** | *Ink Wash* (수묵담채) | **Charcoal** (먹색)<br>명도 40% | **Rice Paper** (화선지 미색) | 동양적인 수묵화의 여백 |

---

## 3. 업데이트 이력 (History)

*   **2026-01-11**:
    *   초기 컬러 테마 정의 및 적용.
    *   전체 스케일의 **채도(Saturation) +10%**, **명도(Lightness) +15%**, **투명도(Alpha) 0.5 → 0.85** 상향 조정 (가시성 개선).
    *   어두운 계열(Kurd, Sapphire, Aeolian, Amara)의 명도를 개별적으로 대폭 상향하여 검은 배경에서 잘 보이도록 수정.
    *   D Asha, Rasavali 등 특정 스케일의 컨셉(Radiant Sunshine, Spicy Masala) 재정립 및 색상 변경.
