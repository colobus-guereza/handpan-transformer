'use client';

import { useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { Howler } from 'howler';

// Silent MP3 base64 (very short)
const SILENT_MP3 = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTY2UAAAAPAAADTGF2ZjU5LjI3LjEwMAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD//////////////////////////////////////////////////////////////////wAAAAAATGF2YzU5LjM3AAAAAAAAAAAAAAAAJAAAAAAAAAAAASAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAA';

/**
 * Component to force unlock audio on iOS silent mode
 * Strategies:
 * 1. navigator.audioSession.type = 'playback' (iOS 17+)
 * 2. Play silent HTML5 audio on first touch
 * 3. Resume Tone.js / Howler contexts
 */
export default function SilentAudioUnlocker() {
    const isUnlockedRef = useRef(false);

    useEffect(() => {
        const unlock = () => {
            if (isUnlockedRef.current) return;

            // 1. Try modern audio session API (iOS 17+)
            if ('audioSession' in navigator && (navigator as any).audioSession) {
                try {
                    (navigator as any).audioSession.type = 'playback';
                    console.log('[SilentUnlock] Set navigator.audioSession.type to playback');
                } catch (e) {
                    console.warn('[SilentUnlock] Failed to set audioSession type', e);
                }
            }

            // 2. Play silent HTML5 audio
            const audio = new Audio(SILENT_MP3);
            audio.play().then(() => {
                console.log('[SilentUnlock] Silent HTML5 audio played successfully');
                isUnlockedRef.current = true;
            }).catch(e => {
                console.warn('[SilentUnlock] Silent audio play failed', e);
            });

            // 3. Resume Audio Contexts
            if (Tone.context && Tone.context.state !== 'running') {
                Tone.context.resume().then(() => {
                    console.log('[SilentUnlock] Tone.js context resumed');
                });
            }

            if (Howler && Howler.ctx && Howler.ctx.state !== 'running') {
                Howler.ctx.resume().then(() => {
                    console.log('[SilentUnlock] Howler context resumed');
                });
            }

            // Clean up listeners if successful (or just try once per session)
            // We keep listeners if it failed? No, let's keep retrying until success.
            // Actually, we should just fire on the first interaction and assume it works or fails.
            // To be safe, removing listeners on first run.
            removeListeners();
        };

        const addListeners = () => {
            window.addEventListener('touchstart', unlock, { capture: true, once: true });
            window.addEventListener('click', unlock, { capture: true, once: true });
            window.addEventListener('keydown', unlock, { capture: true, once: true });
        };

        const removeListeners = () => {
            window.removeEventListener('touchstart', unlock, { capture: true });
            window.removeEventListener('click', unlock, { capture: true });
            window.removeEventListener('keydown', unlock, { capture: true });
        };

        addListeners();

        return () => {
            removeListeners();
        };
    }, []);

    return null; // This component renders nothing
}
