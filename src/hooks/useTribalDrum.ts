import { useEffect, useRef } from 'react';
import * as Tone from 'tone';

export const useTribalDrum = (masterGainNode: Tone.Gain | null) => {
    // Refs for the instruments
    const kickRef = useRef<Tone.MembraneSynth | null>(null);
    const tomRef = useRef<Tone.MembraneSynth | null>(null); // Replaces Snare
    const hatRef = useRef<Tone.NoiseSynth | null>(null);

    // Refs for cleanup
    const disposablesRef = useRef<Tone.ToneAudioNode[]>([]);

    useEffect(() => {
        if (!masterGainNode) return;
        if (typeof window === 'undefined') return;

        // ═══════════════════════════════════════════════════════════════════════
        // 🔮 TRIBAL / SHAMANIC AUDIO ENGINE
        // ═══════════════════════════════════════════════════════════════════════

        // 1. Reverb Layer (Cave Effect)
        // 자연스러운 앰비언스를 위해 Reverb 추가
        const reverb = new Tone.Reverb({
            decay: 3.5,     // 긴 잔향 (동굴 느낌)
            preDelay: 0.05, // 약간의 공간감
            wet: 0.25       // 원음 위주 + 은은한 울림
        });
        reverb.connect(masterGainNode);

        // Reverb Impulse Response 생성 (비동기)
        reverb.generate().catch(e => console.error("Reverb generation failed", e));

        disposablesRef.current.push(reverb);

        // ═══════════════════════════════════════════════════════════════════════
        // 🦵 KICK: Heartbeat Drum (Frame Drum / Buffalo Drum)
        // ═══════════════════════════════════════════════════════════════════════
        // Tone: 아주 깊고 웅장한 소리
        // Filter: 100Hz Lowpass (초저역만 남김)
        // Envelope: Attack 0.02s, Decay 0.5s (긴 여운)

        const kickFilter = new Tone.Filter(100, "lowpass").connect(reverb);

        kickRef.current = new Tone.MembraneSynth({
            pitchDecay: 0.05,
            octaves: 4,          // 낮고 깊게 떨어짐
            oscillator: {
                type: "sine"     // 부드러운 사인파
            },
            envelope: {
                attack: 0.02,    // 부드러운 어택 (둥-)
                decay: 0.5,      // 긴 여운 (Heartbeat)
                sustain: 0.01,
                release: 1.0,    // 아주 긴 릴리즈
                attackCurve: "exponential"
            },
            volume: 2            // 존재감 있게
        }).connect(kickFilter);

        disposablesRef.current.push(kickFilter);
        disposablesRef.current.push(kickRef.current);

        // ═══════════════════════════════════════════════════════════════════════
        // 🪘 TOM: Deep Thud (Replaces Snare)
        // ═══════════════════════════════════════════════════════════════════════
        // 중요: NoiseSynth 사용 금지 -> MembraneSynth 사용
        // Tone: Kick보다 5세미톤 높은 '둥(Tom)' 소리

        // Tom Filter: Kick보다는 조금 더 열려있지만 여전히 따뜻하게
        const tomFilter = new Tone.Filter(200, "lowpass").connect(reverb);

        tomRef.current = new Tone.MembraneSynth({
            pitchDecay: 0.05,
            octaves: 3,
            oscillator: { type: "sine" },
            envelope: {
                attack: 0.02,
                decay: 0.4,
                sustain: 0,
                release: 0.8
            },
            volume: 0
        }).connect(tomFilter);

        disposablesRef.current.push(tomFilter);
        disposablesRef.current.push(tomRef.current);

        // ═══════════════════════════════════════════════════════════════════════
        // 🎩 HAT: Shaker / Rattle
        // ═══════════════════════════════════════════════════════════════════════
        // Tone: 찰찰거리는 나무 쉐이커
        // Filter: 3000Hz Highpass
        // Envelope: attack 0.1s (부드럽게 쏠리는 소리) = Shaker

        const hatFilter = new Tone.Filter(3000, "highpass").connect(reverb);

        hatRef.current = new Tone.NoiseSynth({
            noise: { type: "pink" },   // Pink Noise가 더 자연스러운 쉐이커 소리
            envelope: {
                attack: 0.1,           // 쓰-윽 (쉐이커 흔드는 동작)
                decay: 0.1,
                sustain: 0.05,
                release: 0.1
            },
            volume: -8                 // Ambient Noise 역할
        }).connect(hatFilter);

        disposablesRef.current.push(hatFilter);
        disposablesRef.current.push(hatRef.current);

        // Cleanup
        return () => {
            disposablesRef.current.forEach(node => node.dispose());
            disposablesRef.current = [];
            kickRef.current = null;
            tomRef.current = null;
            hatRef.current = null;
        };
    }, [masterGainNode]);

    return {
        kickRef,
        tomRef,
        hatRef
    };
};
