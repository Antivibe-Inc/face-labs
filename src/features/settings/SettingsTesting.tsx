
import { useState } from 'react';
import { saveRecord, clearHistory, type FaceHistoryRecord } from '../../services/historyStore';

// --- MOCK CONSTANTS ---

const MOCK_TAGS = [
    '平静', '开心', '疲惫', '放松', '紧绷', '期待', '焦虑', '专注', '困倦', '满意', '低落', '有活力'
];

const MOCK_SUMMARIES = [
    '看起来状态很不错，眼神有光。',
    '稍微有点疲惫，记得早点休息。',
    '即使有些累，嘴角也带着笑意。',
    '眼神平静，今天过得应该很安稳。',
    '略显紧绷，可能是工作压力有点大。',
    '充满活力，今天一定发生了好事。',
    '有些困倦，需要补个觉了。'
];

const MOCK_SUGGESTIONS = [
    '早点休息，拒绝熬夜。',
    '喝杯温水，放松一下。',
    '听首喜欢的歌，调节心情。',
    '出去走走，呼吸新鲜空气。'
];

// Placeholder image for mock records (a simple colored circle svg data uri or detailed generic one)
// Using a simple SVG data URI for valid image source
const MOCK_THUMBNAIL = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23FDECF4"/><circle cx="50" cy="40" r="20" fill="%23F973B7"/><path d="M30 80 Q50 90 70 80" stroke="%23F973B7" stroke-width="3" fill="none"/></svg>`;


// --- HELPER FUNCTIONS ---

function getRandomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomItem<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomTags(count: number): string[] {
    const shuffled = [...MOCK_TAGS].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

function generateMockRecord(date: Date): FaceHistoryRecord {
    const energy = getRandomInt(1, 10);
    const mood = getRandomInt(1, 10);

    // Format: "2025年12月10日 18:41"
    const dateLabel = date.toLocaleString('zh-CN', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: false
    });

    return {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2),
        date: date.toISOString(),
        dateLabel,
        thumbnail: MOCK_THUMBNAIL,
        emotion: {
            summary: getRandomItem(MOCK_SUMMARIES),
            energy_level: energy,
            mood_brightness: mood,
            tags: getRandomTags(getRandomInt(1, 3)),
        },
        lifestyle: {
            signals: ['有些黑眼圈', '皮肤略干'],
            suggestions: [getRandomItem(MOCK_SUGGESTIONS), getRandomItem(MOCK_SUGGESTIONS)],
        },
        reflection: {
            summary: '今天的你，依然在努力生活。',
            questions: ['今天有什么开心的小事吗？'],
        },
        note: Math.random() > 0.7 ? '这是一条自动生成的测试备注。' : ''
    };
}


// --- COMPONENT ---

