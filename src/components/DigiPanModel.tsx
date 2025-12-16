
import React, { useMemo } from 'react';
import { SCALES } from '@/data/handpanScales';
import Digipan9 from './Digipan3D/Digipan9';
import Digipan10 from './Digipan3D/Digipan10';
import Digipan11 from './Digipan3D/Digipan11';
import Digipan12 from './Digipan3D/Digipan12';
import Digipan14 from './Digipan3D/Digipan14';
import Digipan14M from './Digipan3D/Digipan14M';
import Digipan15M from './Digipan3D/Digipan15M';
import Digipan18M from './Digipan3D/Digipan18M';
import DigipanDM from './Digipan3D/DigipanDM';

interface DigiPanModelProps {
    scaleId: string;
    isAutoPlay?: boolean;
}

export default function DigiPanModel({ scaleId, isAutoPlay = false }: DigiPanModelProps) {
    const scale = useMemo(() => SCALES.find(s => s.id === scaleId) || SCALES[0], [scaleId]);

    // Logic to select the correct visual component based on note count or mutant type
    const LayoutComponent = useMemo(() => {
        const totalNotes = 1 + scale.notes.top.length + scale.notes.bottom.length;

        if (scale.id.includes('mutant')) {
            if (totalNotes === 14) return Digipan14M;
            if (totalNotes === 15) return Digipan15M;
            if (totalNotes === 18) return Digipan18M;
        }

        switch (totalNotes) {
            case 9: return Digipan9;
            case 10: return Digipan10;
            case 11: return Digipan11;
            case 12: return Digipan12;
            case 14: return Digipan14;
            default: return DigipanDM; // Fallback to scalable Layout
        }
    }, [scale]);

    return (
        /* Render Selected Component directly 
           Note: LayoutComponent (Digipan3D) already contains its own <Canvas> and HTML overlay.
           It should NOT be wrapped in another <Canvas> or <group>. 
        */
        <>
            {LayoutComponent && (
                <LayoutComponent
                    scale={scale}
                    isCameraLocked={true}
                    viewMode={0}
                    showControls={false}
                    showInfoPanel={false} // Managed externally if needed
                    isAutoPlay={isAutoPlay}
                />
            )}
        </>
    );
}
