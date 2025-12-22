import { useRef, useEffect, useCallback } from 'react';

export interface ResonanceSettings {
    trimStart: number;      // Seconds to cut from start (Attack removal)
    fadeInDuration: number; // Seconds for fade-in
    fadeInCurve: number;    // Exponential factor (1 = linear, 5 = very steep)
    delayTime: number;      // Seconds to delay playback (Latency)
    masterGain: number;     // Volume of the harmonic
}

// Global Cache for AudioBuffers (Persists across component unmounts)
const globalAudioBuffers = new Map<string, AudioBuffer>();

interface UseOctaveResonanceProps {
    getAudioContext?: () => AudioContext | null;
    getMasterGain?: () => GainNode | null;
}

export const useOctaveResonance = ({ getAudioContext, getMasterGain }: UseOctaveResonanceProps = {}) => {
    // We no longer strictly need a local ref if we use the getter, 
    // but for fallback we might still want one? 
    // Actually, to fix the mobile issue, we should AVOID creating a local context if one is supplied.
    const localAudioContextRef = useRef<AudioContext | null>(null);

    // Helper to get the active context (Shared or Local)
    const getContext = useCallback(() => {
        if (getAudioContext) {
            const ctx = getAudioContext();
            if (ctx) return ctx;
        }
        return localAudioContextRef.current;
    }, [getAudioContext]);

    // Initialize Local AudioContext ONLY if no shared getter is provided (Legacy fallback)
    useEffect(() => {
        if (!getAudioContext) {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContextClass) {
                localAudioContextRef.current = new AudioContext();
            }
        }
        return () => {
            if (localAudioContextRef.current) {
                localAudioContextRef.current.close().catch(e => console.warn("Failed to close AC", e));
            }
        };
    }, [getAudioContext]);

    // Load Audio Buffer (Global Cache)
    const loadBuffer = useCallback(async (noteName: string) => {
        // Return existing from Global Cache if available
        if (globalAudioBuffers.has(noteName)) {
            return globalAudioBuffers.get(noteName)!;
        }

        const ctx = getContext();
        if (!ctx) return null;

        try {
            const fileName = noteName.replace('#', '%23'); // Simple manual encode for #
            const response = await fetch(`/sounds/${fileName}.mp3`);
            const arrayBuffer = await response.arrayBuffer();

            // decoding audio data requires a context
            const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

            globalAudioBuffers.set(noteName, audioBuffer);
            return audioBuffer;
        } catch (error) {
            console.error(`Failed to load resonance audio: ${noteName}`, error);
            return null;
        }
    }, [getContext]);

    const playResonantNote = useCallback(async (noteName: string, settings: ResonanceSettings) => {
        // ★ [디버그] 모바일 환경 특화 하모닉 재생 디버깅
        const isMobileDevice = typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const playStart = performance.now();
        console.log(`[Debug-Resonance] ===== 하모닉 재생 시작: ${noteName} =====`);
        console.log(`[Debug-Resonance] 환경: ${isMobileDevice ? '📱 모바일' : '💻 데스크톱'}`);

        const ctx = getContext();
        if (!ctx) {
            console.warn(`[Debug-Resonance] ⚠️ AudioContext 없음!`);
            return;
        }

        console.log(`[Debug-Resonance] AudioContext 상태: ${ctx.state}`);
        console.log(`[Debug-Resonance] AudioContext sampleRate: ${ctx.sampleRate}Hz`);
        console.log(`[Debug-Resonance] AudioContext currentTime: ${ctx.currentTime.toFixed(4)}s`);
        console.log(`[Debug-Resonance] AudioContext baseLatency: ${ctx.baseLatency ?? 'N/A'}s`);

        if (ctx.state === 'suspended') {
            console.log(`[Debug-Resonance] AudioContext resume 시도...`);
            const resumeStart = performance.now();
            await ctx.resume();
            console.log(`[Debug-Resonance] AudioContext resume 완료: ${(performance.now() - resumeStart).toFixed(1)}ms`);
        }

        // 버퍼 로딩 시간 측정
        const bufferStart = performance.now();
        const buffer = await loadBuffer(noteName);
        const bufferLoadTime = performance.now() - bufferStart;

        if (!buffer) {
            console.warn(`[Debug-Resonance] ⚠️ 버퍼 로드 실패: ${noteName}`);
            return;
        }

        console.log(`[Debug-Resonance] 버퍼 로드: ${bufferLoadTime.toFixed(1)}ms (캐시 ${bufferLoadTime < 1 ? 'HIT ✅' : 'MISS ❌'})`);
        console.log(`[Debug-Resonance] 버퍼 길이: ${buffer.duration.toFixed(2)}s, 채널: ${buffer.numberOfChannels}`);

        const source = ctx.createBufferSource();
        source.buffer = buffer;

        const gainNode = ctx.createGain();
        source.connect(gainNode);

        const masterGain = getMasterGain ? getMasterGain() : null;
        console.log(`[Debug-Resonance] Master Gain 연결: ${masterGain ? '✅ Limiter 경유' : '❌ destination 직접'}`);

        if (masterGain) {
            gainNode.connect(masterGain);
        } else {
            gainNode.connect(ctx.destination);
        }

        const now = ctx.currentTime;
        const startTime = now + settings.delayTime;

        // ★ [수정됨] 클릭 방지를 위한 미니 램프 시간 (2ms)
        const ANTI_CLICK_RAMP_TIME = 0.002;

        console.log(`[Debug-Resonance] [스케줄링]`);
        console.log(`[Debug-Resonance]   ctx.currentTime: ${now.toFixed(4)}s`);
        console.log(`[Debug-Resonance]   startTime: ${startTime.toFixed(4)}s (delay: ${settings.delayTime}s)`);
        console.log(`[Debug-Resonance]   trimStart: ${settings.trimStart}s`);
        console.log(`[Debug-Resonance]   fadeIn: ${settings.fadeInDuration}s (curve: ${settings.fadeInCurve})`);
        console.log(`[Debug-Resonance]   targetGain: ${settings.masterGain}`);
        console.log(`[Debug-Resonance]   antiClickRamp: ${ANTI_CLICK_RAMP_TIME * 1000}ms`);

        // ★ [수정됨] Gain Ramp - 클릭 방지 로직 적용
        // 문제: setValueAtTime(0, T)와 linearRampToValueAtTime(0.01, T)가 같은 시간에 예약되면 클릭 발생
        // 해결: linearRamp가 2ms 후로 예약되도록 수정
        console.log(`[Debug-Resonance] ★★★ Gain Ramp 시작 (수정된 로직) ★★★`);

        // 1. 시작 시점에 완전 무음 설정
        gainNode.gain.setValueAtTime(0, startTime);
        console.log(`[Debug-Resonance]   setValueAtTime(0, ${startTime.toFixed(4)})`);

        if (settings.fadeInCurve > 1) {
            // 2. 2ms에 걸쳐 0 → 0.01로 부드럽게 전환 (클릭 방지)
            const miniRampEnd = startTime + ANTI_CLICK_RAMP_TIME;
            gainNode.gain.linearRampToValueAtTime(0.01, miniRampEnd);
            console.log(`[Debug-Resonance]   ✅ linearRamp(0.01, ${miniRampEnd.toFixed(4)}) - 2ms 오프셋 적용`);

            // 3. 이후 지수 곡선으로 목표 볼륨까지 페이드인
            const fadeEndTime = miniRampEnd + settings.fadeInDuration;
            gainNode.gain.exponentialRampToValueAtTime(settings.masterGain, fadeEndTime);
            console.log(`[Debug-Resonance]   exponentialRamp(${settings.masterGain}, ${fadeEndTime.toFixed(4)})`);
        } else {
            // 선형 램프: 시작부터 바로 목표 볼륨까지
            const fadeEndTime = startTime + ANTI_CLICK_RAMP_TIME + settings.fadeInDuration;
            gainNode.gain.linearRampToValueAtTime(0.01, startTime + ANTI_CLICK_RAMP_TIME);
            gainNode.gain.linearRampToValueAtTime(settings.masterGain, fadeEndTime);
            console.log(`[Debug-Resonance]   linearRamp(${settings.masterGain}, ${fadeEndTime.toFixed(4)})`);
        }

        source.start(startTime, settings.trimStart);
        console.log(`[Debug-Resonance]   source.start(${startTime.toFixed(4)}, ${settings.trimStart}) 호출됨`);

        const totalTime = performance.now() - playStart;
        console.log(`[Debug-Resonance] 총 처리 시간: ${totalTime.toFixed(1)}ms`);
        console.log(`[Debug-Resonance] ===== 하모닉 재생 스케줄 완료 =====`);
    }, [getContext, loadBuffer, getMasterGain]);

    // Smart Preloading Function
    const preloadNotes = useCallback(async (noteNames: string[]) => {
        // Initialize local if needed and no shared
        if (!getAudioContext && !localAudioContextRef.current) {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContextClass) {
                localAudioContextRef.current = new AudioContext();
            }
        }

        // Parallel loading without blocking
        noteNames.forEach(note => {
            // Only load if not already in global cache
            if (!globalAudioBuffers.has(note)) {
                loadBuffer(note).catch(err => console.warn(`[Resonance] Preload failed for ${note}`, err));
            }
        });
    }, [loadBuffer, getAudioContext]);

    return {
        playResonantNote,
        preloadNotes
    };
};
