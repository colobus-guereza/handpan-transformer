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

            let videoStream: MediaStream;

            if (cropModeRef.current === 'square') {
                // ============================================
                // SQUARE MODE: 오프스크린 캔버스로 중앙 크롭
                // ============================================
                const srcWidth = canvas.width;
                const srcHeight = canvas.height;
                const squareSize = Math.min(srcWidth, srcHeight);

                // 중앙 영역 계산
                const cropX = (srcWidth - squareSize) / 2;
                const cropY = (srcHeight - squareSize) / 2;

                console.log(`[Recorder] Creating square crop: ${squareSize}x${squareSize} from ${srcWidth}x${srcHeight}`);

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

                // 애니메이션 루프: 원본 → 오프스크린 복사
                const copyFrame = () => {
                    if (!offscreenCanvasRef.current) return;

                    offCtx.drawImage(
                        canvas,
                        cropX, cropY, squareSize, squareSize, // 소스 영역 (중앙 정사각형)
                        0, 0, squareSize, squareSize            // 대상 영역 (전체)
                    );

                    animationFrameRef.current = requestAnimationFrame(copyFrame);
                };
                copyFrame();

                // 오프스크린 캔버스에서 스트림 캡처
                videoStream = offscreen.captureStream(60);
            } else {
                // ============================================
                // FULL MODE: 기존 방식 (캔버스 전체)
                // ============================================
                videoStream = canvas.captureStream(60);
            }

            // 2. Capture Audio Stream from Howler
            const dest = audioCtx.createMediaStreamDestination();
            streamDestRef.current = dest;

            // Connect Master Gain to this destination
            masterGain.connect(dest);

            // 3. Bridge Tone.js Audio (Castling/Accompaniment)
            try {
                if (Tone.context && Tone.Destination) {
                    console.log('[Recorder] Bridging Tone.js audio...');

                    const toneRawCtx = Tone.context.rawContext as AudioContext;
                    const toneDest = toneRawCtx.createMediaStreamDestination();
                    toneDestRef.current = toneDest;

                    Tone.Destination.connect(toneDest);

                    const toneStream = toneDest.stream;
                    const toneSource = audioCtx.createMediaStreamSource(toneStream);
                    toneSourceRef.current = toneSource;

                    toneSource.connect(dest);
                    console.log('[Recorder] Tone.js bridge established.');
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
                videoBitsPerSecond: 50000000 // 50 Mbps
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

                if (onRecordingComplete) {
                    onRecordingComplete(blob);
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
    }, [canvasRef, getAudioContext, getMasterGain, onRecordingComplete]);

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
