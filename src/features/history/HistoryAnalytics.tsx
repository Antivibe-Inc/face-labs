
import { useState, useMemo } from 'react';
import type { FaceHistoryRecord } from '../../services/historyStore';

interface AnalyticsProps {
    history: FaceHistoryRecord[];
}

// --- Helper Functions ---

function getDaysAgo(days: number): Date {
    const d = new Date();
    d.setDate(d.getDate() - days);
    d.setHours(0, 0, 0, 0);
    return d;
}

function formatDateLabel(dateStr: string): string {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()}`;
}

// --- Trend Chart Card ---

export function TrendChartCard({ history }: AnalyticsProps) {
    const [range, setRange] = useState<7 | 30>(7);

    const chartData = useMemo(() => {
        const cutoff = getDaysAgo(range);
        const relevant = history.filter(r => new Date(r.date) >= cutoff);

        // Group by day to handle multiple records per day
        const grouped = new Map<string, { energySum: number, moodSum: number, count: number, date: string }>();

        relevant.forEach(r => {
            const d = new Date(r.date);
            const key = d.toDateString(); // "Wed Dec 10 2025"
            if (!grouped.has(key)) {
                grouped.set(key, { energySum: 0, moodSum: 0, count: 0, date: r.date });
            }
            const entry = grouped.get(key)!;
            entry.energySum += r.emotion.energy_level;
            entry.moodSum += r.emotion.mood_brightness;
            entry.count += 1;
        });

        // Convert to array and sort by date
        const result = Array.from(grouped.values()).map(g => ({
            date: g.date,
            energy: g.energySum / g.count,
            mood: g.moodSum / g.count
        })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Fill in missing dates? (Optional, but better for line chart continuum)
        // For simplicity in V1, we'll just plot available points. If gaps are large, line will just connect them.

        return result;
    }, [history, range]);

    // SVG Layout
    const height = 160;
    const width = 300; // viewbox width
    const padding = { top: 20, right: 10, bottom: 20, left: 10 };

    // Map function
    const getX = (index: number) => {
        if (chartData.length <= 1) return width / 2;
        const availableWidth = width - padding.left - padding.right;
        return padding.left + (index / (chartData.length - 1)) * availableWidth;
    };

    const getY = (value: number) => {
        const availableHeight = height - padding.top - padding.bottom;
        // value 0-10. 10 is at top (padding.top), 0 is at bottom (height - padding.bottom)
        return height - padding.bottom - (value / 10) * availableHeight;
    };

    // Generate Paths
    const makePath = (key: 'energy' | 'mood') => {
        if (chartData.length === 0) return '';
        if (chartData.length === 1) {
            // Draw a dot or short line? Return circle coord handled elsewhere or just short line
            const x = getX(0);
            const y = getY(chartData[0][key]);
            return `M ${x - 2} ${y} L ${x + 2} ${y}`;
        }

        return chartData.map((d, i) =>
            `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d[key])}`
        ).join(' ');
    };

    const energyPath = makePath('energy');
    const moodPath = makePath('mood');

    if (chartData.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-pink-border shadow-sm p-4 mb-4 flex flex-col items-center justify-center min-h-[200px]">
                <div className="text-sm font-semibold text-text-main mb-1">精力与心情趋势</div>
                <div className="flex bg-gray-100 rounded-lg p-0.5 mb-6">
                    <button onClick={() => setRange(7)} className={`px-3 py-1 text-xs rounded-md transition-colors ${range === 7 ? 'bg-white shadow-sm text-primary font-medium' : 'text-text-subtle'}`}>最近 7 天</button>
                    <button onClick={() => setRange(30)} className={`px-3 py-1 text-xs rounded-md transition-colors ${range === 30 ? 'bg-white shadow-sm text-primary font-medium' : 'text-text-subtle'}`}>最近 30 天</button>
                </div>
                <p className="text-xs text-text-subtle">最近没有足够的记录来展示趋势。</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-pink-border shadow-sm p-4 mb-4">
            <div className="flex items-center justify-between mb-4">
                <div className="font-semibold text-text-main text-sm">精力与心情趋势</div>
                <div className="flex bg-gray-100 rounded-lg p-0.5">
                    <button
                        onClick={() => setRange(7)}
                        className={`px-3 py-1 text-xs rounded-md transition-colors ${range === 7 ? 'bg-white shadow-sm text-primary font-medium' : 'text-text-subtle'}`}
                    >
                        最近 7 天
                    </button>
                    <button
                        onClick={() => setRange(30)}
                        className={`px-3 py-1 text-xs rounded-md transition-colors ${range === 30 ? 'bg-white shadow-sm text-primary font-medium' : 'text-text-subtle'}`}
                    >
                        最近 30 天
                    </button>
                </div>
            </div>

            {/* Chart */}
            <div className="relative w-full aspect-[2/1] bg-gradient-to-b from-white to-pink-soft/20 rounded-xl mb-3">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                    {/* Grid lines (0, 5, 10) */}
                    {[0, 5, 10].map(val => (
                        <line
                            key={val}
                            x1={padding.left}
                            y1={getY(val)}
                            x2={width - padding.right}
                            y2={getY(val)}
                            stroke="#f5d0e6"
                            strokeWidth="1"
                            strokeDasharray="4 4"
                            opacity="0.5"
                        />
                    ))}

                    {/* Paths */}
                    <path d={energyPath} fill="none" stroke="#F973B7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d={moodPath} fill="none" stroke="#60A5FA" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />

                    {/* Dots */}
                    {chartData.map((d, i) => (
                        <g key={i}>
                            <circle cx={getX(i)} cy={getY(d.energy)} r="3" fill="#F973B7" stroke="white" strokeWidth="1.5" />
                            <circle cx={getX(i)} cy={getY(d.mood)} r="3" fill="#60A5FA" stroke="white" strokeWidth="1.5" />
                        </g>
                    ))}
                </svg>

                {/* Labels */}
                <div className="flex justify-between px-2 text-[10px] text-text-subtle mt-1">
                    <span>{formatDateLabel(chartData[0].date)}</span>
                    {chartData.length > 1 && <span>{formatDateLabel(chartData[chartData.length - 1].date)}</span>}
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-2">
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary"></div>
                    <span className="text-xs text-text-subtle">精力值</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-400 opacity-70"></div>
                    <span className="text-xs text-text-subtle">心情亮度</span>
                </div>
            </div>
        </div>
    );
}

// --- Tag Stats Card ---

export function TagStatsCard({ history }: AnalyticsProps) {
    const stats = useMemo(() => {
        const cutoff = getDaysAgo(30);
        const relevant = history.filter(r => new Date(r.date) >= cutoff);

        if (relevant.length === 0) return null;

        const tagCounts: Record<string, number> = {};
        let totalTags = 0;

        relevant.forEach(r => {
            r.emotion.tags.forEach(t => {
                tagCounts[t] = (tagCounts[t] || 0) + 1;
                totalTags++;
            });
        });

        const sortedTags = Object.entries(tagCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([tag, count]) => ({
                tag,
                count,
                percentage: Math.round((count / totalTags) * 100)
            }));

        return { sortedTags, totalRecords: relevant.length };
    }, [history]);

    if (!stats) {
        return (
            <div className="bg-white rounded-2xl border border-pink-border shadow-sm p-4 mb-4 text-center py-6">
                <div className="w-10 h-10 bg-pink-soft rounded-full flex items-center justify-center mx-auto mb-2 text-xl">🌱</div>
                <div className="text-xs text-text-subtle">最近还没有足够的记录，先多和自己的脸见几次面吧。</div>
            </div>
        );
    }

    const { sortedTags } = stats;

    // Generate AI-ish summary
    let summaryText = "最近你的情绪比较丰富多样。";
    if (sortedTags.length > 0) {
        const top = sortedTags[0];
        if (['平静', '开心', '兴奋', '期待'].includes(top.tag)) {
            summaryText = `这段时间，你最常给自己的标签是“${top.tag}”，状态看起来不错。`;
        } else if (['疲惫', '累', '紧绷', '焦虑'].includes(top.tag)) {
            summaryText = `最近“${top.tag}”类型的标签出现得比较多，可以稍微留意一下自己的节奏。`;
        } else {
            summaryText = `这段时间，“${top.tag}”是你最常出现的关键词。`;
        }
    }

    return (
        <div className="bg-white rounded-2xl border border-pink-border shadow-sm p-4 mb-4">
            <h3 className="text-sm font-semibold text-text-main mb-1">最近常见的情绪标签</h3>
            <p className="text-[10px] text-text-subtle mb-4">统计范围：最近 30 天的记录</p>

            <div className="flex flex-wrap gap-2 mb-4">
                {sortedTags.map(({ tag, count, percentage }) => (
                    <div key={tag} className="flex items-center gap-2 bg-pink-soft/50 px-3 py-1.5 rounded-full border border-pink-border/50">
                        <span className="text-sm font-medium text-text-main">#{tag}</span>
                        <span className="text-[10px] text-text-subtle opacity-80">{count}次 ({percentage}%)</span>
                    </div>
                ))}
            </div>

            <div className="bg-gray-50 rounded-xl p-3 text-xs text-text-subtle leading-relaxed flex items-start gap-2">
                <span className="text-lg leading-none mt-0.5">💬</span>
                {summaryText}
            </div>
        </div>
    );
}
