import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useSpeechRecognition } from './useSpeechRecognition';
import { useSoundGen } from '../../hooks/useSoundGen';
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

export function ConversationView({ image, preliminaryAnalysis, onComplete, onCancel: _ }: ConversationViewProps) {
    const [messages, setMessages] = useState<Message[]>([]);

    // Core States
    // What is currently visible on screen?
    const [displayMode, setDisplayMode] = useState<DisplayMode>('idle');
    const [currentText, setCurrentText] = useState("");
    const [particleMode, setParticleMode] = useState<'idle' | 'listening' | 'speaking' | 'thinking'>('idle');

    // STT Hook
    const { isRecording, transcript, error: speechError, startRecording, stopRecording, isSupported } = useSpeechRecognition();
    const hasInitialized = useRef(false);

    // Sound Hook
    const { playModeSwitch, playClick } = useSoundGen();
    const prevParticleMode = useRef(particleMode);

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
            setCurrentText(transcript || "");
        } else if (displayMode === 'thinking') {
            setParticleMode('thinking');
            // Do NOT overwrite currentText here, keep it empty
            if (!currentText || currentText === "Thinking...") {
                setCurrentText("");
            }
        } else if (displayMode === 'ai_speaking') {
            setParticleMode('speaking');
            // Text is set by the AI response handler
        } else {
            setParticleMode('idle');
        }
    }, [isRecording, transcript, displayMode, currentText]);

    // Sound Effect: Mode Switch
    useEffect(() => {
        if (prevParticleMode.current !== particleMode) {
            try {
                playModeSwitch(prevParticleMode.current, particleMode);
            } catch (e) {
                console.warn("Sound play failed", e);
            }
            prevParticleMode.current = particleMode;
        }
    }, [particleMode, playModeSwitch]);


    const startTurn = async (history: Message[]) => {
        setDisplayMode('thinking');
        setCurrentText(""); // Clear user text immediately to prevent duplicate display
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

    // --- Pointer Events for Robust Hold-to-Speak ---
    const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
        console.log("[Pointer] DOWN - displayMode:", displayMode, "isRecording:", isRecording);

        if (displayMode === 'thinking' || displayMode === 'ai_speaking') {
            console.log("[Pointer] Blocked by displayMode");
            return;
        }

        // Capture pointer so we track it even if it leaves the button
        e.currentTarget.setPointerCapture(e.pointerId);
        console.log("[Pointer] Starting recording...");

        if (!isRecording) {
            try {
                playClick(); // Feedback sound
            } catch (e) {
                console.warn("Sound play failed", e);
            }
            startRecording();
        }
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
        console.log("[Pointer] UP - stopping recording");
        e.currentTarget.releasePointerCapture(e.pointerId);
        stopRecording();
    };

    const handlePointerCancel = (e: React.PointerEvent<HTMLButtonElement>) => {
        console.log("[Pointer] CANCEL - stopping recording");
        e.currentTarget.releasePointerCapture(e.pointerId);
        stopRecording();
    };


    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black text-white flex flex-col items-center justify-between overflow-hidden font-sans"
        >

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
                        <p className="text-base md:text-lg font-medium text-cyan-200">
                            {currentText}
                            <span
                                className="ml-1 inline-block"
                                style={{
                                    color: '#67e8f9',
                                    animation: 'blink 0.8s infinite',
                                    textShadow: '0 0 6px rgba(103, 232, 249, 0.8)'
                                }}
                            >▌</span>
                        </p>
                    ) : (
                        <TypewriterText
                            key={currentText} // Force re-mount on text change to restart typing
                            text={currentText}
                            speed={60}
                            onComplete={() => {
                                if (displayMode === 'ai_speaking') {
                                    setDisplayMode('idle'); // Unlock button when AI finishes speaking
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
                {speechError && <div className="text-xs text-red-500 mb-4">{speechError}</div>}

                <div className="relative group">
                    {/* Pulse Rings */}
                    {isRecording && (
                        <>
                            <div className="absolute inset-0 rounded-full bg-cyan-500/30 animate-ping duration-[2s]"></div>
                            <div className="absolute inset-0 rounded-full bg-cyan-500/20 animate-pulse duration-[1.5s] delay-100"></div>
                        </>
                    )}

                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                        onPointerDown={handlePointerDown}
                        onPointerUp={handlePointerUp}
                        onPointerCancel={handlePointerCancel}
                        // Prevent default context menu on long press
                        onContextMenu={(e) => e.preventDefault()}
                        disabled={displayMode === 'thinking' || displayMode === 'ai_speaking'}
                        style={{ touchAction: 'none' }} // Critical for preventing scroll/zoom while holding
                        className={`relative w-24 h-24 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.1)] select-none ${isRecording
                            ? 'bg-cyan-600 shadow-[0_0_50px_rgba(8,145,178,0.5)]'
                            : displayMode === 'thinking'
                                ? 'bg-neutral-800 border-2 border-neutral-700 opacity-50 cursor-not-allowed'
                                : 'bg-white/10 border border-white/20 hover:bg-white/20'
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
                    </motion.button>
                </div>

                <p className="mt-6 text-sm text-white/40 font-light tracking-wider uppercase">
                    {isRecording ? 'Listening...' : displayMode === 'thinking' ? 'Processing...' : 'Hold to Speak'}
                </p>
            </div>
        </motion.div>
    );
}

// Add global keyframes for the wave animation if needed, or rely on Tailwind utilities
// We can inject a style tag or assume tailwind config. 
// For safety, let's use standard tailwind animate-pulse for simplicity if wave is custom.

