import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Volume2 } from 'lucide-react';


import { Scale } from '@/data/handpanScales';

// Color theme definitions with high transparency for subtle glass effect
const COLOR_THEMES = {
    green: {
        gradient: 'linear-gradient(180deg, rgba(30, 42, 31, 0.25) 0%, rgba(20, 26, 20, 0.5) 100%)',
        cardBg: 'rgba(45, 65, 48, 0.35)',           // High transparency for subtle look
        primary: { r: 124, g: 185, b: 124 },        // #7CB97C
        primaryLight: { r: 197, g: 229, b: 197 },   // #C5E5C5
    },
    magenta: {
        gradient: 'linear-gradient(180deg, rgba(42, 30, 42, 0.25) 0%, rgba(26, 20, 26, 0.5) 100%)',
        cardBg: 'rgba(65, 45, 65, 0.35)',           // High transparency for subtle look
        primary: { r: 185, g: 124, b: 185 },        // #B97CB9
        primaryLight: { r: 229, g: 197, b: 229 },   // #E5C5E5
    },
    yellow: {
        gradient: 'linear-gradient(180deg, rgba(45, 40, 30, 0.25) 0%, rgba(26, 24, 15, 0.5) 100%)',
        cardBg: 'rgba(65, 60, 35, 0.35)',           // High transparency for subtle look
        primary: { r: 234, g: 179, b: 8 },           // #EAB308
        primaryLight: { r: 254, g: 240, b: 138 },    // #FEF08A
    },
    red: {
        gradient: 'linear-gradient(180deg, rgba(42, 30, 30, 0.25) 0%, rgba(26, 20, 20, 0.5) 100%)',
        cardBg: 'rgba(65, 45, 45, 0.35)',           // High transparency for subtle look
        primary: { r: 239, g: 68, b: 68 },           // #EF4444
        primaryLight: { r: 252, g: 165, b: 165 },    // #FCA5A5
    },
    ocean: {
        gradient: 'linear-gradient(180deg, rgba(30, 42, 50, 0.25) 0%, rgba(20, 26, 30, 0.5) 100%)',
        cardBg: 'rgba(45, 60, 70, 0.35)',           // High transparency for subtle look
        primary: { r: 56, g: 189, b: 248 },         // #38BDF8 (Sky Blue)
        primaryLight: { r: 186, g: 230, b: 253 },   // #BAE6FD
    },
} as const;

type ColorTheme = keyof typeof COLOR_THEMES;

interface ReelPanHeroProps {
    introScales: Scale[];
    isPreviewing: (scaleId: string) => boolean;
    onPlay: (e: React.MouseEvent, scale: Scale) => void;
    onSelect: (scale: Scale) => void;
    lang: 'ko' | 'en';
    title?: { ko: string; en: string };
    colorTheme?: ColorTheme;
}

export default function ReelPanHero({
    introScales,
    isPreviewing,
    onPlay,
    onSelect,
    lang,
    title = { ko: '가장 자연스러운 시작', en: 'Easy to Start' },
    colorTheme = 'green'
}: ReelPanHeroProps) {
    const theme = COLOR_THEMES[colorTheme];
    const { r, g, b } = theme.primary;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full relative flex flex-col pt-20 pb-6 px-6 overflow-hidden rounded-[28px] shadow-2xl gap-6"
            style={{ background: theme.gradient }}
        >
            {/* Background Texture */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

            {/* Top: Header */}
            <div className="relative z-10 flex flex-col items-start gap-4">
                {/* Title - Hierarchy Level 1 (highest) */}
                <motion.h1
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-[28px] md:text-3xl font-bold leading-[1.3] font-sans"
                    style={{ color: 'rgba(247, 245, 240, 0.95)' }}
                >
                    {lang === 'ko' ? title.ko : title.en}
                </motion.h1>
            </div>

            {/* Bottom: Scale List */}
            <div className="relative z-10 flex flex-col gap-3">
                {introScales.map((scale, index) => (
                    <motion.div
                        key={scale.id}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.3 + (index * 0.1) }}
                    >
                        <IntroScaleCard
                            scale={scale}
                            isPreviewing={isPreviewing(scale.id)}
                            scalePanelLang={lang}
                            onSelect={onSelect}
                            onPreview={onPlay}
                            colorTheme={colorTheme}
                        />
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}

const IntroScaleCard = ({
    scale,
    isPreviewing,
    scalePanelLang,
    onSelect,
    onPreview,
    colorTheme = 'green'
}: {
    scale: Scale;
    isPreviewing: boolean;
    scalePanelLang: 'ko' | 'en';
    onSelect: (scale: Scale) => void;
    onPreview: (e: React.MouseEvent, scale: Scale) => void;
    colorTheme?: ColorTheme;
}) => {
    const theme = COLOR_THEMES[colorTheme];
    const { r, g, b } = theme.primary;
    const light = theme.primaryLight;

    return (
        <div
            className="p-4 rounded-[24px] flex items-center justify-between group transition-all backdrop-blur-sm"
            style={{
                background: theme.cardBg,
                borderTop: `1px solid rgba(${r}, ${g}, ${b}, 0.25)`
            }}
        >
            {/* Scale Name - Hierarchy Level 2 (medium) */}
            <div className="flex flex-col min-w-0 flex-1 mr-2">
                <span className="font-semibold text-base tracking-tight whitespace-nowrap" style={{ color: 'rgba(240, 235, 229, 0.75)' }}>{scale.name}</span>
            </div>
            <div className="flex items-center gap-2">
                {/* Play Preview Button - Icon only, subtle */}
                <button
                    onClick={(e) => onPreview(e, scale)}
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
                    style={{
                        background: 'transparent',
                        color: isPreviewing ? `rgb(${r}, ${g}, ${b})` : `rgba(${light.r}, ${light.g}, ${light.b}, 0.5)`
                    }}
                >
                    {isPreviewing ? (
                        <Volume2 size={18} className="animate-pulse" style={{ filter: `drop-shadow(0 0 6px rgba(${r}, ${g}, ${b}, 0.6))` }} />
                    ) : (
                        <Play size={18} fill="currentColor" style={{ filter: `drop-shadow(0 0 4px rgba(${light.r}, ${light.g}, ${light.b}, 0.2))` }} />
                    )}
                </button>
                {/* Action Button - Hierarchy Level 3 (lowest) */}
                <button
                    onClick={() => onSelect(scale)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all`}
                    style={{
                        background: `linear-gradient(135deg, rgba(${r}, ${g}, ${b}, 0.28), rgba(${r}, ${g}, ${b}, 0.12))`,
                        border: `1px solid rgba(${r}, ${g}, ${b}, 0.55)`,
                        color: `rgba(${r}, ${g}, ${b}, 0.88)`
                    }}
                >
                    <ArrowRightIcon size={18} />
                </button>
            </div>
        </div>
    );
};

// Helper icon for the "Play Now" arrow
function ArrowRightIcon({ size = 24 }: { size?: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
        </svg>
    );
}
