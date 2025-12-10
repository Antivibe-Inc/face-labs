/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#F973B7',
                'pink-soft': '#FFF7FB',
                'pink-panel': '#FDECF4',
                'pink-border': '#F5D0E6',
                accent: '#F9A8D4',
                'text-main': '#2E1A2E',
                'text-subtle': '#8C728E',
                'card-bg': '#FFFFFF',
            },
            boxShadow: {
                'soft': '0 4px 20px -2px rgba(249, 168, 212, 0.25)',
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-out',
                'slide-up': 'slideUp 0.5s ease-out',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
            },
        },
    },
    plugins: [],
}
