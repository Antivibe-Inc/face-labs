
import { useEffect, useState, useMemo, useRef } from 'react';
import type { FaceHistoryRecord } from '../../services/historyStore';
import { loadHistory, clearHistory, deleteRecord, updateRecordNote } from '../../services/historyStore';
import { getWeeklyStats, buildWeeklySummary, type WeeklyStats } from './historyStats';
import { TrendChartCard, TagStatsCard } from './HistoryAnalytics';
import { pickQuestionsForRecord, pickPracticesForRecord } from '../../services/suggestionService';
import { ShareModal } from '../share/ShareModal';

interface HistoryViewProps {
    onNavigateToToday: () => void;
}

export function HistoryView({ onNavigateToToday }: HistoryViewProps) {
    const [history, setHistory] = useState<FaceHistoryRecord[]>([]);
    const [selectedRecord, setSelectedRecord] = useState<FaceHistoryRecord | null>(null);

    // Filters
    const [filterRange, setFilterRange] = useState<'all' | '7' | '30'>('all');
    const [filterEnergy, setFilterEnergy] = useState<'all' | 'low' | 'mid' | 'high'>('all');
    const [filterTag, setFilterTag] = useState<string>('all');

    useEffect(() => {
        setHistory(loadHistory());
    }, []);

    const handleClearHistory = () => {
        if (confirm("确定要清空所有历史记录吗？这些数据只保存在本机，清空后无法恢复。")) {
            clearHistory();
            setHistory([]);
        }
    };

    const handleDeleteRecord = (id: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent opening detail view
        if (confirm("确定要删除这条记录吗？这条记录只保存在本机，删除后无法恢复。")) {
            deleteRecord(id);
            setHistory(loadHistory()); // Refresh list
        }
    };

    const handleNoteUpdate = (id: string, note: string) => {
        updateRecordNote(id, note);
        setHistory(loadHistory()); // Refresh list to update note preview
    };

    // --- Derived Data ---

    const weeklyStats = getWeeklyStats(history);

    // Get all unique tags for filter
    const uniqueTags = useMemo(() => {
        const tags = new Set<string>();
        history.forEach(r => r.emotion.tags.forEach(t => tags.add(t)));
        return Array.from(tags).sort();
    }, [history]);

    // Apply filters
    const filteredHistory = useMemo(() => {
        return history.filter(r => {
            const date = new Date(r.date);
            const now = new Date();

            // 1. Time Range
            if (filterRange === '7') {
                const cutoff = new Date();
                cutoff.setDate(now.getDate() - 7);
                cutoff.setHours(0, 0, 0, 0);
                if (date < cutoff) return false;
            } else if (filterRange === '30') {
                const cutoff = new Date();
                cutoff.setDate(now.getDate() - 30);
                cutoff.setHours(0, 0, 0, 0);
                if (date < cutoff) return false;
            }

            // 2. Energy
            const e = r.emotion.energy_level;
            if (filterEnergy === 'low' && (e > 3)) return false;
            if (filterEnergy === 'mid' && (e < 4 || e > 6)) return false;
            if (filterEnergy === 'high' && (e < 7)) return false;

            // 3. Tag
            if (filterTag !== 'all' && !r.emotion.tags.includes(filterTag)) return false;

            return true;
        });
    }, [history, filterRange, filterEnergy, filterTag]);


    return (
        <>
            {selectedRecord && (
                <HistoryDetailOverlay
                    record={selectedRecord}
                    onClose={() => setSelectedRecord(null)}
                    onSaveNote={(note) => handleNoteUpdate(selectedRecord.id, note)}
                />
            )}

            {history.length === 0 ? (
                <div className="px-6 py-20 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-pink-soft rounded-full mb-6 flex items-center justify-center text-accent text-2xl border border-pink-border">
                        📝
                    </div>
                    <h2 className="text-xl font-bold text-text-main mb-3">还没有记录</h2>
                    <p className="text-text-subtle mb-8 max-w-xs leading-relaxed text-sm">
                        从“今天”拍一张照片开始，Face Labs 会帮你记录每天的脸部状态。
                    </p>
                    <button
                        onClick={onNavigateToToday}
                        className="px-6 py-3 bg-white border border-primary rounded-full text-sm font-medium text-primary hover:bg-pink-panel transition-colors shadow-sm"
                    >
                        去今天看看
                    </button>
                </div>
            ) : (
                <div className="p-4 pb-24 space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2 px-1">
                        <div>
                            <h2 className="text-xl font-bold text-text-main">历史记录</h2>
                            <p className="text-xs text-text-subtle mt-1">这里是你脸部状态的时间线，只保存在本机。</p>
                        </div>
                        <button
                            onClick={handleClearHistory}
                            className="text-xs text-text-subtle hover:text-primary transition-colors underline"
                        >
                            清空全部记录
                        </button>
                    </div>

                    {/* Analytics Section */}
                    {history.length >= 2 && (
                        <div className="animate-fade-in">
                            <WeeklyOverviewCard stats={weeklyStats} />
                            <TrendChartCard history={history} />
                            <TagStatsCard history={history} />
                        </div>
                    )}
                    {history.length < 2 && (
                        <WeeklyOverviewCard stats={weeklyStats} />
                    )}

                    {/* Filters */}
                    <div className="sticky top-14 bg-gray-50/95 backdrop-blur z-10 py-2 -mx-2 px-2 space-y-2 border-b border-gray-100">
                        {/* Row 1: Range & Energy */}
                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                            {/* Time Select */}
                            <select
                                className="text-xs bg-white border border-pink-border rounded-lg px-2 py-1.5 focus:outline-none focus:border-primary text-text-main"
                                value={filterRange}
                                onChange={(e) => setFilterRange(e.target.value as any)}
                            >
                                <option value="all">全部时间</option>
                                <option value="7">最近 7 天</option>
                                <option value="30">最近 30 天</option>
                            </select>

                            {/* Energy Select */}
                            <select
                                className="text-xs bg-white border border-pink-border rounded-lg px-2 py-1.5 focus:outline-none focus:border-primary text-text-main"
                                value={filterEnergy}
                                onChange={(e) => setFilterEnergy(e.target.value as any)}
                            >
                                <option value="all">精力：全部</option>
                                <option value="low">精力：偏低 (0-3)</option>
                                <option value="mid">精力：中等 (4-6)</option>
                                <option value="high">精力：偏高 (7-10)</option>
                            </select>

                            {/* Tag Select */}
                            <select
                                className="text-xs bg-white border border-pink-border rounded-lg px-2 py-1.5 focus:outline-none focus:border-primary text-text-main max-w-[120px]"
                                value={filterTag}
                                onChange={(e) => setFilterTag(e.target.value)}
                            >
                                <option value="all">全部标签</option>
                                {uniqueTags.map(tag => (
                                    <option key={tag} value={tag}>{tag}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* List */}
                    <div className="space-y-4">
                        {filteredHistory.length === 0 ? (
                            <div className="text-center py-12 text-sm text-text-subtle">
                                在这个筛选条件下还没有记录，可以换个条件试试。
                            </div>
                        ) : (
                            filteredHistory.map(record => (
                                <HistoryCard
                                    key={record.id}
                                    record={record}
                                    onDelete={(e) => handleDeleteRecord(record.id, e)}
                                    onClick={() => setSelectedRecord(record)}
                                />
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    <p className="text-[10px] text-center text-text-subtle opacity-50 pt-4">
                        所有历史记录仅保存在本机浏览器中，可以随时清空。
                    </p>
                </div>
            )}
        </>
    );
}

export function WeeklyOverviewCard({ stats }: { stats: WeeklyStats | null }) {
    if (!stats) {
        return (
            <div className="bg-white rounded-2xl border border-pink-border p-4 text-center shadow-sm mb-4">
                <div className="text-sm font-semibold text-text-main mb-1">本周脸部概览</div>
                <p className="text-xs text-text-subtle">再多记录几天，我们就能为你生成一张“本周脸部概览”。</p>
            </div>
        );
    }

    const { title, description, tips } = buildWeeklySummary(stats);

    return (
        <div className="bg-white rounded-3xl border border-pink-border shadow-sm p-5 mb-4">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-text-main">本周脸部概览</h3>
                <span className="text-xs text-text-subtle bg-pink-soft px-2 py-0.5 rounded-full border border-pink-border/50">
                    基于最近 {stats.count} 次记录
                </span>
            </div>

            <h4 className="text-sm font-bold text-primary mb-2">{title}</h4>
            <p className="text-xs text-text-subtle leading-relaxed mb-4">
                {description}
            </p>

            {/* Numeric Stats */}
            <div className="flex items-center gap-4 mb-5 text-xs text-text-subtle bg-gray-50 p-2 rounded-lg">
                <div>
                    平均精力值：<span className="font-semibold text-text-main">{stats.avgEnergy.toFixed(1)}</span> / 10
                </div>
                <div>
                    平均心情亮度：<span className="font-semibold text-text-main">{stats.avgMood.toFixed(1)}</span> / 10
                </div>
            </div>

            {/* Tips */}
            <div>
                <div className="text-xs font-semibold text-text-main mb-2">给这一周的自己，一点小提示：</div>
                <ul className="space-y-2">
                    {tips.map((tip, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-text-subtle">
                            <span className="text-accent mt-0.5">•</span>
                            {tip}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

interface HistoryCardProps {
    record: FaceHistoryRecord;
    onDelete: (e: React.MouseEvent) => void;
    onClick: () => void;
}

function HistoryCard({ record, onDelete, onClick }: HistoryCardProps) {
    return (
        <div
            onClick={onClick}
            className="bg-white p-3 rounded-2xl border border-pink-border shadow-soft flex items-start gap-4 active:scale-[0.98] transition-transform cursor-pointer relative group"
        >
            {/* Thumbnail */}
            <img
                src={record.thumbnail}
                alt="Face"
                className="w-14 h-14 rounded-full object-cover border border-pink-border flex-shrink-0"
            />

            <div className="flex-1 min-w-0 pr-6">
                {/* Header Line */}
                <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-text-main">{record.dateLabel}</span>
                </div>

                {/* Summary */}
                <p className="text-sm text-text-subtle leading-tight mb-2 line-clamp-2">
                    {record.emotion.summary}
                </p>

                {/* Scores */}
                <div className="text-xs text-text-subtle mb-2 opacity-80">
                    精力值：{record.emotion.energy_level} / 10 · 心情亮度：{record.emotion.mood_brightness} / 10
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                    {record.emotion.tags.map(tag => (
                        <span key={tag} className="px-2 py-0.5 bg-pink-soft text-text-subtle text-[10px] font-medium rounded-md border border-pink-border/50">
                            #{tag}
                        </span>
                    ))}
                </div>

                {/* Note (if exists) */}
                {record.note && record.note.trim() !== '' && (
                    <div className="bg-pink-panel/50 p-2.5 rounded-xl border border-pink-border/30 mt-2">
                        <div className="text-[10px] text-text-subtle mb-1">那天写下的一句话：</div>
                        <p className="text-sm text-text-main leading-relaxed">
                            {record.note}
                        </p>
                    </div>
                )}
            </div>

            {/* Delete Button */}
            <button
                onClick={onDelete}
                className="absolute top-3 right-3 text-[10px] text-text-subtle hover:text-red-500 opacity-60 hover:opacity-100 p-1"
            >
                删除
            </button>
        </div>
    );
}

interface HistoryDetailOverlayProps {
    record: FaceHistoryRecord;
    onClose: () => void;
    onSaveNote: (note: string) => void;
}

export function HistoryDetailOverlay({ record, onClose, onSaveNote }: HistoryDetailOverlayProps) {
    const [note, setNote] = useState(record.note || '');
    const [saved, setSaved] = useState(false);
    const [showShare, setShowShare] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSave = () => {
        onSaveNote(note);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    // Memoize dynamic content so it doesn't change while typing (re-rendering)
    const questions = useMemo(() => pickQuestionsForRecord({ emotion: record.emotion }), [record.id]);
    const practices = useMemo(() => pickPracticesForRecord({ emotion: record.emotion }), [record.id]);

    return (
        <div className="fixed inset-0 z-50 bg-gray-50/95 backdrop-blur-sm overflow-y-auto animate-fade-in flex flex-col">
            {/* Header */}
            <div className="sticky top-0 bg-white/90 backdrop-blur border-b border-pink-border px-4 py-3 flex items-center justify-between z-10 shadow-sm">
                <button
                    onClick={onClose}
                    className="text-sm font-medium text-primary flex items-center gap-1"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    返回
                </button>
                <div className="text-sm font-bold text-text-main">{record.dateLabel}</div>
                <div className="w-16"></div> {/* Spacer for center alignment */}
            </div>

            {/* Content */}
            <div className="p-4 pb-24 space-y-6 max-w-md mx-auto w-full">
                {/* Top Section */}
                <div className="flex flex-col items-center gap-4">
                    <img
                        src={record.thumbnail}
                        alt="Face"
                        className="w-24 h-24 rounded-3xl object-cover border-2 border-pink-border shadow-soft"
                    />
                </div>

                {/* 1. Emotion */}
                <section className="bg-white p-5 rounded-2xl shadow-soft border border-pink-border">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-primary mb-3">01 情绪快照</h3>
                    <p className="text-lg font-medium text-text-main mb-6 leading-snug">
                        "{record.emotion.summary}"
                    </p>
                    <div className="flex flex-wrap gap-2 mb-6">
                        {record.emotion.tags.map(tag => (
                            <span key={tag} className="px-3 py-1 bg-pink-panel text-primary text-xs font-medium rounded-full">
                                #{tag}
                            </span>
                        ))}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-pink-soft p-3 rounded-2xl border border-pink-border/50">
                            <span className="text-xs text-text-subtle">精力值</span>
                            <div className="text-xl font-bold text-text-main">{record.emotion.energy_level}/10</div>
                        </div>
                        <div className="bg-pink-soft p-3 rounded-2xl border border-pink-border/50">
                            <span className="text-xs text-text-subtle">心情亮度</span>
                            <div className="text-xl font-bold text-text-main">{record.emotion.mood_brightness}/10</div>
                        </div>
                    </div>
                </section>

                {/* 2. Lifestyle */}
                <section className="bg-white p-5 rounded-2xl shadow-soft border border-pink-border">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-primary mb-3">02 皮肤与生活方式</h3>
                    <ul className="space-y-2 mb-4">
                        {record.lifestyle.signals.map((signal, idx) => (
                            <li key={idx} className="text-sm text-text-subtle flex items-start gap-2">
                                <span className="text-accent mt-1">•</span>
                                {signal}
                            </li>
                        ))}
                    </ul>
                    <div className="space-y-2">
                        {record.lifestyle.suggestions.map((sugg, idx) => (
                            <li key={idx} className="bg-pink-soft/50 p-2 rounded-lg text-sm text-text-subtle flex items-start gap-2">
                                <span className="text-accent mt-0.5">✓</span>
                                {sugg}
                            </li>
                        ))}
                    </div>
                </section>

                {/* 3. Reflection */}
                <section className="bg-white p-5 rounded-2xl shadow-soft border border-pink-border">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-primary mb-3">03 自我观察与提问</h3>
                    <p className="italic text-text-subtle mb-4 text-sm border-l-2 border-pink-border pl-3">
                        {record.reflection.summary}
                    </p>
                    <ul className="space-y-2">
                        {questions.map((q, idx) => (
                            <li key={idx} className="bg-pink-panel p-3 rounded-2xl text-sm text-text-main border border-pink-border">
                                {q}
                            </li>
                        ))}
                    </ul>
                </section>

                {/* 3.5 Micro-Practices (New) */}
                <section className="bg-white p-5 rounded-2xl shadow-soft border border-pink-border">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-primary mb-3">04 今天的小练习</h3>
                    <p className="text-xs text-text-subtle mb-4">
                        这是针对当时状态的小建议：
                    </p>
                    <div className="space-y-3">
                        {practices.map((practice, idx) => (
                            <div key={idx} className="flex items-start gap-3 bg-pink-soft/30 p-3 rounded-2xl border border-pink-border/50">
                                <span className="text-lg">🌱</span>
                                <span className="text-sm text-text-main leading-relaxed">{practice}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 4. Note (Editable) */}
                <section className="bg-white p-5 rounded-2xl shadow-soft border border-pink-border">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-primary mb-3">05 今天写下的一句话</h3>
                    <textarea
                        className="w-full text-sm text-text-main p-3 rounded-2xl border border-pink-border bg-white focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none min-h-[80px]"
                        rows={3}
                        placeholder="例：那天其实挺累的，但我还是好好照顾了自己。"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        onBlur={handleSave}
                    />
                    {saved && (
                        <p className="text-[10px] text-text-subtle text-right mt-2 animate-fade-in">已保存。</p>
                    )}
                </section>



                {/* 5. Actions */}
                <div className="flex flex-col gap-3 pt-4 pb-8">
                    <button
                        onClick={() => setShowShare(true)}
                        className="w-full py-3.5 bg-white text-primary border border-pink-200 rounded-2xl font-bold shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                        <span>生成今日脸卡图片</span>
                    </button>

                    <button
                        onClick={onClose}
                        className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-pink-200 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        <span>返回时间线</span>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Share Modal */}
            {showShare && (
                <ShareModal
                    record={record}
                    onClose={() => setShowShare(false)}
                />
            )}
        </div>
    );
}
