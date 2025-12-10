import { useEffect, useState } from 'react';

export function AnalyzingView({ image }: { image: string | null }) {
    const [progressText, setProgressText] = useState("正在扫描...");

    useEffect(() => {
        const timer1 = setTimeout(() => setProgressText("观察情绪..."), 600);
        const timer2 = setTimeout(() => setProgressText("检查可见的生活方式线索..."), 1200);
        const timer3 = setTimeout(() => setProgressText("生成自我观察报告..."), 1600);
        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
        };
    }, []);

    return (
        <div className="flex flex-col items-center pt-10 animate-fade-in text-center">
            <div className="relative w-32 h-32 mb-8">
                {image && (
                    <img
                        src={image}
                        alt="Analyzing"
                        className="w-full h-full object-cover rounded-full border-4 border-white shadow-lg opacity-80"
                    />
                )}
                <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            </div>

            <h3 className="text-xl font-medium text-text-main mb-2">正在分析你的脸部状态...</h3>
            <p className="text-sm text-text-subtle animate-pulse">{progressText}</p>
        </div>
    );
}
