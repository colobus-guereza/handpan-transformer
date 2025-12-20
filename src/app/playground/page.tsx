"use client";

import type { Viewport } from 'next';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Camera, Music, Heart, Users, ArrowRight, ArrowLeft, Globe, Smartphone, Box, Type, Drum, Sparkles, HelpCircle, Music2, Play } from 'lucide-react';
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
        description: "ReelPan is a creative tool designed to instantly transform digital handpan performances into high-quality vertical reels ready for sharing.",
        cta: "Create Reel",
        chips: {
            community: "Community Vibes",
            visuals: "3D Visuals",
            audio: "Studio Audio",
            free: "Free Forever"
        },
        footer: "Mindforge Labs • Crafted with 🧡",
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
        description: "릴팬 ReelPan은 디지털 핸드팬 연주를 즉시 공유 가능한 고품질 세로형 릴스 영상으로 변환해주는 창작 도구입니다.",
        cta: "새 릴스 만들기",
        chips: {
            community: "커뮤니티 바이브",
            visuals: "3D 비주얼",
            audio: "스튜디오 오디오",
            free: "평생 무료"
        },
        footer: "마인드포지 랩스 • 장인정신으로 🧡",
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
                        className="group relative px-8 py-3.5 bg-white/10 border border-white/20 text-white rounded-full font-bold !text-base lg:!text-lg tracking-wide shadow-[0_0_20px_rgba(6,182,212,0.15)] hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] hover:-translate-y-1 transition-all duration-300 overflow-hidden backdrop-blur-md"
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            {t.cta} <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/50 via-purple-600/50 to-cyan-600/50 bg-[length:200%_100%] opacity-0 group-hover:opacity-100 animate-shimmer transition-opacity duration-300" />
                    </Link>
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
                            <span className="whitespace-nowrap bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">내 손안의 디지털 핸드팬</span>
                            <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">
                                ReelPan
                            </span>
                        </h2>

                        {/* 2. "일상에서" 중앙 텍스트 */}
                        <p className="text-[1.35rem] md:text-[1.8rem] text-cyan-400 font-medium word-keep text-left mb-8">
                            "영감이 찾아왔을 때,<br className="md:hidden" /> 즉시 폰으로 기록할 수 있다면?"
                        </p>

                        {/* 3. "물리적인 악기" 설명 */}
                        <div className="text-left">
                            <p className="text-slate-400 leading-relaxed text-[1.2rem] md:text-[1.35rem] break-keep">
                                실물 핸드팬이 없어도 괜찮습니다. <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">ReelPan</span>은 당신의 음악적 아이디어를 가장 간편하게 시각화하고 기록할 수 있는 <span className="text-white font-semibold">'디지털 연주 기록 도구'</span>입니다.
                            </p>
                            <p className="text-slate-400 leading-relaxed text-[1.2rem] md:text-[1.35rem] break-keep mt-4">
                                스마트폰만 있다면, 언제 어디서든 나만의 핸드팬 멜로디를 영상으로 저장할 수 있습니다.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="w-full max-w-4xl mx-auto px-6 pb-24 -mt-8 md:-mt-12 flex flex-col gap-20 md:gap-32">

                    {/* Section 2: Features (Grid Cards) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Card 1 */}
                        <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-all duration-500 group">
                            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Music size={24} className="text-cyan-400" />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-slate-100">31 스케일 라이브러리</h3>
                            <p className="text-slate-400 text-[1.05rem] leading-relaxed">
                                대중적인 D Kurd부터 트렌디한 Pygmy, Amara까지! 31개의 다양한 핸드팬 스케일을 디지털로 자유롭게 변경해가며 연주해 볼 수 있습니다.
                            </p>
                        </div>
                        {/* Card 2 */}
                        <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-all duration-500 group">
                            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Smartphone size={24} className="text-purple-400" />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-slate-100">세로형 숏폼(9:16)</h3>
                            <p className="text-slate-400 text-[1.05rem] leading-relaxed">
                                별도의 편집 없이도 릴스, 숏츠 등 모바일 환경에 최적화된 9:16 비율의 연주 영상을 생성합니다. 1:1 정사각형 포맷도 제공합니다.
                            </p>
                        </div>
                        {/* Card 3 */}
                        <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-pink-500/30 transition-all duration-500 group">
                            <div className="w-12 h-12 rounded-2xl bg-pink-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Box size={24} className="text-pink-400" />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-slate-100">영감을 즉시 컨텐츠로</h3>
                            <p className="text-slate-400 text-[1.05rem] leading-relaxed">
                                머릿속에서 맴돌던 멜로디를 놓치지 마세요. 당신의 영감을 터치 몇 번만으로 시각과 청각이 결합된 특별한 영상 콘텐츠로 간편하게 완성할 수 있습니다.
                            </p>
                        </div>
                    </div>

                    {/* Section 3: How to Use (Vertical Stepper) */}
                    <div>
                        <h3 className="text-3xl font-bold text-center mb-12">심플한 사용법</h3>
                        <div className="relative max-w-2xl mx-auto pl-8 border-l border-white/10 space-y-12">
                            {/* Step 1 */}
                            <div className="relative group">
                                <div className="absolute -left-[41px] w-5 h-5 rounded-full bg-slate-900 border-4 border-emerald-500 group-hover:scale-125 transition-transform" />
                                <div className="space-y-2">
                                    <h4 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">새 릴스 만들기</h4>
                                    <p className="text-slate-400">새로운 영상을 만들기 위해서 '릴스 만들기' 버튼을 클릭합니다.</p>
                                </div>
                            </div>
                            {/* Step 2 */}
                            <div className="relative group">
                                <div className="absolute -left-[41px] w-5 h-5 rounded-full bg-slate-900 border-4 border-cyan-500 group-hover:scale-125 transition-transform" />
                                <div className="space-y-2">
                                    <h4 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors">스케일 탐색</h4>
                                    <p className="text-slate-400">스튜디오 상단의 '스케일 이름'을 터치하면, 스케일 선택 패널이 등장합니다. 이곳에서 실제로는 연주해보기 어려운 다양한 스케일의 핸드팬들을 직접 골라보세요. 버튼 하나로 악기 분위기가 즉시 바뀝니다.</p>
                                </div>
                            </div>
                            {/* Step 3 */}
                            <div className="relative group">
                                <div className="absolute -left-[41px] w-5 h-5 rounded-full bg-slate-900 border-4 border-purple-500 group-hover:scale-125 transition-transform" />
                                <div className="space-y-2">
                                    <h4 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors">연주 및 녹화</h4>
                                    <p className="text-slate-400">화면 속 핸드팬을 두드리며 자유롭게 연습하세요. 준비 후 녹화 버튼을 누르면고 연주를 시작하면, 당신의 멜로디가 실시간으로 영상에 담깁니다.</p>
                                </div>
                            </div>
                            {/* Step 4 */}
                            <div className="relative group">
                                <div className="absolute -left-[41px] w-5 h-5 rounded-full bg-slate-900 border-4 border-pink-500 group-hover:scale-125 transition-transform" />
                                <div className="space-y-2">
                                    <h4 className="text-xl font-bold text-white group-hover:text-pink-400 transition-colors">영상 저장 & 공유</h4>
                                    <p className="text-slate-400">연주가 끝나면 결과물을 즉시 영상파일(MP4)로 다운로드 하거나, SNS로 공유할 수 있습니다. 아카이빙, 교육자료, 2차 가공 등에 자유롭게 사용할 수 있습니다.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 4: Use Cases (Bento Grid) */}
                    <div>
                        <h3 className="text-3xl font-bold text-center mb-12 whitespace-nowrap">실용적인 도구</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Box 1 */}
                            <div className="p-8 rounded-3xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 hover:scale-[1.015] transition-all duration-500 flex flex-col gap-4">
                                <h4 className="text-xl font-bold text-cyan-200">영감 아카이빙 & SNS 공유</h4>
                                <p className="text-slate-400 text-[1.05rem]">일상에서 문득 떠오른 멜로디를 즉시 영상으로 포착하고, 릴스나 숏츠로 공유해 나의 고유한 감성을 기록하세요.</p>
                            </div>
                            {/* Box 2 */}
                            <div className="p-8 rounded-3xl bg-gradient-to-bl from-white/10 to-white/5 border border-white/10 hover:scale-[1.015] transition-all duration-500 flex flex-col gap-4">
                                <h4 className="text-xl font-bold text-purple-200">스케일 시뮬레이션</h4>
                                <p className="text-slate-400 text-[1.05rem]">고가의 악기를 구매하기 전, 다양한 스케일을 미리 연주해보며 내 취향에 딱 맞는 음계를 실패 없이 찾아보세요.</p>
                            </div>
                            {/* Box 3 */}
                            <div className="p-8 rounded-3xl bg-gradient-to-tr from-white/10 to-white/5 border border-white/10 hover:scale-[1.015] transition-all duration-500 flex flex-col gap-4">
                                <h4 className="text-xl font-bold text-pink-200">교육자를 위한 레슨 자료 제작</h4>
                                <p className="text-slate-400 text-[1.05rem]">멜로디, 연주패턴과 같은 아이디어를 교육용 영상자료로 제작해, 수강생들에게 더 직관적인 가이드를 편리하게 제공하세요.</p>
                            </div>
                            {/* Box 4 */}
                            <div className="p-8 rounded-3xl bg-gradient-to-tl from-white/10 to-white/5 border border-white/10 hover:scale-[1.015] transition-all duration-500 flex flex-col gap-4">
                                <h4 className="text-xl font-bold text-emerald-200">2차 창작을 위한 디지털 소스</h4>
                                <p className="text-slate-400 text-[1.05rem]">제작된 릴스 영상은 끝이 아닌 시작입니다. 당신만의 창의적인 아이디어를 더하고 가공하여, 원본을 뛰어넘는 완전히 새로운 콘텐츠로 재창조해 보세요.</p>
                            </div>
                        </div>
                    </div>

                    {/* Section 5: UI 기능 설명 */}
                    <div>
                        <h3 className="text-3xl font-bold text-center mb-12 whitespace-nowrap">UI 기능 설명</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                            {/* 1. Label Toggle */}
                            <div className="p-6 rounded-3xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 hover:scale-[1.015] transition-all duration-500 flex flex-col items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center">
                                    <Type size={24} className="text-white/80" />
                                </div>
                                <h4 className="text-lg font-bold text-white">라벨 표시/숨김</h4>
                                <p className="text-slate-400 text-[1.05rem] text-center">톤필드의 피치와 노트번호를 표시하거나 숨길 수 있습니다.</p>
                            </div>

                            {/* 2. Layout Mode */}
                            <div className="p-6 rounded-3xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 hover:scale-[1.015] transition-all duration-500 flex flex-col items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center">
                                    <span className="text-sm font-bold text-white tracking-widest">9:16</span>
                                </div>
                                <h4 className="text-lg font-bold text-white">레이아웃 모드</h4>
                                <p className="text-slate-400 text-[1.05rem] text-center">세로형(9:16)과 정사각형(1:1) 레이아웃을 전환할 수 있습니다.</p>
                            </div>

                            {/* 3. Record Button */}
                            <div className="p-6 rounded-3xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 hover:scale-[1.015] transition-all duration-500 flex flex-col items-center gap-4">
                                <div className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center">
                                    <div className="w-10 h-10 rounded-full bg-red-500" />
                                </div>
                                <h4 className="text-lg font-bold text-white">녹화 시작/정지</h4>
                                <p className="text-slate-400 text-[1.05rem] text-center">중앙의 빨간 버튼을 눌러 연주를 녹화하거나 정지할 수 있습니다.</p>
                            </div>

                            {/* 4. Drum Accompaniment */}
                            <div className="p-6 rounded-3xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 hover:scale-[1.015] transition-all duration-500 flex flex-col items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center">
                                    <Drum size={24} className="text-white/80" />
                                </div>
                                <h4 className="text-lg font-bold text-white">드럼 반주</h4>
                                <p className="text-slate-400 text-[1.05rem] text-center">심플한 드럼반주를 더하여 연주를 더욱 풍부하게 만들 수 있습니다. 아이콘을 길게 클릭해보세요.</p>
                            </div>

                            {/* 5. Chord Pad (화음 반주) */}
                            <div className="p-6 rounded-3xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 hover:scale-[1.015] transition-all duration-500 flex flex-col items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center">
                                    <Music2 size={24} className="text-white/80" />
                                </div>
                                <h4 className="text-lg font-bold text-white">화음 반주</h4>
                                <p className="text-slate-400 text-[1.05rem] text-center">화음반주를 추가하여 연주를 더욱 풍부하게 만들 수 있습니다. 버튼을 길게 눌러보세요.</p>
                            </div>
                        </div>
                    </div>

                    {/* Section 6: Footer (CTA) */}
                    <div className="text-center py-12 border-t border-white/10">
                        <p className="text-xl text-slate-300 font-medium tracking-wide">
                            당신의 일상 속 작은 영감, 이제 <span className="text-white font-bold">ReelPan</span>으로 놓치지 말고 기록하세요.
                        </p>
                    </div>

                </div>
            </section>

        </div>
    );
}
