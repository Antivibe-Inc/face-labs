import { useState, useEffect, useRef, useCallback } from 'react';

export function useSpeechRecognition() {
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        // @ts-ignore
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true; // Keep listening until stopped
            recognition.interimResults = true;
            recognition.lang = 'zh-CN';

            recognition.onstart = () => {
                setIsRecording(true);
                setError(null);
            };

            recognition.onend = () => {
                setIsRecording(false);
            };

            recognition.onresult = (event: any) => {
                // With continuous=true, we get multiple results. We need the latest combined one.
                let finalText = '';
                for (let i = 0; i < event.results.length; ++i) {
                    finalText += event.results[i][0].transcript;
                }
                setTranscript(finalText);
            };

            recognition.onerror = (event: any) => {
                setError(event.error);
                setIsRecording(false);
            };

            recognitionRef.current = recognition;
        } else {
            setError('Browser not supported');
        }
    }, []);

    const startRecording = useCallback(() => {
        if (recognitionRef.current) {
            try {
                setTranscript(''); // Clear previous
                recognitionRef.current.start();
            } catch (e) {
                console.error("Start recording failed", e);
            }
        }
    }, []);

    const stopRecording = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    }, []);

    return {
        isRecording,
        transcript,
        error,
        startRecording,
        stopRecording,
        isSupported: !!recognitionRef.current
    };
}
