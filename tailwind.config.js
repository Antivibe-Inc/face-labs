/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#7CA592', // Sage Green
                'bg-soft': '#F5F7F2', // Warm Sage Tint
                'bg-panel': '#E6EBE6', // Light Sage Panel
                'border-soft': '#D1DAD5', // Muted Sage Border
                accent: '#A3B18A', // Olive Green Accent
                'text-main': '#2C3E33', // Deep Green Black
                'text-subtle': '#6B7F74', // Muted Green Grey
                'card-bg': '#FFFFFF',
            },
            boxShadow: {
                'soft': '0 4px 20px -2px rgba(124, 165, 146, 0.25)',
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
