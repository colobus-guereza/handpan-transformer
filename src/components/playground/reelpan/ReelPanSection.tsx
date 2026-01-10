import React, { useRef } from 'react';
import { Scale } from '@/data/handpanScales';
import { Play } from 'lucide-react';
import { motion } from 'framer-motion';

interface ReelPanSectionProps {
    title: string;
    scales: Scale[];
    onSelect: (scale: Scale) => void;
    onPreview: (e: React.MouseEvent, scale: Scale) => void;
    currentScaleId?: string;
    previewingScaleId?: string | null;
    lang?: 'ko' | 'en';
}

export default function ReelPanSection({
    title,
    scales,
    onSelect,
    onPreview,
    currentScaleId,
    previewingScaleId,
    lang = 'ko'
}: ReelPanSectionProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    return (
        <div className="w-full mb-10">
            <h2 className="text-2xl font-bold text-white mb-4 px-2 flex items-center gap-2">
                {title}
            </h2>

            <div
                ref={scrollContainerRef}
                className="flex gap-4 overflow-x-auto pb-4 px-2 snap-x snap-mandatory hide-scrollbar"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {scales.map((scale) => {
                    const isSelected = scale.id === currentScaleId;
                    const isPreviewing = scale.id === previewingScaleId;
                    const nickname = lang === 'en' ? (scale.nicknameEn || scale.nameEn) : (scale.nickname || scale.name);

                    // Minimal gradient for cards
                    const mood = scale.vector?.minorMajor || 0;
                    let cardBg = '';
                    if (mood < -0.3) cardBg = 'bg-slate-900/40 border-slate-700/50'; // Minor
                    else if (mood > 0.3) cardBg = 'bg-amber-900/20 border-amber-700/30'; // Major
                    else cardBg = 'bg-emerald-900/20 border-emerald-700/30'; // Neutral

                    return (
                        <div
                            key={scale.id}
                            className={`snap-center shrink-0 w-[240px] md:w-[280px] aspect-[4/3] rounded-[24px] border relative overflow-hidden group cursor-pointer transition-all duration-300 ${cardBg} ${isSelected ? 'ring-2 ring-white/50 scale-[1.02]' : 'hover:scale-[1.01] hover:bg-white/5'}`}
                            onClick={() => onSelect(scale)}
                        >
                            <div className="absolute inset-0 p-5 flex flex-col justify-between">
                                <div>
                                    <h3 className={`text-lg font-bold leading-tight mb-1 ${isSelected ? 'text-white' : 'text-white/90'}`}>
                                        {nickname}
                                    </h3>
                                    <p className="text-xs text-white/50 font-medium">
                                        {lang === 'en' ? scale.nameEn || scale.name : scale.name}
                                    </p>
                                </div>

                                <div className="flex items-end justify-between">
                                    <div className="flex gap-1">
                                        {/* Simple visualization of notes or tags */}
                                        <span className="text-[10px] px-2 py-1 rounded-full bg-black/20 text-white/40">
                                            {scale.notes.top.length + scale.notes.bottom.length + 1} Notes
                                        </span>
                                    </div>

                                    <button
                                        onClick={(e) => onPreview(e, scale)}
                                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isPreviewing ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}
                                    >
                                        <Play size={16} fill={isPreviewing ? "currentColor" : "none"} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
