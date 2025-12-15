import { useState } from 'react';

interface PracticeCheckboxProps {
    text: string;
    onToggle?: (checked: boolean) => void;
}

export function PracticeCheckbox({ text, onToggle }: PracticeCheckboxProps) {
    const [checked, setChecked] = useState(false);
    const [showToast, setShowToast] = useState(false);

    const handleClick = () => {
        const newState = !checked;
        setChecked(newState);

        // Haptic feedback
        if (navigator.vibrate) {
            navigator.vibrate(10); // Light tap
        }

        // Show toast if checking
        if (newState) {
            setShowToast(true);
            setTimeout(() => setShowToast(false), 2000);
        }

        onToggle?.(newState);
    };

    return (
        <div className="relative">
            <div
                onClick={handleClick}
                className={`flex items-center gap-3 bg-gray-50 p-3 rounded-2xl border transition-all duration-300 cursor-pointer active:scale-[0.98] ${checked ? 'border-primary/30 bg-primary/5' : 'border-gray-100 hover:border-gray-200'}`}
            >
                {/* Checkbox Icon */}
                <div className={`transition-colors duration-300 ${checked ? 'text-primary' : 'text-gray-400'}`}>
                    <svg className="w-5 h-5" fill={checked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                        <rect x="4" y="4" width="16" height="16" rx="4" strokeWidth={1.5} />
                        {checked && (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12l3 3 5-5" stroke="white" />
                        )}
                    </svg>
                </div>

                {/* Text */}
                <span className={`text-sm leading-relaxed transition-all duration-300 ${checked ? 'text-text-subtle line-through opacity-70' : 'text-text-main'}`}>
                    {text}
                </span>
            </div>

            {/* Local Toast Animation */}
            {showToast && (
                <div className="absolute left-1/2 -top-8 -translate-x-1/2 px-3 py-1 bg-black/80 backdrop-blur text-white text-[10px] rounded-full shadow-lg whitespace-nowrap animate-in fade-in slide-in-from-bottom-2 duration-200 z-10 pointer-events-none">
                    已加入今日承诺 ✨
                </div>
            )}
        </div>
    );
}
