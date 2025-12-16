import { useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';

export const useDreamyPad = () => {
    const synthRef = useRef<Tone.PolySynth | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        // --- [1] Master Effect Chain (고급스러운 공간감의 핵심) ---

        // 1. Limiter: 여러 화음이 겹칠 때 소리가 찢어지는 것을 방지
        const limiter = new Tone.Limiter(-1).toDestination();

        // 2. Reverb: 거대한 우주 공간 느낌 (Decay 12초)
        const reverb = new Tone.Reverb({
            decay: 12,       // 아주 긴 잔향
            wet: 0.6,        // 원음보다 리버브 비중을 높게
            preDelay: 0.3    // 소리가 나고 0.3초 뒤에 울림 (공간의 크기감)
        }).connect(limiter);

        // 3. PingPongDelay: 좌우로 소리가 퍼지는 입체감
        const delay = new Tone.PingPongDelay({
            delayTime: "4n.", // 점 4분음표 박자
            feedback: 0.4,    // 40% 반복
            wet: 0.3          // 은은하게
        }).connect(reverb);

        // 4. Chorus: 소리를 두껍고 몽환적으로 (Detune 효과)
        const chorus = new Tone.Chorus({
            frequency: 0.3,   // 아주 느린 물결
            delayTime: 4.5,
            depth: 0.8,
            spread: 180       // 완전한 스테레오
        }).connect(delay).start();

        // 5. AutoFilter: 소리의 밝기를 천천히 변화시킴 (살아있는 느낌)
        const autoFilter = new Tone.AutoFilter({
            frequency: 0.1,   // 10초에 한 번씩 필터가 열렸다 닫힘
            baseFrequency: 400,
            octaves: 2.5,
            filter: {
                type: "lowpass",
                rolloff: -24,
                Q: 1
            }
        }).connect(chorus).start();


        // --- [2] Synth Source (따뜻한 소리의 원천) ---

        const synth = new Tone.PolySynth(Tone.Synth, {
            oscillator: {
                // FatTriangle: 일반 삼각파보다 배음이 풍부하고 두꺼움
                type: "fattriangle",
                count: 3,         // 오실레이터 3개를 겹침
                spread: 40        // 3개의 오실레이터를 좌우로 벌림
            },

            envelope: {
                attack: 3.0,      // 3초 동안 서서히 커짐 (붓으로 칠하듯이)
                decay: 3.0,
                sustain: 1.0,     // 건반을 누르는 동안 최대 볼륨 유지
                release: 0.8,     // 빠른 페이드아웃 (0.8초)
                attackCurve: "exponential"
            },

            volume: -20 // Pad volume lowered to 60% relative balance
        });

        synth.maxPolyphony = 6; // Set maxPolyphony on instance
        synth.connect(autoFilter);

        synthRef.current = synth;

        // Cleanup
        return () => {
            synth.dispose();
            autoFilter.dispose();
            chorus.dispose();
            delay.dispose();
            reverb.dispose();
            limiter.dispose();
        };
    }, []);

    const toggleSound = async (note: string | number) => {
        await Tone.start();
        if (!synthRef.current) return;

        if (isPlaying) {
            // [OFF] 즉시 종료: 볼륨을 -Infinity로 설정하여 즉시 무음
            synthRef.current.volume.value = -Infinity;
            synthRef.current.releaseAll();
            // 다음 재생을 위해 볼륨 복원
            setTimeout(() => {
                if (synthRef.current) synthRef.current.volume.value = -20;
            }, 100);
            setIsPlaying(false);
        } else {
            // [ON] Attack 타임(3초)에 맞춰 자연스럽게 등장
            // 만약 이미 다른 음이 울리고 있다면 release 후 재생
            synthRef.current.releaseAll();
            // Play Ding Frequency and a Sub Octave for richness
            // If note is number, we can calculate. If string, leave as is.
            if (typeof note === 'number') {
                synthRef.current.triggerAttack([note, note / 2]);
            } else {
                synthRef.current.triggerAttack(note);
            }

            setIsPlaying(true);
        }
    };

    return { toggleSound, isPlaying };
};
