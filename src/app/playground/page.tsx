"use client";

import type { Viewport } from 'next';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Camera, Music, Heart, Users, ArrowRight, ArrowLeft, Globe, Smartphone, Box, Type, Drum, Sparkles, HelpCircle, Music2, Play, Square, Clock } from 'lucide-react';
import ReelPanSlider from '@/components/playground/ReelPanSlider';

/*
export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
};
*/

const translations = {
    en: {
        titlePrefix: "Reel",
        titleSuffix: "Pan",
        subtitleStart: "Turn your ",
        subtitleDing: "Ding",
        subtitleMiddle: " into a ",
        subtitleThing: "Thing!",
        heroTitle: "Your Pocket Handpan",
        heroSubtitle: "Catch the Fleeting Melodies Before They Fade",
        heroDescription1: "No physical handpan? No problem. ReelPan is a \"digital handpan recorder\" designed to easily visualize and document your musical ideas.",
        heroDescription2: "With just your smartphone, you can turn your unique handpan melodies into videos—anytime, anywhere.",
        card1Title: "31 Scale Library",
        card1Description: "From the popular D Kurd to the trendy Pygmy! Access a library of 31 diverse handpan scales and switch between them freely as you play digitally.",
        card2Title: "9:16 Reels/Shorts",
        card2Description: "Create performance videos in a 9:16 ratio, optimized for mobile platforms like Reels and Shorts, without any extra editing. A 1:1 square format is also available.",
        card3Title: "430 Stainless Steel Sound",
        card3Description: "We've created digital audio based on harmonic principles, capturing the unique resonance and tone of actual SUS430 handpan sounds.",
        howToUseTitle: "Easy Steps",
        step1Title: "Create",
        step1Description: "Click the 'Create Reel' button on the home screen to enter the studio.",
        step2Title: "Select Scale",
        step2Description: "Tap the 'scale name' at the top of the studio to open the Scale Panel. Here, you can directly choose from various handpan scales that are difficult to play in real life. With just one button, the instrument's vibe changes instantly.",
        step3Title: "Record",
        step3Description: "Touch the handpan on the screen and practice freely. Once you're ready, press the record button and start playing. Your melody becomes a performance video in real-time. You can also adjust the aspect ratio and accompaniment to suit your needs.",
        step4Title: "Save & Share",
        step4Description: "When you finish recording, you can immediately download the result as a video file (MP4) or share it via messenger/SNS. You can freely use it for archiving, educational materials, secondary creation, and more.",
        versatileFeaturesTitle: "Versatile Features",
        feature1Title: "Emotional Memo",
        feature1Description: "Play new melodies discovered in the gaps of daily life, capturing those fleeting moments of emotion in a handpan video.",
        feature2Title: "Scale Simulator",
        feature2Description: "Test before you buy. Play various scales digitally to find your perfect match risk-free.",
        feature3Title: "Educational Materials",
        feature3Description: "Create visual lesson guides. Explain patterns and melodies intuitively for your students.",
        feature4Title: "Secondary Creation",
        feature4Description: "The created reel video is not the end, but the beginning. Add and process your own creative ideas to recreate it into your own unique content.",
        uiFeaturesTitle: "UI Features",
        uiFeature1Title: "Show/Hide Labels",
        uiFeature1Description: "You can show or hide the pitch and note numbers on the tone fields.",
        uiFeature2Title: "Layout Mode",
        uiFeature2Description: "Switch between vertical (9:16) and square (1:1) layouts to suit your needs.",
        uiFeature3Title: "Start/Stop Recording",
        uiFeature3Description: "Press the red button in the center to start or stop recording your performance.",
        uiFeature4Title: "Drum & Chord Accompaniment",
        uiFeature4Description: "Enrich your performance by adding simple drum or chord backing tracks. Long press the button for more options.",
        description: "ReelPan is a creative tool designed to instantly transform digital handpan performances into high-quality vertical reels ready for sharing.",
        cta: "Create Reel",
        chips: {
            community: "Community Vibes",
            visuals: "3D Visuals",
            audio: "Studio Audio",
            free: "Free Forever"
        },
        footer: "Mindforge Labs • Crafted with 🧡",
        footerCTAText: "Capture the small inspirations in your daily life, and don't let them slip away—record them with",
        footerCTABrand: "ReelPan",
        footerCTAEnd: ".",
        sliderItems: [
            { title: "Inspiration", subtitle: "ReelPan", image: "/images/digipan/12notes_mutant.png" },
            { title: "Connect", subtitle: "ReelPan", image: "/images/digipan/10notes.png" },
            { title: "Record", subtitle: "ReelPan", image: "/images/digipan/9notes.png" },
            { title: "Share", subtitle: "ReelPan", image: "/images/digipan/12notes_mutant.png" },
            { title: "Digital Asset", subtitle: "ReelPan", image: "/images/digipan/10notes.png" }
        ]
    },
    ko: {
        titlePrefix: "Reel",
        titleSuffix: "Pan",
        subtitleStart: "당신의 ",
        subtitleDing: "Ding",
        subtitleMiddle: "을 ",
        subtitleThing: "Thing",
        subtitleEnd: "으로!",
        heroTitle: "내 손안의 디지털 핸드팬",
        heroSubtitle: "날아가는 순간의 멜로디를 붙잡다",
        heroDescription1: "실물 핸드팬이 없어도 괜찮습니다. ReelPan은 당신의 음악적 아이디어를 가장 간편하게 시각화하고 기록할 수 있는 '디지털 연주 기록 도구'입니다.",
        heroDescription2: "스마트폰만 있다면 언제 어디서든, 나만의 핸드팬 멜로디를 연주영상으로 저장할 수 있습니다.",
        card1Title: "31 스케일 라이브러리",
        card1Description: "대중적인 D Kurd부터 트렌디한 Pygmy까지! 31개의 다양한 핸드팬 스케일을 디지털로 자유롭게 변경해가며 연주해 볼 수 있습니다.",
        card2Title: "9:16 릴스/쇼츠 포맷",
        card2Description: "별도의 편집 없이도 릴스, 숏츠 등 모바일 환경에 최적화된 9:16 비율의 연주영상을 생성합니다. 1:1 정사각형 포맷도 제공합니다.",
        card3Title: "430 스테인레스 사운드",
        card3Description: "실제 SUS430 핸드팬 소리 특유의 공명과 음색을 하모닉스 원리에 기반하여 디지털 음원으로 제작했습니다.",
        howToUseTitle: "심플한 사용법",
        step1Title: "새 릴스 만들기",
        step1Description: "홈 화면의 '새 릴스 만들기' 버튼을 클릭하여 스튜디오에 입장합니다.",
        step2Title: "스케일 탐색",
        step2Description: "스튜디오 상단의 '스케일 이름'을 터치하면, 스케일 선택 패널이 등장합니다. 이곳에서 실제로는 연주해보기 어려운 다양한 스케일의 핸드팬들을 직접 골라보세요. 버튼 하나로 악기 분위기가 즉시 바뀝니다.",
        step3Title: "연주 및 녹화",
        step3Description: "화면 속 핸드팬을 터치하며 자유롭게 연습하세요. 준비 후 녹화 버튼을 누르면고 연주를 시작하면, 당신의 멜로디가 실시간으로 연주영상이 됩니다. 화면비율과 반주도 용도에 맞게 설정할 수 있습니다.",
        step4Title: "영상 저장 & 공유",
        step4Description: "녹화를 마치면 결과물을 즉시 영상파일(MP4)로 다운로드 하거나, 메신저/SNS로 공유할 수 있습니다. 아카이빙, 교육자료, 2차 창작 등에 자유롭게 사용할 수 있습니다.",
        versatileFeaturesTitle: "실용적인 도구",
        feature1Title: "감성메모",
        feature1Description: "일상의 틈새에서 발견한 새로운 멜로디를 연주하며, 스쳐 지나갈 수 있는 그 순간의 감흥을 한 편의 핸드팬 영상으로 남깁니다.",
        feature2Title: "스케일 시뮬레이션",
        feature2Description: "고가의 악기를 구매하기 전, 다양한 스케일을 미리 연주해보며 내 취향에 딱 맞는 음계를 실패 없이 찾아보세요.",
        feature3Title: "교육자료 제작",
        feature3Description: "멜로디, 연주패턴과 같은 아이디어를 교육용 영상자료로 제작해, 수강생들에게 더 직관적인 가이드를 편리하게 제공하세요.",
        feature4Title: "2차 창작",
        feature4Description: "제작된 릴스 영상은 끝이 아닌 시작입니다. 당신만의 창의적인 아이디어를 더하고 가공하여, 나만의 고유한 콘텐츠로 재창조해 보세요.",
        uiFeaturesTitle: "UI 기능 설명",
        uiFeature1Title: "라벨 표시/숨김",
        uiFeature1Description: "톤필드의 피치와 노트번호를 표시하거나 숨길 수 있습니다.",
        uiFeature2Title: "레이아웃 모드",
        uiFeature2Description: "세로형(9:16)과 정사각형(1:1) 레이아웃을 전환할 수 있습니다.",
        uiFeature3Title: "녹화 시작/정지",
        uiFeature3Description: "중앙의 빨간 버튼을 눌러 연주를 녹화하거나 정지할 수 있습니다.",
        uiFeature4Title: "드럼 & 화음 반주",
        uiFeature4Description: "심플한 드럼/화음 반주를 더하여 연주를 더욱 풍부하게 만들 수 있습니다. 버튼을 길게 눌러보세요.",
        description: "릴팬 ReelPan은 디지털 핸드팬 연주를 즉시 공유 가능한 고품질 세로형 릴스 영상으로 변환해주는 창작 도구입니다.",
        cta: "새로 만들기",
        chips: {
            community: "커뮤니티 바이브",
            visuals: "3D 비주얼",
            audio: "스튜디오 오디오",
            free: "평생 무료"
        },
        footer: "마인드포지 랩스 • 장인정신으로 🧡",
        footerCTAText: "당신의 일상 속 작은 영감, 이제",
        footerCTABrand: "ReelPan",
        footerCTAEnd: "으로 놓치지 말고 기록하세요.",
        sliderItems: [
            { title: "영감", subtitle: "ReelPan", image: "/images/digipan/12notes_mutant.png" },
            { title: "접속", subtitle: "ReelPan", image: "/images/digipan/10notes.png" },
            { title: "녹화", subtitle: "ReelPan", image: "/images/digipan/9notes.png" },
            { title: "공유", subtitle: "ReelPan", image: "/images/digipan/12notes_mutant.png" },
            { title: "디지털 자산", subtitle: "ReelPan", image: "/images/digipan/10notes.png" }
        ]
    }
};

