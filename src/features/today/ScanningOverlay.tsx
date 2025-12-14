import { useEffect, useState } from 'react';

interface ScanningOverlayProps {
    image: string;
    onComplete?: () => void;
}

export function ScanningOverlay({ image }: ScanningOverlayProps) {
    const [scanProgress, setScanProgress] = useState(0);
    const [metrics, setMetrics] = useState<string[]>([]);

    // Technical jargon for the metrics display
    const analysisSteps = [
        "初始化神经生物特征识别...",
        "定位主要面部锚点...",
        "构建 3D 拓扑网格...",
        "分析皮肤微纹理...",
        "正在计算情绪向量...",
        "合成疲劳指数...",
        "同步生理信号...",
        "生成初步诊断..."
    ];

    useEffect(() => {
        let stepIndex = 0;
        // Asymptotic approach: approaches 99% but slows down significantly
        // Target roughly 30-40s for Gemni 3 Pro Preview
        const timeConstant = 12000; // Time to reach ~63%
        const startTime = Date.now();

        const animInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;

            // Formula: fraction = 1 - e^(-t/timeConstant)
            // This ensures it never hits 100% and slows down smoothly
            let calculatedProgress = 99 * (1 - Math.exp(-elapsed / timeConstant));

            // Ensure we at least move a tiny bit to feel "alive"
            if (calculatedProgress > 98.5) {
                calculatedProgress = 98.5 + (elapsed % 1000) / 2000; // Tiny subtle breathing at the end
            }

            setScanProgress(calculatedProgress);

            // Determine which step text to show based on progress
            // Map 0-80% to the first N-1 steps, keep the last step for the final "wait" phase
            // We have 8 steps. Let's spread them out.
            // Say we want to show steps 0-6 from 0% to 80% progress
            // And step 7 ("生成初步诊断...") from 80% to 99%

            const totalSteps = analysisSteps.length;
            let currentStepIndex = 0;

            if (calculatedProgress < 80) {
                currentStepIndex = Math.floor((calculatedProgress / 80) * (totalSteps - 1));
            } else {
                currentStepIndex = totalSteps - 1;
            }

            // Special case: After ~23s (85% progress), show the encouragement message
            if (calculatedProgress > 85) {
                setMetrics(prev => {
                    if (prev[0] === "接下来跟AI心理师聊几句吧...") return prev;
                    return ["接下来跟AI心理师聊几句吧...", ...prev].slice(0, 4);
                });
            }

            // Update metrics log if step changes
            if (currentStepIndex < totalSteps && currentStepIndex >= stepIndex) {
                if (currentStepIndex > stepIndex || stepIndex === 0) {
                    setMetrics(prev => {
                        // Avoid duplicates
                        if (prev[0] === analysisSteps[currentStepIndex]) return prev;
                        // Keep distinct messages
                        return [analysisSteps[currentStepIndex], ...prev].slice(0, 4);
                    });
                    stepIndex = currentStepIndex;
                }
            }
        }, 50);

        return () => clearInterval(animInterval);
    }, []);

    return (
        <div className="fixed inset-0 z-[100] bg-[#050505] flex flex-col items-center justify-center overflow-hidden font-mono">

            {/* Main scanning viewport */}
            <div className="relative w-full max-w-md h-full max-h-[90vh] flex flex-col items-center justify-center">

                {/* Image Container with effects */}
                <div className="relative w-[90%] aspect-[3/4] rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-[#333]">
                    {/* User's photo */}
                    <img
                        src={image}
                        alt="Scanning"
                        className="w-full h-full object-cover opacity-60 mix-blend-luminosity"
                    />

                    {/* Holographic Mesh Grid Overlay */}
                    <div className="absolute inset-0 opacity-40"
                        style={{
                            backgroundImage: `
                                 linear-gradient(rgba(64, 224, 208, 0.4) 1px, transparent 1px),
                                 linear-gradient(90deg, rgba(64, 224, 208, 0.4) 1px, transparent 1px)
                             `,
                            backgroundSize: '30px 30px',
                            transform: 'perspective(500px) rotateX(10deg)',
                            maskImage: 'radial-gradient(circle at center, black 40%, transparent 80%)'
                        }}
                    />

                    {/* Face Mapping Points - Randomly animated */}
                    <div className="absolute inset-0">
                        {[...Array(12)].map((_, i) => (
                            <div
                                key={i}
                                className="absolute w-1 h-1 bg-[#00ffcc] rounded-full shadow-[0_0_8px_#00ffcc]"
                                style={{
                                    top: `${30 + Math.random() * 40}%`,
                                    left: `${30 + Math.random() * 40}%`,
                                    animation: `ping ${1 + Math.random()}s infinite`,
                                    animationDelay: `${Math.random()}s`
                                }}
                            />
                        ))}
                    </div>

                    {/* Dual Scanning Lines */}
                    {/* Horizontal Scan */}
                    <div
                        className="absolute left-0 right-0 h-[2px] bg-[#00ffcc] shadow-[0_0_20px_#00ffcc] z-20"
                        style={{
                            top: `${scanProgress}%`,
                            opacity: 0.8,
                            transition: 'top 0.1s linear'
                        }}
                    >
                        {/* Label positioned above the line to avoid bottom clipping */}
                        <div className="absolute right-2 bottom-full mb-1 text-[10px] text-[#00ffcc] bg-black/50 px-1 rounded-sm">
                            Y-AXIS: {scanProgress.toFixed(1)}
                        </div>
                    </div>

                    {/* Vertical Scan (faster loops) */}
                    <div
                        className="absolute top-0 bottom-0 w-[1px] bg-[#00ffcc]/30 z-10"
                        style={{
                            left: '0%',
                            animation: 'scan-x 2s infinite linear'
                        }}
                    />

                    {/* Central Face Focus Ring */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-[65%] aspect-[3/4.5] border-[1px] border-[#00ffcc]/30 rounded-[40%] relative animate-pulse">
                            {/* Rotating segments */}
                            <div className="absolute -inset-2 border-t-2 border-b-2 border-[#00ffcc]/60 rounded-[42%] animate-spin-slow" />
                            <div className="absolute -inset-4 border-l-2 border-r-2 border-[#00ffcc]/20 rounded-[45%] animate-spin-reverse-slow" />
                        </div>
                    </div>

                    {/* Corner Reticles */}
                    <div className="absolute top-4 left-4 w-4 h-4 border-l-2 border-t-2 border-[#00ffcc]" />
                    <div className="absolute top-4 right-4 w-4 h-4 border-r-2 border-t-2 border-[#00ffcc]" />
                    <div className="absolute bottom-4 left-4 w-4 h-4 border-l-2 border-b-2 border-[#00ffcc]" />
                    <div className="absolute bottom-4 right-4 w-4 h-4 border-r-2 border-b-2 border-[#00ffcc]" />
                </div>

                {/* Data Terminal Display */}
                <div className="mt-8 w-[90%] font-mono text-xs">
                    {/* Metrics Header */}
                    <div className="flex justify-between text-[#00ffcc]/60 mb-2 border-b border-[#00ffcc]/20 pb-1">
                        <span>SYS.DIAGNOSTIC</span>
                        <span>{scanProgress.toFixed(0)}% COMPLETE</span>
                    </div>

                    {/* Scrolling Log */}
                    <div className="space-y-1 h-20 overflow-hidden text-[#00ffcc] opacity-90 transition-all duration-300">
                        {metrics.map((msg, i) => (
                            <div key={i} className={`flex items-center gap-2 ${i === 0 ? 'text-white font-bold' : 'opacity-60'}`}>
                                <span className="text-[10px] opacity-50">[{Date.now().toString().slice(-4)}]</span>
                                <span>{i === 0 ? '> ' : '  '}{msg}</span>
                            </div>
                        ))}
                    </div>

                    {/* Random flashing data block */}
                    <div className="mt-4 grid grid-cols-3 gap-2 text-[10px] text-[#00ffcc]/40">
                        <div>生物活性: {(85 + Math.random() * 14).toFixed(2)}</div>
                        <div>气血能量: {(70 + Math.random() * 25).toFixed(2)}</div>
                        <div>结构对称: {(92 + Math.random() * 7).toFixed(2)}</div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes scan-x {
                    0% { left: 0%; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { left: 100%; opacity: 0; }
                }
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes spin-reverse-slow {
                    from { transform: rotate(360deg); }
                    to { transform: rotate(0deg); }
                }
            `}</style>
        </div>
    );
}
