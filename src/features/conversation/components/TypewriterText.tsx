import { useState, useEffect, useRef } from 'react';

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
        }, speed);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [text, speed, onComplete]);

    return (
        <p className="text-xl md:text-2xl font-serif leading-relaxed text-white/90 drop-shadow-md text-center max-w-2xl mx-auto px-6">
            {displayedText}
            {displayedText.length < text.length && (
                <span className="animate-pulse ml-1 text-cyan-400">|</span>
            )}
        </p>
    );
}
