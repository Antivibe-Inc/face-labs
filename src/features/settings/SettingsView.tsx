import { useEffect, useState } from 'react';
import { loadSettings, saveSettings, type AppSettings } from '../../services/settingsStore';
import { SettingsTesting } from './SettingsTesting';

export function SettingsView() {
    const [settings, setSettings] = useState<AppSettings>(loadSettings());
    const [savedMessage, setSavedMessage] = useState<string | null>(null);

    const handleToggleReminder = (enabled: boolean) => {
        const newSettings = { ...settings, reminderEnabled: enabled };
        setSettings(newSettings);
        saveSettings(newSettings);
        showSavedFeedback();
    };

    const handleTimeChange = (field: 'hour' | 'minute', value: number) => {
        const newSettings = {
            ...settings,
            reminderHour: field === 'hour' ? value : settings.reminderHour,
            reminderMinute: field === 'minute' ? value : settings.reminderMinute
        };
        setSettings(newSettings);
        saveSettings(newSettings);
        showSavedFeedback();
    };

    const showSavedFeedback = () => {
        setSavedMessage("设置已保存");
        setTimeout(() => setSavedMessage(null), 2000);
    };

    return (
        <div className="p-4 pb-24 space-y-6">
            {/* Header */}
            <div className="flex flex-col items-center text-center">
                <h2 className="text-2xl font-bold text-text-main">设置</h2>
                <p className="text-sm text-text-subtle mt-0.5">在这里设置你的使用习惯</p>
            </div>

            {/* Reminder Card */}
            <div className="bg-white rounded-3xl border border-pink-border shadow-sm p-5 space-y-6">
                <div>
                    <h3 className="text-base font-semibold text-text-main mb-1">每日提醒</h3>
                    <p className="text-xs text-text-subtle leading-relaxed">
                        你可以选择一个每天的时间，提醒自己用一张脸，和当下的自己打个招呼。
                    </p>
                </div>

                {/* Toggle */}
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-sm font-medium text-text-main">开启每日提醒</div>
                        <div className="text-xs text-text-subtle mt-0.5 max-w-[200px]">
                            只会在你打开 Face Labs 时给出轻微提示，不会发送系统通知。
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={settings.reminderEnabled}
                            onChange={(e) => handleToggleReminder(e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                </div>

                {/* Time Picker */}
                <div className={`transition-opacity ${settings.reminderEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                    <div className="text-xs font-semibold text-text-main mb-2">提醒时间</div>
                    <div className="flex items-center gap-2">
                        <select
                            value={settings.reminderHour}
                            onChange={(e) => handleTimeChange('hour', Number(e.target.value))}
                            className="bg-gray-50 border border-gray-200 text-text-main text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5 w-20"
                        >
                            {Array.from({ length: 24 }).map((_, i) => (
                                <option key={i} value={i}>{i.toString().padStart(2, '0')}</option>
                            ))}
                        </select>
                        <span className="text-text-main font-bold">:</span>
                        <select
                            value={settings.reminderMinute}
                            onChange={(e) => handleTimeChange('minute', Number(e.target.value))}
                            className="bg-gray-50 border border-gray-200 text-text-main text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5 w-20"
                        >
                            {Array.from({ length: 60 }).map((_, i) => (
                                <option key={i} value={i}>{i.toString().padStart(2, '0')}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Saved Indicator */}
                <div className={`text-xs text-primary font-medium transition-opacity duration-300 ${savedMessage ? 'opacity-100' : 'opacity-0'}`}>
                    ✓ {savedMessage}
                </div>
            </div>

            {/* Privacy Note */}
            <div className="bg-pink-soft/50 rounded-2xl p-4 text-center">
                <p className="text-[10px] text-text-subtle leading-normal">
                    所有设置和历史记录都只保存在本机浏览器中，不会上传到服务器。
                </p>
            </div>

            {/* Testing Tools (Dev Only) */}
            <SettingsTesting />
        </div>
    );
}
