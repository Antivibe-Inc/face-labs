import { useState, useEffect, useRef } from 'react';
import { useSoundGen } from '../../../hooks/useSoundGen';

interface TypewriterTextProps {
    text: string;
    speed?: number;
    onComplete?: () => void;
}

export function TypewriterText({ text, speed = 50, onComplete }: TypewriterTextProps) {
    const [displayedText, setDisplayedText] = useState('');
    const indexRef = useRef(0);
    const textRef = useRef(text); // Track prop changes
    const timerRef = useRef<number | null>(null);
    const { playTypingSound } = useSoundGen();

    useEffect(() => {
        // Reset if text prop actually changes to something new
        if (text !== textRef.current) {
            setDisplayedText('');
            indexRef.current = 0;
            textRef.current = text;
        }

        // Clear existing timer
        if (timerRef.current) clearInterval(timerRef.current);

        // If complete, don't start
        if (indexRef.current >= text.length) {
            setDisplayedText(text); // Ensure consistency
            return;
        }

        timerRef.current = window.setInterval(() => {
            const nextIndex = indexRef.current + 1;

            if (nextIndex >= text.length) {
                if (timerRef.current) clearInterval(timerRef.current);
                setDisplayedText(text); // Finish
                // Call onComplete in next tick or just here outside updater
                setTimeout(() => onComplete?.(), 0);
                return;
            }

            indexRef.current = nextIndex;
            setDisplayedText(text.slice(0, nextIndex));
            // Play sound for each character
            try {
                playTypingSound();
            } catch (e) {
                // Ignore audio errors
            }
        }, speed);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [text, speed, onComplete]);

    return (
        <p
            className="text-base md:text-lg font-mono tracking-wider leading-relaxed text-center max-w-2xl mx-auto px-6"
            style={{
                color: '#86efac', // green-300 (softer)
                textShadow: '0 0 10px rgba(134, 239, 172, 0.4), 0 0 20px rgba(134, 239, 172, 0.25), 0 0 30px rgba(134, 239, 172, 0.1)',
                letterSpacing: '0.05em'
            }}
        >
            {displayedText}
            {displayedText.length < text.length && (
                <span
                    className="ml-1 inline-block"
                    style={{
                        color: '#22c55e', // green-500
                        animation: 'blink 0.8s infinite',
                        textShadow: '0 0 8px rgba(34, 197, 94, 0.9)'
                    }}
                >▌</span>
            )}
        </p>
    );
}
