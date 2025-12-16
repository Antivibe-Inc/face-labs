import React from 'react';

interface EntryCardProps {
    onTakePhoto: () => void;
    isAnalyzing: boolean;
    isActive: boolean;
}

export function EntryCard({ onTakePhoto, isAnalyzing, isActive }: EntryCardProps) {
    return (
        <div className={`w-full min-h-[360px] flex-shrink-0 flex flex-col p-6 bg-white rounded-[32px] shadow-soft relative overflow-hidden transition-all duration-300 ${isActive ? 'scale-100 border-[2px] border-primary/20 shadow-xl' : 'scale-[0.98] border border-border-soft/50 opacity-90'}`}>
            {/* Decorative Background */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white via-white to-bg-soft -z-10" />

            {/* Main Content Centered */}
            <div className="flex-1 flex flex-col items-center justify-center w-full">
                <div className="w-24 h-24 mb-6 rounded-[32px] bg-white shadow-soft flex items-center justify-center text-primary animate-pulse-slow">
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>

                <h2 className="text-2xl font-bold text-primary mb-3 text-center">
                    观照今天的自己
                </h2>
                <p className="text-sm text-text-subtle text-center leading-relaxed mb-8 max-w-xs">
                    即便再忙，也要停下来，<br />
                    拍一张现在的自己，看看它想说什么？
                </p>

                <div className="w-full space-y-4">
                    <button
                        onClick={onTakePhoto}
                        disabled={isAnalyzing}
                        className="w-full py-4 bg-primary text-white rounded-full text-base font-semibold shadow-lg shadow-soft active:scale-95 transition-all hover:opacity-90 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 relative z-10"
                    >
                        {isAnalyzing ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                正在分析...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                拍一张照片
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Static Footer (No Overlap) */}
            <div className="mt-6 text-[10px] text-text-subtle opacity-50 text-center px-2">
                所有照片仅在本地处理，不会上传到任何服务器。<br />我们尊重并保护您的隐私。
            </div>
        </div >
    );
}
