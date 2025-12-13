import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import html2canvas from 'html2canvas';
import { ShareCard } from './ShareCard';
import type { FaceHistoryRecord } from '../../services/historyStore';

interface ShareModalProps {
    record: FaceHistoryRecord;
    onClose: () => void;
}

export function ShareModal({ record, onClose }: ShareModalProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleSaveImage = async () => {
        if (!cardRef.current) return;

        setIsGenerating(true);
        try {
            // Wait a moment for fonts/images to be fully ready if needed
            await new Promise(resolve => setTimeout(resolve, 100));

            const canvas = await html2canvas(cardRef.current, {
                useCORS: true,
                scale: 3, // Higher quality
                backgroundColor: null,
                logging: false,
                onclone: (clonedDoc) => {
                    // Ensure fonts are loaded in the clone if possible, or just helps with style stability
                    const clonedElement = clonedDoc.getElementById('share-card-content');
                    if (clonedElement) {
                        // Force specific styles if needed
                    }
                }
            });

            // Create download link
            const link = document.createElement('a');
            // Format: facelabs-2025-12-10.png
            const dateStr = new Date(record.date).toISOString().split('T')[0];
            link.download = `facelabs-${dateStr}.png`;
            link.href = canvas.toDataURL('image/png');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Failed to generate image:', error);
            alert('生成图片失败，请重试');
        } finally {
            setIsGenerating(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in safe-area-inset-bottom">
            <div className="w-full max-w-sm flex flex-col items-center gap-6 animate-in zoom-in-95 duration-200">

                {/* Preview Wrapper */}
                <div className="relative shadow-2xl rounded-[32px] overflow-hidden">
                    {/* The actual card to capture */}
                    <div ref={cardRef}>
                        <ShareCard record={record} />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col w-full gap-3">
                    <button
                        onClick={handleSaveImage}
                        disabled={isGenerating}
                        className="w-full py-4 bg-primary text-white rounded-full font-bold shadow-soft active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isGenerating ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                正在生成图片...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                                保存图片
                            </>
                        )}
                    </button>

                    <button
                        onClick={onClose}
                        className="w-full py-3 text-white/70 font-medium hover:text-white transition-colors"
                    >
                        关闭
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
