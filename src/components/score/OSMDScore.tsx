"use client";

import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';

interface OSMDScoreProps {
    musicXmlUrl?: string; // URL to the MusicXML file
    zoom?: number;
    drawTitle?: boolean;
    drawCredits?: boolean;
    autoResize?: boolean;
    externalBpm?: number; // External BPM from MIDI file (takes priority)
    loopStartTime?: number | null; // A point in seconds (for visual marker)
    loopEndTime?: number | null;   // B point in seconds (for visual marker)
}

export interface OSMDScoreHandle {
    updateTime: (seconds: number) => void;
    resetCursor: () => void;
    showCursor: () => void;
    hideCursor: () => void;
    getTimeAtScrollPosition: () => number; // Get time (seconds) at current scroll position
    getXPositionForTime: (seconds: number) => number; // Get X pixel position for a given time
}

const OSMDScore = forwardRef<OSMDScoreHandle, OSMDScoreProps>(({
    musicXmlUrl,
    zoom = 0.8,
    drawTitle = false,
    drawCredits = false,
    autoResize = true,
    externalBpm,
    loopStartTime,
    loopEndTime
}, ref) => {
    const containerRef = useRef<HTMLDivElement>(null); // OSMD renders here
    const scrollContainerRef = useRef<HTMLDivElement>(null); // Scrollable wrapper
    const osmdRef = useRef<OpenSheetMusicDisplay | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Map of musical time (seconds) to horizontal X pixel position
    const [timeMap, setTimeMap] = useState<{ time: number, x: number }[]>([]);

    // Expose cursor methods
    useImperativeHandle(ref, () => ({
        updateTime: (seconds: number) => {
            if (!scrollContainerRef.current || timeMap.length === 0) return;

            // Find the segment [prev, next] for interpolation
            let prev = timeMap[0];
            let next = timeMap[timeMap.length - 1];

            for (let i = 0; i < timeMap.length - 1; i++) {
                if (seconds >= timeMap[i].time && seconds <= timeMap[i + 1].time) {
                    prev = timeMap[i];
                    next = timeMap[i + 1];
                    break;
                }
            }

            let targetX = prev.x;
            if (next.time > prev.time) {
                const ratio = (seconds - prev.time) / (next.time - prev.time);
                targetX = prev.x + (next.x - prev.x) * ratio;
            } else if (seconds > next.time) {
                // Beyond the last mapped note, continue at a constant rate if necessary
                // For now, just stick to the last point
                targetX = next.x;
            }

            // The red playhead is at left 20%. So we want targetX to be at 20% of container width.
            const playheadOffset = scrollContainerRef.current.clientWidth * 0.2;
            const scrollX = targetX - playheadOffset;

            // Smoothly scroll the container
            scrollContainerRef.current.scrollLeft = Math.max(0, scrollX);
        },
        resetCursor: () => {
            if (osmdRef.current && osmdRef.current.cursor) {
                osmdRef.current.cursor.reset();
                if (scrollContainerRef.current) scrollContainerRef.current.scrollLeft = 0;
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
            if (!scrollContainerRef.current || timeMap.length === 0) return 0;

            // Calculate X position at the playhead (20% from left)
            const playheadOffset = scrollContainerRef.current.clientWidth * 0.2;
            const targetX = scrollContainerRef.current.scrollLeft + playheadOffset;

            // Find the segment [prev, next] for reverse interpolation (x -> time)
            let prev = timeMap[0];
            let next = timeMap[timeMap.length - 1];

            for (let i = 0; i < timeMap.length - 1; i++) {
                if (targetX >= timeMap[i].x && targetX <= timeMap[i + 1].x) {
                    prev = timeMap[i];
                    next = timeMap[i + 1];
                    break;
                }
            }

            // Interpolate to get time
            if (next.x > prev.x) {
                const ratio = (targetX - prev.x) / (next.x - prev.x);
                return prev.time + (next.time - prev.time) * ratio;
            }

            return prev.time;
        },
        getXPositionForTime: (seconds: number) => {
            if (timeMap.length === 0) return 0;

            let prev = timeMap[0];
            let next = timeMap[timeMap.length - 1];

            for (let i = 0; i < timeMap.length - 1; i++) {
                if (seconds >= timeMap[i].time && seconds <= timeMap[i + 1].time) {
                    prev = timeMap[i];
                    next = timeMap[i + 1];
                    break;
                }
            }

            if (next.time > prev.time) {
                const ratio = (seconds - prev.time) / (next.time - prev.time);
                return prev.x + (next.x - prev.x) * ratio;
            }

            return prev.x;
        }
    }), [timeMap]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container || !musicXmlUrl) return;

        let isMounted = true; // For cleanup check
        setIsLoading(true);
        setError(null);

        const initOSMD = async () => {
            try {
                // Clear previous content
                container.innerHTML = '';

                // Initialize OSMD
                const osmd = new OpenSheetMusicDisplay(container, {
                    autoResize: autoResize,
                    backend: "svg",
                    drawTitle: drawTitle,
                    drawSubtitle: false,
                    drawComposer: drawCredits,
                    drawLyricist: false,
                    drawMetronomeMarks: true,
                    drawPartNames: false,
                    fingeringPosition: "auto", // or "above", "below"
                    // Crucial for horizontal scrolling
                    renderSingleHorizontalStaffline: true,
                    followCursor: false, // We handle scrolling manually for smoothness
                    // Customize colors if needed (OSMD has limited theming options compared to VexFlow direct usage)
                    // darkMode: true, // Experimental in some versions, check docs if needed
                });

                osmdRef.current = osmd;

                // Load score
                await osmd.load(musicXmlUrl);

                // Apply Zoom
                osmd.Zoom = zoom;

                // Custom styling for dark mode adaptation (manual SVG manipulation might be needed for full dark mode support)
                // However, let's start with basic rendering.
                // OSMD renders black on transparent by default.
                // We might need to invert colors via CSS or OSMD options if available.

                if (isMounted) {
                    osmd.render();

                    // Build Coordinate Map
                    const map: { time: number, x: number }[] = [];
                    const gSheet = osmd.GraphicSheet;

                    // Use external BPM if provided (from MIDI), otherwise fallback to OSMD detection
                    let bpm = externalBpm || 120;
                    if (!externalBpm && (osmd.Sheet as any).DefaultBpm) {
                        bpm = (osmd.Sheet as any).DefaultBpm;
                    }
                    const secondsPerWholeNote = (60 / bpm) * 4;

                    // Traverse pages/measures/staffentries
                    // GraphicSheet.MeasureList is a 2D array: MeasureList[staffIndex][measureIndex]
                    // For single staff, staffIndex is 0.
                    if (gSheet.MeasureList && gSheet.MeasureList[0]) {
                        for (const measure of gSheet.MeasureList[0]) {
                            for (const staffEntry of measure.staffEntries) {
                                const sourceEntry = (staffEntry as any).sourceStaffEntry;
                                if (sourceEntry && sourceEntry.Timestamp) {
                                    const timestamp = sourceEntry.Timestamp.RealValue;
                                    const timeInSeconds = timestamp * secondsPerWholeNote;
                                    const xPos = staffEntry.PositionAndShape.AbsolutePosition.x * 10;
                                    map.push({ time: timeInSeconds, x: xPos });
                                }
                            }
                        }
                    }

                    // Sort and deduplicate
                    const sortedMap = map.sort((a, b) => a.time - b.time);

                    // Deduplicate by time (keep the furthest X for chords or multiple entries at same time)
                    const filteredMap: { time: number, x: number }[] = [];
                    for (const entry of sortedMap) {
                        if (filteredMap.length > 0 && Math.abs(entry.time - filteredMap[filteredMap.length - 1].time) < 0.001) {
                            filteredMap[filteredMap.length - 1].x = Math.max(filteredMap[filteredMap.length - 1].x, entry.x);
                        } else {
                            filteredMap.push(entry);
                        }
                    }

                    setTimeMap(filteredMap);
                    console.log(`[OSMD] Coordinate map built. BPM: ${bpm}. Entries: ${filteredMap.length}`);

                    osmd.cursor.reset();
                    osmd.cursor.hide();
                    setIsLoading(false);
                }

            } catch (err: any) {
                if (isMounted) {
                    console.error("OSMD Load Error:", err);
                    setError(err.message || 'Failed to load score');
                    setIsLoading(false);
                }
            }
        };

        initOSMD();

        return () => {
            isMounted = false;
            osmdRef.current = null;
        };
    }, [musicXmlUrl, zoom, drawTitle, drawCredits, autoResize]);

    // Calculate X positions for loop markers
    const getMarkerXPosition = (seconds: number | null | undefined): number | null => {
        if (seconds === null || seconds === undefined || timeMap.length === 0) return null;

        let prev = timeMap[0];
        let next = timeMap[timeMap.length - 1];

        for (let i = 0; i < timeMap.length - 1; i++) {
            if (seconds >= timeMap[i].time && seconds <= timeMap[i + 1].time) {
                prev = timeMap[i];
                next = timeMap[i + 1];
                break;
            }
        }

        if (next.time > prev.time) {
            const ratio = (seconds - prev.time) / (next.time - prev.time);
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

            {/* Scrollable container wrapper */}
            <div ref={scrollContainerRef} className="w-full h-full relative overflow-x-auto overflow-y-hidden scrollbar-hide">
                {/* OSMD renders into this div - must be empty of React children */}
                <div
                    ref={containerRef}
                    className={`w-full h-full transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                    style={{ whiteSpace: 'nowrap' }}
                />

                {/* A/B Markers - positioned absolutely, respecting scroll */}
                {loopStartX !== null && (
                    <div
                        className="absolute top-0 bottom-0 z-30 pointer-events-none"
                        style={{ left: `${loopStartX}px` }}
                    >
                        <div className="w-[2px] h-full bg-emerald-500/80 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] font-bold text-white shadow-md">
                            A
                        </div>
                    </div>
                )}

                {loopEndX !== null && (
                    <div
                        className="absolute top-0 bottom-0 z-30 pointer-events-none"
                        style={{ left: `${loopEndX}px` }}
                    >
                        <div className="w-[2px] h-full bg-blue-500/80 shadow-[0_0_6px_rgba(59,130,246,0.6)]" />
                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-[10px] font-bold text-white shadow-md">
                            B
                        </div>
                    </div>
                )}
            </div>

            <style jsx global>{`
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
                .osmd-cursor { opacity: 0; }
             `}</style>
        </div>
    );
});

OSMDScore.displayName = 'OSMDScore';

export default OSMDScore;
