import React from 'react';
import { Scale } from '@/data/handpanScales';
import { Play } from 'lucide-react';
import { generateScaleGradient, generateScaleGradientHover } from '@/lib/scaleGradient';

interface ReelPanSectionProps {
    title: string;
    scales: Scale[];
    onSelect: (scale: Scale) => void;
    lang: 'ko' | 'en';
}

export default function ReelPanSection({ title, scales, onSelect, lang }: ReelPanSectionProps) {
    if (scales.length === 0) return null;

    return (
        <section className="py-6">
            <div className="px-6 mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">{title}</h2>
                <span className="text-xs text-white/40">{scales.length}</span>
            </div>

            <div
                className="flex overflow-x-auto px-6 gap-4 pb-4 snap-x snap-mandatory hide-scrollbar"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {scales.map((scale) => {
                    const nickname = lang === 'ko' ? (scale.nickname || scale.name) : (scale.nicknameEn || scale.nameEn || scale.name);
                    const gradient = generateScaleGradient(scale);
                    const hoverGradient = generateScaleGradientHover(scale);

                    return (
                        <div
                            key={scale.id}
                            onClick={() => onSelect(scale)}
                            className="snap-start shrink-0 w-[160px] flex flex-col gap-2 cursor-pointer group"
                        >
                            {/* Card Image/Gradient Area - Unique per scale */}
                            <div
                                className="w-full aspect-square rounded-2xl border border-white/[0.08] group-hover:border-white/25 transition-all overflow-hidden relative shadow-md"
                                style={{ background: gradient }}
                            >
                                {/* 1. Starry Texture Layer (Enhanced Visibility) */}
                                <div
                                    className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-70 mix-blend-screen pointer-events-none"
                                    style={{ filter: 'contrast(150%) brightness(130%)' }}
                                />

                                {/* 2. Nebula Glow Overlay (Cosmic Atmosphere) */}
                                <div
                                    className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.1] to-transparent opacity-60 mix-blend-overlay pointer-events-none"
                                />

                                {/* 3. Hover Gradient Layer */}
                                <div
                                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 mix-blend-soft-light"
                                    style={{ background: hoverGradient }}
                                />

                                {/* 3. Deep Vignette Overlay (Cosmic Depth) */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10 pointer-events-none" />

                                {/* Play Icon Overlay */}
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                                        <Play size={20} fill="white" className="text-white ml-0.5" />
                                    </div>
                                </div>
                            </div>

                            {/* Text Info */}
                            <div className="text-center">
                                <h3 className="text-sm font-bold text-white/90 truncate group-hover:text-white transition-colors">
                                    {scale.name}
                                </h3>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
