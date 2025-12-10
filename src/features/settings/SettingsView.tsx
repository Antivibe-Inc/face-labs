import { useEffect, useState } from 'react';
import { loadSettings, saveSettings, type FaceLabsSettings } from '../../services/settingsStore';
import { SettingsTesting } from './SettingsTesting';

export function SettingsView() {
    const [savedMessage, setSavedMessage] = useState<string | null>(null);

    const [reminderEnabled, setReminderEnabled] = useState(false);
    const [reminderTime, setReminderTime] = useState({ hour: 21, minute: 30 });

    useEffect(() => {
        const settings = loadSettings();
        setReminderEnabled(settings.reminderEnabled);
        setReminderTime({ hour: settings.reminderHour, minute: settings.reminderMinute });
    }, []);

    const handleSave = () => {
        const newSettings: FaceLabsSettings = {
            reminderEnabled,
            reminderHour: reminderTime.hour,
            reminderMinute: reminderTime.minute,
        };
        saveSettings(newSettings);
        showSavedFeedback();
    };

    const showSavedFeedback = () => {
        setSavedMessage("设置已保存");
        setTimeout(() => setSavedMessage(null), 2000);
    };

    // Effect to save settings whenever reminderEnabled or reminderTime changes
    useEffect(() => {
        handleSave();
    }, [reminderEnabled, reminderTime]);

    return (
        <div className="p-4 pb-24 space-y-6">
            {/* Header */}
            <div className="flex flex-col items-center text-center">
                <h2 className="text-xl font-bold text-text-main">设置</h2>
                <p className="text-xs text-text-subtle mt-0.5">在这里设置你的使用习惯</p>
            </div>

            {/* Reminder Card */}
            <div className="bg-white rounded-3xl border border-pink-border shadow-sm p-5 space-y-6">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex flex-col">
                        <span className="text-lg font-bold text-text-main">每日提醒</span>
                        <span className="text-sm text-text-subtle">每天根据你的生活节奏提醒</span>
                    </div>
                    <button
                        onClick={() => setReminderEnabled(!reminderEnabled)}
                        className={`w-14 h-8 rounded-full transition-colors relative ${reminderEnabled ? 'bg-primary' : 'bg-gray-200'}`}
                    >
                        <div className={`active:scale-90 absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${reminderEnabled ? 'left-7' : 'left-1'}`} />
                    </button>
                </div>

                {reminderEnabled && (
                    <div className="animate-fade-in">
                        <label className="block text-sm font-medium text-text-subtle mb-3">提醒时间</label>
                        <div className="flex gap-2">
                            <select
                                value={reminderTime.hour}
                                onChange={(e) => setReminderTime({ ...reminderTime, hour: parseInt(e.target.value) })}
                                className="flex-1 p-3 bg-pink-soft/50 border border-pink-border rounded-xl text-text-main focus:outline-none focus:border-primary text-center font-bold text-lg"
                            >
                                {Array.from({ length: 24 }).map((_, i) => (
                                    <option key={i} value={i}>{i.toString().padStart(2, '0')}</option>
                                ))}
                            </select>
                            <span className="self-center font-bold text-text-main">:</span>
                            <select
                                value={reminderTime.minute}
                                onChange={(e) => setReminderTime({ ...reminderTime, minute: parseInt(e.target.value) })}
                                className="flex-1 p-3 bg-pink-soft/50 border border-pink-border rounded-xl text-text-main focus:outline-none focus:border-primary text-center font-bold text-lg"
                            >
                                {Array.from({ length: 60 }).map((_, i) => (
                                    <option key={i} value={i}>{i.toString().padStart(2, '0')}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {/* Saved Indicator */}
            <div className={`text-xs text-primary font-medium transition-opacity duration-300 ${savedMessage ? 'opacity-100' : 'opacity-0'}`}>
                ✓ {savedMessage}
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
