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

    // Map of musical time (seconds) to horizontal X pixel position
    const [timeMap, setTimeMap] = useState<{ time: number, x: number }[]>([]);

    // VISUAL CORRECTION: Shift the score slightly Left (Scroll Right) to Center the Note Head on the Red Line.
    // OSMD X Usually points to the left edge of the note bbox.
    const X_SHIFT_CORRECTION = 18;

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
                targetX = next.x;
            }

            scrollContainerRef.current.scrollLeft = targetX;
        },
        resetCursor: () => {
            if (osmdRef.current && osmdRef.current.cursor) {
                osmdRef.current.cursor.reset();
                if (scrollContainerRef.current && timeMap.length > 0) {
                    scrollContainerRef.current.scrollLeft = timeMap[0].x;
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
            if (!scrollContainerRef.current || timeMap.length === 0) return 0;

            const targetX = scrollContainerRef.current.scrollLeft;

            let prev = timeMap[0];
            let next = timeMap[timeMap.length - 1];

            for (let i = 0; i < timeMap.length - 1; i++) {
                if (targetX >= timeMap[i].x && targetX <= timeMap[i + 1].x) {
                    prev = timeMap[i];
                    next = timeMap[i + 1];
                    break;
                }
            }

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

                    const map: { time: number, x: number }[] = [];
                    const gSheet = osmd.GraphicSheet;

                    let bpm = externalBpm || 120;
                    if (!externalBpm && (osmd.Sheet as any).DefaultBpm) {
                        bpm = (osmd.Sheet as any).DefaultBpm;
                    }
                    const secondsPerWholeNote = (60 / bpm) * 4;

                    if (gSheet.MeasureList && gSheet.MeasureList[0]) {
                        const defaultUnit = (osmd.EngravingRules as any).UnitInPixels || 10.0;
                        const SPEED_CORRECTION = 0.82;
                        let conversionFactor = defaultUnit * zoom * SPEED_CORRECTION;

                        try {
                            if (containerRef.current) {
                                const containerWidth = containerRef.current.clientWidth;
                                const page = (osmd.GraphicSheet as any).MusicPages?.[0];
                                if (page) {
                                    const pageWidthInUnits = page.PositionAndShape.Size.width;
                                    if (pageWidthInUnits > 0) {
                                        conversionFactor = (containerWidth / pageWidthInUnits) * SPEED_CORRECTION;
                                        console.log(`[OSMD] Smart Scale set to ${conversionFactor.toFixed(3)}`);
                                    }
                                }
                            }
                        } catch (e) {
                            console.warn("[OSMD] Smart scale warning:", e);
                        }

                        for (const measure of gSheet.MeasureList[0]) {
                            for (const staffEntry of measure.staffEntries) {
                                const sourceEntry = (staffEntry as any).sourceStaffEntry;
                                if (sourceEntry && sourceEntry.Timestamp) {
                                    const timestamp = sourceEntry.Timestamp.RealValue;
                                    const timeInSeconds = timestamp * secondsPerWholeNote;
                                    const xPos = (staffEntry.PositionAndShape.AbsolutePosition.x * conversionFactor) + X_SHIFT_CORRECTION;
                                    map.push({ time: timeInSeconds, x: xPos });
                                }
                            }
                        }
                    }

                    const sortedMap = map.sort((a, b) => a.time - b.time);
                    const filteredMap: { time: number, x: number }[] = [];
                    for (const entry of sortedMap) {
                        if (filteredMap.length > 0 && Math.abs(entry.time - filteredMap[filteredMap.length - 1].time) < 0.001) {
                            filteredMap[filteredMap.length - 1].x = Math.max(filteredMap[filteredMap.length - 1].x, entry.x);
                        } else {
                            filteredMap.push(entry);
                        }
                    }

                    setTimeMap(filteredMap);

                    if (filteredMap.length > 0 && onScoreLoadedRef.current) {
                        onScoreLoadedRef.current(filteredMap[0].time);
                        const initialX = filteredMap[0].x;
                        if (scrollContainerRef.current) {
                            scrollContainerRef.current.scrollLeft = initialX;
                        }
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

            <div
                ref={scrollContainerRef}
                className="w-full h-full relative overflow-x-auto overflow-y-hidden scrollbar-hide flex"
            >
                <div style={{ minWidth: '20%', flexShrink: 0 }} />
                <div
                    ref={containerRef}
                    id="osmd-container"
                    className="h-full min-w-fit flex-shrink-0"
                />
                <div style={{ minWidth: '60%', flexShrink: 0 }} />

                {loopStartX !== null && (
                    <div
                        className="absolute top-0 bottom-0 z-40 pointer-events-none flex flex-col items-center -translate-x-1/2"
                        style={{ left: `calc(20% + ${loopStartX}px)` }}
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
                        style={{ left: `calc(20% + ${loopEndX}px)` }}
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
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
                .osmd-cursor { opacity: 0; }
             `}</style>
        </div>
    );
});

OSMDScore.displayName = 'OSMDScore';

export default OSMDScore;
