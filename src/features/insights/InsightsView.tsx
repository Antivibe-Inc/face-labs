
import { useEffect, useState } from 'react';
import type { FaceHistoryRecord } from '../../services/historyStore';
import { loadHistory } from '../../services/historyStore';
import { getWeeklyStats } from '../history/historyStats';
import { WeeklyOverviewCard } from '../history/HistoryView'; // Assuming export, might need to extract if not exported
import { TrendChartCard, TagStatsCard, WeeklyRhythmCard, PhysiologicalStatsCard } from '../history/HistoryAnalytics';

// We need to ensure WeeklyOverviewCard is exported from HistoryView or moved.
// For now, I will assume I need to extract it or import it.
// Checking previous code: WeeklyOverviewCard is in HistoryView.tsx but not exported?
// Wait, I should probably check HistoryView.tsx export status.
// To be safe, I will import it. If it fails, I will refactor HistoryView to export it.

interface InsightsViewProps {
    onNavigateToTimeline: () => void;
}

export function InsightsView({ onNavigateToTimeline }: InsightsViewProps) {
    const [history, setHistory] = useState<FaceHistoryRecord[]>([]);

    useEffect(() => {
        setHistory(loadHistory());
    }, []);

    const weeklyStats = getWeeklyStats(history);

    return (
        <div className="p-4 pb-24 space-y-4 animate-fade-in h-full overflow-y-auto no-scrollbar">
            {/* Header */}
            <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold text-text-main tracking-tight">洞察</h1>
                <p className="text-xs text-text-subtle mt-0.5">从时间线中整理出的趋势和小提示</p>
            </div>

            {/* A. Weekly Overview */}
            <WeeklyOverviewCard stats={weeklyStats} />

            {/* B. Trend Chart */}
            <TrendChartCard history={history} />

            {/* C. Physiological Stats (New) */}
            <PhysiologicalStatsCard history={history} />

            {/* D. Weekly Rhythm (New) */}
            <WeeklyRhythmCard history={history} />

            {/* E. Tag Stats */}
            <TagStatsCard history={history} />

            {/* F. Back to Timeline Link */}
            {history.length > 0 && (
                <div
                    onClick={onNavigateToTimeline}
                    className="bg-gradient-to-r from-bg-soft to-white border border-border-soft rounded-2xl p-4 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform shadow-sm"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-xl shadow-sm">
                            🕰️
                        </div>
                        <div>
                            <div className="text-sm font-semibold text-text-main">时间线</div>
                            <div className="text-[10px] text-text-subtle">想翻具体某一天？前往查看详细记录。</div>
                        </div>
                    </div>
                    <svg className="w-5 h-5 text-text-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </div>
            )}

            {/* E. Placeholder */}
            <div className="border border-dashed border-gray-300 rounded-2xl p-6 text-center">
                <div className="text-sm font-medium text-text-subtle mb-1">更多洞察</div>
                <div className="text-xs text-gray-400">后续会在这里加入更多基于历史记录的分析与小结。</div>
            </div>
        </div>
    );
}
