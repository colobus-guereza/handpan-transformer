"use client";

import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';

interface OSMDScoreProps {
    musicXmlUrl?: string; // URL to the MusicXML file
    zoom?: number;
    drawTitle?: boolean;
    drawCredits?: boolean;
    autoResize?: boolean;
}

export interface OSMDScoreHandle {
    updateTime: (seconds: number) => void;
    resetCursor: () => void;
    showCursor: () => void;
    hideCursor: () => void;
}

const OSMDScore = forwardRef<OSMDScoreHandle, OSMDScoreProps>(({
    musicXmlUrl,
    zoom = 0.8,
    drawTitle = false,
    drawCredits = false,
    autoResize = true
}, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const osmdRef = useRef<OpenSheetMusicDisplay | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Map of musical time (seconds) to horizontal X pixel position
    const [timeMap, setTimeMap] = useState<{ time: number, x: number }[]>([]);

    // Expose cursor methods
    useImperativeHandle(ref, () => ({
        updateTime: (seconds: number) => {
            if (!containerRef.current || timeMap.length === 0) return;

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
            const playheadOffset = containerRef.current.clientWidth * 0.2;
            const scrollX = targetX - playheadOffset;

            // Smoothly scroll the container
            containerRef.current.scrollLeft = Math.max(0, scrollX);
        },
        resetCursor: () => {
            if (osmdRef.current && osmdRef.current.cursor) {
                osmdRef.current.cursor.reset();
                if (containerRef.current) containerRef.current.scrollLeft = 0;
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

                    // Access BPM more safely
                    let bpm = 120;
                    if ((osmd.Sheet as any).DefaultBpm) bpm = (osmd.Sheet as any).DefaultBpm;
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
                ref={containerRef}
                className={`w-full transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'} overflow-x-auto overflow-y-hidden scrollbar-hide`}
                style={{ whiteSpace: 'nowrap' }}
            />
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
