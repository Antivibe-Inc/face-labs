import { useState, useEffect, useRef } from 'react';

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
            recognition.continuous = false; // Stop after one sentence/utterance
            recognition.interimResults = false;
            recognition.lang = 'zh-CN';

            recognition.onstart = () => {
                setIsRecording(true);
                setError(null);
            };

            recognition.onend = () => {
                setIsRecording(false);
            };

            recognition.onresult = (event: any) => {
                const text = event.results[0][0].transcript;
                setTranscript(text);
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

    const startRecording = () => {
        if (recognitionRef.current) {
            try {
                setTranscript(''); // Clear previous
                recognitionRef.current.start();
            } catch (e) {
                console.error("Start recording failed", e);
            }
        }
    };

    const stopRecording = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    };

    return {
        isRecording,
        transcript,
        error,
        startRecording,
        stopRecording,
        isSupported: !!recognitionRef.current
    };
}
