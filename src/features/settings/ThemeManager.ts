import { loadSettings } from '../../services/settingsStore';

export function initTheme() {
    const settings = loadSettings();
    applyTheme(settings.theme);
}

export function applyTheme(theme: 'sage' | 'blue' | 'sand') {
    // Determine the theme value to set on the data-theme attribute
    // Default (sage) doesn't strictly need a value if it's :root, but for clarity:
    // We defined :root as sage, so removing attribute resorts to sage.
    // However, to support explicit switching, we can use the attribute for non-default too if we wanted,
    // but our CSS uses [data-theme='blue'] etc.

    const root = document.documentElement;

    if (theme === 'sage') {
        root.removeAttribute('data-theme');
    } else {
        root.setAttribute('data-theme', theme);
    }

    // Optional: Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
        const colorMap = {
            sage: '#F5F7F2',
            blue: '#F0F4F7',
            sand: '#FAF7F2'
        };
        metaThemeColor.setAttribute('content', colorMap[theme]);
    }
}
