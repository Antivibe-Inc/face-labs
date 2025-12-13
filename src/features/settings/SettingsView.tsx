import { useState, useEffect } from 'react';
import { loadSettings, saveSettings, type FaceLabsSettings } from '../../services/settingsStore';
import { applyTheme } from './ThemeManager';
import { SettingsTesting } from './SettingsTesting';

export function SettingsView() {
    const [settings, setSettings] = useState<FaceLabsSettings>(loadSettings());

    // Initial load
    useEffect(() => {
        setSettings(loadSettings());
    }, []);

    // Unified update handler
    const updateSettings = (updates: Partial<FaceLabsSettings>) => {
        const newSettings = { ...settings, ...updates };
        setSettings(newSettings);
        saveSettings(newSettings);

        // Apply theme immediately if changed
        if (updates.theme) {
            applyTheme(updates.theme);
        }

        // Show feedback for specific actions if needed, or just let UI reflect state.
        // For simple toggles, instant feedback is better. 
        // We can show "Saved" toast if desired, but toggle switches usually don't need it.
    };

    // Special handler for time inputs to debounce or just set directly
    const handleTimeChange = (type: 'hour' | 'minute', value: number) => {
        const updates = {
            [type === 'hour' ? 'reminderHour' : 'reminderMinute']: value
        };
        updateSettings(updates);
    };

    return (
        <div className="p-4 pb-24 space-y-6 h-full flex flex-col">
            {/* Header */}
            <div className="flex flex-col items-center text-center flex-shrink-0">
                <h1 className="text-2xl font-bold text-text-main tracking-tight">设置</h1>
                <p className="text-xs text-text-subtle mt-0.5">在这里设置你的使用习惯</p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 no-scrollbar pb-10">

                {/* Theme Settings */}
                <section className="bg-white rounded-3xl p-5 shadow-sm border border-border-soft">
                    <h2 className="text-sm font-bold text-text-main mb-4 flex items-center gap-2">
                        <span>🎨</span> 外观风格
                    </h2>

                    <div className="grid grid-cols-1 gap-3">
                        {/* Sage (Default) */}
                        <button
                            onClick={() => updateSettings({ theme: 'sage' })}
                            className={`flex items-center gap-4 p-3 rounded-2xl border transition-all ${settings.theme === 'sage' ? 'bg-bg-soft border-primary ring-1 ring-primary' : 'bg-white border-border-soft hover:bg-gray-50'}`}
                        >
                            <div className="w-10 h-10 rounded-full bg-[#7CA592] border-2 border-white shadow-sm flex-shrink-0"></div>
                            <div className="flex-1 text-left">
                                <div className="text-sm font-semibold text-text-main">晨雾绿 (默认)</div>
                                <div className="text-xs text-text-subtle">自然、松弛、疗愈</div>
                            </div>
                            {settings.theme === 'sage' && (
                                <div className="text-primary">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            )}
                        </button>

                        {/* Blue */}
                        <button
                            onClick={() => updateSettings({ theme: 'blue' })}
                            className={`flex items-center gap-4 p-3 rounded-2xl border transition-all ${settings.theme === 'blue' ? 'bg-[#F0F4F7] border-[#6B8A9E] ring-1 ring-[#6B8A9E]' : 'bg-white border-border-soft hover:bg-gray-50'}`}
                        >
                            <div className="w-10 h-10 rounded-full bg-[#6B8A9E] border-2 border-white shadow-sm flex-shrink-0"></div>
                            <div className="flex-1 text-left">
                                <div className="text-sm font-semibold text-[#24323B]">静谧蓝</div>
                                <div className="text-xs text-[#5D717E]">理智、冷静、通透</div>
                            </div>
                            {settings.theme === 'blue' && (
                                <div className="text-[#6B8A9E]">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            )}
                        </button>

                        {/* Sand */}
                        <button
                            onClick={() => updateSettings({ theme: 'sand' })}
                            className={`flex items-center gap-4 p-3 rounded-2xl border transition-all ${settings.theme === 'sand' ? 'bg-[#FAF7F2] border-[#9C826B] ring-1 ring-[#9C826B]' : 'bg-white border-border-soft hover:bg-gray-50'}`}
                        >
                            <div className="w-10 h-10 rounded-full bg-[#9C826B] border-2 border-white shadow-sm flex-shrink-0"></div>
                            <div className="flex-1 text-left">
                                <div className="text-sm font-semibold text-[#3E3228]">暖陶沙</div>
                                <div className="text-xs text-[#8A7868]">温暖、极简、质朴</div>
                            </div>
                            {settings.theme === 'sand' && (
                                <div className="text-[#9C826B]">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            )}
                        </button>
                    </div>
                </section>

                {/* Reminder Card */}
                <div className="bg-white rounded-3xl border border-border-soft shadow-sm p-5 space-y-6">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex flex-col">
                            <span className="text-lg font-bold text-text-main">每日提醒</span>
                            <span className="text-sm text-text-subtle">每天根据你的生活节奏提醒</span>
                        </div>
                        <button
                            onClick={() => updateSettings({ reminderEnabled: !settings.reminderEnabled })}
                            className={`w-14 h-8 rounded-full transition-colors relative ${settings.reminderEnabled ? 'bg-primary' : 'bg-gray-200'}`}
                        >
                            <div className={`active:scale-90 absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${settings.reminderEnabled ? 'left-7' : 'left-1'}`} />
                        </button>
                    </div>

                    {settings.reminderEnabled && (
                        <div className="animate-fade-in">
                            <label className="block text-sm font-medium text-text-subtle mb-3">提醒时间</label>
                            <div className="flex gap-2">
                                <select
                                    value={settings.reminderHour}
                                    onChange={(e) => handleTimeChange('hour', parseInt(e.target.value))}
                                    className="flex-1 p-3 bg-bg-soft/50 border border-border-soft rounded-xl text-text-main focus:outline-none focus:border-primary text-center font-bold text-lg"
                                >
                                    {Array.from({ length: 24 }).map((_, i) => (
                                        <option key={i} value={i}>{i.toString().padStart(2, '0')}</option>
                                    ))}
                                </select>
                                <span className="self-center font-bold text-text-main">:</span>
                                <select
                                    value={settings.reminderMinute}
                                    onChange={(e) => handleTimeChange('minute', parseInt(e.target.value))}
                                    className="flex-1 p-3 bg-bg-soft/50 border border-border-soft rounded-xl text-text-main focus:outline-none focus:border-primary text-center font-bold text-lg"
                                >
                                    {Array.from({ length: 60 }).map((_, i) => (
                                        <option key={i} value={i}>{i.toString().padStart(2, '0')}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                {/* Privacy Note */}
                <div className="bg-bg-soft/50 rounded-2xl p-4 text-center">
                    <p className="text-[10px] text-text-subtle leading-normal">
                        所有设置和历史记录都只保存在本机浏览器中，不会上传到服务器。
                    </p>
                </div>

                {/* Testing Tools (Dev Only) */}
                <SettingsTesting />
            </div>
        </div>
    );
}
