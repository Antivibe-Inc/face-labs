

export function HistoryPlaceholder({ onBack }: { onBack: () => void }) {
    return (
        <div className="px-6 py-12 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-bg-soft rounded-full mb-6 flex items-center justify-center text-accent text-2xl border border-border-soft">
                🕰️
            </div>
            <h2 className="text-2xl font-semibold text-text-main mb-3">历史记录 · 敬请期待</h2>
            <p className="text-text-subtle mb-8 max-w-xs leading-relaxed">
                未来这里会展示你的脸部状态时间线：每周的情绪趋势、能量曲线，以及你写下的小备注。
            </p>
            <button
                onClick={onBack}
                className="px-6 py-3 bg-white border border-primary rounded-full text-sm font-medium text-primary hover:bg-bg-panel transition-colors shadow-sm"
            >
                回到今天
            </button>
        </div>
    );
}
