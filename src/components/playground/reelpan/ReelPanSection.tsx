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

const getScaleBackgroundImage = (scaleName: string): string | null => {
    const name = scaleName.toLowerCase();

    // Mapping keywords to filenames
    if (name.includes('kurd')) return '/images/scales/kurd.png';
    if (name.includes('pygmy')) return '/images/scales/pygmy.png';
    if (name.includes('aeolian')) return '/images/scales/aeolian.png';
    if (name.includes('annapurna')) return '/images/scales/annapurna.png';
    if (name.includes('asha')) return '/images/scales/asha.png';
    if (name.includes('equinox')) return '/images/scales/equinox.png';
    if (name.includes('sirena')) return '/images/scales/lasirena.png';
    if (name.includes('nordlys')) return '/images/scales/nordlys.png';
    if (name.includes('romanian')) return '/images/scales/romanianhijaz.png';
    if (name.includes('hijaz')) return '/images/scales/hijaz.png';
    if (name.includes('saladin')) return '/images/scales/saladin.png';
    if (name.includes('major')) return '/images/scales/major.png';
    if (name.includes('muju')) return '/images/scales/muju.png';
    if (name.includes('aegean')) return '/images/scales/aegean.png';
    if (name.includes('amara')) return '/images/scales/amara.png';
    if (name.includes('annaziska')) return '/images/scales/annaziska.png';
    if (name.includes('blues')) return '/images/scales/blues.png';
    if (name.includes('deepasia')) return '/images/scales/deepasia.png';
    if (name.includes('rasavali')) return '/images/scales/rasavali.png';
    if (name.includes('sapphire')) return '/images/scales/sapphire.png';
    if (name.includes('yunsl')) return '/images/scales/yunsl.png';

    return null;
};

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
                    const bgImage = getScaleBackgroundImage(scale.name);

                    return (
                        <div
                            key={scale.id}
                            onClick={() => onSelect(scale)}
                            className="snap-start shrink-0 w-[160px] flex flex-col gap-2 cursor-pointer group"
                        >
                            {/* Card Image/Gradient Area - Unique per scale */}
                            <div
                                className="w-full aspect-square rounded-2xl border border-white/[0.08] group-hover:border-white/25 transition-all overflow-hidden relative shadow-md bg-cover bg-center"
                                style={{
                                    background: bgImage ? `url(${bgImage})` : gradient,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center'
                                }}
                            >
                                {/* Hover Gradient Layer */}
                                <div
                                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                    style={{ background: hoverGradient }}
                                />

                                {/* Subtle inner glow overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-white/[0.1] pointer-events-none" />

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
