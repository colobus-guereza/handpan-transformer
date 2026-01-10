import React from 'react';
import { Scale } from '@/data/handpanScales';
import { Play } from 'lucide-react';
import { motion } from 'framer-motion';

interface ReelPanHeroProps {
    scale: Scale;
    onPlay: (e: React.MouseEvent, scale: Scale) => void;
    onSelect: (scale: Scale) => void;
    lang?: 'ko' | 'en';
}

export default function ReelPanHero({ scale, onPlay, onSelect, lang = 'ko' }: ReelPanHeroProps) {
    if (!scale) return null;

    const nickname = lang === 'en' ? (scale.nicknameEn || scale.nameEn) : (scale.nickname || scale.name);
    const subName = lang === 'en' ? scale.nameEn || scale.name : scale.name;
    const desc = lang === 'en' ? scale.descriptionEn : scale.description;

    // Generate gradient based on mood vector
    // minorMajor: -1 (Dark/Blue) ~ 0 (Green/Teal) ~ 1 (Bright/Orange)
    const mood = scale.vector?.minorMajor || 0;

    let gradient = '';
    if (mood < -0.5) {
        // Deep Minor (Night, Purple, Deep Blue)
        gradient = 'radial-gradient(circle at 30% 20%, #4a1d96 0%, #0f172a 60%, #000000 100%)';
    } else if (mood < 0) {
        // Soft Minor (Teal, Forest)
        gradient = 'radial-gradient(circle at 30% 20%, #115e59 0%, #0f172a 60%, #000000 100%)';
    } else if (mood < 0.5) {
        // Neutral / Major-Minor (Green, Gold)
        gradient = 'radial-gradient(circle at 30% 20%, #b45309 0%, #2f1c10 60%, #000000 100%)';
    } else {
        // Bright Major (Orange, Yellow, Blue Sky)
        gradient = 'radial-gradient(circle at 30% 20%, #ea580c 0%, #431407 60%, #000000 100%)';
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full relative aspect-[16/10] md:aspect-[21/9] rounded-[40px] overflow-hidden shadow-2xl mb-8 group cursor-pointer"
            onClick={() => onSelect(scale)}
            style={{
                background: gradient
            }}
        >
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-500" />

            <div className="absolute inset-0 p-8 flex flex-col justify-end items-start md:p-12">
                <div className="mb-2 inline-flex items-center px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10">
                    <span className="text-xs font-medium text-white/80 uppercase tracking-widest">Today's Pick</span>
                </div>

                <h1 className="text-4xl md:text-6xl font-black text-white mb-2 leading-tight tracking-tight shadow-sm">
                    {nickname}
                </h1>

                <div className="flex items-center gap-4 mb-6">
                    <span className="text-lg md:text-xl text-white/80 font-medium tracking-wide">
                        {subName}
                    </span>
                    <div className="h-1 w-1 rounded-full bg-white/50" />
                    <span className="text-sm md:text-base text-white/60 line-clamp-1 max-w-[200px] md:max-w-none">
                        {desc}
                    </span>
                </div>

                <button
                    onClick={(e) => onPlay(e, scale)}
                    className="flex items-center gap-3 px-8 py-4 bg-white text-black rounded-full font-bold text-lg hover:scale-105 active:scale-95 transition-transform duration-200 shadow-[0_0_40px_rgba(255,255,255,0.3)]"
                >
                    <Play fill="currentColor" size={24} />
                    <span>Watch Preview</span>
                </button>
            </div>

            {/* Decorative Elements */}
            <div className="absolute top-8 right-8 text-white/10">
                <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="10" />
                </svg>
            </div>
        </motion.div>
    );
}
