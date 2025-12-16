import { useState, useMemo } from 'react';
import type { FaceAnalysisResult } from '../../types/analysis';
import { pickQuestionsForRecord, pickPracticesForRecord } from '../../services/suggestionService';
import { PracticeCheckbox } from '../../components/ui/PracticeCheckbox';
import { calculateFiveDimensions } from '../history/historyStats';
import { RadarChart5D } from '../history/RadarChart5D';


interface ReportViewProps {
    result: FaceAnalysisResult;
    image: string;
    onRetake: () => void;
    onSaveNote: (note: string) => void;
}

export function ReportView({ result, image, onRetake, onSaveNote }: ReportViewProps) {
    const [note, setNote] = useState('');
    const [expandMetrics, setExpandMetrics] = useState(false);

    // Calculate 5 Dimensions
    const fiveDimensions = useMemo(() => calculateFiveDimensions(result.emotion), [result.emotion]);
    const dateStr = new Date(result.timestamp).toLocaleDateString('zh-CN', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    return (
        <div className="animate-fade-in space-y-6">

            {/* Header Section */}
            {/* Header Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-primary/5 to-purple-50 p-6 rounded-3xl border border-primary/10 shadow-sm">
                <div className="relative z-10 flex items-center gap-5">
                    <div className="relative">
                        <img
                            src={image}
                            alt="Face"
                            className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-md transform -rotate-2"
                        />
                        <div className="absolute -bottom-2 -right-2 bg-white p-1.5 rounded-full shadow-sm text-lg">
                            ✨
                        </div>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-text-main tracking-tight">今日状态报告</h2>
                        <p className="text-sm text-text-subtle font-medium mt-1 uppercase tracking-wide opacity-80">{dateStr}</p>
                    </div>
                </div>
                {/* Decorative blob */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl"></div>
            </div>

            {/* 0. Deep Insight (Hidden per user request) */}
            {/* {result.deep_reasoning && (
                <section className="bg-gradient-to-br from-indigo-50 to-purple-50 p-5 rounded-2xl shadow-soft border border-indigo-100 relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 text-indigo-100 opacity-50 z-0">
                        <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                    </div>

                    <div className="relative z-10">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-3 flex items-center gap-2">
                            <span className="text-lg">🔍</span> AI 深度洞察
                        </h3>
                        <p className="text-sm text-text-main leading-relaxed font-medium">
                            {result.deep_reasoning}
                        </p>
                    </div>
                </section>
            )} */}

            {/* 1. Emotion Snapshot - Hero Card */}
            <section className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/60"></span>
                    <h3 className="text-sm font-bold text-text-subtle tracking-widest">情绪快照</h3>
                </div>

                <div className="relative">
                    <span className="absolute -top-4 -left-2 text-6xl text-primary/10 font-serif">"</span>
                    <p className="text-2xl font-medium text-text-main mb-6 leading-normal font-serif relative z-10 pl-2">
                        {result.emotion.summary}
                    </p>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                    {result.emotion.tags.map(tag => (
                        <span key={tag} className="px-3 py-1 bg-bg-panel text-primary text-xs font-medium rounded-full">
                            #{tag}
                        </span>
                    ))}
                </div>

                <div className="grid grid-cols-3 gap-3 mb-3">
                    <ScoreCard label="精力值" value={result.emotion.energy_level} compact />
                    <ScoreCard label="心情亮度" value={result.emotion.mood_brightness} compact />
                    <ScoreCard label="气色值" value={result.emotion.vitality_score || 0} compact />
                </div>

                <div className="bg-bg-panel p-3 rounded-2xl border border-border-soft">
                    <p className="text-sm text-text-main">
                        <span className="font-semibold text-primary">💡 Suggestion:</span> {result.emotion.today_suggestion}
                    </p>
                </div>
            </section>

            {/* 1.5 Face Wellness 5D - Radar + Interpretation */}
            <section className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col items-center transition-all duration-300">
                <div className="w-full flex items-center gap-2 mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-400"></span>
                    <h3 className="text-sm font-bold text-text-subtle tracking-widest">五维状态分析</h3>
                </div>

                <div className="py-2">
                    <RadarChart5D data={fiveDimensions} size={260} />
                </div>

                {/* Expand Toggle */}
                <button
                    onClick={() => setExpandMetrics(!expandMetrics)}
                    className="flex flex-col items-center gap-1 mt-0 group"
                >
                    <span className="text-xs text-gray-400 group-hover:text-primary transition-colors">
                        {expandMetrics ? "收起详细指标" : "展开 10 项详细指标"}
                    </span>
                    <div className={`w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center transition-all duration-300 group-hover:bg-primary/10 ${expandMetrics ? 'rotate-180' : ''}`}>
                        <svg className="w-4 h-4 text-gray-400 group-hover:text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </button>

                {/* Collapsible Metrics Grid */}
                <div className={`w-full overflow-hidden transition-all duration-500 ease-in-out ${expandMetrics ? 'max-h-[800px] opacity-100 mt-6' : 'max-h-0 opacity-0 mt-0'}`}>
                    <div className="space-y-6 pb-2">

                        {/* 1. Core Vitality */}
                        <div>
                            <h4 className="text-xs font-bold text-orange-400 mb-3 ml-1">核心活力</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <MetricProgressRow icon="⚡️" label="精力" value={result.emotion.energy_level} color="bg-orange-400" />
                                <MetricProgressRow icon="🌟" label="气色" value={result.emotion.vitality_score || 0} color="bg-amber-400" />
                            </div>
                        </div>

                        {/* 2. Physio Balance */}
                        <div>
                            <h4 className="text-xs font-bold text-purple-400 mb-3 ml-1">生理平衡</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <MetricProgressRow icon="🔴" label="压力" value={result.emotion.stress_level || 0} color="bg-red-500" />
                                <MetricProgressRow icon="🟡" label="疲劳" value={result.emotion.fatigue_level || 0} color="bg-yellow-500" />
                                <div className="col-span-1">
                                    <MetricProgressRow icon="🔵" label="困倦" value={result.emotion.sleepiness_level || 0} color="bg-blue-400" />
                                </div>
                            </div>
                        </div>

                        {/* 3. Emotional Valence */}
                        <div>
                            <h4 className="text-xs font-bold text-pink-400 mb-3 ml-1">情绪效价</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <MetricProgressRow icon="☁️" label="心情" value={result.emotion.mood_brightness} color="bg-pink-300" />
                                <MetricProgressRow icon="🌊" label="平静" value={result.emotion.calmness_score || 0} color="bg-sky-400" />
                            </div>
                        </div>

                        {/* 4. Cognitive Readiness */}
                        <div>
                            <h4 className="text-xs font-bold text-cyan-500 mb-3 ml-1">认知就绪</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <MetricProgressRow icon="🧠" label="专注" value={result.emotion.focus_score || 0} color="bg-cyan-400" />
                            </div>
                        </div>

                        {/* 5. Social Radiance */}
                        <div>
                            <h4 className="text-xs font-bold text-amber-500 mb-3 ml-1">社交光彩</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <MetricProgressRow icon="🤝" label="亲和" value={result.emotion.approachability_score || 0} color="bg-yellow-400" />
                                <MetricProgressRow icon="🦁" label="自信" value={result.emotion.confidence_score || 0} color="bg-orange-400" />
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* 2. Skin Diagnosis */}
            <section className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400/60"></span>
                    <h3 className="text-sm font-bold text-text-subtle tracking-widest">皮肤诊断</h3>
                </div>

                <div className="grid grid-cols-1 gap-2">
                    {result.lifestyle.signals.map((signal, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-purple-50/50 border border-purple-100/50 rounded-xl hover:bg-purple-50 transition-colors">
                            <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-purple-100/50 text-purple-500">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <circle cx="12" cy="12" r="2" fill="currentColor"></circle>
                                </svg>
                            </span>
                            <span className="text-sm text-gray-700 font-medium">{signal}</span>
                        </div>
                    ))}
                </div>

                <div className="pt-3 px-1 mt-2">
                    <p className="text-[10px] text-gray-400 italic text-center">
                        {result.lifestyle.disclaimer}
                    </p>
                </div>
            </section>

            {/* 3. Lifestyle Analysis */}
            <section className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400/60"></span>
                    <h3 className="text-sm font-bold text-text-subtle tracking-widest">生活方式探查</h3>
                </div>

                <div className="space-y-4">
                    <div className="space-y-3">
                        {result.lifestyle.suggestions.map((sugg, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-3 bg-green-50/50 border border-green-100/50 rounded-xl hover:bg-green-50 hover:shadow-sm transition-all duration-300">
                                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100/50 text-green-600 flex items-center justify-center border border-green-200/50">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"></path>
                                    </svg>
                                </div>
                                <div className="flex-1 py-1">
                                    <p className="text-sm text-gray-700 leading-relaxed font-medium">
                                        {sugg}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 3. Reflection */}
            <section className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent/60"></span>
                    <h3 className="text-sm font-bold text-text-subtle tracking-widest">自我观察与提问</h3>
                </div>

                <div className="space-y-3">
                    {(result.reflection.questions && result.reflection.questions.length > 0
                        ? result.reflection.questions
                        : pickQuestionsForRecord({ emotion: result.emotion })
                    ).map((q, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-blue-50/50 border border-blue-100/50 rounded-xl hover:bg-blue-50 hover:shadow-sm transition-all duration-300">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100/50 text-blue-600 flex items-center justify-center border border-blue-200/50">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                </svg>
                            </div>
                            <div className="flex-1 py-1">
                                <p className="text-sm text-gray-700 leading-relaxed font-medium">
                                    {q}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Micro-Practices Section (New) */}
            <section className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400/60"></span>
                    <h3 className="text-sm font-bold text-text-subtle tracking-widest">今天的小练习</h3>
                </div>
                <p className="text-xs text-text-subtle mb-4">
                    从下面挑一件最轻松的，如果今天只做到这一件，也已经很不错了。
                </p>
                <div className="space-y-3">
                    {((result.lifestyle.suggested_plans && result.lifestyle.suggested_plans.length > 0)
                        ? result.lifestyle.suggested_plans
                        : (result.lifestyle.suggestions && result.lifestyle.suggestions.length > 0 ? result.lifestyle.suggestions : pickPracticesForRecord({ emotion: result.emotion }))
                    ).map((practice, idx) => (
                        <PracticeCheckbox
                            key={idx}
                            text={practice}
                            onToggle={() => {
                                // Optional: Track usage, but for now local state in component is enough
                            }}
                        />
                    ))}
                </div>
            </section>

            {/* 4. Personal Note */}
            <section className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-300/60"></span>
                    <h3 className="text-sm font-bold text-text-subtle tracking-widest">今天给自己写下的一句话</h3>
                </div>
                <p className="text-xs text-text-subtle mb-3">
                    可以是今天的感受、一个小小的发现，或者想对自己说的话。
                </p>
                <textarea
                    className="w-full text-sm text-text-main p-3 rounded-2xl border border-gray-100 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none focus:bg-white transition-colors"
                    rows={3}
                    placeholder="例：今天其实挺累的，但我还在好好照顾自己。"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    onBlur={() => onSaveNote(note)}
                />
            </section>

            {/* Actions */}
            <div className="pt-4 flex flex-col gap-3">
                <button
                    onClick={onRetake}
                    className="w-full py-4 bg-white text-primary border border-primary rounded-full font-semibold shadow-sm active:scale-95 transition-transform hover:bg-bg-panel"
                >
                    Retake / 试一张新照片
                </button>
            </div>

        </div >
    );
}

function ScoreCard({ label, value, compact = false }: { label: string; value: number; compact?: boolean }) {
    const widthPct = `${value * 10}%`;

    return (
        <div className={`rounded-2xl flex flex-col items-start border border-gray-100/50 hover:bg-white hover:shadow-sm transition-all duration-300 ${compact ? 'p-3 bg-gray-100/70' : 'bg-gray-50 p-4'}`}>
            <span className={`font-bold uppercase tracking-wider text-text-subtle/70 mb-1 ${compact ? 'text-[9px]' : 'text-[10px] mb-2'}`}>{label}</span>
            <div className="flex items-baseline gap-1.5 w-full">
                <span className={`font-bold text-gray-800 leading-none tracking-tight ${compact ? 'text-2xl' : 'text-3xl'}`}>{value}</span>
                <span className="text-[10px] text-text-subtle font-medium">/10</span>
            </div>
            <div className={`w-full bg-gray-200/50 rounded-full overflow-hidden ${compact ? 'h-1 mt-2' : 'h-1.5 mt-3'}`}>
                <div
                    style={{ width: widthPct }}
                    className={`h-full rounded-full shadow-sm transition-all duration-1000 ease-out ${value > 7 ? 'bg-gradient-to-r from-green-400 to-emerald-500' : value > 4 ? 'bg-gradient-to-r from-yellow-400 to-orange-400' : 'bg-gradient-to-r from-gray-400 to-gray-500'}`}
                />
            </div>
        </div>
    );
}

function MetricProgressRow({ icon, label, value, color }: { icon: string, label: string, value: number, color: string }) {
    return (
        <div className="bg-gray-50 rounded-xl p-3 flex flex-col justify-center gap-2 border border-gray-50">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                    <span className="text-sm opacity-80 shadow-sm">{icon}</span>
                    <span className="text-xs font-medium text-gray-600">{label}</span>
                </div>
                <span className="text-sm font-bold text-gray-800 tabular-nums">{value.toFixed(1)}</span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${color}`} style={{ width: `${value * 10}%` }} />
            </div>
        </div>
    );
}
