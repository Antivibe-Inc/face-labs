/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: 'rgb(var(--color-primary) / <alpha-value>)',
                'bg-soft': 'rgb(var(--color-bg-soft) / <alpha-value>)',
                'bg-panel': 'rgb(var(--color-bg-panel) / <alpha-value>)',
                'border-soft': 'rgb(var(--color-border-soft) / <alpha-value>)',
                accent: 'rgb(var(--color-accent) / <alpha-value>)',
                'text-main': 'rgb(var(--color-text-main) / <alpha-value>)',
                'text-subtle': 'rgb(var(--color-text-subtle) / <alpha-value>)',
                'card-bg': '#FFFFFF',
            },
            boxShadow: {
                'soft': '0 4px 20px -2px rgb(var(--color-primary) / 0.25)',
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
