import { useRef, useEffect, useState } from 'react';

interface CameraModalProps {
    onPhotoTaken: (file: File) => void;
    onCancel: () => void;
}

type CameraMode = 'preview' | 'captured';

export function CameraModal({ onPhotoTaken, onCancel }: CameraModalProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [mode, setMode] = useState<CameraMode>('preview');
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Initial camera setup
    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, []);

    const startCamera = async () => {
        try {
            setError(null);
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user' }
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error("Camera access error:", err);
            setError("无法访问摄像头。请检查权限或尝试使用'上传照片'功能。");
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const handleCapture = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;

        // Set canvas to match video dimensions
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Draw video frame to canvas
        // Mirror the image to match user expectation (since we mirror the preview)
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0);

        // Get data URL
        const dataUrl = canvas.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
        setMode('captured');

        // Pause/stop video stream to save resources
        video.pause();
    };

    const handleRetake = async () => {
        setCapturedImage(null);
        setMode('preview');
        // Restart the camera stream
        await startCamera();
    };

    const handleUsePhoto = () => {
        if (!capturedImage) return;

        // Convert base64 to File
        fetch(capturedImage)
            .then(res => res.blob())
            .then(blob => {
                const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
                onPhotoTaken(file);
            });
    };

    return (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col items-center justify-center animate-fade-in">
            {/* Hidden canvas for capture */}
            <canvas ref={canvasRef} className="hidden" />

            {error ? (
                <div className="text-white text-center p-6 max-w-sm">
                    <p className="mb-6 text-red-300 font-medium">{error}</p>
                    <button
                        onClick={onCancel}
                        className="px-8 py-3 bg-white text-black rounded-xl font-semibold hover:bg-gray-100 transition-colors"
                    >
                        关闭
                    </button>
                </div>
            ) : (
                <>
                    {/* Main Content Area */}
                    <div className="relative w-full h-full flex flex-col">

                        {/* Header / Top Bar (Optional, mostly for spacing) */}
                        <div className="absolute top-0 left-0 right-0 p-4 z-10 flex justify-end">
                            {/* Can add flash toggle or other controls here later */}
                        </div>

                        {/* Video / Image Display */}
                        <div className="flex-1 flex items-center justify-center bg-black overflow-hidden relative">
                            {mode === 'preview' ? (
                                <>
                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        playsInline
                                        muted
                                        className="w-full h-full object-cover transform -scale-x-100"
                                    />
                                    {/* Face Guide Overlay */}
                                    <div className="absolute inset-0 pointer-events-none">
                                        {/* Cinematic vignetting */}
                                        <div
                                            className="absolute inset-0"
                                            style={{
                                                background: 'radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.5) 80%, rgba(0,0,0,0.8) 100%)'
                                            }}
                                        />

                                        {/* Guide Area Container */}
                                        <div className="absolute inset-0 flex flex-col items-center justify-center translate-y-6">
                                            {/* Face oval guide */}
                                            <div className="relative w-[65%] aspect-[3/4.2]">
                                                {/* Dashed Oval Border */}
                                                <div
                                                    className="absolute inset-0 rounded-[45%] opacity-60"
                                                    style={{
                                                        border: '2px dashed rgba(255, 255, 255, 0.5)',
                                                    }}
                                                />

                                                {/* Corner Brackets for tech feel */}
                                                <div className="absolute -top-4 -left-4 w-8 h-8 border-t-2 border-l-2 border-white/80 rounded-tl-lg" />
                                                <div className="absolute -top-4 -right-4 w-8 h-8 border-t-2 border-r-2 border-white/80 rounded-tr-lg" />
                                                <div className="absolute -bottom-4 -left-4 w-8 h-8 border-b-2 border-l-2 border-white/80 rounded-bl-lg" />
                                                <div className="absolute -bottom-4 -right-4 w-8 h-8 border-b-2 border-r-2 border-white/80 rounded-br-lg" />

                                                {/* Center/Eye line guide */}
                                                <div className="absolute top-[45%] left-4 right-4 h-[1px] bg-white/20">
                                                    <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-white/40" />
                                                    <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-white/40" />
                                                </div>
                                            </div>

                                            {/* Text Prompt */}
                                            <div className="mt-8 px-4 py-2 bg-black/40 backdrop-blur-sm rounded-full">
                                                <p className="text-white/90 text-sm font-medium tracking-wide flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                                    请将面部对准框内
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                capturedImage && (
                                    <img
                                        src={capturedImage}
                                        alt="Captured"
                                        className="w-full h-full object-cover"
                                    />
                                )
                            )}
                        </div>

                        {/* Controls Bar */}
                        <div className="bg-gray-900/90 backdrop-blur-md px-6 py-10 pb-safe relative flex items-center justify-center">
                            {mode === 'preview' ? (
                                <>
                                    <button
                                        onClick={onCancel}
                                        className="absolute left-6 text-white font-medium px-4 py-2 hover:bg-white/10 rounded-lg transition-colors"
                                    >
                                        取消
                                    </button>

                                    <button
                                        onClick={handleCapture}
                                        className="w-20 h-20 rounded-full border-[5px] border-white/30 flex items-center justify-center bg-transparent active:scale-95 transition-all hover:border-white/50"
                                        aria-label="Capture photo"
                                    >
                                        <div className="w-[66px] h-[66px] rounded-full bg-white shadow-lg" />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={handleRetake}
                                        className="text-white font-medium px-4 py-2 hover:bg-white/10 rounded-lg transition-colors"
                                    >
                                        重拍
                                    </button>

                                    <button
                                        onClick={handleUsePhoto}
                                        className="px-6 py-3 bg-primary text-white font-semibold rounded-full shadow-lg active:scale-95 transition-transform"
                                    >
                                        使用这张照片
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
