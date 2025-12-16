import { useRef, useEffect } from 'react';

/**
 * 화성 반주용 신디사이저 훅
 * MP3 없이 오실레이터로 부드러운 Pad 사운드를 실시간 합성합니다.
 */
export const useChordSynth = (audioCtx: AudioContext | null) => {
    // 전체 볼륨을 조절하는 마스터 노드
    const masterGainRef = useRef<GainNode | null>(null);

    // 초기화: 마스터 게인 노드 생성 및 연결
    useEffect(() => {
        if (!audioCtx) return;

        // 마스터 볼륨 설정 (화음이 겹치므로 낮게 설정: 0.2 ~ 0.3)
        const masterGain = audioCtx.createGain();
        masterGain.gain.value = 0.25;
        masterGain.connect(audioCtx.destination);

        masterGainRef.current = masterGain;

        return () => {
            // masterGain.disconnect(); 
            // 주의: AudioContext가 공유되는 경우 연결 해제가 다른 오디오에 영향을 줄 수 있으므로 조심해야 함.
            // 여기서는 컴포넌트 언마운트 시 노드 연결만 끊음.
            if (masterGainRef.current) {
                masterGainRef.current.disconnect();
            }
        };
    }, [audioCtx]);

    /**
     * 단일 코드를 재생하는 함수
     * @param frequencies 재생할 주파수 배열 (예: [220, 330, 440])
     * @param time 재생 시작 시간 (audioCtx.currentTime 기준)
     * @param duration 지속 시간 (초 단위)
     */
    const playChord = (frequencies: number[], time: number, duration: number) => {
        if (!audioCtx) {
            console.error("[useChordSynth] AudioContext is null!");
            return;
        }
        if (!masterGainRef.current) {
            console.error("[useChordSynth] MasterGain mismatch or null!");
        }

        // Add small safety buffer if time is close to currentTime
        const startTime = Math.max(time, audioCtx.currentTime + 0.05);

        console.log(`[useChordSynth] playChord called. Freqs: ${frequencies}, Duration: ${duration}, AdjustedStart: ${startTime}`);

        // Common Filter for the Chord (or per note? Per note is richer)
        // Let's do per note for rich detuning potential in future

        const attackTime = 0.5;  // Slower attack for Pad
        const releaseTime = 1.0;

        frequencies.forEach(freq => {
            // 1. Oscillator: Sawtooth for rich harmonics
            const osc = audioCtx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.value = freq;

            // 2. Filter: Lowpass to tame harshness (Subtractive Synthesis)
            const filter = audioCtx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = freq * 4; // Brightness relative to pitch
            filter.Q.value = 1; // Slight resonance

            // 3. Gain: Envelope
            const noteGain = audioCtx.createGain();

            // Graph: Osc -> Filter -> NoteGain -> MasterGain
            osc.connect(filter);
            filter.connect(noteGain);
            noteGain.connect(masterGainRef.current!);

            // 4. Volume Envelope (ADSR)
            noteGain.gain.setValueAtTime(0, startTime);
            noteGain.gain.linearRampToValueAtTime(0.5, startTime + attackTime); // Max vol 0.5 to avoid clipping

            const endMeasure = startTime + duration;
            noteGain.gain.setValueAtTime(0.5, endMeasure - releaseTime);
            noteGain.gain.linearRampToValueAtTime(0.001, endMeasure);

            // 5. Start/Stop
            osc.start(startTime);
            osc.stop(endMeasure + 0.1); // Extra buffer for release
        });
    };

    // 비상 정지 기능 (옵션)
    const stopAll = () => {
        if (masterGainRef.current) {
            // 급격히 줄이고 끊기
            const ctx = audioCtx;
            if (ctx) {
                masterGainRef.current.gain.cancelScheduledValues(ctx.currentTime);
                masterGainRef.current.gain.setValueAtTime(masterGainRef.current.gain.value, ctx.currentTime);
                masterGainRef.current.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.1);
            }
        }
    };

    return { playChord, stopAll };
};
