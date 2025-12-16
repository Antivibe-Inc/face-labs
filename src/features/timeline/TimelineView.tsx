import { useState, useRef, useEffect, useMemo } from 'react';
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
import { EntryCard } from './components/EntryCard';
import { FaceCard } from './components/FaceCard';

// --- Helper: Grouping Logic ---

function groupHistory(history: FaceHistoryRecord[]) {
    const groups: { key: string; label: string; records: FaceHistoryRecord[] }[] = [];

    // Sort history just in case (Newest first)
    const sorted = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const todayRecords: FaceHistoryRecord[] = [];
    const yesterdayRecords: FaceHistoryRecord[] = [];

    // Use array of objects for earlier to maintain order
    const earlierGroups: { label: string, records: FaceHistoryRecord[] }[] = [];
    let currentMonthLabel = '';
    let currentMonthRecords: FaceHistoryRecord[] = [];

    sorted.forEach(record => {
        const d = new Date(record.date);
        const checkDate = new Date(d);
        checkDate.setHours(0, 0, 0, 0);

        if (checkDate.getTime() === today.getTime()) {
            todayRecords.push(record);
        } else if (checkDate.getTime() === yesterday.getTime()) {
            yesterdayRecords.push(record);
        } else {
            // Month Grouping
            const monthLabel = `${d.getFullYear()}年${d.getMonth() + 1}月`;
            if (monthLabel !== currentMonthLabel) {
                if (currentMonthLabel && currentMonthRecords.length > 0) {
                    earlierGroups.push({ label: currentMonthLabel, records: currentMonthRecords });
                }
                currentMonthLabel = monthLabel;
                currentMonthRecords = [];
            }
            currentMonthRecords.push(record);
        }
    });

    // Push last collected month
    if (currentMonthLabel && currentMonthRecords.length > 0) {
        earlierGroups.push({ label: currentMonthLabel, records: currentMonthRecords });
    }

    if (todayRecords.length > 0) groups.push({ key: 'today', label: '今天', records: todayRecords });
    if (yesterdayRecords.length > 0) groups.push({ key: 'yesterday', label: '昨天', records: yesterdayRecords });

    earlierGroups.forEach(g => {
        groups.push({ key: g.label, label: g.label, records: g.records });
    });

    return groups;
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

    // Initial Load
    useEffect(() => {
        setHistory(loadHistory());
    }, []);

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
                threshold: 0.5
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
    }, [history.length]);

    // Check for reminder on mount ... (Logic kept same)
    useEffect(() => {
        const settings = loadSettings();
        if (!settings.reminderEnabled) return;
        const todayStr = new Date().toDateString();
        const dismissedDate = localStorage.getItem('faceLabs_dismissedReminderDate');
        if (dismissedDate === todayStr) return;
        const currentHistory = loadHistory();
        const hasTodayRecord = currentHistory.some(r => new Date(r.date).toDateString() === todayStr);
        if (hasTodayRecord) return;
        const now = new Date();
        const reminderTime = settings.reminderHour * 60 + settings.reminderMinute;
        const currentTime = now.getHours() * 60 + now.getMinutes();
        if (currentTime >= reminderTime) {
            setShowReminder(true);
        }
    }, [history]); // Dep on history to re-check if user adds one

    const handleDismissReminder = () => {
        setShowReminder(false);
        const todayStr = new Date().toDateString();
        localStorage.setItem('faceLabs_dismissedReminderDate', todayStr);
    };

    const scrollToNewest = () => {
        if (scrollContainerRef.current) {
            setTimeout(() => {
                const container = scrollContainerRef.current;
                if (container) {
                    // Simple scroll to top
                    container.scrollTo({ top: 0, behavior: 'smooth' });
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
            const imageUrl = await blobToBase64(blob);
            setCurrentImage(imageUrl);
            const raw = await callGeminiAnalysis(imageUrl);
            setPreliminaryAnalysis(raw);
            setShowConversation(true);
            setIsAnalyzing(false);
        } catch (error) {
            console.error("Preliminary analysis failed", error);
            setIsAnalyzing(false);
            alert(`服务不可用: ${error instanceof Error ? error.message : "未知错误"}`);
            if (currentImage) {
                const result = await analyzeFace(currentImage);
                const record = createRecordFromAnalysis(result, currentImage);
                const success = saveRecord(record);
                if (!success) {
                    setShowDailyLimitAlert(true);
                } else {
                    setHistory(loadHistory());
                    setSelectedRecord(record);
                    scrollToNewest();
                }
            }
        }
    };

    const handleConversationComplete = (result: FaceAnalysisResult, transcript?: { role: 'user' | 'assistant'; content: string }[]) => {
        setShowConversation(false);
        if (currentImage) {
            const record = createRecordWithConversation(result, currentImage, transcript || []);
            const success = saveRecord(record);
            if (!success) {
                setShowDailyLimitAlert(true);
                return;
            }
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
        setHistory(loadHistory());
    };

    // Grouping
    const groupedHistory = useMemo(() => groupHistory(history), [history]);

    // Flatten logic for refs: EntryCard is 0. 
    let cardRefIndex = 1;

    return (
        <div className="relative w-full h-full flex flex-col bg-gray-50">
            {/* Header */}
            <div className="pt-4 pb-2 px-6 flex flex-col items-center text-center bg-gray-50 z-10">
                <h1 className="text-2xl font-bold text-text-main tracking-tight">时间线</h1>
                <p className="text-xs text-text-subtle mt-0.5 flex items-center gap-2">
                    <span>用一张脸，观照每一天的自己</span>
                </p>
            </div>

            {/* Scroll Container (Vertical Feed with Timeline Rail) */}
            <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto no-scrollbar flex flex-col px-4 pt-4 pb-24"
            >
                {/* 0. Entry Card (The 'Now' Node) */}
                <div className="flex items-stretch gap-3 mb-6 relative">
                    {/* Rail Column */}
                    <div className="w-8 flex-shrink-0 relative flex flex-col items-center">
                        {/* Line connecting to bottom */}
                        <div className="absolute top-8 bottom-0 w-px bg-emerald-100/80 left-1/2 -translate-x-1/2"></div>

                        {/* Node */}
                        <div className="relative z-10 w-4 h-4 rounded-full bg-white border-2 border-emerald-500 flex items-center justify-center mt-6 shadow-sm">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        </div>
                    </div>

                    {/* Right Content */}
                    <div
                        ref={(el) => { cardRefs.current[0] = el; }}
                        data-index="0"
                        className="flex-1"
                    >
                        <div className="flex items-baseline justify-between mb-2">
                            <span className="text-sm font-bold text-emerald-800">现在</span>
                        </div>
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
                </div>

                {/* Groups */}
                {groupedHistory.map((group) => (
                    <div key={group.key} className="mb-0">
                        {/* Group Header (if needed distinct from cards, but requirements say label next to rail) */}
                        {/* Actually user said: "Before each group, render a small section header aligned with the timeline rail" */}
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 flex-shrink-0 flex justify-center">
                                {/* Optional dot for group start? Or just empty rail space? 
                                     User said: "Left (rail column): Could show a slightly larger dot OR a small label" 
                                     Let's use a small label or dot. 
                                     Let's just keep the rail line running through? 
                                     If we use a flex row for the header, we can put the label in the right column.
                                 */}
                                <div className="w-px h-full bg-emerald-100/80"></div>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className={`font-bold ${group.key === 'today' || group.key === 'yesterday' ? 'text-sm text-emerald-800' : 'text-xs text-emerald-700/80 uppercase tracking-wide'}`}>
                                    {group.label}
                                </span>
                                {group.key === 'today' && <span className="text-[10px] text-gray-400 font-normal">今天的脸卡</span>}
                            </div>
                        </div>

                        {/* Records in Group */}
                        <div className="space-y-0">
                            {group.records.map((record) => {
                                const currentIndex = cardRefIndex++;
                                const isToday = group.key === 'today';

                                return (
                                    <div key={record.id} className="flex items-stretch gap-3 relative pb-6">
                                        {/* Rail */}
                                        <div className="w-8 flex-shrink-0 relative flex flex-col items-center">
                                            {/* Full height line */}
                                            <div className="absolute top-0 bottom-0 w-px bg-emerald-100 left-1/2 -translate-x-1/2"></div>

                                            {/* Dot */}
                                            <div className={`
                                                relative z-10 rounded-full mt-6 transition-all duration-300
                                                ${isToday
                                                    ? 'w-3.5 h-3.5 bg-emerald-500 border-2 border-white shadow-sm ring-1 ring-emerald-100'
                                                    : 'w-3 h-3 bg-white border border-emerald-500'
                                                }
                                            `}></div>
                                        </div>

                                        {/* Card */}
                                        <div
                                            ref={(el) => { cardRefs.current[currentIndex] = el; }}
                                            data-index={currentIndex}
                                            className="flex-1 min-w-0" // min-w-0 prevents flex child overflow
                                        >
                                            <FaceCard
                                                record={record}
                                                onDelete={(e) => handleDelete(record.id, e)}
                                                onClick={() => setSelectedRecord(record)}
                                                isActive={activeIndex === currentIndex}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}

                {/* Empty State Hint */}
                {history.length === 0 && (
                    <div className="pl-11 text-xs text-gray-400">
                        在这里开始你的第一张记录...
                    </div>
                )}
            </div>

            {/* Overlays ... (Same) */}
            {showCamera && (
                <CameraModal
                    onPhotoTaken={(file) => handleCameraCapture(file)}
                    onCancel={() => setShowCamera(false)}
                />
            )}

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
