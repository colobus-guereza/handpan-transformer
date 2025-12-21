import { useState, useRef, useCallback, useEffect } from 'react';
import * as Tone from 'tone';

interface UseDigipanRecorderProps {
    canvasRef: React.RefObject<HTMLCanvasElement>;
    getAudioContext: () => AudioContext | null;
    getMasterGain: () => GainNode | null;
    onRecordingComplete?: (blob: Blob) => void;
    cropMode?: 'full' | 'square'; // NEW: 녹화 크롭 모드
}

export const useDigipanRecorder = ({
    canvasRef,
    getAudioContext,
    getMasterGain,
    onRecordingComplete,
    cropMode = 'full' // 기본값: 전체 캔버스 녹화
}: UseDigipanRecorderProps) => {
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const streamDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);

    // Refs for Tone.js Bridge
    const toneDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);
    const toneSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

    // Refs for Square Crop Mode
    const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const cropModeRef = useRef(cropMode); // Track current mode for animation loop

    // Update ref when prop changes
    useEffect(() => {
        cropModeRef.current = cropMode;
    }, [cropMode]);

    // Keep track of the latest callback to avoid stale closures in onstop
    const savedCallback = useRef(onRecordingComplete);

    useEffect(() => {
        savedCallback.current = onRecordingComplete;
    }, [onRecordingComplete]);

    const startRecording = useCallback(() => {
        const canvas = canvasRef.current;
        const audioCtx = getAudioContext();
        const masterGain = getMasterGain();

        if (!canvas || !audioCtx || !masterGain) {
            console.error('[Recorder] Missing dependencies for recording (Canvas, AudioContext, or MasterGain)');
            return;
        }

        try {
            console.log(`[Recorder] Initializing... (Mode: ${cropModeRef.current})`);
            // ... (stream setup code is unchanged) ...

            // ... (options setup code is unchanged) ...

            // 5. Setup MediaRecorder logic (with Ref usage)
            // Note: We need to re-implement the setup part here because we are replacing the startRecording body logic wrapper
            // But since I cannot easily replace just the middle, I will provide the context.
            // Wait, replace_file_content replaces a chunk. I need to be careful to match existing code.
            // The previous 'startRecording' function is long.

            // Let's rely on the fact that I'm replacing the `startRecording` DEPENDENCIES array logic or usage.
            // Actually, I should use `savedCallback.current` inside `recorder.onstop`.

            // Let's modify the `recorder.onstop` block specifically if possible, OR rewrite startRecording start.

            // To be safe and clean, I will replace the whole startRecording function definition loop if I can match it, 
            // OR I will just inject the Ref at the top and change onstop.

            // Checking the file content again... 

            console.log(`[Recorder] Initializing... (Mode: ${cropModeRef.current})`);

            let videoStream: MediaStream;

            const MAX_RESOLUTION = 1080;

            if (cropModeRef.current === 'square') {
                // ============================================
                // SQUARE MODE: 오프스크린 캔버스로 중앙 크롭 (Max 1080p)
                // ============================================
                const srcWidth = canvas.width;
                const srcHeight = canvas.height;
                let squareSize = Math.min(srcWidth, srcHeight);

                // Resolution Cap
                if (squareSize > MAX_RESOLUTION) {
                    console.log(`[Recorder] Cap square resolution: ${squareSize} -> ${MAX_RESOLUTION}`);
                    squareSize = MAX_RESOLUTION;
                }

                // 중앙 영역 계산 (원본 기준)
                const originalSquareSize = Math.min(srcWidth, srcHeight);
                const cropX = (srcWidth - originalSquareSize) / 2;
                const cropY = (srcHeight - originalSquareSize) / 2;

                console.log(`[Recorder] Creating square crop: ${squareSize}x${squareSize}`);

                // 오프스크린 캔버스 생성
                const offscreen = document.createElement('canvas');
                offscreen.width = squareSize;
                offscreen.height = squareSize;
                offscreenCanvasRef.current = offscreen;

                const offCtx = offscreen.getContext('2d');
                if (!offCtx) {
                    console.error('[Recorder] Failed to get offscreen context');
                    return;
                }

                // 애니메이션 루프
                const copyFrame = () => {
                    if (!offscreenCanvasRef.current) return;
                    offCtx.drawImage(
                        canvas,
                        cropX, cropY, originalSquareSize, originalSquareSize, // Source (Center Crop)
                        0, 0, squareSize, squareSize            // Destination (Scaled)
                    );
                    animationFrameRef.current = requestAnimationFrame(copyFrame);
                };
                copyFrame();

                videoStream = offscreen.captureStream(30); // 30 FPS
            } else {
                // ============================================
                // FULL MODE: Max 1080p Downscaling
                // ============================================
                const srcWidth = canvas.width;
                const srcHeight = canvas.height;
                const maxDim = Math.max(srcWidth, srcHeight);

                if (maxDim > MAX_RESOLUTION) {
                    // Downscale needed
                    const scale = MAX_RESOLUTION / maxDim;
                    const destWidth = Math.round(srcWidth * scale);
                    const destHeight = Math.round(srcHeight * scale);

                    console.log(`[Recorder] Downscaling Full Mode: ${srcWidth}x${srcHeight} -> ${destWidth}x${destHeight}`);

                    const offscreen = document.createElement('canvas');
                    offscreen.width = destWidth;
                    offscreen.height = destHeight;
                    offscreenCanvasRef.current = offscreen;

                    const offCtx = offscreen.getContext('2d');
                    if (!offCtx) {
                        // Fallback
                        console.error('[Recorder] Failed to get context for resize, using original');
                        videoStream = canvas.captureStream(30);
                    } else {
                        const copyFrame = () => {
                            if (!offscreenCanvasRef.current) return;
                            offCtx.drawImage(canvas, 0, 0, srcWidth, srcHeight, 0, 0, destWidth, destHeight);
                            animationFrameRef.current = requestAnimationFrame(copyFrame);
                        };
                        copyFrame();
                        videoStream = offscreen.captureStream(30);
                    }
                } else {
                    // Original is small enough
                    videoStream = canvas.captureStream(30);
                }
            }

            // 2. Capture Audio Stream from Howler
            const dest = audioCtx.createMediaStreamDestination();
            streamDestRef.current = dest;

            // Connect Master Gain to this destination
            masterGain.connect(dest);

            // 3. Bridge Tone.js Audio (Drum/Accompaniment)
            try {
                if (typeof window !== 'undefined' && Tone.context) {
                    console.log('[Recorder] Bridging Tone.js destination...');

                    const toneRawCtx = Tone.context.rawContext as AudioContext;
                    const toneDest = toneRawCtx.createMediaStreamDestination();
                    toneDestRef.current = toneDest;

                    // Tone.Destination is the master output for all Tone.js instruments
                    Tone.getDestination().connect(toneDest);

                    const toneStream = toneDest.stream;
                    const toneSource = audioCtx.createMediaStreamSource(toneStream);
                    toneSourceRef.current = toneSource;

                    toneSource.connect(dest);
                    console.log('[Recorder] Tone.js bridge established successfully.');
                } else {
                    console.log('[Recorder] Tone.js context not found, skipping bridge for now.');
                }
            } catch (err) {
                console.warn('[Recorder] Failed to bridge Tone.js audio:', err);
            }

            // 4. Combine Tracks
            const combinedStream = new MediaStream([
                ...videoStream.getVideoTracks(),
                ...dest.stream.getAudioTracks()
            ]);

            // 5. Setup MediaRecorder
            const mimeTypes = [
                'video/mp4;codecs=h264,aac',
                'video/mp4;codecs=avc1,mp4a.40.2',
                'video/mp4',
                'video/mp4;codecs=h264',
                'video/webm;codecs=vp9',
                'video/webm;codecs=vp8',
                'video/webm'
            ];

            let selectedMimeType = '';
            for (const type of mimeTypes) {
                if (MediaRecorder.isTypeSupported(type)) {
                    selectedMimeType = type;
                    break;
                }
            }

            if (!selectedMimeType) {
                console.warn('[Recorder] No supported mimeType found, trying default constructor.');
            }

            const options: MediaRecorderOptions = {
                mimeType: selectedMimeType || undefined,
                videoBitsPerSecond: 50000000 // 50 Mbps (High Performance / Low CPU overhead)
            };
            console.log(`[Recorder] Using MIME Type: ${selectedMimeType || 'default'} @ 50Mbps`);

            const recorder = new MediaRecorder(combinedStream, options);
            mediaRecorderRef.current = recorder;
            chunksRef.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            // Helper for cleanup
            const cleanup = () => {
                // Stop animation frame (for square mode)
                if (animationFrameRef.current) {
                    cancelAnimationFrame(animationFrameRef.current);
                    animationFrameRef.current = null;
                }
                offscreenCanvasRef.current = null;

                // Cleanup Howler Audio Nodes
                if (streamDestRef.current && masterGain) {
                    try {
                        masterGain.disconnect(streamDestRef.current);
                    } catch (err) {
                        console.warn('Failed to disconnect recorder node', err);
                    }
                }

                // Cleanup Tone.js Bridge
                if (toneSourceRef.current && streamDestRef.current) {
                    try {
                        toneSourceRef.current.disconnect(streamDestRef.current);
                        toneSourceRef.current.disconnect();
                    } catch (e) {
                        console.warn('Failed to disconnect tone source', e);
                    }
                }
                if (toneDestRef.current) {
                    try {
                        Tone.Destination.disconnect(toneDestRef.current);
                    } catch (e) {
                        console.warn('Failed to disconnect Tone.Destination', e);
                    }
                }
                toneSourceRef.current = null;
                toneDestRef.current = null;

                setIsRecording(false);
                console.log('[Recorder] Finished and cleaned up.');
            };

            recorder.onstop = () => {
                const actualMimeType = recorder.mimeType;
                const blob = new Blob(chunksRef.current, { type: actualMimeType });

                cleanup();

                if (savedCallback.current) {
                    savedCallback.current(blob);
                }
            };

            // Start
            recorder.start();
            setIsRecording(true);
            console.log('[Recorder] Started.');

            // Safety Timeout (Max 60 seconds)
            setTimeout(() => {
                if (recorder.state === 'recording') {
                    console.log('[Recorder] Max duration reached (60s). Stopping.');
                    recorder.stop();
                }
            }, 60000);

        } catch (err) {
            console.error('[Recorder] Failed to start recording:', err);
            setIsRecording(false);
        }
    }, [canvasRef, getAudioContext, getMasterGain]); // Removed onRecordingComplete dependency

    const stopRecording = useCallback(() => {
        if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') {
            console.warn('Recorder is not active');
            return;
        }
        mediaRecorderRef.current.stop();
    }, []);

    return {
        isRecording,
        startRecording,
        stopRecording
    };
};
