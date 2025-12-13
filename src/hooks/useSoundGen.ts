import { useRef, useEffect, useCallback, useState } from 'react';

interface SoundGenReturn {
    playTypingSound: () => void;
    playModeSwitch: (from: string, to: string) => void;
    playClick: () => void;
    toggleMute: () => void;
    isMuted: boolean;
}

export function useSoundGen(): SoundGenReturn {
    const audioContextRef = useRef<AudioContext | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const isMutedRef = useRef(isMuted);

    useEffect(() => {
        isMutedRef.current = isMuted;
    }, [isMuted]);

    const initAudio = useCallback(() => {
        if (!audioContextRef.current) {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContextClass) {
                audioContextRef.current = new AudioContextClass();
            }
        }
        if (audioContextRef.current?.state === 'suspended') {
            audioContextRef.current.resume();
        }
    }, []);

    const playTone = useCallback((freq: number, type: OscillatorType, duration: number, volume: number = 0.1) => {
        if (isMutedRef.current || !audioContextRef.current) return;
        const ctx = audioContextRef.current;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        gain.gain.setValueAtTime(volume, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + duration);
    }, []);

    const playTypingSound = useCallback(() => {
        initAudio();
        // Softer, lower pitched "thock" sound
        const variation = Math.random() * 100 - 50;
        // Use sine wave for softness, lower frequency (300-400Hz)
        // Very short duration (0.03s) to avoid overlapping "buzz"
        playTone(400 + variation, 'sine', 0.03, 0.02);
    }, [initAudio, playTone]);

    const playClick = useCallback(() => {
        initAudio();
        playTone(600, 'sine', 0.1, 0.05);
    }, [initAudio, playTone]);

    const playModeSwitch = useCallback((_from: string, to: string) => {
        initAudio();
        if (isMutedRef.current || !audioContextRef.current) return;
        const ctx = audioContextRef.current;
        const now = ctx.currentTime;

        if (to === 'listening') {
            // Power up sound
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.setValueAtTime(200, now);
            osc.frequency.exponentialRampToValueAtTime(600, now + 0.3);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.linearRampToValueAtTime(0, now + 0.3);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(now + 0.3);
        } else if (to === 'ai_speaking') {
            // Data flow / Chime
            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const gain = ctx.createGain();

            osc1.type = 'sine';
            osc2.type = 'triangle';

            osc1.frequency.setValueAtTime(440, now); // A4
            osc2.frequency.setValueAtTime(554.37, now); // C#5

            gain.gain.setValueAtTime(0.05, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(ctx.destination);

            osc1.start();
            osc2.start();
            osc1.stop(now + 0.6);
            osc2.stop(now + 0.6);
        }
    }, [initAudio]);

    const toggleMute = useCallback(() => {
        setIsMuted((prev: boolean) => !prev);
    }, []);

    return {
        playTypingSound,
        playModeSwitch,
        playClick,
        toggleMute,
        isMuted
    };
}
