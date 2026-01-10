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
            // Skip resonance for Snare notes (they are percussive/dry)
            if (noteName.includes('Snare')) return null;

            let fileName = noteName.replace('#', '%23'); // Simple manual encode for #

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

        // ★ [솔루션 A] 방어적 선행 스케줄링 (Defensive Pre-scheduling)
        // iOS Safari를 위한 안전 마진: 최소 50ms 이상 확보
        const SAFE_MARGIN = 0.05; // 50ms
        const effectiveDelay = Math.max(settings.delayTime, SAFE_MARGIN);
        const startTime = now + effectiveDelay;

        // [정밀 진단] 스케줄링 여유 시간 측정
        const scheduleMargin = startTime - now;

        console.log(`[Debug-Resonance] [솔루션 A: 방어적 선행 스케줄링]`);
        console.log(`[Debug-Resonance]   ctx.currentTime (now): ${now.toFixed(4)}s`);
        console.log(`[Debug-Resonance]   원래 delay: ${settings.delayTime}s, 적용된 delay: ${effectiveDelay}s`);
        console.log(`[Debug-Resonance]   startTime: ${startTime.toFixed(4)}s`);
        console.log(`[Debug-Resonance]   여유 마진: ${(scheduleMargin * 1000).toFixed(2)}ms ${scheduleMargin < 0.05 ? '⚠️ 위험' : '✅ 안전(50ms+)'}`)
        console.log(`[Debug-Resonance]   trimStart: ${settings.trimStart}s`);
        console.log(`[Debug-Resonance]   fadeIn: ${settings.fadeInDuration}s (curve: ${settings.fadeInCurve})`);
        console.log(`[Debug-Resonance]   targetGain: ${settings.masterGain}`);

        // ★ [핵심] Gain Node 이중 앵커링 (Double Anchoring)
        // WebKit 보간 버그 방지: now와 startTime 양쪽에 setValueAtTime(0) 설정
        console.log(`[Debug-Resonance] ★★★ 이중 앵커링 + 지수 페이드 복원 ★★★`);

        // 1. 즉시 0으로 고정 (현재 시점) - 틱 방지 핵심
        gainNode.gain.setValueAtTime(0, now);
        console.log(`[Debug-Resonance]   ① setValueAtTime(0, now=${now.toFixed(4)}) - 즉시 고정`);

        // 2. 재생 시작 시점에도 0으로 앵커 (WebKit 보간 버그 방지)
        gainNode.gain.setValueAtTime(0, startTime);
        console.log(`[Debug-Resonance]   ② setValueAtTime(0, startTime=${startTime.toFixed(4)}) - 앵커`);

        const fadeEndTime = startTime + settings.fadeInDuration;

        // 3. 페이드 곡선 분기: 지수(눌림) vs 선형
        if (settings.fadeInCurve > 1) {
            // ★ [복원] 지수 곡선 페이드 (눌린 모양)
            // exponentialRamp는 0에서 시작 불가 → 0.001에서 시작
            const EPSILON = 0.001;
            const rampStartTime = startTime + 0.001; // 1ms 오프셋 후 미세값 설정

            gainNode.gain.setValueAtTime(EPSILON, rampStartTime);
            gainNode.gain.exponentialRampToValueAtTime(settings.masterGain, fadeEndTime);

            console.log(`[Debug-Resonance]   ③ 지수 페이드 복원 (curve: ${settings.fadeInCurve})`);
            console.log(`[Debug-Resonance]      setValueAtTime(${EPSILON}, ${rampStartTime.toFixed(4)})`);
            console.log(`[Debug-Resonance]      exponentialRamp(${settings.masterGain}, ${fadeEndTime.toFixed(4)})`);
        } else {
            // 선형 램프
            gainNode.gain.linearRampToValueAtTime(settings.masterGain, fadeEndTime);
            console.log(`[Debug-Resonance]   ③ 선형 페이드 (curve: ${settings.fadeInCurve})`);
            console.log(`[Debug-Resonance]      linearRamp(${settings.masterGain}, ${fadeEndTime.toFixed(4)})`);
        }

        // 4. 소스 재생 예약
        source.start(startTime, settings.trimStart);
        console.log(`[Debug-Resonance]   ④ source.start(${startTime.toFixed(4)}, ${settings.trimStart}) 호출됨`);

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
