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

    const startRecording = useCallback(async () => {
        if (recognitionRef.current) {
            try {
                // On mobile, we need to explicitly request microphone permission first
                // This triggers the browser's permission dialog
                await navigator.mediaDevices.getUserMedia({ audio: true });

                setTranscript(''); // Clear previous
                recognitionRef.current.start();
            } catch (e: any) {
                console.error("Start recording failed", e);
                if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
                    setError('请允许麦克风权限');
                } else if (e.name === 'NotFoundError') {
                    setError('未找到麦克风设备');
                } else {
                    setError('无法启动语音识别: ' + e.message);
                }
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
