"use client";

import React, { useState } from 'react';
// import { Canvas } from '@react-three/fiber'; // Removed: Digipan3D implements its own Canvas
// import { OrbitControls, Sphere } from '@react-three/drei';
import { parseMidi } from '@/lib/midiUtils';
import { useMidiStore, TrackRole } from '@/store/useMidiStore';
import DigiPanModel from '@/components/DigiPanModel';
import * as Tone from 'tone';

export default function DevDashboard() {
    const [logs, setLogs] = useState<string[]>([]);

    // Zustand Store
    const { midiData, setMidiData, updateTrackRole } = useMidiStore();

    const addLog = (msg: string) => {
        setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        addLog(`File selected: ${file.name}`);

        try {
            const arrayBuffer = await file.arrayBuffer();
            // Use core logic to parse and classify
            const processedSong = await parseMidi(arrayBuffer, file.name);

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
                    <h2 className="text-xl font-bold mb-4 text-emerald-400">1. Input & Control</h2>
                    <div className="bg-neutral-800 p-4 rounded-lg border border-neutral-700 space-y-4">
                        <div>
                            <label className="block mb-2 text-sm text-neutral-400">Upload MIDI File (.mid)</label>
                            <input
                                type="file"
                                accept=".mid"
                                onChange={handleFileUpload}
                                className="w-full text-sm text-neutral-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700"
                            />
                        </div>

                        <div className="border-t border-neutral-700 pt-4 space-y-2">
                            <button
                                onClick={() => {
                                    setMidiData({
                                        midiName: "Demo Song (D Kurd 10)",
                                        bpm: 120,
                                        duration: 60,
                                        tracks: [],
                                        suggestedScale: "d_kurd_10"
                                    });
                                    addLog("[Demo] Loaded fake MIDI data with D Kurd 10 scale");
                                }}
                                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-semibold transition-colors"
                            >
                                Load Demo (D Kurd 10)
                            </button>

                            <button
                                onClick={async () => {
                                    try {
                                        await Tone.start();
                                        addLog("[Audio] AudioContext started successfully");
                                        console.log('Audio Context Started');
                                    } catch (err) {
                                        addLog(`[Audio] Error starting AudioContext: ${err}`);
                                        console.error('Audio Context Error:', err);
                                    }
                                }}
                                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-sm font-semibold transition-colors"
                            >
                                Start Audio
                            </button>
                        </div>
                    </div>
                </div>

                {midiData && (
                    <div className="bg-neutral-800 p-4 rounded-lg border border-neutral-700">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg">Track List ({midiData.tracks.length})</h3>
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
            <div className="flex-1 bg-black relative flex flex-col">
                <div className="absolute top-4 left-4 z-10 bg-black/50 p-2 rounded text-emerald-400">
                    <h2 className="text-xl font-bold">2. Visual Stage (R3F)</h2>
                </div>
                <div className="w-full h-full bg-neutral-900 border-l border-r border-neutral-700 relative">
                    {/* 
                      Fix: Digipan3D (inside DigiPanModel) brings its own <Canvas>. 
                      We must NOT wrap it in another <Canvas>.
                    */}
                    {midiData?.suggestedScale ? (
                        <DigiPanModel scaleId={midiData.suggestedScale} isAutoPlay={true} />
                    ) : (
                        // Fallback Placeholder if no MIDI loaded
                        <div className="flex items-center justify-center w-full h-full flex-col text-neutral-500 gap-4">
                            <div className="w-16 h-16 rounded-full border-4 border-neutral-700 animate-pulse"></div>
                            <p>Load a MIDI file to generate 3D Model</p>
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT: Data Log */}
            <div className="w-1/4 min-w-[300px] border-l border-neutral-700 p-4 flex flex-col bg-neutral-900">

                <h2 className="text-xl font-bold mb-4 text-emerald-400">3. Data Log</h2>

                {/* Analysis Card - Algorithm Transparency */}
                {midiData?.matchResult && (
                    <div className="bg-neutral-800 p-4 rounded-lg border border-neutral-700 mb-4 shadow-lg">
                        <div className="flex justify-between items-start mb-3 border-b border-neutral-700 pb-2">
                            <div>
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    🏆 Winner: <span className="text-emerald-400">{midiData.matchResult.scaleName}</span>
                                </h3>
                                <div className="text-xs text-neutral-400 mt-1">
                                    Transpose: <strong className="text-white">
                                        {midiData.matchResult.transposition > 0 ? '+' : ''}{midiData.matchResult.transposition} Semitones
                                    </strong>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold text-emerald-500">
                                    {Math.round(midiData.matchResult.score)}%
                                </div>
                                <div className="text-[10px] text-neutral-500 uppercase tracking-wider">Accuracy</div>
                            </div>
                        </div>

                        {/* Note Analysis Badges */}
                        <div className="space-y-3 mb-4">
                            <div>
                                <div className="text-[10px] text-neutral-500 uppercase mb-1">Matched Notes (Hit)</div>
                                <div className="flex flex-wrap gap-1">
                                    {midiData.matchResult.matchedNotes.map((note, i) => (
                                        <span key={i} className="px-2 py-0.5 bg-emerald-900/50 text-emerald-400 text-xs rounded border border-emerald-800">
                                            {note}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {midiData.matchResult.missedNotes.length > 0 && (
                                <div>
                                    <div className="text-[10px] text-neutral-500 uppercase mb-1">Missed Notes (Dissonance)</div>
                                    <div className="flex flex-wrap gap-1">
                                        {midiData.matchResult.missedNotes.map((note, i) => (
                                            <span key={i} className="px-2 py-0.5 bg-red-900/30 text-red-400 text-xs rounded border border-red-900/50 opacity-80">
                                                {note}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Reasoning */}
                        <div className="bg-neutral-900/50 p-3 rounded text-xs text-neutral-400 italic border border-neutral-800">
                            {midiData.matchResult.transposition === 0 ? (
                                midiData.matchResult.score >= 100 ? (
                                    <span className="text-emerald-400">✨ 오리지널 키가 핸드팬 스케일과 완벽하게 일치합니다.</span>
                                ) : (
                                    <span>오리지널 키에서 가장 높은 매칭률을 보입니다.</span>
                                )
                            ) : (
                                <>
                                    Original Key에서는 매칭률이 낮아,
                                    <span className="text-emerald-400 font-bold mx-1">
                                        {midiData.matchResult.transposition > 0 ? '+' : ''}{midiData.matchResult.transposition}키
                                    </span>
                                    조옮김(Transpose)하여 최적의 스케일을 찾았습니다.
                                </>
                            )}
                        </div>
                    </div>
                )}


                <div className="flex-1 bg-neutral-950 rounded-lg p-2 font-mono text-xs text-green-500 overflow-y-auto border border-neutral-800 font-light mb-4 max-h-[40vh]">
                    {logs.length === 0 && <span className="text-neutral-600 italic">Waiting for events...</span>}
                    {logs.map((log, i) => (
                        <div key={i} className="mb-1 border-b border-neutral-900 pb-1 break-words">{log}</div>
                    ))}
                </div>

                {midiData && (
                    <div className="flex-1 bg-neutral-800 rounded-lg p-2 overflow-auto border border-neutral-700">
                        <h3 className="text-sm font-bold text-neutral-300 sticky top-0 bg-neutral-800 pb-2 border-b border-neutral-700 mb-2">Processed Song JSON</h3>
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
