"use client";

import type { Viewport } from 'next';
import { useState, useRef } from 'react';
import Link from 'next/link';
import { Camera, Music, Heart, Users, ArrowRight, ArrowLeft, Globe, Smartphone, Box } from 'lucide-react';
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
        cta: "릴스 만들기",
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
                <h1 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 !text-5xl lg:!text-7xl font-black tracking-tight text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.15)] text-center leading-tight whitespace-nowrap">
                    Reel<span className="!text-cyan-400 lg:!text-transparent lg:!bg-clip-text lg:!bg-gradient-to-r from-cyan-400 to-purple-400">Pan</span>
                </h1>

                {/* Subtitle & CTA - Below Center */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 mt-12 flex flex-col items-center gap-6">
                    <p className="!text-sm lg:!text-xl text-slate-400 font-medium tracking-wide flex items-center gap-2 flex-wrap justify-center">
                        {lang === 'en' ? (
                            <>
                                {t.subtitleStart}<span className="text-cyan-400 font-bold">{t.subtitleDing}</span>
                                {t.subtitleMiddle}<span className="text-purple-400 font-bold">{t.subtitleThing}</span>
                            </>
                        ) : (
                            <span className="font-bold text-slate-300">
                                오늘도 하나 남겨볼까? <span className="text-2xl inline-block translate-y-1">📹</span>
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
                    <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
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

                    {/* Center Quote - 화면 정중앙 고정 */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full px-4 z-10">
                        <p className="text-lg md:text-2xl text-cyan-400 font-medium word-keep text-left">
                            "일상에서 영감이 왔을 때,<br className="md:hidden" /> 모바일 영상으로 바로 남길 수 있다면?"
                        </p>
                    </div>

                    {/* Section 1: Hero - Title Above Center (30px 위) */}
                    <div className="absolute left-1/2 transform -translate-x-1/2 text-left w-full px-4" style={{ bottom: 'calc(50% + 30px + 1.5rem)' }}>
                        <h2 className="text-3xl md:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400 leading-tight flex flex-col">
                            <span className="whitespace-nowrap">내 손안의 디지털 핸드팬</span>
                            <span>ReelPan</span>
                        </h2>
                    </div>

                    {/* Section 1: Hero - Description Below Center (30px 아래) */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 text-left w-full px-4" style={{ top: 'calc(50% + 30px + 1.5rem)' }}>
                        <p className="text-slate-400 leading-relaxed text-base md:text-lg break-keep">
                            물리적인 악기가 없어도 괜찮습니다. ReelPan은 당신의 음악적 아이디어를 가장 간편하게 시각화하고 기록할 수 있는 <span className="text-white font-semibold">'디지털 연주 기록 도구'</span>입니다.
                        </p>
                        <p className="text-slate-400 leading-relaxed text-base md:text-lg break-keep mt-4">
                            무거운 악기 대신 스마트폰이나 PC만 있다면, 언제 어디서든 당신만의 멜로디를 영상으로 저장할 수 있습니다.
                        </p>
                    </div>
                </div>

                <div className="w-full max-w-4xl mx-auto px-6 pb-24 flex flex-col gap-20 md:gap-32">

                    {/* Section 2: Features (Grid Cards) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Card 1 */}
                        <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-colors group">
                            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Music size={24} className="text-cyan-400" />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-slate-100">31 스케일 라이브러리</h3>
                            <p className="text-slate-400 text-[1.05rem] leading-relaxed">
                                대중적인 D Kurd부터 트렌디한 Pygmy, Amara까지! 31개의 다양한 핸드팬 스케일을 디지털로 자유롭게 변경해가며 연주해 볼 수 있습니다.
                            </p>
                        </div>
                        {/* Card 2 */}
                        <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-colors group">
                            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Smartphone size={24} className="text-purple-400" />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-slate-100">세로형 숏폼(9:16) 최적화</h3>
                            <p className="text-slate-400 text-[1.05rem] leading-relaxed">
                                별도의 편집 없이도 릴스(Reels), 숏츠(Shorts) 등 모바일 환경에 최적화된 9:16 비율의 연주 영상을 생성합니다. 1:1 정사각형 포맷도 제공합니다.
                            </p>
                        </div>
                        {/* Card 3 */}
                        <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-pink-500/30 transition-colors group">
                            <div className="w-12 h-12 rounded-2xl bg-pink-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Box size={24} className="text-pink-400" />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-slate-100">아이디어를 곧바로 콘텐츠로</h3>
                            <p className="text-slate-400 text-[1.05rem] leading-relaxed">
                                머릿속에서 맴돌던 멜로디를 놓치지 마세요. 당신의 영감을 터치 몇 번만으로 시각과 청각이 결합된 특별한 영상 콘텐츠로 간편하게 완성할 수 있습니다.
                            </p>
                        </div>
                    </div>

                    {/* Section 3: How to Use (Vertical Stepper) */}
                    <div>
                        <h3 className="text-3xl font-bold text-center mb-12">심플한 사용 방법</h3>
                        <div className="relative max-w-2xl mx-auto pl-8 border-l border-white/10 space-y-12">
                            {/* Step 1 */}
                            <div className="relative group">
                                <div className="absolute -left-[41px] w-5 h-5 rounded-full bg-slate-900 border-4 border-cyan-500 group-hover:scale-125 transition-transform" />
                                <div className="space-y-2">
                                    <h4 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors">스케일 탐색</h4>
                                    <p className="text-slate-400">실제로는 연주해보기 어려운 다양한 스케일의 핸드팬들을 직접 골라보세요. 버튼 하나로 악기 분위기가 즉시 바뀝니다.</p>
                                </div>
                            </div>
                            {/* Step 2 */}
                            <div className="relative group">
                                <div className="absolute -left-[41px] w-5 h-5 rounded-full bg-slate-900 border-4 border-purple-500 group-hover:scale-125 transition-transform" />
                                <div className="space-y-2">
                                    <h4 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors">연주 및 녹화</h4>
                                    <p className="text-slate-400">화면 속 핸드팬을 두드리며 자유롭게 연주하세요. 준비 후 녹화 버튼을 누르면, 당신의 터치 타이밍과 멜로디가 실시간으로 영상에 담깁니다. 반주기능으로 멜로디를 보다 선명하게 만들어보세요.</p>
                                </div>
                            </div>
                            {/* Step 3 */}
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
                        <h3 className="font-bold text-center mb-12 whitespace-nowrap" style={{ fontSize: 'clamp(1.25rem, 4vw, 1.875rem)' }}>일상에서 이렇게 활용해 보세요</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Box 1 */}
                            <div className="p-8 rounded-3xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex flex-col gap-4">
                                <h4 className="text-xl font-bold text-cyan-200">나만의 음악 스케치북</h4>
                                <p className="text-slate-400 text-[1.05rem]">이동 중인 버스나 잠들기 전, 문득 떠오른 멜로디가 휘발되기 전에 영상 메모로 스케치해 두세요.</p>
                            </div>
                            {/* Box 2 */}
                            <div className="p-8 rounded-3xl bg-gradient-to-bl from-white/10 to-white/5 border border-white/10 flex flex-col gap-4">
                                <h4 className="text-xl font-bold text-purple-200">스케일 학습 및 시뮬레이션</h4>
                                <p className="text-slate-400 text-[1.05rem]">새로운 핸드팬을 구매하기 전, 31가지 스케일을 미리 연주해보며 내 취향에 맞는 음계가 무엇인지 파악하는 교육용 도구로 활용할 수 있습니다.</p>
                            </div>
                            {/* Box 3 */}
                            <div className="p-8 rounded-3xl bg-gradient-to-tr from-white/10 to-white/5 border border-white/10 flex flex-col gap-4">
                                <h4 className="text-xl font-bold text-pink-200">연주 패턴 기록 (Logging)</h4>
                                <p className="text-slate-400 text-[1.05rem]">연습 중인 리듬이나 타법 패턴을 시각적인 영상으로 기록하여, 텍스트 악보로는 표현하기 힘든 느낌을 저장해 두세요.</p>
                            </div>
                            {/* Box 4 */}
                            <div className="p-8 rounded-3xl bg-gradient-to-tl from-white/10 to-white/5 border border-white/10 flex flex-col gap-4">
                                <h4 className="text-xl font-bold text-emerald-200">디지털 창작물 자산화</h4>
                                <p className="text-slate-400 text-[1.05rem]">내가 만든 멜로디를 디지털 파일로 차곡차곡 모아, 나만의 음악 라이브러리(Digital Asset)를 구축할 수 있습니다.</p>
                            </div>
                        </div>
                    </div>

                    {/* Section 5: Footer (CTA) */}
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
