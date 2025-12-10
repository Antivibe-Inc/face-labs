import { useState } from 'react';
import type { FaceAnalysisResult } from '../../types/analysis';
import { pickQuestionsForRecord, pickPracticesForRecord } from '../../services/suggestionService';


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
            <div className="flex items-center gap-4 bg-card-bg p-4 rounded-2xl shadow-soft border border-pink-border">
                <img
                    src={image}
                    alt="Face"
                    className="w-16 h-16 rounded-2xl object-cover border border-pink-border"
                />
                <div>
                    <h2 className="text-lg font-bold text-text-main">今日脸部报告</h2>
                    <p className="text-sm text-text-subtle">{dateStr}</p>
                </div>
            </div>

            {/* 1. Emotion Snapshot */}
            <section className="bg-card-bg p-5 rounded-2xl shadow-soft border border-pink-border">
                <h3 className="text-xs font-bold uppercase tracking-wider text-primary mb-3">01 情绪快照</h3>

                <p className="text-lg font-medium text-text-main mb-6 leading-snug">
                    "{result.emotion.summary}"
                </p>

                <div className="flex flex-wrap gap-2 mb-6">
                    {result.emotion.tags.map(tag => (
                        <span key={tag} className="px-3 py-1 bg-pink-panel text-primary text-xs font-medium rounded-full">
                            #{tag}
                        </span>
                    ))}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <ScoreCard label="精力值" value={result.emotion.energy_level} />
                    <ScoreCard label="心情亮度" value={result.emotion.mood_brightness} />
                </div>

                <div className="bg-pink-panel p-3 rounded-2xl border border-pink-border">
                    <p className="text-sm text-text-main">
                        <span className="font-semibold text-primary">💡 Suggestion:</span> {result.emotion.today_suggestion}
                    </p>
                </div>
            </section>

            {/* 2. Skin & Lifestyle Hints */}
            <section className="bg-card-bg p-5 rounded-2xl shadow-soft border border-pink-border">
                <h3 className="text-xs font-bold uppercase tracking-wider text-primary mb-3">02 皮肤与生活方式提示</h3>

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

                    <div className="pt-2 border-t border-pink-border/50">
                        <p className="text-[10px] text-text-subtle italic opacity-70">
                            {result.lifestyle.disclaimer}
                        </p>
                    </div>
                </div>
            </section>

            {/* 3. Reflection */}
            <section className="bg-card-bg p-5 rounded-2xl shadow-soft border border-pink-border">
                <h3 className="text-xs font-bold uppercase tracking-wider text-primary mb-3">03 自我观察与提问</h3>

                <p className="italic text-text-subtle mb-6 text-sm border-l-2 border-pink-border pl-3">
                    {result.reflection.summary}
                </p>

                <h4 className="text-sm font-semibold text-text-main mb-3">给今天的你，一点点温柔的提问:</h4>
                <ul className="space-y-3">
                    {pickQuestionsForRecord({ emotion: result.emotion }).map((q, idx) => (
                        <li key={idx} className="bg-pink-panel p-3 rounded-2xl text-sm text-text-main border border-pink-border">
                            {q}
                        </li>
                    ))}
                </ul>
            </section>

            {/* Micro-Practices Section (New) */}
            <section className="bg-card-bg p-5 rounded-2xl shadow-soft border border-pink-border">
                <h3 className="text-xs font-bold uppercase tracking-wider text-primary mb-3">今天的小练习</h3>
                <p className="text-xs text-text-subtle mb-4">
                    从下面挑一件最轻松的，如果今天只做到这一件，也已经很不错了。
                </p>
                <div className="space-y-3">
                    {pickPracticesForRecord({ emotion: result.emotion }).map((practice, idx) => (
                        <div key={idx} className="flex items-start gap-3 bg-white p-3 rounded-2xl border border-pink-border/50">
                            <span className="text-lg">🌱</span>
                            <span className="text-sm text-text-main leading-relaxed">{practice}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* 4. Personal Note */}
            <section className="bg-card-bg p-5 rounded-2xl shadow-soft border border-pink-border">
                <h3 className="text-xs font-bold uppercase tracking-wider text-primary mb-3">04 给今天的自己写一句话</h3>
                <p className="text-xs text-text-subtle mb-3">
                    可以是今天的感受、一个小小的发现，或者想对自己说的话。
                </p>
                <textarea
                    className="w-full text-sm text-text-main p-3 rounded-2xl border border-pink-border bg-white focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
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
                    className="w-full py-4 bg-white text-primary border border-primary rounded-full font-semibold shadow-sm active:scale-95 transition-transform hover:bg-pink-panel"
                >
                    Retake / 试一张新照片
                </button>
            </div>

        </div>
    );
}

function ScoreCard({ label, value }: { label: string; value: number }) {
    // Simple bar visualization
    const widthPct = `${value * 10}%`;

    return (
        <div className="bg-pink-soft p-3 rounded-2xl flex flex-col items-start border border-pink-border/50">
            <span className="text-xs text-text-subtle mb-1">{label}</span>
            <div className="flex items-end gap-1 w-full">
                <span className="text-2xl font-bold text-text-main leading-none">{value}</span>
                <span className="text-xs text-text-subtle mb-0.5">/10</span>
            </div>
            <div className="w-full h-1.5 bg-pink-border rounded-full mt-2 overflow-hidden">
                <div style={{ width: widthPct }} className="h-full bg-primary rounded-full shadow-sm" />
            </div>
        </div>
    );
}
