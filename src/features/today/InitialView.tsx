import { useRef, useState } from 'react';
import { CameraModal } from './CameraModal';

interface InitialViewProps {
    onImageSelect: (file: File) => void;
    showReminder?: boolean;
    onDismissReminder?: () => void;
}

export function InitialView({ onImageSelect, showReminder, onDismissReminder }: InitialViewProps) {
    const [showCamera, setShowCamera] = useState(false);
    const uploadInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onImageSelect(e.target.files[0]);
        }
    };

    const handlePhotoTaken = (file: File) => {
        setShowCamera(false);
        onImageSelect(file);
    };

    return (
        <>
            {showCamera && (
                <CameraModal
                    onPhotoTaken={handlePhotoTaken}
                    onCancel={() => setShowCamera(false)}
                />
            )}

            {showReminder && (
                <div className="mx-4 mt-2 mb-6 bg-bg-panel/50 border border-border-soft rounded-2xl p-4 flex items-start gap-3 animate-fade-in relative z-10">
                    <div className="text-xl mt-0.5">⏰</div>
                    <div className="flex-1 text-left">
                        <h3 className="text-sm font-bold text-text-main mb-1">今天，想要和自己的脸打个招呼吗？</h3>
                        <p className="text-xs text-text-subtle mb-3 leading-relaxed">
                            按照你的设置，现在是你给自己留一点观察时间的时刻。
                        </p>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setShowCamera(true)}
                                className="text-xs font-semibold text-primary bg-white/80 px-3 py-1.5 rounded-full border border-border-soft/50 shadow-sm active:scale-95 transition-transform"
                            >
                                现在去拍一张
                            </button>
                            <button
                                onClick={onDismissReminder}
                                className="text-[10px] text-text-subtle/70 underline hover:text-text-subtle"
                            >
                                今天先不用提醒
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className={`flex flex-col items-center justify-start min-h-[60vh] px-6 text-center animate-fade-in ${showReminder ? 'pt-4' : 'pt-12'}`}>
                <div className="w-24 h-24 mb-6 rounded-[32px] bg-white shadow-soft flex items-center justify-center text-primary">
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>

                <h2 className="text-2xl font-bold text-text-main mb-2">
                    观察今天的自己
                </h2>

                <p className="text-text-subtle mb-8 max-w-xs leading-relaxed">
                    找一个光线柔和的位置，拍一张正脸照片，看看今天的自己是什么状态。 <br />
                </p>

                <div className="flex flex-col w-full max-w-xs gap-3">
                    {/* Take Photo Button */}
                    <button
                        onClick={() => setShowCamera(true)}
                        className="w-full py-4 bg-primary text-white rounded-full font-semibold shadow-soft active:scale-95 transition-transform flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        拍一张照片
                    </button>
                    {/* Camera Modal replaces the hidden input for capture */}

                    {/* Upload Photo Button */}
                    <button
                        onClick={() => uploadInputRef.current?.click()}
                        className="w-full py-3.5 bg-white text-primary border border-primary rounded-full font-semibold shadow-sm active:scale-95 transition-transform hover:bg-bg-panel flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        上传照片
                    </button>
                    <input
                        type="file"
                        accept="image/*"
                        ref={uploadInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                    />
                </div>

                <p className="mt-8 text-[10px] text-gray-400 max-w-[250px] leading-tight">
                    本应用不会预测命运，也不提供任何医疗或心理诊断，仅用于自我观察和日常调整参考。
                </p>
            </div>
        </>
    );
}
