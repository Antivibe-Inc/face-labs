import { useState } from 'react';
import type { FaceAnalysisResult } from '../../types/analysis';
import { pickQuestionsForRecord, pickPracticesForRecord } from '../../services/suggestionService';
import { PracticeCheckbox } from '../../components/ui/PracticeCheckbox';


interface ReportViewProps {
    result: FaceAnalysisResult;
    image: string;
    onRetake: () => void;
    onSaveNote: (note: string) => void;
}

export function ReportView({ result, image, onRetake, onSaveNote }: ReportViewProps) {
    const [note, setNote] = useState('');

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

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <ScoreCard label="精力值" value={result.emotion.energy_level} />
                    <ScoreCard label="心情亮度" value={result.emotion.mood_brightness} />
                </div>

                <div className="bg-bg-panel p-3 rounded-2xl border border-border-soft">
                    <p className="text-sm text-text-main">
                        <span className="font-semibold text-primary">💡 Suggestion:</span> {result.emotion.today_suggestion}
                    </p>
                </div>
            </section>

            {/* 2. Skin & Lifestyle Hints */}
            <section className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400/60"></span>
                    <h3 className="text-sm font-bold text-text-subtle tracking-widest">皮肤与生活方式提示</h3>
                </div>

                <div className="space-y-4">
                    <div>
                        <h4 className="text-sm font-semibold text-text-main mb-2">可见的生活方式线索</h4>
                        <ul className="space-y-1">
                            {result.lifestyle.signals.map((signal, idx) => (
                                <li key={idx} className="text-sm text-text-subtle flex items-start gap-2">
                                    <span className="text-accent mt-1">•</span>
                                    {signal}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold text-text-main mb-2">今天可以温柔地对自己做这些小事：</h4>
                        <ul className="space-y-1">
                            {result.lifestyle.suggestions.map((sugg, idx) => (
                                <li key={idx} className="text-sm text-text-subtle flex items-start gap-2">
                                    <span className="text-accent mt-1">✓</span>
                                    {sugg}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="pt-2 border-t border-border-soft/50">
                        <p className="text-[10px] text-text-subtle italic opacity-70">
                            {result.lifestyle.disclaimer}
                        </p>
                    </div>
                </div>
            </section>

            {/* 3. Reflection */}
            <section className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent/60"></span>
                    <h3 className="text-sm font-bold text-text-subtle tracking-widest">自我观察与提问</h3>
                </div>

                <h4 className="text-sm font-semibold text-text-main mb-3">给今天的你，一点点温柔的提问:</h4>
                <ul className="space-y-3">
                    {(result.reflection.questions && result.reflection.questions.length > 0
                        ? result.reflection.questions
                        : pickQuestionsForRecord({ emotion: result.emotion })
                    ).map((q, idx) => (
                        <li key={idx} className="bg-bg-panel p-3 rounded-2xl text-sm text-text-main border border-border-soft">
                            {q}
                        </li>
                    ))}
                </ul>
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
                            onToggle={(checked) => {
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

        </div>
    );
}

function ScoreCard({ label, value }: { label: string; value: number }) {
    const widthPct = `${value * 10}%`;

    return (
        <div className="bg-gray-50 p-4 rounded-2xl flex flex-col items-start border border-gray-100/50 hover:bg-white hover:shadow-sm transition-all duration-300">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-subtle/70 mb-2">{label}</span>
            <div className="flex items-baseline gap-1.5 w-full">
                <span className="text-3xl font-bold text-gray-800 leading-none tracking-tight">{value}</span>
                <span className="text-xs text-text-subtle font-medium">/10</span>
            </div>
            <div className="w-full h-1.5 bg-gray-200/50 rounded-full mt-3 overflow-hidden">
                <div
                    style={{ width: widthPct }}
                    className={`h-full rounded-full shadow-sm transition-all duration-1000 ease-out ${value > 7 ? 'bg-gradient-to-r from-green-400 to-emerald-500' : value > 4 ? 'bg-gradient-to-r from-yellow-400 to-orange-400' : 'bg-gradient-to-r from-gray-400 to-gray-500'}`}
                />
            </div>
        </div>
    );
}
