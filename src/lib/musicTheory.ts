
import { Scale } from '../data/handpanScales';

/**
 * 1. 기초 주파수 데이터 (Hz)
 * 핸드팬의 범위인 2옥타브~5옥타브 위주로 정의
 * 필요한 경우 더 넓은 범위로 확장 가능
 */
export const NOTE_FREQS: Record<string, number> = {
    // 2옥타브 (베이스 확장용)
    "C2": 65.41, "C#2": 69.30, "D2": 73.42, "E2": 82.41, "F2": 87.31, "F#2": 92.50, "G2": 98.00, "A2": 110.00, "Bb2": 116.54, "B2": 123.47,

    // 3옥타브
    "C3": 130.81, "C#3": 138.59, "D3": 146.83, "Eb3": 155.56, "E3": 164.81, "F3": 174.61, "F#3": 185.00, "G3": 196.00, "G#3": 207.65, "A3": 220.00, "Bb3": 233.08, "B3": 246.94,

    // 4옥타브
    "C4": 261.63, "C#4": 277.18, "D4": 293.66, "Eb4": 311.13, "E4": 329.63, "F4": 349.23, "F#4": 369.99, "G4": 392.00, "G#4": 415.30, "A4": 440.00, "Bb4": 466.16, "B4": 493.88,

    // 5옥타브
    "C5": 523.25, "C#5": 554.37, "D5": 587.33, "Eb5": 622.25, "E5": 659.25, "F5": 698.46, "F#5": 739.99, "G5": 783.99, "G#5": 830.61, "A5": 880.00, "Bb5": 932.33, "B5": 987.77,

    // 6옥타브 (고음 확장)
    "C6": 1046.50,

    // Aliases for Flat/Sharp Equivalence
    "Db2": 69.30, "Gb2": 92.50, "Ab2": 103.83,
    "Db3": 138.59, "Gb3": 185.00, "Ab3": 207.65,
    "Db4": 277.18, "Gb4": 369.99, "Ab4": 415.30,
    "Db5": 554.37, "Gb5": 739.99, "Ab5": 830.61
};

/**
 * 노트 이름 파싱 유틸리티
 * 예: "Bb3" -> { note: "Bb", octave: 3, freq: 233.08 }
 */
