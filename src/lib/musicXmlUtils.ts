
/**
 * Utility for parsing MusicXML files.
 */

export interface ParsedNote {
    step: string;
    octave: number;
    alter: number;
    duration: number; // in divisions
    type: string;
    dots: number;
    isRest: boolean;
    accidental?: string;
}

export interface ParsedMeasure {
    number: number;
    notes: ParsedNote[];
    divisions: number;
    timeSignature?: {
        beats: number;
        beatType: number;
    };
    clef?: {
        sign: string;
        line: number;
    };
}

export interface ParsedScore {
    title: string;
    composer: string;
    measures: ParsedMeasure[];
}

/**
 * Parses MusicXML string and returns a structured score object.
 */
export function parseMusicXml(xmlString: string): ParsedScore {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");

    const score: ParsedScore = {
        title: xmlDoc.querySelector("work-title")?.textContent || "Untitled",
        composer: xmlDoc.querySelector("creator[type='composer']")?.textContent || "Unknown",
        measures: [],
    };

    const part = xmlDoc.querySelector("part");
    if (!part) return score;

    const measures = part.querySelectorAll("measure");
    let currentDivisions = 1;
    let currentTimeSignature = { beats: 4, beatType: 4 };

    measures.forEach((measureNode) => {
        const measureNumber = parseInt(measureNode.getAttribute("number") || "0", 10);

        // Check for attributes change
        const attributes = measureNode.querySelector("attributes");
        if (attributes) {
            const divNode = attributes.querySelector("divisions");
            if (divNode) currentDivisions = parseInt(divNode.textContent || "1", 10);

            const timeNode = attributes.querySelector("time");
            if (timeNode) {
                currentTimeSignature = {
                    beats: parseInt(timeNode.querySelector("beats")?.textContent || "4", 10),
                    beatType: parseInt(timeNode.querySelector("beat-type")?.textContent || "4", 10),
                };
            }
        }

        const notes: ParsedNote[] = [];
        const noteNodes = measureNode.querySelectorAll("note");

        noteNodes.forEach((n) => {
            // Filter for Voice 1 only to avoid overlapping notes causing "Too many ticks"
            const voice = n.querySelector("voice")?.textContent || "1";
            if (voice !== "1") return;

            // Skip grace notes as they don't have duration in the main timeline
            if (n.querySelector("grace")) return;

            const isRest = n.querySelector("rest") !== null;
            let step = "";
            let octave = 4;
            let alter = 0;

            if (!isRest) {
                step = n.querySelector("pitch step")?.textContent || "C";
                octave = parseInt(n.querySelector("pitch octave")?.textContent || "4", 10);
                alter = parseInt(n.querySelector("pitch alter")?.textContent || "0", 10);
            }

            const duration = parseInt(n.querySelector("duration")?.textContent || "1", 10);
            const type = n.querySelector("type")?.textContent || "quarter";
            const dots = n.querySelectorAll("dot").length;
            const accidental = n.querySelector("accidental")?.textContent || undefined;

            notes.push({
                step,
                octave,
                alter,
                duration,
                type,
                dots,
                isRest,
                accidental,
            });
        });

        score.measures.push({
            number: measureNumber,
            notes,
            divisions: currentDivisions,
            timeSignature: { ...currentTimeSignature },
        });
    });

    return score;
}
