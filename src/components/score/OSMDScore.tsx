"use client";

import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';

interface OSMDScoreProps {
    musicXmlUrl?: string; // URL to the MusicXML file
    zoom?: number;
    drawTitle?: boolean;
    drawCredits?: boolean;
    autoResize?: boolean;
    externalBpm?: number; // Fallback BPM
    loopStartTime?: number | null; // A point in seconds (for visual marker)
    loopEndTime?: number | null;   // B point in seconds (for visual marker)
    onScoreLoaded?: (firstNoteTime: number) => void; // Callback with the time of the first note
}

export interface OSMDScoreHandle {
    updateTime: (seconds: number) => void;
    resetCursor: () => void;
    showCursor: () => void;
    hideCursor: () => void;
    getTimeAtScrollPosition: () => number; // Get time (seconds) at current scroll position
    getXPositionForTime: (seconds: number) => number; // Get X pixel position for a given time
}

// Data structure for synchronization anchors
interface TimeAnchor {
    seconds: number;       // Musical time in seconds
    x: number;            // Pixel X position in the scroll container
    measureNumber?: number; // Optional debug info
}

const OSMDScore = forwardRef<OSMDScoreHandle, OSMDScoreProps>(({
    musicXmlUrl,
    zoom = 0.8,
    drawTitle = false,
    drawCredits = false,
    autoResize = true,
    externalBpm,
    loopStartTime,
    loopEndTime,
    onScoreLoaded
}, ref) => {
    const containerRef = useRef<HTMLDivElement>(null); // OSMD renders here
    const scrollContainerRef = useRef<HTMLDivElement>(null); // Scrollable wrapper
    const osmdRef = useRef<OpenSheetMusicDisplay | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Manual Speed Correction to fix drift (User reported 2 notes fast at end)
    // 1.0 = Theoretical perfection
    // 0.95 = 5% Slower (Visual distance is compressed, so cursor takes longer to traverse)
    const VISUAL_SPEED_CORRECTION = 0.95;

    // Map of musical time (seconds) to horizontal X pixel position (Anchors)
    const [anchors, setAnchors] = useState<TimeAnchor[]>([]);

    // Expose cursor methods
    useImperativeHandle(ref, () => ({
        updateTime: (seconds: number) => {
            if (!scrollContainerRef.current || anchors.length === 0) return;

            // Anchor Point Interpolation
            // Find the segment [prev, next] where 'seconds' falls
            // Binary search could be used for optimization, but linear is fine for N < 1000
            let prev = anchors[0];
            let next = anchors[anchors.length - 1];

            // 1. Find immediate neighbors
            for (let i = 0; i < anchors.length - 1; i++) {
                if (seconds >= anchors[i].seconds && seconds <= anchors[i + 1].seconds) {
                    prev = anchors[i];
                    next = anchors[i + 1];
                    break;
                }
            }

            // 2. Linear Interpolation
            let targetX = prev.x;
            if (next.x > prev.x && next.seconds > prev.seconds) {
                const ratio = (seconds - prev.seconds) / (next.seconds - prev.seconds);
                targetX = prev.x + (next.x - prev.x) * ratio;
            } else if (seconds > next.seconds) {
                // Extrapolate at the end if needed, or clamp
                targetX = next.x;
            }

            // Apply scroll
            scrollContainerRef.current.scrollLeft = targetX;
        },
        resetCursor: () => {
            if (osmdRef.current && osmdRef.current.cursor) {
                osmdRef.current.cursor.reset();
                if (scrollContainerRef.current && anchors.length > 0) {
                    scrollContainerRef.current.scrollLeft = anchors[0].x;
                }
            }
        },
        showCursor: () => {
            if (osmdRef.current && osmdRef.current.cursor) {
                osmdRef.current.cursor.show();
            }
        },
        hideCursor: () => {
            if (osmdRef.current && osmdRef.current.cursor) {
                osmdRef.current.cursor.hide();
            }
        },
        getTimeAtScrollPosition: () => {
            if (!scrollContainerRef.current || anchors.length === 0) return 0;
            const targetX = scrollContainerRef.current.scrollLeft;
            let prev = anchors[0];
            let next = anchors[anchors.length - 1];
            for (let i = 0; i < anchors.length - 1; i++) {
                if (targetX >= anchors[i].x && targetX <= anchors[i + 1].x) {
                    prev = anchors[i];
                    next = anchors[i + 1];
                    break;
                }
            }
            if (next.x > prev.x) {
                const ratio = (targetX - prev.x) / (next.x - prev.x);
                return prev.seconds + (next.seconds - prev.seconds) * ratio;
            }
            return prev.seconds;
        },
        getXPositionForTime: (seconds: number) => {
            if (anchors.length === 0) return 0;
            let prev = anchors[0];
            let next = anchors[anchors.length - 1];
            for (let i = 0; i < anchors.length - 1; i++) {
                if (seconds >= anchors[i].seconds && seconds <= anchors[i + 1].seconds) {
                    prev = anchors[i];
                    next = anchors[i + 1];
                    break;
                }
            }
            if (next.seconds > prev.seconds) {
                const ratio = (seconds - prev.seconds) / (next.seconds - prev.seconds);
                return prev.x + (next.x - prev.x) * ratio;
            }
            return prev.x;
        }
    }), [anchors]);

    const onScoreLoadedRef = useRef(onScoreLoaded);
    useEffect(() => {
        onScoreLoadedRef.current = onScoreLoaded;
    }, [onScoreLoaded]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container || !musicXmlUrl) return;

        let isMounted = true;
        setIsLoading(true);
        setError(null);

        const initOSMD = async () => {
            try {
                container.innerHTML = '';
                const osmd = new OpenSheetMusicDisplay(container, {
                    autoResize: autoResize,
                    backend: "svg",
                    drawTitle: drawTitle,
                    drawSubtitle: false,
                    drawComposer: drawCredits,
                    drawLyricist: false,
                    drawMetronomeMarks: true,
                    drawPartNames: false,
                    fingeringPosition: "auto",
                    renderSingleHorizontalStaffline: true,
                    followCursor: false,
                });

                osmdRef.current = osmd;
                await osmd.load(musicXmlUrl);
                osmd.Zoom = zoom;

                if (isMounted) {
                    osmd.render();

                    // --- Anchor Generation Logic ---
                    const rawAnchors: TimeAnchor[] = [];

                    // 1. Calculate precise conversion factor (Units -> Pixels)
                    let conversionFactor = 1.0;
                    try {
                        if (containerRef.current) {
                            const containerWidth = containerRef.current.clientWidth;
                            const page = (osmd.GraphicSheet as any).MusicPages?.[0];
                            if (page) {
                                const pageWidthInUnits = page.PositionAndShape.Size.width;
                                if (pageWidthInUnits > 0) {
                                    // With renderSingleHorizontalStaffline, PageWidth corresponds to the full width
                                    // ContainerWidth is the rendered SVG width in pixels
                                    conversionFactor = containerWidth / pageWidthInUnits;
                                    console.log(`[OSMD] Anchor System: 1 Unit = ${conversionFactor.toFixed(4)} Pixels`);
                                }
                            }
                        }
                    } catch (e) {
                        console.warn("[OSMD] Conversion factor calc failed, fallback to defaults", e);
                        const defaultUnit = (osmd.EngravingRules as any).UnitInPixels || 10.0;
                        conversionFactor = defaultUnit * zoom;
                    }

                    // APPLY VISUAL SPEED CORRECTION
                    conversionFactor *= VISUAL_SPEED_CORRECTION;

                    // 2. Setup Time Conversion (Constant BPM Fallback)
                    // Reverted Tempo Map logic as user reported worse sync.
                    console.log('[OSMD] Sync Strategy: ConstantBPM with Anchor Interpolation');

                    let bpm = externalBpm || 120;
                    if (!externalBpm && (osmd.Sheet as any).DefaultBpm) {
                        bpm = (osmd.Sheet as any).DefaultBpm;
                    }
                    const secondsPerWholeNote = (60 / bpm) * 4;
                    console.log(`[OSMD] BPM: ${bpm}, Sec/Whole: ${secondsPerWholeNote}`);

                    // 3. Extract Anchors from Vertical Containers
                    const containers = osmd.GraphicSheet.VerticalGraphicalStaffEntryContainers;
                    const OFFSET_SECONDS = 0.0;

                    for (const container of containers) {
                        if (container && container.StaffEntries && container.StaffEntries.length > 0) {

                            // A. Get Timestamp (Whole Notes from OSMD)
                            const wholeNotes = container.AbsoluteTimestamp.RealValue;
                            const timeInSeconds = wholeNotes * secondsPerWholeNote;

                            // B. Get X Position
                            const firstEntry = container.StaffEntries[0];
                            if (firstEntry) {
                                // AbsolutePosition.x is relative to the Page (which implies the whole staff in SingleLine mode)
                                const unitX = firstEntry.PositionAndShape.AbsolutePosition.x;
                                const pixelX = unitX * conversionFactor;

                                // Safe access to MeasureNumber
                                const measureNumber = container.ParentMeasure?.MeasureNumber ?? -1;

                                rawAnchors.push({
                                    seconds: Math.max(0, timeInSeconds + OFFSET_SECONDS),
                                    x: pixelX,
                                    measureNumber: measureNumber
                                });
                            }
                        }
                    }

                    // Sort and Deduplicate
                    const sortedAnchors = rawAnchors.sort((a, b) => a.seconds - b.seconds);

                    const filteredAnchors: TimeAnchor[] = [];

                    for (const anchor of sortedAnchors) {
                        // Filter out duplicates (same time) - keep the one with max X (most rightward, just in case)
                        if (filteredAnchors.length === 0 || Math.abs(anchor.seconds - filteredAnchors[filteredAnchors.length - 1].seconds) > 0.001) {
                            filteredAnchors.push(anchor);
                        }
                    }

                    console.log(`[OSMD] Generated ${filteredAnchors.length} synchronization anchors.`);
                    setAnchors(filteredAnchors);

                    if (filteredAnchors.length > 0 && onScoreLoadedRef.current) {
                        onScoreLoadedRef.current(filteredAnchors[0].seconds);

                        // Initial Scroll
                        const initialX = filteredAnchors[0].x;
                        setTimeout(() => {
                            if (scrollContainerRef.current) {
                                scrollContainerRef.current.scrollLeft = initialX;
                            }
                        }, 50);
                    }

                    osmd.cursor.reset();
                    osmd.cursor.hide();
                    setIsLoading(false);
                }
            } catch (err: any) {
                if (isMounted) {
                    setError(err.message || 'Failed to load score');
                    setIsLoading(false);
                }
            }
        };

        const timer = setTimeout(() => {
            initOSMD();
        }, 100);

        return () => {
            isMounted = false;
            clearTimeout(timer);
            osmdRef.current = null;
        };
    }, [musicXmlUrl, zoom, drawTitle, drawCredits, autoResize, externalBpm]);

    const getMarkerXPosition = (seconds: number | null | undefined): number | null => {
        if (seconds === null || seconds === undefined || anchors.length === 0) return null;

        // Re-use logic or helper
        let prev = anchors[0];
        let next = anchors[anchors.length - 1];

        for (let i = 0; i < anchors.length - 1; i++) {
            if (seconds >= anchors[i].seconds && seconds <= anchors[i + 1].seconds) {
                prev = anchors[i];
                next = anchors[i + 1];
                break;
            }
        }
        if (next.seconds > prev.seconds) {
            const ratio = (seconds - prev.seconds) / (next.seconds - prev.seconds);
            return prev.x + (next.x - prev.x) * ratio;
        }
        return prev.x;
    };

    const loopStartX = getMarkerXPosition(loopStartTime);
    const loopEndX = getMarkerXPosition(loopEndTime);

    return (
        <div className="w-full h-full relative overflow-hidden flex items-center justify-center">
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                </div>
            )}

            {error && (
                <div className="absolute inset-0 flex items-center justify-center z-10 text-red-500">
                    <p>Error loading score: {error}</p>
                </div>
            )}

            <div
                ref={scrollContainerRef}
                className="w-full h-full relative overflow-x-auto overflow-y-hidden scrollbar-hide flex"
            >
                <div style={{ minWidth: '50%', flexShrink: 0 }} />
                <div
                    ref={containerRef}
                    id="osmd-container"
                    className="h-full min-w-fit flex-shrink-0"
                />
                <div style={{ minWidth: '50%', flexShrink: 0 }} />

                {loopStartX !== null && (
                    <div
                        className="absolute top-0 bottom-0 z-40 pointer-events-none flex flex-col items-center -translate-x-1/2"
                        style={{ left: `calc(50% + ${loopStartX}px)` }}
                    >
                        <div className="mt-[25px] mb-1 w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center text-xs font-bold text-black shadow-md border border-yellow-600 z-50">
                            A
                        </div>
                        <div className="w-[2px] flex-1 bg-yellow-400/80 shadow-[0_0_6px_rgba(250,204,21,0.6)]" />
                    </div>
                )}

                {loopEndX !== null && (
                    <div
                        className="absolute top-0 bottom-0 z-40 pointer-events-none flex flex-col items-center -translate-x-1/2"
                        style={{ left: `calc(50% + ${loopEndX}px)` }}
                    >
                        <div className="mt-[25px] mb-1 w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center text-xs font-bold text-black shadow-md border border-yellow-600 z-50">
                            B
                        </div>
                        <div className="w-[2px] flex-1 bg-yellow-400/80 shadow-[0_0_6px_rgba(250,204,21,0.6)]" />
                    </div>
                )}
            </div>

            <style jsx global>{`
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { 
                    -ms-overflow-style: none; 
                    scrollbar-width: none; 
                    scroll-behavior: auto !important; /* Force instant sync, bypass global smooth scroll */
                }
                .osmd-cursor { opacity: 0; }
             `}</style>
        </div>
    );
});

OSMDScore.displayName = 'OSMDScore';

export default OSMDScore;