export function SettingsTesting() {
    // Single Creator State
    const [customDate, setCustomDate] = useState(() => {
        const now = new Date();
        return now.toISOString().split('T')[0]; // YYYY-MM-DD
    });
    const [customTime, setCustomTime] = useState(() => {
        const now = new Date();
        return now.toTimeString().slice(0, 5); // HH:MM
    });
    const [customEnergy, setCustomEnergy] = useState<number>(5);
    const [customMood, setCustomMood] = useState<number>(5);
    const [customTags, setCustomTags] = useState<string>('');
    const [customNote, setCustomNote] = useState<string>('');

    const [statusMsg, setStatusMsg] = useState<string>('');

    const showMsg = (msg: string) => {
        setStatusMsg(msg);
        setTimeout(() => setStatusMsg(''), 3000);
    };

    const handleClearHistory = () => {
        if (confirm("这会清空本机所有历史记录（包括真实记录），操作后无法恢复，确认继续吗？")) {
            clearHistory();
            showMsg("已清空所有历史记录。");
        }
    };

    const handleGenerateBulk = (days: number) => {
        if (!confirm(`确定要生成最近 ${days} 天的测试数据吗？建议先清空历史记录。此操作会在现有数据基础上追加测试记录。`)) {
            return;
        }

        const now = new Date();

        for (let i = 0; i < days; i++) {
            // Generate 1-2 records per day
            const recordsPerDay = getRandomInt(1, 2);
            for (let j = 0; j < recordsPerDay; j++) {
                const d = new Date(now);
                d.setDate(d.getDate() - i);

                // Random time: 08:00 - 22:00
                d.setHours(getRandomInt(8, 22), getRandomInt(0, 59), 0, 0);

                const record = generateMockRecord(d);
                saveRecord(record, { ignoreDailyLimit: true });
            }
        }
        showMsg(`已生成 ${days} 天的测试数据。`);
    };

    const handleCreateSingle = () => {
        try {
            const dateObj = new Date(`${customDate}T${customTime}:00`);
            if (isNaN(dateObj.getTime())) {
                alert("日期或时间格式不正确");
                return;
            }

            const tagsArray = customTags.split(/[,，\s]+/).filter(Boolean);
            if (tagsArray.length === 0) tagsArray.push('手动测试');

            const record: FaceHistoryRecord = {
                id: Date.now().toString(36) + Math.random().toString(36).substr(2),
                date: dateObj.toISOString(),
                dateLabel: dateObj.toLocaleString('zh-CN', {
                    year: 'numeric', month: 'long', day: 'numeric',
                    hour: '2-digit', minute: '2-digit', hour12: false
                }),
                thumbnail: MOCK_THUMBNAIL,
                emotion: {
                    summary: '手动创建的测试记录',
                    energy_level: customEnergy,
                    mood_brightness: customMood,
                    tags: tagsArray,
                },
                lifestyle: {
                    signals: ['手动创建'],
                    suggestions: ['无建议'],
                },
                reflection: {
                    summary: '手动创建',
                    questions: [],
                },
                note: customNote
            };

            saveRecord(record, { ignoreDailyLimit: true });
            showMsg("已创建一条测试记录。");

            // Reset msg after 3s
        } catch (e) {
            console.error(e);
            alert("创建失败，请检查输入。");
        }
    };

    return (
        <div className="bg-white rounded-3xl border border-border-soft shadow-sm p-5 mt-6 border-l-4 border-l-yellow-400">
            <h3 className="text-base font-bold text-text-main mb-1">测试数据工具（仅开发自测用）</h3>
            <p className="text-xs text-text-subtle mb-6">这里会直接写入或清空本机的历史记录数据，请谨慎使用。</p>

            {/* Bulk Generation */}
            <div className="mb-8">
                <h4 className="text-xs font-bold uppercase tracking-wider text-text-subtle mb-3">一键生成</h4>
                <div className="flex gap-3">
                    <button
                        onClick={() => handleGenerateBulk(7)}
                        className="px-4 py-2 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg text-sm font-medium hover:bg-yellow-100 transition-colors"
                    >
                        生成最近 7 天
                    </button>
                    <button
                        onClick={() => handleGenerateBulk(30)}
                        className="px-4 py-2 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg text-sm font-medium hover:bg-yellow-100 transition-colors"
                    >
                        生成最近 30 天
                    </button>
                </div>
            </div>

            {/* Single Creation */}
            <div className="mb-8">
                <h4 className="text-xs font-bold uppercase tracking-wider text-text-subtle mb-3">手动创建记录</h4>
                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] text-text-subtle mb-1">日期</label>
                            <input
                                type="date"
                                className="w-full text-sm border border-gray-200 rounded-lg p-2"
                                value={customDate}
                                onChange={e => setCustomDate(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] text-text-subtle mb-1">时间</label>
                            <input
                                type="time"
                                className="w-full text-sm border border-gray-200 rounded-lg p-2"
                                value={customTime}
                                onChange={e => setCustomTime(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] text-text-subtle mb-1">精力值 (0-10): {customEnergy}</label>
                            <input
                                type="range" min="0" max="10"
                                className="w-full accent-primary h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer"
                                value={customEnergy}
                                onChange={e => setCustomEnergy(Number(e.target.value))}
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] text-text-subtle mb-1">心情亮度 (0-10): {customMood}</label>
                            <input
                                type="range" min="0" max="10"
                                className="w-full accent-blue-400 h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer"
                                value={customMood}
                                onChange={e => setCustomMood(Number(e.target.value))}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] text-text-subtle mb-1">标签 (空格分隔)</label>
                        <input
                            type="text"
                            className="w-full text-sm border border-gray-200 rounded-lg p-2"
                            placeholder="如：平静 专注"
                            value={customTags}
                            onChange={e => setCustomTags(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] text-text-subtle mb-1">备注 (Note)</label>
                        <input
                            type="text"
                            className="w-full text-sm border border-gray-200 rounded-lg p-2"
                            placeholder="写一句话..."
                            value={customNote}
                            onChange={e => setCustomNote(e.target.value)}
                        />
                    </div>

                    <button
                        onClick={handleCreateSingle}
                        className="w-full py-2 bg-text-main text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                        创建测试记录
                    </button>
                </div>
            </div>

            {/* Clear History */}
            <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-text-subtle mb-3">危险操作</h4>
                <button
                    onClick={handleClearHistory}
                    className="text-xs text-red-500 hover:text-red-600 underline"
                >
                    清空全部历史记录（测试用）
                </button>
            </div>

            {/* Feedback Message */}
            {statusMsg && (
                <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-4 py-2 rounded-full shadow-lg animate-fade-in z-50">
                    {statusMsg}
                </div>
            )}
        </div>
    );
}
