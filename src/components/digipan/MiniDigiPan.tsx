'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Scale } from '@/data/handpanScales';
import { Language } from '@/constants/translations';
import Digipan9 from './Digipan9';
import Digipan10 from './Digipan10';
import Digipan11 from './Digipan11';
import Digipan12 from './Digipan12';
import Digipan14 from './Digipan14';
import Digipan14M from './Digipan14M';
import Digipan15M from './Digipan15M';
import Digipan18M from './Digipan18M';

import { Digipan3DHandle } from './Digipan3D';

interface MiniDigiPanProps {
    scale: Scale;
    language: Language;
}

const MiniDigiPan = React.forwardRef<Digipan3DHandle, MiniDigiPanProps>(({ scale, language }, ref) => {
    // --- Lazy Loading State ---
    const [isVisible, setIsVisible] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { rootMargin: '200px', threshold: 0.01 }
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, []);
    // --------------------------

    // Determine which component to render based on note count
    const bottomCount = scale.notes.bottom ? scale.notes.bottom.length : 0;
    const totalNotes = 1 + scale.notes.top.length + bottomCount;

    // console.log(`MiniDigiPan Render: ${scale.id} (${scale.name}), notes: ${totalNotes}`);

    const is18Notes = totalNotes === 18;
    const is15Notes = totalNotes === 15;
    const is14Notes = totalNotes === 14;
    const is12Notes = totalNotes === 12;
    const is11Notes = totalNotes === 11;
    const is10Notes = totalNotes === 10;
    const is9Notes = totalNotes === 9;

    const commonProps = {
        // ref not included here to be explicit
        scale: scale,
        isCameraLocked: true as const,
        showControls: false as const,
        showInfoPanel: false as const,
        initialViewMode: 2 as const,
        enableZoom: false as const,
        enablePan: false as const,
        showLabelToggle: true as const,
        hideTouchText: true as const,
    };

    // Responsive Container Logic for Digipan 11 and 12
    const [isVerticalLayout, setIsVerticalLayout] = React.useState(false);

    React.useEffect(() => {
        const checkLayout = () => {
            setIsVerticalLayout(window.innerWidth < 1280);
        };
        checkLayout();
        window.addEventListener('resize', checkLayout);
        return () => window.removeEventListener('resize', checkLayout);
    }, []);

    const containerClass = is9Notes || is10Notes || is14Notes || is15Notes || is18Notes
        ? "w-full aspect-[10/11] max-h-[550px] md:max-h-[800px] relative rounded-2xl overflow-hidden bg-white -mt-2"
        : "w-full aspect-square max-h-[500px] md:max-h-[700px] relative rounded-2xl overflow-hidden bg-white -mt-2";

    return (
        <div className="w-full">
            <div ref={containerRef} className={containerClass}>
                {!isVisible ? (
                    // Loading Placeholder
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50">
                        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-400 rounded-full animate-spin mb-2" />
                        <span className="text-xs font-medium opacity-70">Loading 3D...</span>
                    </div>
                ) : (
                    // Actual Content (Preserved Logic)
                    is18Notes ? (
                        <Digipan18M ref={ref} {...commonProps} />
                    ) : is15Notes ? (
                        <Digipan15M ref={ref} {...commonProps} />
                    ) : is14Notes ? (
                        scale.id === 'fs_low_pygmy_14_mutant' ? (
                            <Digipan14M ref={ref} {...commonProps} />
                        ) : (
                            <Digipan14 ref={ref} {...commonProps} />
                        )
                    ) : is12Notes ? (
                        <Digipan12 ref={ref} {...commonProps} />
                    ) : is11Notes ? (
                        <Digipan11 ref={ref} {...commonProps} />
                    ) : is10Notes ? (
                        <Digipan10 ref={ref} {...commonProps} />
                    ) : is9Notes ? (
                        <Digipan9 ref={ref} {...commonProps} />
                    ) : (
                        <div className="flex items-center justify-center w-full h-full bg-slate-100 text-slate-400">
                            Unknown Note Layout ({totalNotes})
                        </div>
                    )
                )}
            </div>
        </div>
    );
});

export default MiniDigiPan;
