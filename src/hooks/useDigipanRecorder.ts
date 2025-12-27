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

    // ★ Lock to prevent double initialization (fixes first-recording flicker)
    const isInitializingRef = useRef(false);

    // Update ref when prop changes
    useEffect(() => {
        cropModeRef.current = cropMode;
    }, [cropMode]);

    // Keep track of the latest callback to avoid stale closures in onstop
    const savedCallback = useRef(onRecordingComplete);

    useEffect(() => {
        savedCallback.current = onRecordingComplete;
    }, [onRecordingComplete]);

    const startRecording = useCallback(async () => {
        console.log(`[RecorderDebug] ${Date.now()} startRecording() hook called`);

        // ★ Prevent double initialization (fixes first-recording flicker)
        if (isInitializingRef.current || mediaRecorderRef.current?.state === 'recording') {
            console.warn('[Recorder] Already initializing or recording. Ignored.');
            return;
        }
        isInitializingRef.current = true;

        const canvas = canvasRef.current;
        const audioCtx = getAudioContext();
        const masterGain = getMasterGain();

        console.log(`[RecorderDebug] ${Date.now()} Dependencies check - canvas: ${!!canvas}, audioCtx: ${!!audioCtx}, masterGain: ${!!masterGain}`);

        if (!canvas || !audioCtx || !masterGain) {
            console.error('[Recorder] Missing dependencies for recording (Canvas, AudioContext, or MasterGain)');
            isInitializingRef.current = false;
            return;
        }

        // ★ FIX: Wait for 2 animation frames to ensure React rendering is complete
        // This prevents the black flash caused by captureStream() accessing the canvas
        // before React has finished updating the UI
        console.log(`[RecorderDebug] ${Date.now()} Waiting for render frames...`);
        await new Promise<void>(resolve => {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    console.log(`[RecorderDebug] ${Date.now()} Render frames complete, proceeding with capture`);
                    resolve();
                });
            });
        });

        try {
            console.log(`[RecorderDebug] ${Date.now()} Starting initialization (Mode: ${cropModeRef.current})`);
            console.log(`[Recorder] Initializing... (Mode: ${cropModeRef.current})`);

            let videoStream: MediaStream;

            // 모바일 기기 감지
            const isMobileDevice = typeof navigator !== 'undefined' &&
                /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

            // 해상도 제한 설정
            // 모바일: 1080p (메모리 보호), 데스크톱: 4K (고화질 유지)
            const MAX_RESOLUTION = isMobileDevice ? 1080 : 2160;

            // FPS 설정: 모바일/데스크톱 모두 60fps (터치 애니메이션 부드러움)
            const targetFPS = 60;

            console.log(`[RecorderDebug] ${Date.now()} Canvas dimensions: ${canvas.width}x${canvas.height}`);
            console.log(`[RecorderDebug] ${Date.now()} cropMode: ${cropModeRef.current}, isMobile: ${isMobileDevice}, MaxRes: ${MAX_RESOLUTION}`);

            if (cropModeRef.current === 'square') {
                // ============================================
                // SQUARE MODE: 오프스크린 캔버스로 중앙 크롭 (Max 1080p)
                // ============================================
                console.log(`[RecorderDebug] ${Date.now()} Entering SQUARE mode branch`);
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
                console.log(`[RecorderDebug] ${Date.now()} Creating offscreen canvas...`);
                const offscreen = document.createElement('canvas');
                offscreen.width = squareSize;
                offscreen.height = squareSize;
                offscreenCanvasRef.current = offscreen;
                console.log(`[RecorderDebug] ${Date.now()} Offscreen canvas created`);

                const offCtx = offscreen.getContext('2d', { alpha: false });
                if (!offCtx) {
                    console.error('[Recorder] Failed to get offscreen context');
                    isInitializingRef.current = false;
                    return;
                }

                // ★ Pre-draw: 배경 채우기 + 첫 프레임 강제 그리기 (검정 깜빡임 방지)
                offCtx.fillStyle = '#000000';
                offCtx.fillRect(0, 0, squareSize, squareSize);
                offCtx.drawImage(
                    canvas,
                    cropX, cropY, originalSquareSize, originalSquareSize,
                    0, 0, squareSize, squareSize
                );

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

                console.log(`[RecorderDebug] ${Date.now()} Calling captureStream(${targetFPS})...`);
                videoStream = offscreen.captureStream(targetFPS);
                console.log(`[RecorderDebug] ${Date.now()} captureStream completed`);
            } else {
                // ============================================
                // FULL MODE: Max 1080p Downscaling
                // ============================================
                console.log(`[RecorderDebug] ${Date.now()} Entering FULL mode branch`);
                const srcWidth = canvas.width;
                const srcHeight = canvas.height;
                const maxDim = Math.max(srcWidth, srcHeight);

                if (maxDim > MAX_RESOLUTION) {
                    // Downscale needed
                    const scale = MAX_RESOLUTION / maxDim;
                    const destWidth = Math.round(srcWidth * scale);
                    const destHeight = Math.round(srcHeight * scale);

                    console.log(`[Recorder] Downscaling Full Mode: ${srcWidth}x${srcHeight} -> ${destWidth}x${destHeight}`);

                    console.log(`[RecorderDebug] ${Date.now()} Creating offscreen canvas for downscaling...`);
                    const offscreen = document.createElement('canvas');
                    offscreen.width = destWidth;
                    offscreen.height = destHeight;
                    offscreenCanvasRef.current = offscreen;
                    console.log(`[RecorderDebug] ${Date.now()} Offscreen canvas created`);

                    const offCtx = offscreen.getContext('2d', { alpha: false });
                    if (!offCtx) {
                        // Fallback
                        console.error('[Recorder] Failed to get context for resize, using original');
                        videoStream = canvas.captureStream(targetFPS);
                    } else {
                        // ★ Pre-draw: 배경 채우기 + 첫 프레임 강제 그리기 (검정 깜빡임 방지)
                        offCtx.fillStyle = '#000000';
                        offCtx.fillRect(0, 0, destWidth, destHeight);
                        offCtx.drawImage(canvas, 0, 0, srcWidth, srcHeight, 0, 0, destWidth, destHeight);

                        const copyFrame = () => {
                            if (!offscreenCanvasRef.current) return;
                            offCtx.drawImage(canvas, 0, 0, srcWidth, srcHeight, 0, 0, destWidth, destHeight);
                            animationFrameRef.current = requestAnimationFrame(copyFrame);
                        };
                        copyFrame();
                        console.log(`[RecorderDebug] ${Date.now()} Calling captureStream(${targetFPS}) for downscaled...`);
                        videoStream = offscreen.captureStream(targetFPS);
                        console.log(`[RecorderDebug] ${Date.now()} captureStream completed`);
                    }
                } else {
                    // ★ FIX: Original is small enough, but still use offscreen canvas to prevent WebGL context interruption
                    console.log(`[RecorderDebug] ${Date.now()} Using offscreen canvas (same size, no downscale)`);

                    const offscreen = document.createElement('canvas');
                    offscreen.width = srcWidth;
                    offscreen.height = srcHeight;
                    offscreenCanvasRef.current = offscreen;

                    const offCtx = offscreen.getContext('2d', { alpha: false });
                    if (!offCtx) {
                        console.error('[Recorder] Failed to get context, using original canvas as fallback');
                        videoStream = canvas.captureStream(targetFPS);
                    } else {
                        // ★ Pre-draw: 배경 채우기 + 첫 프레임 강제 그리기 (검정 깜빡임 방지)
                        console.log(`[RecorderDebug] ${Date.now()} Step 1: fillRect starting...`);
                        offCtx.fillStyle = '#000000';
                        offCtx.fillRect(0, 0, srcWidth, srcHeight);
                        console.log(`[RecorderDebug] ${Date.now()} Step 1: fillRect completed`);

                        console.log(`[RecorderDebug] ${Date.now()} Step 2: drawImage from WebGL starting...`);
                        offCtx.drawImage(canvas, 0, 0);
                        console.log(`[RecorderDebug] ${Date.now()} Step 2: drawImage completed`);

                        console.log(`[RecorderDebug] ${Date.now()} Step 3: Starting copyFrame loop...`);
                        const copyFrame = () => {
                            if (!offscreenCanvasRef.current) return;
                            offCtx.drawImage(canvas, 0, 0);
                            animationFrameRef.current = requestAnimationFrame(copyFrame);
                        };
                        copyFrame();
                        console.log(`[RecorderDebug] ${Date.now()} Step 3: copyFrame loop started`);

                        console.log(`[RecorderDebug] ${Date.now()} Step 4: Calling captureStream(${targetFPS})...`);
                        videoStream = offscreen.captureStream(targetFPS);
                        console.log(`[RecorderDebug] ${Date.now()} Step 4: captureStream completed`);
                    }
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

            // Video Bitrate Configuration
            // Mobile: 30 Mbps (Safe for iOS/Android memory & processing)
            // Desktop: 100 Mbps (Ultra Quality for big screens)
            const targetBitrate = isMobileDevice ? 30000000 : 100000000;

            const options: MediaRecorderOptions = {
                mimeType: selectedMimeType || undefined,
                videoBitsPerSecond: targetBitrate
            };
            console.log(`[Recorder] 📹 Configuration:`);
            console.log(`  - Device: ${isMobileDevice ? 'Mobile' : 'Desktop'}`);
            console.log(`  - MIME Type: ${selectedMimeType || 'default'}`);
            console.log(`  - Target Bitrate: ${targetBitrate / 1000000} Mbps`);
            console.log(`  - Target FPS: ${targetFPS} fps`);

            const recorder = new MediaRecorder(combinedStream, options);
            mediaRecorderRef.current = recorder;
            chunksRef.current = [];

            // 디버그용 변수
            let recordStartTime = 0;
            let totalDataSize = 0;
            let chunkCount = 0;

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                    chunkCount++;
                    totalDataSize += e.data.size;

                    const elapsedSec = ((Date.now() - recordStartTime) / 1000).toFixed(1);
                    const chunkSizeMB = (e.data.size / 1024 / 1024).toFixed(2);
                    const totalSizeMB = (totalDataSize / 1024 / 1024).toFixed(2);

                    console.log(`[Recorder] 📦 Chunk #${chunkCount}: ${chunkSizeMB} MB (Total: ${totalSizeMB} MB, Time: ${elapsedSec}s)`);
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

                // ★ Release initialization lock
                isInitializingRef.current = false;

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

            // Start (1초마다 메모리 버퍼를 비워 모바일 메모리 한계 방지)
            recorder.start(1000);
            setIsRecording(true);
            console.log('[Recorder] Started with 1s timeslice (memory-safe mode).');

            // Safety Timeout (Max 60 seconds)
            setTimeout(() => {
                if (recorder.state === 'recording') {
                    console.log('[Recorder] Max duration reached (60s). Stopping.');
                    recorder.stop();
                }
            }, 60000);

        } catch (err) {
            console.error('[Recorder] Failed to start recording:', err);
            isInitializingRef.current = false;
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
