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

    // Debug info state for on-screen overlay


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
                // Beyond the last mapped note, continue at a constant rate if necessary
                targetX = next.x;
            }

            // CLEAN LOGIC:
            // Since we added 20% Padding-Left (Spacer) to the container, the content (x=0) naturally starts at the Playhead (20%).
            // To align a note at 'targetX' with the Playhead, we simply scroll by 'targetX'.
            // Formula: (Padding + targetX) - Scroll = Playhead
            // Since Padding == Playhead (both 20%), this simplifies to: targetX = Scroll
            // targetX already includes X_SHIFT_CORRECTION from timeMap creation.

            // Debug Log (Throttled)
            if (Math.floor(seconds * 10) % 20 === 0) {
                console.log(`[OSMD Sync] t=${seconds.toFixed(2)} targetX=${targetX.toFixed(1)} scrollLeft=${targetX.toFixed(1)}`);
            }

            scrollContainerRef.current.scrollLeft = targetX;
        },
        resetCursor: () => {
            if (osmdRef.current && osmdRef.current.cursor) {
                osmdRef.current.cursor.reset();
                // Scroll back to the first note's position, not 0
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

            // CLEAN LOGIC: Inverse of updateTime.
            // Scroll = targetX.
            const targetX = scrollContainerRef.current.scrollLeft;

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

    // Use ref for callback to avoid effect re-execution
    const onScoreLoadedRef = useRef(onScoreLoaded);
    useEffect(() => {
        onScoreLoadedRef.current = onScoreLoaded;
    }, [onScoreLoaded]);

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
                        // Smart Scaling Logic
                        const defaultUnit = (osmd.EngravingRules as any).UnitInPixels || 10.0;
                        // TODO: [Service Deployment Requirement] Improve logic to ensure the Digipan playhead matches individual notes at the exact moment.
                        const SPEED_CORRECTION = 0.82; // Final Adjusted Speed: 0.82

                        let conversionFactor = defaultUnit * zoom * SPEED_CORRECTION;


                        // Auto-Resize Correction
                        try {
                            if (containerRef.current) {
                                const containerWidth = containerRef.current.clientWidth;
                                const page = (osmd.GraphicSheet as any).MusicPages?.[0];
                                if (page) {
                                    const pageWidthInUnits = page.PositionAndShape.Size.width;
                                    if (pageWidthInUnits > 0) {
                                        conversionFactor = (containerWidth / pageWidthInUnits) * SPEED_CORRECTION;

                                        console.log(`[OSMD] Smart Scale. Container: ${containerWidth}px, UnitWidth: ${pageWidthInUnits.toFixed(2)}. Factor: ${conversionFactor.toFixed(3)} (Adj: ${SPEED_CORRECTION})`);
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
                                    // BAKE IN the X_SHIFT_CORRECTION here to unify the coordinate system.
                                    const xPos = (staffEntry.PositionAndShape.AbsolutePosition.x * conversionFactor) + X_SHIFT_CORRECTION;
                                    map.push({ time: timeInSeconds, x: xPos });
                                }
                            }
                        }
                    }

                    // Sort and deduplicate
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
                    console.log(`[OSMD] Coordinate map built. BPM: ${bpm}. Entries: ${filteredMap.length}`);

                    if (filteredMap.length > 0 && onScoreLoadedRef.current) {
                        onScoreLoadedRef.current(filteredMap[0].time);
                        console.log(`[OSMD] First note time: ${filteredMap[0].time.toFixed(3)}s`);

                        // INITIAL SYNC: Scroll to the first note immediately so it aligns with Playhead
                        const initialX = filteredMap[0].x;
                        if (scrollContainerRef.current) {
                            // initialX already includes X_SHIFT_CORRECTION from timeMap creation.
                            scrollContainerRef.current.scrollLeft = initialX;
                            console.log(`[OSMD] Initial Scroll set to ${initialX} (to match Playhead)`);
                        }
                    }

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

        const timer = setTimeout(() => {
            initOSMD();
        }, 100);

        return () => {
            isMounted = false;
            clearTimeout(timer);
            if (osmdRef.current) {
                // osmdRef.current.clear(); // Removing clear might prevent blanking issues on slight re-renders, but careful with memory.
                osmdRef.current = null;
            }
        };
    }, [musicXmlUrl, zoom, drawTitle, drawCredits, autoResize, externalBpm]); // Removed onScoreLoaded

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
            {/* ENABLE FLEX to use Spacer Divs for precise alignment */}
            <div
                ref={scrollContainerRef}
                className="w-full h-full relative overflow-x-auto overflow-y-hidden scrollbar-hide flex"
            >
                {/* SPACER: Explicitly pushes the score start to the 20% mark (Playhead position) */}
                {/* This is more robust than padding in ensuring the content starts exactly where we want */}
                <div style={{ minWidth: '20%', flexShrink: 0 }} />

                {/* OSMD renders into this div - must be empty of React children */}
                {/* Added min-w-fit to ensure it doesn't shrink */}
                <div
                    ref={containerRef}
                    id="osmd-container"
                    className="h-full min-w-fit flex-shrink-0"
                />

                {/* End Spacer to allow scrolling the last note to the playhead */}
                <div style={{ minWidth: '60%', flexShrink: 0 }} />

                {/* A/B Markers - positioned absolutely relative to the SCROLL CONTAINER (so they scroll) */}
                {/* Note: Left 0 of this container = Left Edge of Spacer. */}
                {/* So Note 0 is at 20% (Spacer Width). */}
                {loopStartX !== null && (
                    <div
                        className="absolute top-0 bottom-0 z-40 pointer-events-none flex flex-col items-center -translate-x-1/2"
                        style={{ left: `calc(20% + ${loopStartX}px)` }}
                    >
                        {/* Text Bubble */}
                        <div className="mt-[25px] mb-1 w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center text-xs font-bold text-black shadow-md border border-yellow-600 z-50">
                            A
                        </div>
                        {/* Line */}
                        <div className="w-[2px] flex-1 bg-yellow-400/80 shadow-[0_0_6px_rgba(250,204,21,0.6)]" />
                    </div>
                )}

                {loopEndX !== null && (
                    <div
                        className="absolute top-0 bottom-0 z-40 pointer-events-none flex flex-col items-center -translate-x-1/2"
                        style={{ left: `calc(20% + ${loopEndX}px)` }}
                    >
                        {/* Text Bubble */}
                        <div className="mt-[25px] mb-1 w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center text-xs font-bold text-black shadow-md border border-yellow-600 z-50">
                            B
                        </div>
                        {/* Line */}
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
