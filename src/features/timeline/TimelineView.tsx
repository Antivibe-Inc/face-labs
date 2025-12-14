import { useState, useRef, useEffect } from 'react';
import type { FaceHistoryRecord } from '../../services/historyStore';
import { loadHistory, deleteRecord, updateRecordNote, saveRecord, hasTodayRecord, createRecordWithConversation, createRecordFromAnalysis } from '../../services/historyStore';
import { CameraModal } from '../today/CameraModal';
import { ScanningOverlay } from '../today/ScanningOverlay';
import { analyzeFace } from '../../services/faceAnalysis';
import type { FaceAnalysisResult } from '../../types/analysis';
import { ConversationView } from '../conversation/ConversationView';
import { HistoryDetailOverlay } from '../history/HistoryView';
import { loadSettings } from '../../services/settingsStore';
import { callGeminiAnalysis, type GeminiFaceAnalysis } from '../../services/geminiService';

// --- Component: Entry Card (Today) ---
interface EntryCardProps {
    onTakePhoto: () => void;
    isAnalyzing: boolean;
    isActive: boolean;
}

function EntryCard({ onTakePhoto, isAnalyzing, isActive }: EntryCardProps) {
    return (
        <div className={`w-[85vw] max-w-sm h-[70vh] flex-shrink-0 snap-center flex flex-col items-center justify-center p-6 bg-white rounded-[40px] shadow-soft relative overflow-hidden transition-all duration-300 ${isActive ? 'scale-100 border-[3px] border-primary shadow-xl' : 'scale-[0.92] border border-border-soft/50 opacity-80'}`}>
            {/* Decorative Background */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white via-white to-bg-soft -z-10" />

            <div className="w-24 h-24 mb-6 rounded-[32px] bg-white shadow-soft flex items-center justify-center text-primary animate-pulse-slow">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>

            <h2 className="text-2xl font-bold text-primary mb-3 text-center">
                观照今天的自己
            </h2>
            <p className="text-sm text-text-subtle text-center leading-relaxed mb-10 max-w-xs">
                即便再忙，也要停下来，<br />
                拍一张现在的样子，看看它想提醒你什么。
            </p>

            <div className="w-full space-y-4">
                <button
                    onClick={onTakePhoto}
                    disabled={isAnalyzing}
                    className="w-full py-4 bg-primary text-white rounded-full text-base font-semibold shadow-lg shadow-soft active:scale-95 transition-all hover:opacity-90 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isAnalyzing ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            正在分析...
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            拍一张照片
                        </>
                    )}
                </button>
            </div>

            <div className="absolute bottom-6 text-[10px] text-text-subtle opacity-50 text-center px-6">
                所有照片仅在本地处理，不会上传到任何服务器。<br />我们尊重并保护您的隐私。
            </div>
        </div >
    );
}

// --- Component: Face Card (History) ---
interface FaceCardProps {
    record: FaceHistoryRecord;
    onDelete: (e: React.MouseEvent) => void;
    onClick: () => void;
    isActive: boolean;
}

