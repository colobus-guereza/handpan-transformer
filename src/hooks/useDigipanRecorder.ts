import { useState, useRef, useCallback } from 'react';

interface UseDigipanRecorderProps {
    canvasRef: React.RefObject<HTMLCanvasElement>;
    getAudioContext: () => AudioContext | null;
    getMasterGain: () => GainNode | null;
    onRecordingComplete?: (blob: Blob) => void;
}

// ... imports ...
import * as Tone from 'tone';

export const useDigipanRecorder = ({ canvasRef, getAudioContext, getMasterGain, onRecordingComplete }: UseDigipanRecorderProps) => {
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const streamDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);

    // Refs for Tone.js Bridge
    const toneDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);
    const toneSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

    const startRecording = useCallback(() => {
        const canvas = canvasRef.current;
        const audioCtx = getAudioContext();
        const masterGain = getMasterGain();

        if (!canvas || !audioCtx || !masterGain) {
            console.error('[Recorder] Missing dependencies for recording (Canvas, AudioContext, or MasterGain)');
            return;
        }

        try {
            console.log('[Recorder] Initializing...');

            // 1. Capture Video Stream from Canvas (60 FPS for high smoothness)
            const canvasStream = canvas.captureStream(60);

            // 2. Capture Audio Stream from Howler
            const dest = audioCtx.createMediaStreamDestination();
            streamDestRef.current = dest;

            // Connect Master Gain to this destination
            masterGain.connect(dest);

            // 3. Bridge Tone.js Audio (Castling/Accompaniment)
            // We create a stream from Tone's context and pipe it into the recording context
            try {
                if (Tone.context && Tone.Destination) {
                    console.log('[Recorder] Bridging Tone.js audio...');

                    // A. Create a MediaStreamDestination in Tone's context
                    // Access rawContext to ensure we get the native method
                    const toneRawCtx = Tone.context.rawContext as AudioContext;
                    const toneDest = toneRawCtx.createMediaStreamDestination();
                    toneDestRef.current = toneDest;

                    // B. Connect Tone.Master to this destination
                    Tone.Destination.connect(toneDest);

                    // C. Create a Source in the Recording Context (audioCtx) from the stream
                    const toneStream = toneDest.stream;
                    const toneSource = audioCtx.createMediaStreamSource(toneStream);
                    toneSourceRef.current = toneSource;

                    // D. Connect the bridged source to the final recording destination
                    toneSource.connect(dest);
                    console.log('[Recorder] Tone.js bridge established.');
                }
            } catch (err) {
                // Non-critical error: Recording can proceed without accompaniment
                console.warn('[Recorder] Failed to bridge Tone.js audio:', err);
            }

            // 4. Combine Tracks
            const combinedStream = new MediaStream([
                ...canvasStream.getVideoTracks(),
                ...dest.stream.getAudioTracks()
            ]);

            // 5. Setup MediaRecorder
            const mimeTypes = [
                'video/mp4;codecs=h264,aac', // iOS/Android Standard (Best Compatibility)
                'video/mp4;codecs=avc1,mp4a.40.2', // Alternative H.264 + AAC
                'video/mp4',             // Generic MP4
                'video/mp4;codecs=h264', // Safari Explicit
                'video/webm;codecs=vp9', // Chrome Desktop (High Quality)
                'video/webm;codecs=vp8', // Chrome/Android Standard
                'video/webm'             // Generic Fallback
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
                        toneSourceRef.current.disconnect(); // Disconnect from everything
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
                // Determine extension based on actual mimeType used
                const actualMimeType = recorder.mimeType;

                // Compile the blob
                const blob = new Blob(chunksRef.current, { type: actualMimeType });

                // Cleanup Audio Nodes
                cleanup();

                // Notify Parent
                if (onRecordingComplete) {
                    onRecordingComplete(blob);
                }
            };

            // Start
            recorder.start();
            setIsRecording(true);
            console.log('[Recorder] Started.');

            // Safety Timeout (Max 60 seconds - Increased for longer demos)
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
        // This will trigger onstop defined in startRecording
        mediaRecorderRef.current.stop();
    }, []);

    return {
        isRecording,
        startRecording,
        stopRecording
    };
};
