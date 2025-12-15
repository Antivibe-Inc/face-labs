
import { useState, useMemo } from 'react';
import type { FaceHistoryRecord } from '../../services/historyStore';
import { RadarChart5D } from './RadarChart5D';

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

// --- Trend Chart Card (Interactive) ---

export function TrendChartCard({ history }: AnalyticsProps) {
    const [range, setRange] = useState<7 | 30>(7);
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    const chartData = useMemo(() => {
        const cutoff = getDaysAgo(range);
        const relevant = history.filter(r => new Date(r.date) >= cutoff);
        if (relevant.length === 0) return [];

        // Group by day to handle multiple records per day
        const grouped = new Map<string, { energySum: number, moodSum: number, count: number, date: string }>();

        relevant.forEach(r => {
            const d = new Date(r.date);
            const key = d.toDateString();
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

        return result;
    }, [history, range]);

    // Dimensions
    const height = 180;
    const width = 320;
    const padding = { top: 30, right: 10, bottom: 30, left: 10 };

    // Scales
    const getX = (index: number) => {
        if (chartData.length <= 1) return width / 2;
        const availableWidth = width - padding.left - padding.right;
        return padding.left + (index / (chartData.length - 1)) * availableWidth;
    };

    const getY = (value: number) => {
        const availableHeight = height - padding.top - padding.bottom;
        return height - padding.bottom - (value / 10) * availableHeight;
    };

    // Smooth Curve Generator (Catmull-Rom Spline implementation)
    const getPoint = (i: number, key: 'energy' | 'mood') => ({ x: getX(i), y: getY(chartData[i][key]) });

    const generatePath = (key: 'energy' | 'mood') => {
        if (chartData.length === 0) return '';
        if (chartData.length === 1) return `M ${getX(0) - 5} ${getY(chartData[0][key])} L ${getX(0) + 5} ${getY(chartData[0][key])}`;

        const points = chartData.map((_, i) => getPoint(i, key));

        let d = `M ${points[0].x},${points[0].y}`;

        for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[Math.max(i - 1, 0)];
            const p1 = points[i];
            const p2 = points[i + 1];
            const p3 = points[Math.min(i + 2, points.length - 1)];

            const cp1x = p1.x + (p2.x - p0.x) / 6;
            const cp1y = p1.y + (p2.y - p0.y) / 6;
            const cp2x = p2.x - (p3.x - p1.x) / 6;
            const cp2y = p2.y - (p3.y - p1.y) / 6;

            d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
        }
        return d;
    };

    const generateFill = (key: 'energy' | 'mood') => {
        const path = generatePath(key);
        return `${path} L ${getX(chartData.length - 1)},${height - padding.bottom} L ${getX(0)},${height - padding.bottom} Z`;
    };

    if (chartData.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-border-soft shadow-sm p-4 mb-4 flex flex-col items-center justify-center min-h-[200px]">
                <div className="text-sm font-semibold text-text-main mb-1">精力与心情趋势</div>
                <div className="flex bg-gray-100 rounded-lg p-0.5 mb-6">
                    <button onClick={() => setRange(7)} className={`px-3 py-1 text-xs rounded-md transition-colors ${range === 7 ? 'bg-white shadow-sm text-primary font-medium' : 'text-text-subtle'}`}>最近 7 天</button>
                    <button onClick={() => setRange(30)} className={`px-3 py-1 text-xs rounded-md transition-colors ${range === 30 ? 'bg-white shadow-sm text-primary font-medium' : 'text-text-subtle'}`}>最近 30 天</button>
                </div>
                <p className="text-xs text-text-subtle">最近没有足够的记录来展示趋势。</p>
            </div>
        );
    }

    const energyPath = generatePath('energy');
    const moodPath = generatePath('mood');
    const energyFill = generateFill('energy');
    const moodFill = generateFill('mood');

    // Interaction Handlers
    const handleTouchMove = (e: React.MouseEvent | React.TouchEvent) => {
        const svgRect = e.currentTarget.getBoundingClientRect();
        let clientX;
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
        } else {
            clientX = (e as React.MouseEvent).clientX;
        }

        const relativeX = clientX - svgRect.left;
        const availableWidth = width - padding.left - padding.right;
        const rawIndex = ((relativeX - padding.left) / availableWidth) * (chartData.length - 1);
        const index = Math.max(0, Math.min(Math.round(rawIndex), chartData.length - 1));

        setActiveIndex(index);
    };

    const handleLeave = () => setActiveIndex(null);

    return (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 mb-4">
            <div className="flex items-center justify-between mb-2">
                <div className="font-semibold text-text-main text-sm">精力与心情</div>
                <div className="flex bg-gray-100 rounded-lg p-0.5">
                    <button onClick={() => setRange(7)} className={`px-3 py-1 text-xs rounded-md transition-colors ${range === 7 ? 'bg-white shadow-sm text-primary font-medium' : 'text-text-subtle'}`}>7天</button>
                    <button onClick={() => setRange(30)} className={`px-3 py-1 text-xs rounded-md transition-colors ${range === 30 ? 'bg-white shadow-sm text-primary font-medium' : 'text-text-subtle'}`}>30天</button>
                </div>
            </div>

            {/* Dynamic Status Text */}
            <div className="h-6 mb-2 flex items-center">
                {activeIndex !== null ? (
                    <div className="text-xs flex gap-4 animate-in fade-in transition-all">
                        <span className="font-medium text-gray-700">{formatDateLabel(chartData[activeIndex].date)}</span>
                        <span className="text-primary font-medium">精力: {chartData[activeIndex].energy.toFixed(1)}</span>
                        <span className="text-blue-500 font-medium">心情: {chartData[activeIndex].mood.toFixed(1)}</span>
                    </div>
                ) : (
                    <p className="text-[10px] text-text-subtle">点击或滑动图表查看详情</p>
                )}
            </div>

            {/* Chart */}
            <div
                className="relative w-full aspect-[1.8/1] select-none touch-none"
                onMouseMove={handleTouchMove}
                onTouchMove={handleTouchMove}
                onMouseLeave={handleLeave}
                onTouchEnd={handleLeave}
            >
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                    <defs>
                        <linearGradient id="gradEnergy" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#F973B7" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#F973B7" stopOpacity="0" />
                        </linearGradient>
                        <linearGradient id="gradMood" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#60A5FA" stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {/* Grid lines */}
                    {[0, 5, 10].map(val => (
                        <line key={val} x1={padding.left} y1={getY(val)} x2={width - padding.right} y2={getY(val)}
                            stroke="#f0f0f0" strokeWidth="1" strokeDasharray="4 4" />
                    ))}

                    {/* Areas */}
                    <path d={energyFill} fill="url(#gradEnergy)" className="transition-all duration-300" />
                    <path d={moodFill} fill="url(#gradMood)" className="transition-all duration-300" />

                    {/* Lines */}
                    <path d={energyPath} fill="none" stroke="#F973B7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-sm transition-all duration-300" />
                    <path d={moodPath} fill="none" stroke="#60A5FA" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" className="drop-shadow-sm transition-all duration-300" />

                    {/* Active Cursor */}
                    {activeIndex !== null && (
                        <g>
                            <line
                                x1={getX(activeIndex)} y1={padding.top}
                                x2={getX(activeIndex)} y2={height - padding.bottom}
                                stroke="#ccc" strokeWidth="1" strokeDasharray="2 2"
                            />
                            {/* Dots for current selection */}
                            <circle cx={getX(activeIndex)} cy={getY(chartData[activeIndex].energy)} r="4" fill="#F973B7" stroke="white" strokeWidth="2" />
                            <circle cx={getX(activeIndex)} cy={getY(chartData[activeIndex].mood)} r="4" fill="#60A5FA" stroke="white" strokeWidth="2" />
                        </g>
                    )}
                </svg>
            </div>

            {/* Axis Labels */}
            <div className="flex justify-between px-2 text-[10px] text-text-subtle/60 mt-[-10px] pointer-events-none">
                <span>{formatDateLabel(chartData[0].date)}</span>
                {chartData.length > 1 && <span>{formatDateLabel(chartData[chartData.length - 1].date)}</span>}
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
            .slice(0, 5) // Show top 5
            .map(([tag, count]) => ({
                tag,
                count,
                percentage: Math.round((count / totalTags) * 100)
            }));

        return { sortedTags, totalRecords: relevant.length };
    }, [history]);

    if (!stats) {
        return (
            <div className="bg-white rounded-2xl border border-border-soft shadow-sm p-4 mb-4 text-center py-6">
                <div className="w-10 h-10 bg-bg-soft rounded-full flex items-center justify-center mx-auto mb-2 text-xl">🌱</div>
                <div className="text-xs text-text-subtle">最近还没有足够的记录，先多和自己的脸见几次面吧。</div>
            </div>
        );
    }

    const { sortedTags } = stats;

    return (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 mb-4">
            <h3 className="text-sm font-semibold text-text-main mb-4">情绪关键词排行</h3>

            <div className="space-y-4 mb-6">
                {sortedTags.map(({ tag, count, percentage }, index) => (
                    <div key={tag} className="group">
                        <div className="flex justify-between items-center text-xs mb-1.5">
                            <div className="flex items-center gap-2">
                                <span className={`flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>
                                    {index + 1}
                                </span>
                                <span className="font-medium text-text-main">#{tag}</span>
                            </div>
                            <span className="text-text-subtle font-mono opacity-70">{count}次 ({percentage}%)</span>
                        </div>
                        <div className="w-full h-2 bg-gray-50 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-1000 ease-out ${index === 0 ? 'bg-primary' :
                                    index === 1 ? 'bg-primary/70' :
                                        index === 2 ? 'bg-primary/40' : 'bg-gray-200'
                                    }`}
                                style={{ width: `${percentage}%`, transform: 'translateX(-100%)', animation: 'slideIn 1s forwards' }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            <style>{`
                @keyframes slideIn {
                    to { transform: translateX(0); }
                }
            `}</style>

            <div className="bg-bg-panel/50 rounded-xl p-3 text-xs text-text-subtle leading-relaxed flex items-start gap-2 border border-border-soft/30">
                <span className="text-lg leading-none mt-0.5 opacity-80">💡</span>
                {sortedTags.length > 0 && (
                    <span>
                        你最近最主要的状态是“{sortedTags[0].tag}”，占了 {sortedTags[0].percentage}% 的比重。
                        {sortedTags.length > 1 && `其次是“${sortedTags[1].tag}”。`}
                    </span>
                )}
            </div>
        </div>
    );
}

// --- Physiological Stats Card ---

export function PhysiologicalStatsCard({ history }: AnalyticsProps) {
    const stats = useMemo(() => {
        const cutoff = getDaysAgo(14); // 2 weeks trend
        const relevant = history.filter(r => new Date(r.date) >= cutoff).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // If no data at all in range
        if (relevant.length === 0) return null;

        return relevant.map(r => ({
            date: new Date(r.date).getDate() + '日',
            stress: r.emotion.stress_level || 0,
            fatigue: r.emotion.fatigue_level || 0,
            sleepiness: r.emotion.sleepiness_level || 0
        }));
    }, [history]);

    // SHOW CARD EVEN IF LOW DATA (Empty State)
    if (!stats || stats.length === 0) {
        return (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 mb-4 opacity-60">
                <div className="flex items-center gap-2 mb-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                    <h3 className="text-sm font-semibold text-text-main">生理负荷深潜</h3>
                    <span className="text-[10px] text-white bg-red-400 px-1.5 py-0.5 rounded ml-auto">AI 实验性指标</span>
                </div>
                <div className="text-center py-6 text-xs text-text-subtle">
                    数据不足，无法分析。<br />请多记录几次，AI 将开始追踪你的压力与疲劳趋势。
                </div>
            </div>
        )
    }

    // Simple Sparkline Logic
    const width = 100;
    const height = 40;
    const maxVal = 10;

    const makePoints = (key: 'stress' | 'fatigue' | 'sleepiness') => {
        if (stats.length < 2) return `0,${height} 100,${height}`; // Flat line fallback

        return stats.map((d, i) => {
            const x = (i / (stats.length - 1)) * width;

            // TS issue: d[key] key access.
            // Let's fix typings or simple property access
            // d has stress, fatigue, sleepiness.
            const val = d[key as 'stress' | 'fatigue' | 'sleepiness'];
            const yPos = height - (val / maxVal) * height;
            return `${x},${yPos}`;
        }).join(' ');
    };

    // Calculate Averages
    const avgStress = stats.reduce((acc, c) => acc + c.stress, 0) / stats.length;
    const avgFatigue = stats.reduce((acc, c) => acc + c.fatigue, 0) / stats.length;

    let insight = "各项指标比较平稳。";
    if (avgStress > 6) insight = "近期压力值普遍偏高，注意释放。";
    if (avgFatigue > 7) insight = "身体疲劳积累较多，请强制自己休息。";
    if (avgStress < 4 && avgFatigue < 4) insight = "身心处于比较放松的恢复期。";

    // Handle single record case for insight
    if (stats.length === 1) insight = "这是你的第一个生理数据点，继续保持记录以查看趋势。";

    const last = stats[stats.length - 1];

    return (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 mb-4">
            <div className="flex items-center gap-2 mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                <h3 className="text-sm font-semibold text-text-main">生理负荷</h3>
                <span className="text-[10px] text-white bg-red-400 px-1.5 py-0.5 rounded ml-auto">AI 实验性指标</span>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
                <MetricSpark label="压力值" color="#F87171" points={makePoints('stress')} value={last.stress} />
                <MetricSpark label="疲劳度" color="#FBBF24" points={makePoints('fatigue')} value={last.fatigue} />
                <MetricSpark label="困倦感" color="#60A5FA" points={makePoints('sleepiness')} value={last.sleepiness} />
            </div>

            <div className="bg-red-50 rounded-xl p-3 text-xs text-red-700/80 leading-relaxed flex items-start gap-2">
                <span className="text-lg leading-none mt-0.5">🩺</span>
                {insight}
            </div>
        </div>
    );
}

function MetricSpark({ label, color, points, value }: { label: string, color: string, points: string, value: number }) {
    return (
        <div className="bg-gray-50 rounded-xl p-3 flex flex-col justify-between h-24 relative overflow-hidden group">
            <div className="z-10">
                <div className="text-[10px] text-text-subtle mb-0.5">{label}</div>
                <div className="text-xl font-bold text-text-main">{value.toFixed(1)}</div>
            </div>

            <svg viewBox="0 0 100 40" className="absolute bottom-0 left-0 right-0 w-full h-12 opacity-50 group-hover:opacity-80 transition-opacity" preserveAspectRatio="none">
                <polyline
                    points={points}
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    vectorEffect="non-scaling-stroke"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <polygon
                    points={`${points} 100,40 0,40`}
                    fill={color}
                    opacity="0.2"
                />
            </svg>
        </div>
    );
}

// --- Weekly Rhythm Card ---

export function WeeklyRhythmCard({ history }: AnalyticsProps) {
    const [viewMode, setViewMode] = useState<'emotion' | 'physio'>('emotion');

    const stats = useMemo(() => {
        // We want aggregate stats for Sunday(0) to Saturday(6)
        // over the last 90 days (to get a good sample size for "rhythm")
        const cutoff = getDaysAgo(90);
        const relevant = history.filter(r => new Date(r.date) >= cutoff);

        if (relevant.length < 3) return null;

        const dayStats = Array(7).fill(null).map(() => ({
            energy: 0, mood: 0,
            stress: 0, fatigue: 0, sleepiness: 0,
            count: 0
        }));

        relevant.forEach(r => {
            const d = new Date(r.date);
            const dayIdx = d.getDay(); // 0 = Sun
            dayStats[dayIdx].energy += r.emotion.energy_level;
            dayStats[dayIdx].mood += r.emotion.mood_brightness;
            dayStats[dayIdx].stress += (r.emotion.stress_level || 0);
            dayStats[dayIdx].fatigue += (r.emotion.fatigue_level || 0);
            dayStats[dayIdx].sleepiness += (r.emotion.sleepiness_level || 0);
            dayStats[dayIdx].count += 1;
        });

        const labels = ['日', '一', '二', '三', '四', '五', '六'];

        // Find today to highlight
        const todayIdx = new Date().getDay();

        const data = dayStats.map((stat, i) => {
            if (stat.count === 0) return { label: labels[i], energy: 0, mood: 0, stress: 0, fatigue: 0, sleepiness: 0, count: 0, isToday: i === todayIdx };
            return {
                label: labels[i],
                energy: stat.energy / stat.count,
                mood: stat.mood / stat.count,
                stress: stat.stress / stat.count,
                fatigue: stat.fatigue / stat.count,
                sleepiness: stat.sleepiness / stat.count,
                count: stat.count,
                isToday: i === todayIdx
            };
        });

        return { data, totalRecords: relevant.length };
    }, [history]);

    if (!stats) return null;

    const { data } = stats;

    // Find peak day (highest energy or lowest stress depending on mode?)
    // For simplicity, keep it about "Best State" (Energy) for now, or maybe "Highest Stress" for physio?
    // Let's stick to Energy for the highlight to be positive.
    // const validDays = data.filter(d => d.count > 0);
    // const peakDay = validDays.length > 0 ? validDays.sort((a, b) => b.energy - a.energy)[0] : null;

    return (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 mb-4">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-semibold text-text-main">周律动</h3>

                <div className="flex bg-gray-100 p-0.5 rounded-lg">
                    <button
                        onClick={() => setViewMode('emotion')}
                        className={`px-3 py-1 text-[10px] font-medium rounded-md transition-all ${viewMode === 'emotion' ? 'bg-white shadow-sm text-primary' : 'text-text-subtle'}`}
                    >
                        情绪
                    </button>
                    <button
                        onClick={() => setViewMode('physio')}
                        className={`px-3 py-1 text-[10px] font-medium rounded-md transition-all ${viewMode === 'physio' ? 'bg-white shadow-sm text-rose-500' : 'text-text-subtle'}`}
                    >
                        身体
                    </button>
                </div>
            </div>

            <div className="flex justify-between items-end h-[120px] mb-2 px-1">
                {data.map((d, i) => (
                    <div key={i} className="flex flex-col items-center gap-2 group relative w-full">
                        {/* Bars Container */}
                        <div className="relative w-full max-w-[24px] h-[100px] flex items-end justify-center">

                            {viewMode === 'emotion' ? (
                                // Emotion Mode: Side-by-Side (Consistent with Physio)
                                <div className="flex gap-[1px] h-full items-end justify-center w-full px-1">
                                    {d.count > 0 && (
                                        <>
                                            {/* Energy */}
                                            <div className="w-1.5 h-full bg-pink-100 rounded-sm relative group/bar">
                                                <div
                                                    style={{ height: `${d.energy * 10}%` }}
                                                    className={`absolute bottom-0 w-full rounded-sm transition-all duration-1000 ${d.isToday ? 'bg-primary' : 'bg-primary/80'}`}
                                                />
                                            </div>
                                            {/* Mood */}
                                            <div className="w-1.5 h-full bg-blue-100 rounded-sm relative group/bar">
                                                <div
                                                    style={{ height: `${d.mood * 10}%` }}
                                                    className="absolute bottom-0 w-full bg-blue-400/80 rounded-sm transition-all duration-1000"
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                            ) : (
                                // Physio Mode: 3 Thin Bars
                                <div className="flex gap-[1px] h-full items-end justify-center w-full px-1">
                                    {d.count > 0 && (
                                        <>
                                            {/* Stress */}
                                            <div className="w-1.5 h-full bg-rose-200 rounded-sm relative group/bar">
                                                <div style={{ height: `${d.stress * 10}%` }} className="absolute bottom-0 w-full bg-rose-400 rounded-sm transition-all duration-1000"></div>
                                            </div>
                                            {/* Fatigue */}
                                            <div className="w-1.5 h-full bg-amber-100 rounded-sm relative group/bar">
                                                <div style={{ height: `${d.fatigue * 10}%` }} className="absolute bottom-0 w-full bg-amber-400 rounded-sm transition-all duration-1000"></div>
                                            </div>
                                            {/* Sleepiness */}
                                            <div className="w-1.5 h-full bg-blue-100 rounded-sm relative group/bar">
                                                <div style={{ height: `${d.sleepiness * 10}%` }} className="absolute bottom-0 w-full bg-blue-400 rounded-sm transition-all duration-1000"></div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Label */}
                        <span className={`text-[10px] font-medium ${d.isToday ? 'text-primary' : 'text-text-subtle'}`}>
                            {d.label}
                        </span>

                        {/* Hover Tooltip */}
                        {d.count > 0 && (
                            <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-black/90 text-white text-[10px] px-2 py-1.5 rounded-lg whitespace-nowrap z-20 shadow-xl flex flex-col gap-0.5">
                                {viewMode === 'emotion' ? (
                                    <>
                                        <div className="text-pink-300">✨ 精力: <span className="font-bold text-white">{d.energy.toFixed(1)}</span></div>
                                        <div className="text-blue-300">☁️ 心情: <span className="font-bold text-white">{d.mood.toFixed(1)}</span></div>
                                    </>
                                ) : (
                                    <>
                                        <div className="text-rose-300">🔴 压力: <span className="font-bold text-white">{d.stress.toFixed(1)}</span></div>
                                        <div className="text-amber-300">🟡 疲劳: <span className="font-bold text-white">{d.fatigue.toFixed(1)}</span></div>
                                        <div className="text-blue-300">🔵 困倦: <span className="font-bold text-white">{d.sleepiness.toFixed(1)}</span></div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="flex items-center justify-center gap-4 mt-2">
                {viewMode === 'emotion' ? (
                    <div className="flex gap-4">
                        <div className="flex items-center gap-1.5 text-xs text-text-subtle/80 font-medium tracking-wide"><span className="w-2 h-2 rounded-full bg-primary"></span>精力</div>
                        <div className="flex items-center gap-1.5 text-xs text-text-subtle/80 font-medium tracking-wide"><span className="w-2 h-2 rounded-full bg-blue-400"></span>心情亮度</div>
                    </div>
                ) : (
                    <div className="flex gap-4">
                        <div className="flex items-center gap-1.5 text-xs text-text-subtle/80 font-medium tracking-wide"><span className="w-2 h-2 rounded-full bg-rose-400"></span>压力</div>
                        <div className="flex items-center gap-1.5 text-xs text-text-subtle/80 font-medium tracking-wide"><span className="w-2 h-2 rounded-full bg-amber-400"></span>疲劳</div>
                        <div className="flex items-center gap-1.5 text-xs text-text-subtle/80 font-medium tracking-wide"><span className="w-2 h-2 rounded-full bg-blue-400"></span>困倦</div>
                    </div>
                )}
            </div>
        </div>
    );
}

// --- Face Wellness 5D Card ---

export function FaceWellnessCard({ history }: AnalyticsProps) {
    const stats = useMemo(() => {
        const cutoff = getDaysAgo(30);
        const relevant = history.filter(r => new Date(r.date) >= cutoff);

        if (relevant.length === 0) return null;

        // Calculate Aggregates for 5 Wellness Dimensions using system definition
        const sum = relevant.reduce((acc, r) => {
            // 1. Core Vitality (Energy + Vitality)
            const energy = r.emotion.energy_level || 0;
            const vitality = r.emotion.vitality_score || 0;
            const dimVitality = (energy + vitality) / 2;

            // 2. Physio Balance (10 - Avg(Stress, Fatigue, Sleepiness)) -> High is Good
            const stress = r.emotion.stress_level || 0;
            const fatigue = r.emotion.fatigue_level || 0;
            const sleepiness = r.emotion.sleepiness_level || 0;
            // Handle missing physio data gracefully if 0 (though 0 is a valid score, usually it means missing in old data)
            // But here we treat 0 as 0 load (perfect state). That's acceptable.
            const avgLoad = (stress + fatigue + sleepiness) / 3;
            const dimPhysio = Math.max(0, 10 - avgLoad);

            // 3. Emotional Valence (Mood + Calmness)
            const mood = r.emotion.mood_brightness || 0;
            const calmness = r.emotion.calmness_score || 0;
            const dimEmotion = (mood + calmness) / 2;

            // 4. Cognitive Readiness (Focus)
            const dimCognitive = r.emotion.focus_score || 0;

            // 5. Social Radiance (Approachability + Confidence)
            const approachability = r.emotion.approachability_score || 0;
            const confidence = r.emotion.confidence_score || 0;
            const dimSocial = (approachability + confidence) / 2;

            return {
                vitality: acc.vitality + dimVitality,
                physio: acc.physio + dimPhysio,
                emotion: acc.emotion + dimEmotion,
                cognitive: acc.cognitive + dimCognitive,
                social: acc.social + dimSocial,
            };
        }, { vitality: 0, physio: 0, emotion: 0, cognitive: 0, social: 0 });

        const count = relevant.length;

        return {
            vitality: sum.vitality / count,
            physio: sum.physio / count,
            emotion: sum.emotion / count,
            cognitive: sum.cognitive / count,
            social: sum.social / count,
        };
    }, [history]);

    // Use dummy data if no history
    const chartData = stats || { vitality: 5, physio: 5, emotion: 5, cognitive: 5, social: 5 };

    return (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 mb-4 flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-400"></span>
                    <h3 className="text-sm font-semibold text-text-main">五维面部状态 (Face Wellness)</h3>
                </div>
                {!stats && <span className="text-[10px] text-text-subtle bg-gray-100 px-2 py-1 rounded-full">暂无足够数据 (显示示例)</span>}
            </div>

            <div className="py-4">
                <RadarChart5D data={chartData} size={240} />
            </div>

            <div className="text-xs text-text-subtle text-center max-w-[90%] leading-relaxed space-y-2 mt-2">
                <p>
                    {stats
                        ? "五维模型通过整合 10 项细分指标，全面扫描您的状态。"
                        : "开始记录每日面部状态，点亮 Core Vitality 等五大核心维度。"}
                </p>
                {stats && (
                    <div className="flex flex-wrap justify-center gap-2 text-[10px] text-gray-400">
                        <span>⚡️核心活力</span>
                        <span>🧠认知就绪</span>
                        <span>☀️社交光彩</span>
                        <span>☁️情绪效价</span>
                        <span>⚖️生理平衡</span>
                    </div>
                )}
            </div>
        </div>
    );
}
