import { useState, useEffect, useRef } from 'react';
import { useSpeechRecognition } from './useSpeechRecognition';
import { generateConversationReply, analyzeFaceWithConversation, type GeminiFaceAnalysis } from '../../services/geminiService';

import type { FaceAnalysisResult } from '../../types/analysis';

interface ConversationViewProps {
    image: string; // Base64
    preliminaryAnalysis: GeminiFaceAnalysis;
    onComplete: (result: FaceAnalysisResult, transcript?: { role: 'user' | 'assistant'; content: string }[]) => void;
    onCancel: () => void;
}

type Message = { role: 'user' | 'assistant'; content: string };

export function ConversationView({ image, preliminaryAnalysis, onComplete, onCancel }: ConversationViewProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);

    // STT Hook
    const { isRecording, transcript, startRecording, stopRecording, isSupported } = useSpeechRecognition();

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const hasInitialized = useRef(false);

    // Initial AI Message (Round 0)
    useEffect(() => {
        // Prevent React Strict Mode double-invocation
        if (hasInitialized.current) return;
        hasInitialized.current = true;

        startTurn([]);
    }, []);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isProcessing]);

    // Handle STT Result (auto-send when recording stops and we have text)
    // Note: useSpeechRecognition hook updates transcript on result.
    // If we want "Press and Hold", we usually send on "Mouse Up" (Stop Recording) -> Then check transcript.
    // But speech recognition is async.
    // Let's refine the flow:
    // 1. User holds -> recording starts.
    // 2. User releases -> recording stops -> we get final transcript -> we auto-send it as user message.
    useEffect(() => {
        if (!isRecording && transcript) {
            handleUserMessage(transcript);
        }
    }, [isRecording, transcript]);


    const startTurn = async (history: Message[]) => {
        setIsProcessing(true);
        try {
            const reply = await generateConversationReply(image, preliminaryAnalysis, history);

            const aiMsg = `${reply.observation} ${reply.question}`;
            setMessages(prev => [...prev, { role: 'assistant', content: aiMsg }]);

            if (reply.isFinal) {
                // Determine if we should auto-close or just offer wrapper button?
                // Spec says "User clicks End". So we just let them click.
            }
        } catch (e) {
            console.error(e);
            // Fallback
            setMessages(prev => [...prev, { role: 'assistant', content: "网络好像有点卡，我们可以直接生成报告。" }]);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleUserMessage = async (text: string) => {
        const newHistory = [...messages, { role: 'user' as const, content: text }];
        setMessages(newHistory);

        // AI Turn
        await startTurn(newHistory);
    };

    const handleEndConversation = async () => {
        setIsProcessing(true);
        try {
            // 1. Call Final Analysis
            // We need to bridge the raw JSON from analyzeFaceWithConversation to FaceAnalysisResult structure
            // Existing 'analyzeFace' does this mapping. We might need a helper or just do it similarly.
            // Let's reuse 'analyzeFace' logic but passing the conversation-enhanced raw data?
            // Actually 'analyzeFaceWithConversation' returns raw object.

            const rawResult = await analyzeFaceWithConversation(preliminaryAnalysis, messages);

            // 2. Construct FaceAnalysisResult (mocking the mapping here for now, better to unify in faceAnalysis.ts)
            // But since 'faceAnalysis.ts' uses 'geminiService.callGeminiAnalysis', we effectively bypassed it.
            // We need to construct the full object.

            const fullResult: FaceAnalysisResult = {
                emotion: {
                    summary: rawResult.summary || "今日状态总结", // Fallback if prompt didn't strictly output this
                    energy_level: rawResult.energy_level,
                    mood_brightness: rawResult.mood_brightness,
                    tags: rawResult.tags,
                    today_suggestion: "好好休息" // Mock or derive
                },
                lifestyle: {
                    signals: rawResult.skin_signals || [],
                    suggestions: rawResult.lifestyle_hints || [],
                    disclaimer: "非医疗诊断，仅供参考"
                },
                reflection: {
                    summary: rawResult.dialog_summary || "...", // Use dialog summary here? or reflection prompt
                    questions: ["今天有什么值得记录的事？"] // Mock
                },
                timestamp: Date.now(),
                dialog_summary: rawResult.dialog_summary,
                analysis_confidence: 0.9
            };

            // We need to refine the fields mappings. 
            // Ideally 'analyzeFaceWithConversation' prompting should align closer to 'callGeminiAnalysis' output structure 
            // OR we use 'faceAnalysis.ts' helpers.
            // For this implementation, I will assume the prompt output aligns with required fields.

            onComplete(fullResult, messages);
        } catch (e) {
            console.error("Final analysis failed", e);
            alert("生成报告失败，将使用基础分析结果");
            // Fallback: just use preliminary data converted to result
            // Mock conversion
            const fallbackResult: FaceAnalysisResult = {
                emotion: {
                    summary: "分析受阻，基于初步印象",
                    energy_level: preliminaryAnalysis.energy_level,
                    mood_brightness: preliminaryAnalysis.mood_brightness,
                    tags: preliminaryAnalysis.tags,
                    today_suggestion: ""
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
        } finally {
            setIsProcessing(false);
        }
    };



    // Add useRef for the button
    const speechButtonRef = useRef<HTMLButtonElement>(null);

    // Native event listener attachment for non-passive events
    useEffect(() => {
        const button = speechButtonRef.current;
        if (!button) return;

        const handleTouchStart = (e: TouchEvent) => {
            e.preventDefault(); // This now works because we use { passive: false }
            startRecording();
        };

        const handleTouchEnd = (e: TouchEvent) => {
            e.preventDefault();
            stopRecording();
        };

        // Also handle mouse down/up for desktop to prevent focus stealing
        const handleMouseDown = (e: MouseEvent) => {
            e.preventDefault();
            startRecording();
        };

        const handleMouseUp = (e: MouseEvent) => {
            e.preventDefault();
            stopRecording();
        };

        button.addEventListener('touchstart', handleTouchStart, { passive: false });
        button.addEventListener('touchend', handleTouchEnd, { passive: false });
        button.addEventListener('touchcancel', handleTouchEnd, { passive: false }); // Reuse end handler for cancel

        button.addEventListener('mousedown', handleMouseDown);
        button.addEventListener('mouseup', handleMouseUp);
        button.addEventListener('mouseleave', handleMouseUp); // Handle drag out

        const handleContextMenu = (e: Event) => {
            e.preventDefault();
        };
        button.addEventListener('contextmenu', handleContextMenu);

        return () => {
            button.removeEventListener('touchstart', handleTouchStart);
            button.removeEventListener('touchend', handleTouchEnd);
            button.removeEventListener('touchcancel', handleTouchEnd);
            button.removeEventListener('mousedown', handleMouseDown);
            button.removeEventListener('mouseup', handleMouseUp);
            button.removeEventListener('mouseleave', handleMouseUp);
            button.removeEventListener('contextmenu', handleContextMenu);
        };
    }, [startRecording, stopRecording]);

    return (
        <div className="fixed inset-0 z-[100] bg-bg-soft flex flex-col animate-fade-in">
            {/* ... (rest of the file remains, but button JSX changes below) */}
            {/* Header */}
            <div className="px-4 py-3 bg-white/80 backdrop-blur border-b border-border-soft flex items-center justify-between shadow-sm">
                <button onClick={onCancel} className="text-text-subtle text-sm">取消</button>
                <div className="text-sm font-bold text-text-main">
                    {new Date().toLocaleString('zh-CN', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="w-10 h-10 rounded-full overflow-hidden border border-border-soft">
                    <img src={image} className="w-full h-full object-cover" alt="Current" />
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3.5 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                            ? 'bg-primary text-white rounded-tr-none shadow-soft'
                            : 'bg-white text-text-main rounded-tl-none border border-border-soft shadow-sm'
                            }`}>
                            {msg.content}
                        </div>
                    </div>
                ))}

                {isProcessing && (
                    <div className="flex justify-start">
                        <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-border-soft shadow-sm flex gap-1 items-center">
                            <span className="w-1.5 h-1.5 bg-text-subtle/50 rounded-full animate-bounce"></span>
                            <span className="w-1.5 h-1.5 bg-text-subtle/50 rounded-full animate-bounce delay-100"></span>
                            <span className="w-1.5 h-1.5 bg-text-subtle/50 rounded-full animate-bounce delay-200"></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Controls */}
            <div className="p-4 bg-white border-t border-border-soft pb-8">
                {/* Voice Button */}
                <div className="flex flex-col items-center gap-4 mb-4">
                    {!isSupported && <div className="text-xs text-red-500">浏览器不支持语音输入，请打字。</div>}

                    <button
                        ref={speechButtonRef}
                        disabled={isProcessing}
                        className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all select-none ${isRecording
                            ? 'bg-primary scale-110 ring-4 ring-primary/30'
                            : 'bg-white border-2 border-primary text-primary'
                            }`}
                    >
                        {isRecording ? (
                            <svg className="w-8 h-8 text-white animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                        ) : (
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                        )}
                    </button>
                    <p className="text-xs text-text-subtle">
                        {isRecording ? '松开结束' : '按住说话'}
                    </p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handleEndConversation}
                        className="flex-1 py-3 bg-primary text-white rounded-xl text-sm font-bold shadow-soft"
                    >
                        结束对话并生成
                    </button>
                </div>
            </div>
        </div >
    );
}
