"use client";

import React, { useState, Suspense, useMemo, use } from 'react';
import dynamic from 'next/dynamic';
import { parseMidi, findBestMatchScale, getScaleNotes } from '@/lib/midiUtils';
import { useMidiStore, TrackRole } from '@/store/useMidiStore';
import { SCALES } from '@/data/handpanScales';
import { Language } from '@/constants/translations';

const MiniDigiPan = dynamic(() => import('@/components/digipan/MiniDigiPan'), {
    ssr: false,
    loading: () => <div className="flex items-center justify-center w-full h-full text-neutral-500">Loading 3D Model...</div>
});


import ScaleSelection from '@/components/dev/ScaleSelection';
export default function DevDashboard(props: { params: Promise<any> }) {
    const params = use(props.params); // Unwrap params to satisfy Next.js 15 requirement
    const [logs, setLogs] = useState<string[]>([]);
    const [manualScaleId, setManualScaleId] = useState<string | null>(null);



    // Zustand Store
    const { midiData, setMidiData, updateTrackRole, matchingAlgorithm, setMatchingAlgorithm } = useMidiStore();

    // Determine Target Scale (Default to D Asha 9 if no MIDI or no match)
    // The previous code had 'd_kurd_10' as default. The user specifically asked for 'D Asha 9'.
    // We map the suggestedScale ID to the Scale object.
    const targetScale = useMemo(() => {
        // Priority 1: Manual Selection
        if (manualScaleId) {
            const found = SCALES.find(s => s.id === manualScaleId);
            if (found) return found;
        }

        const targetId = midiData?.suggestedScale || 'd_asha_9';
        // Try finding by ID first
        let found = SCALES.find(s => s.id === targetId);
        // Fallback to name search if needed (e.g. if ID schema differs)
        if (!found) found = SCALES.find(s => s.name === "D Asha 9");
        // Fallback to first scale
        if (!found) found = SCALES[0];
        return found;
    }, [midiData?.suggestedScale, manualScaleId]);

    const language: Language = 'ko'; // Default to Korean

    const addLog = (msg: string) => {
        setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
    };

    const digiPanRef = React.useRef<any>(null); // Use any for dynamic component ref


    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        addLog(`File selected: ${file.name}`);

        try {
            const arrayBuffer = await file.arrayBuffer();
            // Use core logic to parse and classify
            const processedSong = await parseMidi(arrayBuffer, file.name, matchingAlgorithm);

            setMidiData(processedSong);
            addLog(`MIDI Parsed & Classified: ${processedSong.midiName} (${processedSong.tracks.length} tracks)`);

            // Auto-log initial classification results
            processedSong.tracks.forEach(t => {
                addLog(`[Track ${t.id}] ${t.name} -> ${t.role.toUpperCase()}`);
            });

        } catch (err) {
            addLog(`Error parsing MIDI: ${err}`);
            console.error(err);
        }
    };

    return (
        <div className="flex w-full h-screen bg-neutral-900 text-white font-mono overflow-hidden">
            {/* LEFT: Input & Control */}
            <div className="w-1/3 min-w-[350px] border-r border-neutral-700 p-4 flex flex-col gap-6 overflow-y-auto">
                <div>
                    <h2 className="text-xl font-bold mb-4 text-emerald-400">1. 입력 및 제어</h2>
                    <div className="bg-neutral-800 p-4 rounded-lg border border-neutral-700 space-y-4">
                        {/* Mode Toggle */}
                        <div>
                            <label className="block mb-2 text-sm text-neutral-400">매칭 모드 (Matching Mode)</label>
                            <div className="flex bg-neutral-900 p-1 rounded-lg border border-neutral-700 relative">
                                <button
                                    onClick={() => {
                                        setMatchingAlgorithm('standard');
                                        addLog('[Mode] Switched to Standard Mode (Waterfall)');
                                        if (midiData) {
                                            const { scaleId: suggestedScale, matchResult } = findBestMatchScale(midiData.tracks, 'standard');
                                            setMidiData({ ...midiData, suggestedScale, matchResult });
                                            addLog(`[Re-Match] New Scale: ${matchResult?.scaleName}`);
                                        }
                                    }}
                                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all z-10 ${matchingAlgorithm === 'standard' ? 'bg-emerald-600 text-white shadow-sm' : 'text-neutral-500 hover:text-white'}`}
                                >
                                    Standard
                                </button>
                                <button
                                    onClick={() => {
                                        setMatchingAlgorithm('pro');
                                        addLog('[Mode] Switched to Pro Mode (Max Score)');
                                        if (midiData) {
                                            const { scaleId: suggestedScale, matchResult } = findBestMatchScale(midiData.tracks, 'pro');
                                            setMidiData({ ...midiData, suggestedScale, matchResult });
                                            addLog(`[Re-Match] New Scale: ${matchResult?.scaleName}`);
                                        }
                                    }}
                                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all z-10 ${matchingAlgorithm === 'pro' ? 'bg-red-600 text-white shadow-sm' : 'text-neutral-500 hover:text-white'}`}
                                >
                                    Pro
                                </button>
                            </div>
                            <div className="mt-2 text-[10px] text-neutral-500 leading-tight">
                                {matchingAlgorithm === 'standard'
                                    ? "🔵 Picks 9-10 note scales (Tier 1) if possible. Best for beginners."
                                    : "🔴 Picks precise match even if it's a complex Mutant scale."}
                            </div>
                        </div>

                        <div>
                            <label className="block mb-2 text-sm text-neutral-400">MIDI 파일 업로드 (.mid)</label>
                            <input
                                type="file"
                                accept=".mid"
                                onChange={handleFileUpload}
                                className="w-full text-sm text-neutral-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700"
                            />
                        </div>

                        <div className="border-t border-neutral-700 pt-4 space-y-4">

                            {/* Audio Start Button Removed per user request (Auto-start on interaction) */}
                        </div>
                    </div>

                    {/* Scale Selection */}
                    <ScaleSelection
                        currentScaleId={targetScale.id}
                        onScaleSelect={(id) => {
                            setManualScaleId(id);
                            addLog(`[Manual] Scale selected: ${id}`);
                        }}
                    />
                </div>

                {midiData && (
                    <div className="bg-neutral-800 p-4 rounded-lg border border-neutral-700">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg">트랙 목록 (Track List)</h3>
                            <span className="text-xs text-neutral-500">{midiData.bpm.toFixed(0)} BPM</span>
                        </div>

                        <ul className="space-y-3">
                            {midiData.tracks.map((track) => (
                                <li key={track.id} className="bg-neutral-900 p-3 rounded border border-neutral-800 flex flex-col gap-2">
                                    <div className="flex justify-between items-start">
                                        <span className="font-semibold text-sm truncate w-32" title={track.name}>
                                            {track.id}. {track.name || 'Untitled'}
                                        </span>
                                        <span className="text-xs text-neutral-500 whitespace-nowrap">
                                            {track.noteCount} notes | Ch {track.channel + 1}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between gap-2">
                                        <select
                                            value={track.role}
                                            onChange={(e) => {
                                                const newRole = e.target.value as TrackRole;
                                                updateTrackRole(track.id, newRole);
                                                addLog(`[Manual] Track ${track.id} role changed to ${newRole.toUpperCase()}`);
                                            }}
                                            className={`text-xs p-1 rounded border bg-neutral-950 w-full
                          ${track.role === 'melody' ? 'text-emerald-400 border-emerald-900' : ''}
                          ${track.role === 'rhythm' ? 'text-red-400 border-red-900' : ''}
                          ${track.role === 'harmony' ? 'text-blue-400 border-blue-900' : ''}
                          ${track.role === 'ignore' ? 'text-gray-500 border-neutral-800' : ''}
                        `}
                                        >
                                            <option value="melody">Melody (Leaf)</option>
                                            <option value="rhythm">Rhythm (Root)</option>
                                            <option value="harmony">Harmony (Branch)</option>
                                            <option value="ignore">Ignore</option>
                                        </select>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* CENTER: Visual Stage */}
            <div className="flex-1 bg-black relative flex flex-col transition-all">

                {/* BOTTOM: Visual Stage (DigiPan) */}
                <div className="flex-1 w-full bg-neutral-900 border-l border-r border-neutral-700 relative min-h-0 group">
                    {/* Render MiniDigiPan with the determined scale */}
                    <Suspense fallback={<div className="flex items-center justify-center h-full text-emerald-500">3D 환경 초기화 중...</div>}>
                        {targetScale && (
                            <MiniDigiPan
                                ref={digiPanRef}
                                scale={targetScale}
                                language={language}
                            // Pass other props if MiniDigiPan accepts them (e.g. for interaction logging)
                            />
                        )}
                    </Suspense>
                </div>
            </div>

            {/* RIGHT: Data Log */}
            <div className="w-1/4 min-w-[300px] border-l border-neutral-700 p-4 flex flex-col bg-neutral-900">
                <h2 className="text-xl font-bold mb-4 text-emerald-400">3. 데이터 로그</h2>

                {/* Analysis Card - Algorithm Transparency */}
                {/* Analysis Card - Algorithm Transparency */}
                {midiData?.matchResult && (
                    <div className="bg-neutral-800 p-4 rounded-lg border border-neutral-700 mb-4 shadow-lg space-y-4">

                        {/* 1. Original Key Analysis */}
                        <div className="bg-neutral-900/50 p-3 rounded-lg border border-neutral-700/50">
                            <h3 className="text-[10px] text-neutral-400 font-bold uppercase mb-2 flex justify-between items-center tracking-wider">
                                <span>Original Key Analysis</span>
                                <span className="bg-neutral-800 text-[9px] px-1.5 py-0.5 rounded text-neutral-500 border border-neutral-700" title="Based on Note Duration & Distribution">Krumhansl-Schmuckler</span>
                            </h3>
                            <div className="flex items-baseline gap-2 mb-2">
                                <span className="text-xl font-bold text-white">
                                    {midiData.matchResult.originalKey || 'Unknown'}
                                </span>
                            </div>
                            {/* Theoretical Notes */}
                            <div className="flex flex-wrap gap-1">
                                {(() => {
                                    const [root, type] = (midiData.matchResult.originalKey || '').split(' ');
                                    if (!root || !type) return null;
                                    const notes = getScaleNotes(root, type as 'Major' | 'Minor');
                                    return notes.map((n, i) => (
                                        <span key={i} className="text-[10px] text-neutral-500 bg-neutral-800 px-1.5 py-0.5 rounded border border-neutral-700/50 font-mono">
                                            {n}
                                        </span>
                                    ));
                                })()}
                            </div>
                        </div>

                        {/* 2. Best Handpan Scale */}
                        <div className="bg-neutral-900/30 p-3 rounded-lg border border-neutral-700/50 relative overflow-hidden group">

                            <h3 className="text-[10px] text-emerald-500 font-bold uppercase mb-1 tracking-wider">Recommended Scale</h3>
                            <div className="flex justify-between items-end mb-3">
                                <div>
                                    <div className="text-lg font-bold text-white relative z-10 leading-tight">
                                        {midiData.matchResult.scaleName}
                                    </div>
                                    <div className="text-xs text-neutral-400 mt-1">
                                        Transpose: <strong className={midiData.matchResult.transposition === 0 ? "text-emerald-400" : "text-amber-400"}>
                                            {midiData.matchResult.transposition > 0 ? '+' : ''}{midiData.matchResult.transposition} Semitones
                                        </strong>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-emerald-500">
                                        {Math.round(midiData.matchResult.score)}%
                                    </div>
                                    <div className="text-[9px] text-neutral-600 uppercase tracking-widest">Score</div>
                                </div>
                            </div>

                            {/* Match Details Badge */}
                            <div className="space-y-2 border-t border-neutral-800 pt-3 relative z-10">
                                <div className="text-[9px] text-neutral-500 uppercase tracking-wider mb-1">Score Calculation</div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="bg-neutral-900/80 p-2 rounded border border-neutral-800 flex justify-between">
                                        <span className="text-neutral-500 text-[10px]">Exact Matches</span>
                                        <span className="text-emerald-400 font-bold">{midiData.matchResult.details?.exactMatches || 0}</span>
                                    </div>
                                    <div className="bg-neutral-900/80 p-2 rounded border border-neutral-800 flex justify-between">
                                        <span className="text-neutral-500 text-[10px]">Folded Matches</span>
                                        <span className="text-yellow-500 font-bold">{(midiData.matchResult.details?.foldedMatches || 0).toFixed(1)}</span>
                                    </div>
                                </div>
                                {(midiData.matchResult.details?.transposePenalty || 0) > 0 && (
                                    <div className="bg-neutral-900/80 p-2 rounded border border-neutral-800 flex justify-between items-center text-[10px]">
                                        <span className="text-neutral-500">Transpose Penalty</span>
                                        <span className="text-red-400 font-bold">-{midiData.matchResult.details?.transposePenalty} pts</span>
                                    </div>
                                )}
                                {(midiData.matchResult.details?.keyBonus || 0) > 0 && (
                                    <div className="bg-emerald-900/10 p-2 rounded border border-emerald-900/30 flex justify-between items-center text-[10px]">
                                        <span className="text-emerald-600">Key Match Bonus</span>
                                        <span className="text-emerald-400 font-bold">+{midiData.matchResult.details?.keyBonus} pts</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 3. Visual Feedback */}
                        <div>
                            <h3 className="text-[10px] text-neutral-500 font-bold uppercase mb-2 tracking-wider">Visual Feedback</h3>
                            <div className="flex flex-wrap gap-1 mb-2">
                                {midiData.matchResult.matchedNotes.map((note, i) => (
                                    <span key={`match-${i}`} className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] rounded border border-emerald-500/20 font-mono">
                                        {note}
                                    </span>
                                ))}
                                {midiData.matchResult.foldedNotes && midiData.matchResult.foldedNotes.map((note, i) => (
                                    <span key={`folded-${i}`} className="px-2 py-0.5 bg-yellow-500/10 text-yellow-500 text-[10px] rounded border border-yellow-500/20 font-mono" title="Octave Adjusted">
                                        {note}
                                    </span>
                                ))}
                            </div>
                            {midiData.matchResult.missedNotes.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                    {midiData.matchResult.missedNotes.map((note, i) => (
                                        <span key={`miss-${i}`} className="px-1.5 py-0.5 bg-red-900/40 text-red-400 text-[10px] rounded border border-red-900/50">
                                            {note}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}


                <div className="flex-1 bg-neutral-950 rounded-lg p-2 font-mono text-xs text-green-500 overflow-y-auto border border-neutral-800 font-light mb-4 max-h-[40vh]">
                    {logs.length === 0 && <span className="text-neutral-600 italic">이벤트 대기 중...</span>}
                    {logs.map((log, i) => (
                        <div key={i} className="mb-1 border-b border-neutral-900 pb-1 break-words">{log}</div>
                    ))}
                </div>

                {midiData && (
                    <div className="flex-1 bg-neutral-800 rounded-lg p-2 overflow-auto border border-neutral-700">
                        <h3 className="text-sm font-bold text-neutral-300 sticky top-0 bg-neutral-800 pb-2 border-b border-neutral-700 mb-2">처리된 노래 데이터 (JSON)</h3>
                        <pre className="text-[10px] text-neutral-400 whitespace-pre-wrap">
                            {JSON.stringify(midiData, (key, value) => {
                                // Truncate notes array for display performance
                                if (key === 'notes' && Array.isArray(value)) {
                                    return `[Array(${value.length})]`;
                                }
                                return value;
                            }, 2)}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
}
