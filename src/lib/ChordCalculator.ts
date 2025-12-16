import * as Tone from 'tone';

export interface ChordSet {
    barStart: number;
    notes: string[];
    role: string;
}

/**
 * 핸드팬 스케일 맞춤형 화성 생성기 (Final Version)
 * 1. Smart Interval Logic: 불협화음(2도 등)을 피하고 3도/5도를 수학적으로 찾음.
 * 2. Cinematic Progression: 1-6-3-7 진행으로 세련된 분위기 연출.
 */
export const calculateChordProgression = (scaleNotes: string[]): ChordSet[] => {
    // 안전장치: 노트가 너무 적으면 빈 배열 반환
    if (!scaleNotes || scaleNotes.length < 5) return [];

    // [Step 1] 계산 효율화를 위한 미디 노트 맵핑
    const noteToMidi = new Map<string, number>();
    const midiToNote = new Map<number, string>();

    scaleNotes.forEach(note => {
        const midi = Tone.Frequency(note).toMidi();
        noteToMidi.set(note, midi);
        midiToNote.set(midi, note);
    });

    // 스케일 내의 모든 미디 노트 (오름차순 정렬)
    const sortedMidis = Array.from(noteToMidi.values()).sort((a, b) => a - b);

    /**
     * [핵심 로직] 주어진 루트 노트에 대해 스케일 내에서 가장 잘 어울리는 화음 찾기
     * - 무조건 인덱스 +2가 아니라, 반음 간격(Interval)을 확인하여 불협화음 방지
     */
    const findHarmonicNotes = (rootNote: string): string[] => {
        const rootMidi = noteToMidi.get(rootNote);
        if (rootMidi === undefined) return [rootNote];

        const chordNotes = [rootNote]; // 베이스 노트 포함

        // 1. Perfect 5th (완전 5도) 찾기 - 가장 중요 (약 7반음 차이)
        // 스케일 내에 정확히 +7이 없으면 ±1 범위 내에서 근사값 찾기 (파워코드 형성)
        const perfectFifth = sortedMidis.find(m => Math.abs(m - (rootMidi + 7)) <= 1);

        // 2. 3rd (3도) 찾기 - 성격 결정 (Major +4 / Minor +3)
        // 3도가 스케일에 없으면 과감히 생략하여 깔끔한 파워코드(Root+5th)로 감
        const major3rd = sortedMidis.find(m => m === rootMidi + 4);
        const minor3rd = sortedMidis.find(m => m === rootMidi + 3);

        // 3도 추가 (우선순위: 스케일에 있는 것)
        if (minor3rd) chordNotes.push(midiToNote.get(minor3rd)!);
        else if (major3rd) chordNotes.push(midiToNote.get(major3rd)!);

        // 5도 추가 (소리의 뼈대)
        if (perfectFifth) {
            chordNotes.push(midiToNote.get(perfectFifth)!);
        } else {
            // 만약 5도조차 없다면? (희박하지만) -> 옥타브 위(Root + 12)를 추가하여 풍성함 유지
            const octave = sortedMidis.find(m => m === rootMidi + 12);
            if (octave) chordNotes.push(midiToNote.get(octave)!);
        }

        return chordNotes;
    };

    // [Step 2] Cinematic Minor Progression (1 - 6 - 4 - 5)
    // 핸드팬의 감성에 가장 잘 맞는 현대적 진행
    const len = scaleNotes.length;

    const progressionIndices = [
        { idx: 0, bar: 1, role: "The Root (i) - Start" },          // 1도
        { idx: 5 % len, bar: 5, role: "The Epic (VI) - Climax" },  // 6도
        { idx: 3 % len, bar: 9, role: "The Deep (iv) - Deep" },    // 4도
        { idx: 4 % len, bar: 13, role: "The Climax (V) - Resolve" } // 5도
    ];

    // 각 단계별로 스마트 화음 계산 적용
    return progressionIndices.map(prog => {
        const rootNote = scaleNotes[prog.idx];
        const harmonicNotes = findHarmonicNotes(rootNote);

        return {
            barStart: prog.bar,
            notes: harmonicNotes, // ["D3", "F3", "A3"] 등 계산된 실제 노트
            role: prog.role
        };
    });
};
