import { useState, useEffect, useRef } from 'react';
import { useSpeechRecognition } from './useSpeechRecognition';
import { generateConversationReply, analyzeFaceWithConversation, type GeminiFaceAnalysis } from '../../services/geminiService';
import { VoiceParticles } from './components/VoiceParticles';
import { TypewriterText } from './components/TypewriterText';
import type { FaceAnalysisResult } from '../../types/analysis';

interface ConversationViewProps {
    image: string; // Base64
    preliminaryAnalysis: GeminiFaceAnalysis;
    onComplete: (result: FaceAnalysisResult, transcript?: { role: 'user' | 'assistant'; content: string }[]) => void;
    onCancel: () => void;
}

type Message = { role: 'user' | 'assistant'; content: string };
type DisplayMode = 'ai_speaking' | 'user_speaking' | 'thinking' | 'idle';

export function ConversationView({ image, preliminaryAnalysis, onComplete, onCancel }: ConversationViewProps) {
    const [messages, setMessages] = useState<Message[]>([]);

    // Core States
    // What is currently visible on screen?
    const [displayMode, setDisplayMode] = useState<DisplayMode>('idle');
    const [currentText, setCurrentText] = useState("");
    const [particleMode, setParticleMode] = useState<'idle' | 'listening' | 'speaking' | 'thinking'>('idle');

    // STT Hook
    const { isRecording, transcript, startRecording, stopRecording, isSupported } = useSpeechRecognition();
    const hasInitialized = useRef(false);

    // Initial AI Message (Round 0)
    useEffect(() => {
        if (hasInitialized.current) return;
        hasInitialized.current = true;
        // Start thinking immediately
        setDisplayMode('thinking');
        startTurn([]);
    }, []);

    // State Sync Logic
    useEffect(() => {
        if (isRecording) {
            setDisplayMode('user_speaking');
            setParticleMode('listening');
            setCurrentText(transcript || "正在聆听...");
        } else if (displayMode === 'thinking') {
            setParticleMode('thinking');
            // Do NOT overwrite currentText with "Thinking..." here. 
            // Keep showing the user's last words or "Thinking" if it was empty.
            if (!currentText || currentText === "Thinking...") {
                setCurrentText("Thinking...");
            }
        } else if (displayMode === 'ai_speaking') {
            setParticleMode('speaking');
            // Text is set by the AI response handler
        } else {
            setParticleMode('idle');
        }
    }, [isRecording, transcript, displayMode, currentText]);


    const startTurn = async (history: Message[]) => {
        setDisplayMode('thinking');
        try {
            const reply = await generateConversationReply(image, preliminaryAnalysis, history);

            const aiMsg = `${reply.observation} ${reply.question}`;
            setMessages(prev => [...prev, { role: 'assistant', content: aiMsg }]);

            // Switch to AI Speaking mode
            setCurrentText(aiMsg);
            setDisplayMode('ai_speaking');

        } catch (e) {
            console.error(e);
            setCurrentText("网络好像有点卡，我们可以直接生成报告。");
            setDisplayMode('ai_speaking');
            setMessages(prev => [...prev, { role: 'assistant', content: "网络好像有点卡，我们可以直接生成报告。" }]);
        }
    };

    // When recording stops and we have a valid transcript, send it
    useEffect(() => {
        if (!isRecording && transcript && displayMode === 'user_speaking') {
            // User finished speaking. 
            // 1. Commit user message to history
            const newHistory = [...messages, { role: 'user' as const, content: transcript }];
            setMessages(newHistory);

            // 2. Trigger AI turn
            startTurn(newHistory);
        }
    }, [isRecording, transcript, displayMode]);


    const handleEndConversation = async () => {
        setDisplayMode('thinking');
        setCurrentText("正在整理本次对话...");

        try {
            const rawResult = await analyzeFaceWithConversation(preliminaryAnalysis, messages);

            const fullResult: FaceAnalysisResult = {
                emotion: {
                    summary: rawResult.summary || "今日状态总结",
                    energy_level: rawResult.energy_level,
                    mood_brightness: rawResult.mood_brightness,
                    tags: rawResult.tags,
                    today_suggestion: rawResult.today_suggestion || "好好休息"
                },
                lifestyle: {
                    signals: rawResult.skin_signals || [],
                    suggestions: rawResult.lifestyle_hints || [],
                    disclaimer: "非医疗诊断，仅供参考"
                },
                reflection: {
                    summary: rawResult.dialog_summary || "...",
                    questions: ["今天有什么值得记录的事？"]
                },
                timestamp: Date.now(),
                dialog_summary: rawResult.dialog_summary,
                analysis_confidence: 0.9
            };

            onComplete(fullResult, messages);
        } catch (e) {
            console.error("Final analysis failed", e);
            alert("生成报告失败，将使用基础分析结果");
            const fallbackResult: FaceAnalysisResult = {
                emotion: {
                    summary: "分析受阻，基于初步印象",
                    energy_level: preliminaryAnalysis.energy_level,
                    mood_brightness: preliminaryAnalysis.mood_brightness,
                    tags: preliminaryAnalysis.tags,
                    today_suggestion: "休息一下"
                },
                lifestyle: {
                    signals: preliminaryAnalysis.skin_signals || [],
                    suggestions: preliminaryAnalysis.lifestyle_hints || [],
                    disclaimer: "非医疗诊断"
                },
                reflection: { summary: "", questions: [] },
                timestamp: Date.now()
            };
            onComplete(fallbackResult, messages);
        }
    };

    // --- Button Ref & Events (Touch/Hold Logic) ---
    const speechButtonRef = useRef<HTMLButtonElement>(null);
    // Use a ref to track "intent to record" synchronously, avoiding React render lag
    const isHandlingInputRef = useRef(false);

    // Sync ref (as a fallback safety)
    useEffect(() => {
        if (!isRecording) {
            isHandlingInputRef.current = false;
        }
    }, [isRecording]);

    useEffect(() => {
        const button = speechButtonRef.current;
        if (!button) return;

        const cleanupListeners = () => {
            window.removeEventListener('touchend', handleGlobalEnd);
            window.removeEventListener('touchcancel', handleGlobalEnd);
            window.removeEventListener('mouseup', handleGlobalEnd);
        };

        const handleGlobalEnd = (e: Event) => {
            stopRecording();
            isHandlingInputRef.current = false; // Release lock
            cleanupListeners();
        };

        const handleStart = (e: Event) => {
            // If it's a touch event, prevent default to stop ghost mouse clicks
            if (e.type === 'touchstart') {
                e.preventDefault();
            }

            // Synchronous Lock Check
            if (isHandlingInputRef.current) {
                return;
            }

            if (!isRecording) {
                isHandlingInputRef.current = true; // Set lock immediately
                startRecording();

                window.addEventListener('touchend', handleGlobalEnd);
                window.addEventListener('touchcancel', handleGlobalEnd);
                window.addEventListener('mouseup', handleGlobalEnd);
            }
        };

        const handleTouchStart = (e: TouchEvent) => handleStart(e);
        const handleMouseDown = (e: MouseEvent) => handleStart(e);
        const handleContextMenu = (e: Event) => e.preventDefault();

        // Safety cleanup when component unmounts
        const unmountCleanup = () => {
            cleanupListeners();
            isHandlingInputRef.current = false;
        };

        // Attach start listeners to the BUTTON
        button.addEventListener('touchstart', handleTouchStart, { passive: false });
        button.addEventListener('mousedown', handleMouseDown);
        button.addEventListener('contextmenu', handleContextMenu);

        // Cleanup function for the effect
        return () => {
            button.removeEventListener('touchstart', handleTouchStart);
            button.removeEventListener('mousedown', handleMouseDown);
            button.removeEventListener('contextmenu', handleContextMenu);
            unmountCleanup();
        };
    }, [startRecording, stopRecording]); // Removed isRecording from deps!


    return (
        <div className="fixed inset-0 z-[100] bg-black text-white flex flex-col items-center justify-between overflow-hidden animate-fade-in font-sans">

            {/* 1. Background Particles */}
            <VoiceParticles mode={particleMode} />

            {/* 2. End Button (Top Right, Subtle) */}
            <div className="absolute top-6 right-6 z-20">
                <button
                    onClick={handleEndConversation}
                    className="px-4 py-2 rounded-full border border-white/20 text-white/60 text-sm hover:bg-white/10 active:scale-95 transition-all backdrop-blur-md"
                >
                    结束并生成
                </button>
            </div>

            {/* 3. Main Text Display (Center/Bottom-Half) */}
            <div className="flex-1 w-full flex items-center justify-center p-8 z-10 relative mt-20">
                <div className="w-full max-w-xl text-center min-h-[120px]">
                    {/* Only show text if we have something. 
                        If user is speaking, show transcript directly.
                        If AI is speaking, use Typewriter. 
                    */}
                    {displayMode === 'user_speaking' ? (
                        <p className="text-xl md:text-2xl font-medium text-cyan-200 animate-pulse">
                            {currentText}
                        </p>
                    ) : (
                        <TypewriterText
                            key={currentText} // Force re-mount on text change to restart typing
                            text={currentText}
                            speed={60}
                            onComplete={() => {
                                if (displayMode === 'ai_speaking') {
                                    setParticleMode('idle'); // Stop waving when text finishes
                                }
                            }}
                        />
                    )}
                </div>
            </div>

            {/* 4. Bottom Controls */}
            <div className="w-full pb-16 pt-8 z-20 flex flex-col items-center justify-end bg-gradient-to-t from-black via-black/80 to-transparent">
                {!isSupported && <div className="text-xs text-red-500 mb-4">浏览器不支持语音，请更换 Chrome/Safari</div>}

                <div className="relative group">
                    {/* Pulse Rings */}
                    {isRecording && (
                        <>
                            <div className="absolute inset-0 rounded-full bg-cyan-500/30 animate-ping duration-[2s]"></div>
                            <div className="absolute inset-0 rounded-full bg-cyan-500/20 animate-pulse duration-[1.5s] delay-100"></div>
                        </>
                    )}

                    <button
                        ref={speechButtonRef}
                        disabled={displayMode === 'thinking' || displayMode === 'ai_speaking'} // Disable while AI is thinking/talking?? Actually, usually we allow interruption. But let's keep it simple: blocking for now.
                        className={`relative w-24 h-24 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-all duration-300 ${isRecording
                            ? 'bg-cyan-600 scale-110 shadow-[0_0_50px_rgba(8,145,178,0.5)]'
                            : displayMode === 'thinking'
                                ? 'bg-neutral-800 border-2 border-neutral-700 opacity-50 cursor-not-allowed'
                                : 'bg-white/10 border border-white/20 hover:bg-white/20 hover:scale-105 active:scale-95'
                            }`}
                    >
                        {isRecording ? (
                            <div className="w-8 h-8 flex gap-1 items-center justify-center">
                                {/* Wave Animation */}
                                <div className="w-1.5 bg-white rounded-full animate-[wave_1s_ease-in-out_infinite] h-4"></div>
                                <div className="w-1.5 bg-white rounded-full animate-[wave_1s_ease-in-out_infinite_0.1s] h-6"></div>
                                <div className="w-1.5 bg-white rounded-full animate-[wave_1s_ease-in-out_infinite_0.2s] h-4"></div>
                                <div className="w-1.5 bg-white rounded-full animate-[wave_1s_ease-in-out_infinite_0.3s] h-3"></div>
                            </div>
                        ) : (
                            <svg className={`w-8 h-8 ${displayMode === 'thinking' ? 'text-white/20' : 'text-white/90'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                        )}
                    </button>
                </div>

                <p className="mt-6 text-sm text-white/40 font-light tracking-wider uppercase">
                    {isRecording ? 'Listening...' : displayMode === 'thinking' ? 'Processing...' : 'Hold to Speak'}
                </p>
            </div>
        </div>
    );
}

// Add global keyframes for the wave animation if needed, or rely on Tailwind utilities
// We can inject a style tag or assume tailwind config. 
// For safety, let's use standard tailwind animate-pulse for simplicity if wave is custom.

