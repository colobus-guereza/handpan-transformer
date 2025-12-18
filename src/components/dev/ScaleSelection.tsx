import React, { useState } from 'react';
import { SCALES } from '@/data/handpanScales';

interface ScaleSelectionProps {
    currentScaleId: string;
    onScaleSelect: (scaleId: string) => void;
}

export default function ScaleSelection({ currentScaleId, onScaleSelect }: ScaleSelectionProps) {
    const [isExpanded, setIsExpanded] = useState(false); // Default collapsed

    // Find the current scale object for display name
    const currentScale = SCALES.find(s => s.id === currentScaleId);

    return (
        <div className="bg-neutral-800 p-4 rounded-lg border border-neutral-700">
            <h2 className="text-xl font-bold mb-4 text-emerald-400">Scale Selection</h2>

            <div className="mb-4 p-3 bg-neutral-900 rounded border border-neutral-800">
                <div className="text-xs text-neutral-500 uppercase mb-1">Current Scale</div>
                <div className="text-lg font-bold text-white">
                    {currentScale ? currentScale.name : 'Unknown Scale'}
                </div>
                <div className="text-xs text-neutral-400 font-mono mt-1">
                    ID: {currentScaleId}
                </div>
            </div>

            <div className="border-t border-neutral-700 pt-2">
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center justify-between w-full text-left py-2 hover:bg-neutral-700/50 rounded px-1 transition-colors"
                >
                    <span className="text-xs text-neutral-500 uppercase font-bold">
                        Available Scales ({SCALES.length})
                    </span>
                    <span className="text-neutral-500 text-xs">
                        {isExpanded ? '▲' : '▼'}
                    </span>
                </button>

                {isExpanded && (
                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar mt-2">
                        {SCALES.map((scale) => (
                            <div
                                key={scale.id}
                                onClick={() => onScaleSelect(scale.id)}
                                className={`p-2 rounded text-sm transition-colors border cursor-pointer ${scale.id === currentScaleId
                                    ? 'bg-emerald-900/30 border-emerald-800 text-emerald-300'
                                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200 hover:border-neutral-600'
                                    }`}
                            >
                                <div className="font-medium">{scale.name}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