const parseNote = (noteName: string) => {
    // Sharp/Flat 처리
    // 정규식: (음이름)(옵션: #|b)(옥타브 숫자)
    const match = noteName.match(/^([A-G])([#b]?)([0-8])$/);
    if (!match) return null;

    return {
        full: noteName,
        freq: NOTE_FREQS[noteName] || 0
    };
};

/**
 * Scale 객체에서 모든 구성음을 추출하고 주파수 순으로 정렬하여 반환
 */
export const getSortedScaleNotes = (scale: Scale): string[] => {
    // 1. 모든 노트 수집 (ding + bottom + top)
    const allNotes = new Set<string>();

    if (scale.notes.ding) allNotes.add(scale.notes.ding);
    scale.notes.bottom.forEach(n => allNotes.add(n));
    scale.notes.top.forEach(n => allNotes.add(n));

    // 2. 주파수 기준 정렬
    return Array.from(allNotes).sort((a, b) => {
        const freqA = NOTE_FREQS[a] || 0;
        const freqB = NOTE_FREQS[b] || 0;
        return freqA - freqB;
    });
};

/**
 * 16마디 코드 진행 템플릿
 * Degree: 정렬된 스케일 노트 배열에서의 인덱스 (0-indexed)
 * 4/4박자 기준, duration은 박자 수 (4 = 1마디)
 */
const PROGRESSION_TEMPLATE = [
    // A Part (Intro/Theme) - 4 Bars
    { degree: 0, duration: 4 }, // I (Tonic)
    { degree: 5, duration: 4 }, // VI (Sub-mediant) -> D Kurd 기준 F or Bb 느낌 (스케일 구성에 따라 다름)
    { degree: 3, duration: 4 }, // IV
    { degree: 4, duration: 4 }, // V (Dominant)

    // B Part (Development) - 4 Bars
    { degree: 0, duration: 4 }, // I
    { degree: 2, duration: 4 }, // III
    { degree: 5, duration: 4 }, // VI
    { degree: 4, duration: 4 }, // V

    // A' Part (Repeat/Variation) - 4 Bars
    { degree: 0, duration: 4 }, // I
    { degree: 5, duration: 4 }, // VI
    { degree: 3, duration: 4 }, // IV
    { degree: 4, duration: 4 }, // V

    // Outro - 4 Bars
    { degree: 0, duration: 4 }, // I (Hold)
    { degree: 0, duration: 4 }, // I (Hold)
    { degree: 0, duration: 4 }, // I (Hold)
    { degree: 0, duration: 4 }, // I (Fade out)
];

// 결과물 데이터 인터페이스
export interface ChordEvent {
    barIndex: number;      // 마디 번호 (0 ~ 15)
    timeOffset: number;    // 시작 시간 (박자 단위, 0, 4, 8... relative to loop start)
    duration: number;      // 지속 시간 (박자 단위)
    frequencies: number[]; // 실제 재생할 주파수들 [Root, 3rd, 5th]
    rootNote: string;      // 루트음 이름 (디버깅용)
    chordName: string;     // 코드 추정 이름 (예: "Dm", "Bb")
}

/**
 * 메인 함수: 스케일 정보를 받으면 16마디의 연주 데이터를 계산해서 반환
 */
export const generateAccompanimentData = (scale: Scale | null): ChordEvent[] => {
    if (!scale) return [];

    // 1. 스케일의 가용 음들을 주파수 순으로 정렬 (Lowest -> Highest)
    const notes = getSortedScaleNotes(scale);
    if (notes.length === 0) return [];

    const events: ChordEvent[] = [];
    let currentBeat = 0;

    // 2. 템플릿 순회 및 코드 생성
    PROGRESSION_TEMPLATE.forEach((item, index) => {
        // 2-1. Root Note 결정
        // degree가 노트 갯수를 넘어가면 모듈러 연산으로 옥타브 위쪽 음처럼 처리하거나 순환
        const rootIndex = item.degree % notes.length;
        const rootNoteName = notes[rootIndex];

        // 2-2. 3도 누적 방식 (1-3-5)으로 코드 구성
        // 핸드팬 스케일은 7음계가 아닐 수 있으므로 (8음, 9음 등),
        // 단순히 +2 인덱스가 3도가 아닐 수 있음.
        // 하지만 "스케일 내에서 2칸 건너뛰기"는 경험적으로 괜찮은 화성을 만듦 (Tertian Harmony)

        const thirdIndex = (rootIndex + 2) % notes.length;
        const fifthIndex = (rootIndex + 4) % notes.length;

        const chordNotes = [
            notes[rootIndex],
            notes[thirdIndex],
            notes[fifthIndex]
        ];

        // 2-3. 주파수 매핑
        // 만약 3음, 5음이 루트보다 주파수가 낮다면(배열이 순환해서 앞쪽으로 갔다면),
        // 옥타브를 올려야(2배) 자연스러운 보이싱이 됨

        const rootFreq = NOTE_FREQS[notes[rootIndex]] || 0;

        const frequencies = chordNotes.map((note, i) => {
            let freq = NOTE_FREQS[note] || 0;
            // 보이싱 보정: 
            // 1. 기본적으로 Root 아래로 내려가면 안됨 (Inversion 제외)
            // 2. 배열 인덱스가 순환했다면(logic: index < rootIndex) 한 옥타브 올림
            // 하지만 여기선 단순히 frequency 비교가 더 확실함

            if (i > 0 && freq < rootFreq) {
                freq *= 2; // 옥타브 Up
            }
            return freq;
        }).filter(f => f > 0);

        // 2-4. 예외 처리: 주파수가 너무 높으면(예: 1000Hz 이상) 패드 소리로 듣기 싫을 수 있음
        // 필요하다면 전체적으로 옥타브 다운 처리 고려 (나중에 튜닝)

        events.push({
            barIndex: index,
            timeOffset: currentBeat,
            duration: item.duration,
            frequencies: frequencies,
            rootNote: rootNoteName,
            chordName: `Chord ${item.degree + 1}` // 임시 이름
        });

        currentBeat += item.duration;
    });

    return events;
};
