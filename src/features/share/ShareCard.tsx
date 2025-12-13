import type { FaceHistoryRecord } from '../../services/historyStore';

interface ShareCardProps {
    record: FaceHistoryRecord;
    id?: string; // Optional ID for the DOM element if needed elsewhere
}

export function ShareCard({ record, id }: ShareCardProps) {
    const { thumbnail, emotion, note } = record;
    const { summary, energy_level, mood_brightness, tags } = emotion;

    // Parse date for display (e.g., "2025年 12月 10日")
    // dateLabel is like "2025年12月10日 23:30", simplify it
    const dateObj = new Date(record.date);
    const dateDisplay = dateObj.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <div
            id={id}
            className="w-[360px] bg-gradient-to-br from-[#F5F7F2] to-white p-6 rounded-[32px] shadow-sm border border-border-soft flex flex-col relative overflow-hidden font-sans text-text-main"
            style={{ aspectRatio: '4/5' }}
        >
            {/* Decorative Background Elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-100/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none" />

            {/* Header: Date */}
            <div className="text-center mb-5 relative z-10">
                <div className="inline-block px-3 py-1 bg-white/60 backdrop-blur-sm rounded-full text-xs font-medium text-text-subtle tracking-wide">
                    {dateDisplay}
                </div>
            </div>

            {/* Photo */}
            <div className="w-full aspect-[4/3] rounded-[24px] overflow-hidden shadow-inner border border-white/50 mb-5 relative z-10 bg-white">
                <img
                    src={thumbnail}
                    alt="Face"
                    className="w-full h-full object-cover transform-gpu"
                    style={{ objectPosition: 'center' }}
                />
            </div>

            {/* Content Body */}
            <div className="flex-1 flex flex-col items-center relative z-10">
                {/* Summary */}
                <h2 className="text-xl font-bold text-center text-text-main mb-3 leading-snug px-2">
                    {summary}
                </h2>

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs font-medium text-text-subtle mb-4">
                    <div className="flex flex-col items-center gap-1">
                        <span>精力 {energy_level}</span>
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary rounded-full opacity-80"
                                style={{ width: `${energy_level * 10}%` }}
                            />
                        </div>
                    </div>
                    <div className="w-px h-6 bg-border-soft/50" />
                    <div className="flex flex-col items-center gap-1">
                        <span>心情 {mood_brightness}</span>
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-400 rounded-full opacity-80"
                                style={{ width: `${mood_brightness * 10}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap justify-center gap-2 mb-4">
                    {tags.slice(0, 3).map(tag => (
                        <span key={tag} className="px-2.5 py-0.5 bg-white/70 border border-border-soft text-text-subtle text-[10px] rounded-full shadow-sm">
                            #{tag}
                        </span>
                    ))}
                </div>

                {/* Note */}
                {note && (
                    <div className="w-full bg-white/50 rounded-xl p-3 border border-white/60 mb-2">
                        <div className="text-[10px] text-primary/60 mb-1 font-medium">那天写下的一句话：</div>
                        <p className="text-xs text-text-main leading-relaxed line-clamp-2 italic">
                            {note}
                        </p>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="mt-auto pt-4 flex items-end justify-between text-[10px] text-text-subtle/50 relative z-10">
                <div className="font-bold tracking-wider text-text-subtle/70">FACE LABS</div>
                <div className="flex flex-col items-end leading-tight scale-90 origin-bottom-right">
                    <span>仅用于自我观察</span>
                    <span>不作医疗或心理诊断</span>
                </div>
            </div>
        </div>
    );
}
