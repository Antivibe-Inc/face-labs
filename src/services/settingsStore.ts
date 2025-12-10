
export interface FaceLabsSettings {
    theme: 'sage' | 'blue' | 'sand';
    reminderEnabled: boolean;
    reminderHour: number;   // 0–23
    reminderMinute: number; // 0–59
}

const STORAGE_KEY = 'faceLabs_settings';

const DEFAULT_SETTINGS: FaceLabsSettings = {
    theme: 'sage',
    reminderEnabled: false,
    reminderHour: 20,
    reminderMinute: 0,
};

export function loadSettings(): FaceLabsSettings {
    try {
        const json = localStorage.getItem(STORAGE_KEY);
        if (!json) return DEFAULT_SETTINGS;
        return { ...DEFAULT_SETTINGS, ...JSON.parse(json) };
    } catch (e) {
        console.error('Failed to load settings:', e);
        return DEFAULT_SETTINGS;
    }
}

export function saveSettings(settings: FaceLabsSettings): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
        console.error('Failed to save settings:', e);
    }
}