export default function PlaygroundHome() {
    const [lang, setLang] = useState<'ko' | 'en'>('ko');
    const t = translations[lang];

    const screen2Ref = useRef<HTMLDivElement>(null);
    const screen1Ref = useRef<HTMLDivElement>(null);

    const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
        ref.current?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="h-dvh w-screen overflow-x-auto snap-x snap-mandatory flex overflow-y-hidden bg-slate-950 text-white selection:bg-cyan-500 selection:text-white">

            {/* Language Toggle - Fixed Position */}
            <button
                onClick={() => setLang(lang === 'ko' ? 'en' : 'ko')}
                className="fixed top-[calc(1.5rem+env(safe-area-inset-top))] right-6 z-50 px-4 py-2 bg-white/5 backdrop-blur-md rounded-full text-sm font-bold text-slate-300 border border-white/10 shadow-lg hover:bg-white/10 transition-all flex items-center gap-2"
            >
                <Globe size={16} className="text-slate-400" />
                <span className={lang === 'ko' ? 'text-white' : 'text-slate-500'}>KO</span>
                <span className="text-slate-600">|</span>
                <span className={lang === 'en' ? 'text-white' : 'text-slate-500'}>EN</span>
            </button>

            {/* Background Decor - Fixed & Shared (Midnight Resonance) */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                {/* Deep Purple Aurora - moved further off screen on mobile */}
                <div className="absolute top-[-30%] md:top-[-10%] left-[-5%] w-[500px] h-[500px] bg-purple-600/30 rounded-full blur-[120px] mix-blend-screen opacity-50 animate-pulse-slow" />
                {/* Cyan Glow */}
                <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-cyan-600/20 rounded-full blur-[120px] mix-blend-screen opacity-50 animate-pulse-slow delay-1000" />
                {/* Soft Blue Nebulua */}
                <div className="absolute top-[40%] left-[60%] w-[300px] h-[300px] bg-blue-600/20 rounded-full blur-[80px] mix-blend-screen opacity-40" />
            </div>

            {/* Screen 1: Main Landing (No Scroll) */}
            <section ref={screen1Ref} className="w-screen h-dvh flex-shrink-0 snap-center relative z-10 overflow-hidden">

                {/* Main Title - Exact Vertical Center */}
                <h1 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 !text-5xl lg:!text-7xl font-black tracking-tight text-center leading-tight whitespace-nowrap">
                    <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">
                        ReelPan
                    </span>
                </h1>

                {/* Subtitle & CTA - Below Center */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 mt-12 flex flex-col items-center gap-6">
                    <p className="!text-[0.975rem] sm:!text-[1.1375rem] lg:!text-[1.625rem] text-slate-400 font-medium tracking-wide flex items-center gap-2 whitespace-nowrap justify-center">
                        {lang === 'en' ? (
                            <>
                                {t.subtitleStart}<span className="text-cyan-400 font-bold">{t.subtitleDing}</span>
                                {t.subtitleMiddle}<span className="text-purple-400 font-bold">{t.subtitleThing}</span>
                            </>
                        ) : (
                            <span className="font-bold text-slate-300 whitespace-nowrap">
                                오늘도 하나 남겨볼까? <span className="text-2xl inline-block translate-y-1">🤩</span>
                            </span>
                        )}
                    </p>

                    <Link
                        href="/playground/reelpan"
                        className="group relative px-8 py-3.5 bg-white/10 border border-white/20 text-white rounded-full font-bold !text-base lg:!text-lg tracking-wide shadow-[0_0_20px_rgba(6,182,212,0.15)] hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] hover:-translate-y-1 transition-all duration-300 overflow-hidden backdrop-blur-md w-[240px] whitespace-nowrap"
                    >
                        <span className="relative z-10 flex items-center gap-2 justify-center">
                            {t.cta} <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/50 via-purple-600/50 to-cyan-600/50 bg-[length:200%_100%] opacity-0 group-hover:opacity-100 animate-shimmer transition-opacity duration-300" />
                    </Link>

                    {/* 연습모드 버튼 - 연결 기능 추후 구현 */}
                    <button
                        disabled
                        className="group relative px-8 py-3.5 bg-white/10 border border-white/20 text-white rounded-full font-bold !text-base lg:!text-lg tracking-wide shadow-[0_0_20px_rgba(6,182,212,0.15)] transition-all duration-300 overflow-hidden backdrop-blur-md w-[240px] whitespace-nowrap cursor-default pointer-events-none opacity-60"
                    >
                        <span className="relative z-10 flex items-center gap-2 justify-center">
                            {lang === 'ko' ? '연습모드' : 'Practice Room'} <Clock size={18} />
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/50 via-purple-600/50 to-cyan-600/50 bg-[length:200%_100%] opacity-0" />
                    </button>
                </div>

                {/* Navigation Button: Go to Screen 2 */}
                <button
                    onClick={() => scrollToSection(screen2Ref)}
                    className="absolute bottom-10 right-10 p-4 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-cyan-300 border border-white/5 transition-all shadow-lg backdrop-blur-md animate-pulse-slow group"
                    aria-label="Next Page"
                >
                    <HelpCircle size={24} className="group-hover:scale-110 transition-transform" />
                </button>
            </section>

            {/* Screen 2: Service Introduction (Dark Mode) */}
            <section ref={screen2Ref} className="w-screen min-h-dvh flex-shrink-0 snap-center flex flex-col items-center overflow-y-auto relative z-10 bg-slate-950 text-white selection:bg-cyan-500 selection:text-white">

                {/* Navigation Button: Back to Screen 1 */}
                <button
                    onClick={() => scrollToSection(screen1Ref)}
                    className="sticky top-[calc(1.5rem+env(safe-area-inset-top))] self-start ml-6 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white border border-white/5 transition-all shadow-lg backdrop-blur-md"
                    aria-label="Previous Page"
                >
                    <ArrowLeft size={20} />
                </button>

                <div className="w-full max-w-4xl mx-auto px-6 min-h-dvh relative flex items-center justify-center">

                    {/* Hero Section - Flex Column으로 자연스럽게 배치 */}
                    <div className="flex flex-col items-start w-full px-4" style={{ marginTop: '-10vh' }}>

                        {/* 1. 릴팬 타이틀 */}
                        <h2 className="text-3xl md:text-6xl font-bold tracking-tight leading-tight flex flex-col mb-8">
                            <span className="whitespace-nowrap bg-clip-text text-transparent bg-gradient-to-b from-white/50 to-slate-400/50">{t.heroTitle}</span>
                            <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">
                                ReelPan
                            </span>
                        </h2>

                        {/* 2. "일상에서" 중앙 텍스트 */}
                        <p className="text-[1.35rem] md:text-[1.8rem] text-cyan-400 font-medium word-keep text-left mb-8">
                            {lang === 'ko' ? (
                                <>
                                    날아가는 순간의 멜로디를<br className="md:hidden" /> 붙잡다
                                </>
                            ) : (
                                <>
                                    {t.heroSubtitle.split(' ').slice(0, 4).join(' ')}<br className="md:hidden" /> {t.heroSubtitle.split(' ').slice(4).join(' ')}
                                </>
                            )}
                        </p>

                        {/* 3. "물리적인 악기" 설명 */}
                        <div className="text-left">
                            <p className="text-slate-400 leading-relaxed text-[1.2rem] md:text-[1.35rem] break-keep">
                                {lang === 'ko' ? (
                                    <>
                                        실물 핸드팬이 없어도 괜찮습니다. <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">ReelPan</span>은 당신의 음악적 아이디어를 가장 간편하게 시각화하고 기록할 수 있는 <span className="text-white font-semibold">'디지털 연주 기록 도구'</span>입니다.
                                    </>
                                ) : (
                                    <>
                                        {t.heroDescription1.split('ReelPan')[0]}<span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">ReelPan</span>{t.heroDescription1.split('ReelPan')[1]}
                                    </>
                                )}
                            </p>
                            <p className="text-slate-400 leading-relaxed text-[1.2rem] md:text-[1.35rem] break-keep mt-4">
                                {t.heroDescription2}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="w-full max-w-4xl mx-auto px-6 pb-24 -mt-8 md:-mt-12 flex flex-col gap-20 md:gap-32">

                    {/* Section 2: Features (Grid Cards) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Card 3 */}
                        <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-pink-500/30 transition-all duration-500 group">
                            <div className="w-12 h-12 rounded-2xl bg-pink-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Box size={24} className="text-pink-400" />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-slate-100">{t.card3Title}</h3>
                            <p className="text-slate-400 text-[1.05rem] leading-relaxed">
                                {t.card3Description}
                            </p>
                        </div>
                        {/* Card 1 */}
                        <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-all duration-500 group">
                            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Music size={24} className="text-cyan-400" />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-slate-100">{t.card1Title}</h3>
                            <p className="text-slate-400 text-[1.05rem] leading-relaxed">
                                {t.card1Description}
                            </p>
                        </div>
                        {/* Card 2 */}
                        <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-all duration-500 group">
                            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Smartphone size={24} className="text-purple-400" />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-slate-100">{t.card2Title}</h3>
                            <p className="text-slate-400 text-[1.05rem] leading-relaxed">
                                {t.card2Description}
                            </p>
                        </div>
                    </div>

                    {/* Section 3: How to Use (Vertical Stepper) */}
                    <div>
                        <h3 className="text-3xl font-bold text-center mb-12">{t.howToUseTitle}</h3>
                        <div className="relative max-w-2xl mx-auto pl-8 border-l border-white/10 space-y-12">
                            {/* Step 1 */}
                            <div className="relative group">
                                <div className="absolute -left-[41px] w-5 h-5 rounded-full bg-slate-900 border-4 border-emerald-500 group-hover:scale-125 transition-transform" />
                                <div className="space-y-2">
                                    <h4 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">{t.step1Title}</h4>
                                    <p className="text-slate-400">{t.step1Description}</p>
                                </div>
                            </div>
                            {/* Step 2 */}
                            <div className="relative group">
                                <div className="absolute -left-[41px] w-5 h-5 rounded-full bg-slate-900 border-4 border-cyan-500 group-hover:scale-125 transition-transform" />
                                <div className="space-y-2">
                                    <h4 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors">{t.step2Title}</h4>
                                    <p className="text-slate-400">{t.step2Description}</p>
                                </div>
                            </div>
                            {/* Step 3 */}
                            <div className="relative group">
                                <div className="absolute -left-[41px] w-5 h-5 rounded-full bg-slate-900 border-4 border-purple-500 group-hover:scale-125 transition-transform" />
                                <div className="space-y-2">
                                    <h4 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors">{t.step3Title}</h4>
                                    <p className="text-slate-400">{t.step3Description}</p>
                                </div>
                            </div>
                            {/* Step 4 */}
                            <div className="relative group">
                                <div className="absolute -left-[41px] w-5 h-5 rounded-full bg-slate-900 border-4 border-pink-500 group-hover:scale-125 transition-transform" />
                                <div className="space-y-2">
                                    <h4 className="text-xl font-bold text-white group-hover:text-pink-400 transition-colors">{t.step4Title}</h4>
                                    <p className="text-slate-400">{t.step4Description}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 4: Use Cases (Bento Grid) */}
                    <div>
                        <h3 className="text-3xl font-bold text-center mb-12 whitespace-nowrap">{t.versatileFeaturesTitle}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Box 1 */}
                            <div className="p-8 rounded-3xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 hover:scale-[1.015] transition-all duration-500 flex flex-col gap-4">
                                <h4 className="text-xl font-bold text-cyan-200">{t.feature1Title}</h4>
                                <p className="text-slate-400 text-[1.05rem]">{t.feature1Description}</p>
                            </div>
                            {/* Box 2 */}
                            <div className="p-8 rounded-3xl bg-gradient-to-bl from-white/10 to-white/5 border border-white/10 hover:scale-[1.015] transition-all duration-500 flex flex-col gap-4">
                                <h4 className="text-xl font-bold text-purple-200">{t.feature2Title}</h4>
                                <p className="text-slate-400 text-[1.05rem]">{t.feature2Description}</p>
                            </div>
                            {/* Box 3 */}
                            <div className="p-8 rounded-3xl bg-gradient-to-tr from-white/10 to-white/5 border border-white/10 hover:scale-[1.015] transition-all duration-500 flex flex-col gap-4">
                                <h4 className="text-xl font-bold text-pink-200">{t.feature3Title}</h4>
                                <p className="text-slate-400 text-[1.05rem]">{t.feature3Description}</p>
                            </div>
                            {/* Box 4 */}
                            <div className="p-8 rounded-3xl bg-gradient-to-tl from-white/10 to-white/5 border border-white/10 hover:scale-[1.015] transition-all duration-500 flex flex-col gap-4">
                                <h4 className="text-xl font-bold text-emerald-200">{t.feature4Title}</h4>
                                <p className="text-slate-400 text-[1.05rem]">{t.feature4Description}</p>
                            </div>
                        </div>
                    </div>

                    {/* Section 5: UI 기능 설명 */}
                    <div>
                        <h3 className="text-3xl font-bold text-center mb-12 whitespace-nowrap">{t.uiFeaturesTitle}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                            {/* 1. Label Toggle */}
                            <div className="p-6 rounded-3xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 hover:scale-[1.015] transition-all duration-500 flex flex-col items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center">
                                    <Type size={24} className="text-white/80" />
                                </div>
                                <h4 className="text-lg font-bold text-white">{t.uiFeature1Title}</h4>
                                <p className="text-slate-400 text-[1.05rem] text-center">{t.uiFeature1Description}</p>
                            </div>

                            {/* 2. Layout Mode */}
                            <div className="p-6 rounded-3xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 hover:scale-[1.015] transition-all duration-500 flex flex-col items-center gap-4">
                                <div className="flex items-center justify-center gap-3">
                                    <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center">
                                        <span className="text-sm font-bold text-white tracking-widest">9:16</span>
                                    </div>
                                    <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center">
                                        <span className="text-sm font-bold text-white tracking-widest">1:1</span>
                                    </div>
                                </div>
                                <h4 className="text-lg font-bold text-white">{t.uiFeature2Title}</h4>
                                <p className="text-slate-400 text-[1.05rem] text-center">{t.uiFeature2Description}</p>
                            </div>

                            {/* 3. Record Button */}
                            <div className="p-6 rounded-3xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 hover:scale-[1.015] transition-all duration-500 flex flex-col items-center gap-4">
                                <div className="flex items-center justify-center gap-3">
                                    <div className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center">
                                        <div className="w-10 h-10 rounded-full bg-red-500" />
                                    </div>
                                    <div className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center">
                                        <div className="w-10 h-10 rounded-md bg-red-500" />
                                    </div>
                                </div>
                                <h4 className="text-lg font-bold text-white">{t.uiFeature3Title}</h4>
                                <p className="text-slate-400 text-[1.05rem] text-center">{t.uiFeature3Description}</p>
                            </div>

                            {/* 4. Drum & Chord Accompaniment */}
                            <div className="p-6 rounded-3xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 hover:scale-[1.015] transition-all duration-500 flex flex-col items-center gap-4">
                                <div className="flex items-center justify-center gap-3">
                                    <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center">
                                        <Drum size={24} className="text-white/80" />
                                    </div>
                                    <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center">
                                        <Music2 size={24} className="text-white/80" />
                                    </div>
                                </div>
                                <h4 className="text-lg font-bold text-white">{t.uiFeature4Title}</h4>
                                <p className="text-slate-400 text-[1.05rem] text-center">{t.uiFeature4Description}</p>
                            </div>
                        </div>
                    </div>

                    {/* Section 6: Footer (CTA) */}
                    <div className="text-center py-12 border-t border-white/10">
                        <p className="text-xl text-slate-300 font-medium tracking-wide">
                            <span className="bg-clip-text text-transparent bg-gradient-to-b from-white/70 to-slate-400/70">{t.footerCTABrand}</span>
                        </p>
                    </div>

                </div>
            </section>

        </div>
    );
}
