"use client";

import { useRef } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';

interface ReelPanSliderProps {
    items: {
        title: string;
        subtitle: string;
        image: string;
    }[];
}

export default function ReelPanSlider({ items }: ReelPanSliderProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const { current } = scrollContainerRef;
            const scrollAmount = 300; // Adjust scroll amount as needed
            if (direction === 'left') {
                current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            } else {
                current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            }
        }
    };

    return (
        <div className="relative w-full max-w-screen-xl mx-auto px-4 mt-8 group">
            {/* Left Button */}
            <button
                onClick={() => scroll('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-slate-900/50 backdrop-blur-md rounded-full shadow-lg border border-white/10 flex items-center justify-center text-white hover:bg-slate-800 hover:scale-110 transition-all duration-300 opacity-0 group-hover:opacity-100 disabled:opacity-0"
                aria-label="Scroll left"
            >
                <ChevronLeft size={24} />
            </button>

            {/* Scroll Container */}
            <div
                ref={scrollContainerRef}
                className="flex gap-6 overflow-x-auto pb-8 pt-4 snap-x snap-mandatory hide-scrollbar"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {items.map((item, index) => (
                    <div
                        key={index}
                        className="flex-none w-[280px] aspect-[9/16] bg-slate-900/50 border border-white/5 rounded-3xl overflow-hidden relative shadow-lg hover:shadow-2xl transition-all duration-300 snap-center cursor-pointer group/card"
                    >
                        {/* Image Placeholder */}
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                            <Image
                                src={item.image}
                                alt={item.title}
                                fill
                                className="object-contain p-4 group-hover/card:scale-105 transition-transform duration-500"
                            />
                        </div>

                        {/* Overlay with Play Button */}
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                            <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center backdrop-blur-sm transform scale-50 group-hover/card:scale-100 transition-transform duration-300 delay-100">
                                <Play size={32} className="text-orange-500 ml-1" fill="currentColor" />
                            </div>
                        </div>

                        {/* Title Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 translate-y-4 group-hover/card:translate-y-0 text-left">
                            <p className="font-black text-4xl leading-tight tracking-tight">{item.title}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Right Button */}
            <button
                onClick={() => scroll('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-slate-900/50 backdrop-blur-md rounded-full shadow-lg border border-white/10 flex items-center justify-center text-white hover:bg-slate-800 hover:scale-110 transition-all duration-300 opacity-0 group-hover:opacity-100"
                aria-label="Scroll right"
            >
                <ChevronRight size={24} />
            </button>
        </div>
    );
}