function FaceCard({ record, onDelete, onClick, isActive }: FaceCardProps) {
    const topTags = record.emotion.tags.slice(0, 3);

    return (
        <div
            onClick={onClick}
            className={`w-[85vw] max-w-sm h-[70vh] flex-shrink-0 snap-center bg-white rounded-[40px] shadow-sm relative overflow-hidden flex flex-col cursor-pointer active:scale-[0.98] transition-all duration-300 ${isActive ? 'scale-100 border-[3px] border-primary shadow-xl' : 'scale-[0.92] border border-border-soft/50 opacity-80'}`}
        >
            {/* Header Image Area */}
            <div className="relative h-[55%] bg-gray-100 flex items-center justify-center overflow-hidden">
                {record.thumbnail.includes('camera_icon_custom') ? (
                    <div className="w-full h-full bg-white flex items-center justify-center text-primary/50">
                        <svg className="w-20 h-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                ) : (
                    <img src={record.thumbnail} alt="Face" className="w-full h-full object-cover" />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-6">
                    <div className="text-white text-xs opacity-80 mb-1">{record.dateLabel.split(' ')[0]}</div>
                    <div className="text-white text-lg font-bold truncate pr-8">{record.emotion.summary}</div>
                </div>

                {/* Delete Button */}
                <button
                    onClick={onDelete}
                    className="absolute top-4 right-4 w-8 h-8 bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-red-500/80 transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-6 flex flex-col justify-between bg-white">
                <div>
                    {/* Metrics */}
                    <div className="flex items-center gap-4 text-xs font-medium text-text-subtle mb-4">
                        <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-primary"></span>
                            精力 {record.emotion.energy_level}/10
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                            心情 {record.emotion.mood_brightness}/10
                        </span>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                        {topTags.map(tag => (
                            <span key={tag} className="px-3 py-1 bg-bg-soft/50 text-text-main text-xs rounded-full border border-border-soft/30">
                                #{tag}
                            </span>
                        ))}
                    </div>

                    {/* Note Preview */}
                    {record.note ? (
                        <div className="text-sm text-text-subtle bg-gray-50 p-3 rounded-xl italic border border-gray-100 line-clamp-2">
                            “{record.note}”
                        </div>
                    ) : (
                        <div className="text-xs text-text-subtle opacity-50 italic">
                            没有写下备注...
                        </div>
                    )}
                </div>

                <button className="w-full py-3 mt-2 text-sm text-primary font-medium hover:bg-bg-soft/30 rounded-xl transition-colors flex items-center justify-center gap-1">
                    查看完整报告
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
        </div>
    );
}


// --- Main View ---

export function TimelineView() {
    const [history, setHistory] = useState<FaceHistoryRecord[]>([]);
    const [showCamera, setShowCamera] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Conversation State
    const [showConversation, setShowConversation] = useState(false);
    const [currentImage, setCurrentImage] = useState<string | null>(null);
    const [preliminaryAnalysis, setPreliminaryAnalysis] = useState<GeminiFaceAnalysis | null>(null);

    // UI State
    const [selectedRecord, setSelectedRecord] = useState<FaceHistoryRecord | null>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const [showDailyLimitAlert, setShowDailyLimitAlert] = useState(false); // Alert state
    const [showReminder, setShowReminder] = useState(false); // Reminder state
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

    // Intersection Observer to track active card
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const index = Number(entry.target.getAttribute('data-index'));
                        setActiveIndex(index);
                    }
                });
            },
            {
                root: scrollContainerRef.current,
                threshold: 0.6 // Card is considered active when 60% visible
            }
        );

        const currentRefs = cardRefs.current;
        currentRefs.forEach((card) => {
            if (card) observer.observe(card);
        });

        return () => {
            currentRefs.forEach((card) => {
                if (card) observer.unobserve(card);
            });
        };
    }, [history.length]); // Re-run when history length changes

    // Initial Load
    useEffect(() => {
        setHistory(loadHistory());
    }, []);

    // Check for reminder on mount
    useEffect(() => {
        const settings = loadSettings();
        if (!settings.reminderEnabled) return;

        // 1. Check if dismissed for today
        const todayStr = new Date().toDateString();
        const dismissedDate = localStorage.getItem('faceLabs_dismissedReminderDate');
        if (dismissedDate === todayStr) return;

        // 2. Check if already has record for today
        // Note: loadHistory() might not be updated in state yet, so load directly
        const currentHistory = loadHistory();
        const hasTodayRecord = currentHistory.some(r => new Date(r.date).toDateString() === todayStr);
        if (hasTodayRecord) return;

        // 3. Time check: Show if it's past the reminder time
        const now = new Date();
        const reminderTime = settings.reminderHour * 60 + settings.reminderMinute;
        const currentTime = now.getHours() * 60 + now.getMinutes();

        if (currentTime >= reminderTime) {
            setShowReminder(true);
        }
    }, []);

    const handleDismissReminder = () => {
        setShowReminder(false);
        const todayStr = new Date().toDateString();
        localStorage.setItem('faceLabs_dismissedReminderDate', todayStr);
    };

    const scrollToNewest = () => {
        if (scrollContainerRef.current) {
            // Scroll to index 1 (the first history card)
            setTimeout(() => {
                const container = scrollContainerRef.current;
                if (container) {
                    const children = container.children;
                    if (children.length > 1) {
                        children[1].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                    }
                }
            }, 100);
        }
    };


    // Helper: Convert Blob to Base64
    const blobToBase64 = (blob: Blob): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    const handleCameraCapture = async (blob: Blob) => {
        setShowCamera(false);
        setIsAnalyzing(true);
        try {
            // Convert to Base64
            const imageUrl = await blobToBase64(blob);
            setCurrentImage(imageUrl);

            // Preliminary Analysis
            // Note: We use callGeminiAnalysis directly to get the raw signals for conversation
            const raw = await callGeminiAnalysis(imageUrl);

            setPreliminaryAnalysis(raw);
            setShowConversation(true);
            setIsAnalyzing(false);

        } catch (error) {
            console.error("Preliminary analysis failed", error);
            setIsAnalyzing(false);
            // Show actual error for debugging
            alert(`服务不可用: ${error instanceof Error ? error.message : "未知错误"}`);

            // Fallback: Skip conversation
            if (currentImage) {
                // Reuse analyzeFace which has mock fallback
                const result = await analyzeFace(currentImage);
                saveAndRedirect(result, currentImage);
            }
        }
    };

    const handleConversationComplete = (result: FaceAnalysisResult, transcript?: { role: 'user' | 'assistant'; content: string }[]) => {
        setShowConversation(false);

        // Save Record
        if (currentImage) {
            const record = createRecordWithConversation(result, currentImage, transcript || []);
            const success = saveRecord(record); // Default limit applies

            if (!success) {
                setShowDailyLimitAlert(true);
                return;
            }

            // Redirect
            setHistory(loadHistory());
            setSelectedRecord(record);
            scrollToNewest();
        }
        setCurrentImage(null);
        setPreliminaryAnalysis(null);
    };

    const handleConversationCancel = () => {
        setShowConversation(false);
        setCurrentImage(null);
        setPreliminaryAnalysis(null);
    };

    const saveAndRedirect = (result: FaceAnalysisResult, image: string) => {
        const record = createRecordFromAnalysis(result, image);
        const success = saveRecord(record);
        if (!success) {
            setShowDailyLimitAlert(true);
            return;
        }
        setHistory(loadHistory());
        setSelectedRecord(record);
        scrollToNewest();
    };

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm("确定要删除这张脸卡吗？删除后无法恢复。")) {
            deleteRecord(id);
            setHistory(loadHistory());
            if (selectedRecord?.id === id) {
                setSelectedRecord(null);
            }
        }
    };

    const handleNoteUpdate = (id: string, note: string) => {
        updateRecordNote(id, note);
        setHistory(loadHistory()); // Refresh to update preview
    };

    return (
        <div className="relative w-full h-full flex flex-col bg-gray-50">
            {/* Header */}
            <div className="pt-4 pb-2 px-6 flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold text-text-main tracking-tight">时间线</h1>
                <p className="text-xs text-text-subtle mt-0.5 flex items-center gap-2">
                    <span>用一张脸，观照每一天的自己</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                    <span>已留下 {history.length} 张卡片</span>
                </p>
            </div>

            {/* Scroll Container */}
            <div
                ref={scrollContainerRef}
                className="flex-1 overflow-x-auto no-scrollbar flex items-center gap-4 px-6 snap-x snap-mandatory pt-4 pb-8"
            >
                {/* 0. Entry Card */}
                <div
                    ref={(el) => { cardRefs.current[0] = el; }}
                    data-index="0"
                    className="snap-center"
                >
                    <EntryCard
                        onTakePhoto={() => {
                            if (hasTodayRecord()) {
                                setShowDailyLimitAlert(true);
                            } else {
                                setShowCamera(true);
                            }
                        }}
                        isAnalyzing={isAnalyzing}
                        isActive={activeIndex === 0}
                    />
                </div>

                {/* 1..N History Cards */}
                {history.map((record, idx) => (
                    <div
                        key={record.id}
                        ref={(el) => { cardRefs.current[idx + 1] = el; }}
                        data-index={idx + 1}
                        className="snap-center"
                    >
                        <FaceCard
                            record={record}
                            onDelete={(e) => handleDelete(record.id, e)}
                            onClick={() => setSelectedRecord(record)}
                            isActive={activeIndex === idx + 1}
                        />
                    </div>
                ))}

                {/* Empty State Hint (if no history) */}
                {history.length === 0 && (
                    <div className="flex-shrink-0 w-8"></div> // Spacer
                )}
            </div>

            {/* Footer Hint */}
            {history.length === 0 && (
                <div className="absolute bottom-6 left-0 w-full text-center text-xs text-text-subtle animate-fade-in pointer-events-none">
                    先拍一张，Face Labs 才能为你生成脸卡时间线。
                </div>
            )}

            {/* Overlays */}
            {showCamera && (
                <CameraModal
                    onPhotoTaken={(file) => handleCameraCapture(file)}
                    onCancel={() => setShowCamera(false)}
                />
            )}

            {/* Scanning Overlay - shown during analysis */}
            {isAnalyzing && currentImage && (
                <ScanningOverlay image={currentImage} />
            )}

            {showConversation && currentImage && preliminaryAnalysis && (
                <ConversationView
                    image={currentImage}
                    preliminaryAnalysis={preliminaryAnalysis}
                    onComplete={handleConversationComplete}
                    onCancel={handleConversationCancel}
                />
            )}

            {/* Daily Limit Alert Overlay */}
            {showDailyLimitAlert && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-[32px] p-6 w-full max-w-xs text-center shadow-2xl scale-100 animate-in fade-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 bg-bg-soft rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                            ✋
                        </div>
                        <h3 className="text-xl font-bold text-text-main mb-2">今天已经有一张脸卡啦</h3>
                        <p className="text-sm text-text-subtle leading-relaxed mb-6">
                            Face Labs 每天只保留一条记录。
                            <br />
                            如果你想重新来一次，可以先在时间线里删除今天的脸卡，再重新拍一张。
                        </p>
                        <button
                            onClick={() => setShowDailyLimitAlert(false)}
                            className="w-full py-3.5 bg-primary text-white rounded-2xl font-semibold shadow-lg shadow-soft active:scale-95 transition-all"
                        >
                            知道了
                        </button>
                    </div>
                </div>
            )}

            {/* Daily Reminder Overlay */}
            {showReminder && (
                <div className="fixed inset-0 z-[50] flex items-end justify-center p-4 bg-black/20 backdrop-blur-[2px] animate-fade-in pointer-events-none">
                    <div className="bg-white/95 backdrop-blur rounded-[24px] p-4 w-full max-w-sm shadow-xl border border-border-soft/50 pointer-events-auto animate-in slide-in-from-bottom-10 duration-300 mb-20">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-border-soft flex items-center justify-center shrink-0 text-xl">
                                ⏰
                            </div>
                            <div className="flex-1">
                                <h3 className="text-2xl font-bold text-slate-500 mb-2">观照今天的自己</h3>
                                <p className="text-xs text-text-subtle leading-relaxed mb-3">
                                    现在是观察自己的好时间。
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            setShowReminder(false);
                                            // Optional: scroll to entry card if needed, but we are likely already there or user will scroll.
                                            cardRefs.current[0]?.scrollIntoView({ behavior: 'smooth' });
                                        }}
                                        className="text-xs font-semibold bg-primary text-white px-4 py-2 rounded-full shadow-sm active:scale-95 transition-transform"
                                    >
                                        去拍一张
                                    </button>
                                    <button
                                        onClick={handleDismissReminder}
                                        className="text-xs text-text-subtle px-2 py-2 hover:text-text-main transition-colors"
                                    >
                                        今天先不用
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {selectedRecord && (
                <HistoryDetailOverlay
                    record={selectedRecord}
                    onClose={() => setSelectedRecord(null)}
                    onSaveNote={(note) => handleNoteUpdate(selectedRecord.id, note)}
                />
            )}
        </div>
    );
}
