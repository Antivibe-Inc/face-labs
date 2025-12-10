import { useState, useEffect } from 'react';
import { InitialView } from './InitialView';
import { AnalyzingView } from './AnalyzingView';
import { ReportView } from './ReportView';
import { analyzeFaceMock } from '../../services/mockFaceAnalysis';
import type { FaceAnalysisResult } from '../../types/analysis';
import { createRecordFromAnalysis, saveRecord, loadHistory } from '../../services/historyStore';
import { loadSettings } from '../../services/settingsStore';


type Step = 'initial' | 'analyzing' | 'report';

export function TodayContainer() {
    const [step, setStep] = useState<Step>('initial');
    const [image, setImage] = useState<string | null>(null);
    const [result, setResult] = useState<FaceAnalysisResult | null>(null);
    const [showReminder, setShowReminder] = useState(false);
    const [currentRecordId, setCurrentRecordId] = useState<string | null>(null);

    // Check for reminder conditions on mount
    useEffect(() => {
        const settings = loadSettings();
        if (!settings.reminderEnabled) return;

        // 1. Check if dismissed for today
        const todayStr = new Date().toDateString(); // "Wed Dec 10 2025"
        const dismissedDate = localStorage.getItem('faceLabs_dismissedReminderDate');
        if (dismissedDate === todayStr) return;

        // 2. Check if already has record for today
        const history = loadHistory();
        const hasTodayRecord = history.some(r => new Date(r.date).toDateString() === todayStr);
        if (hasTodayRecord) return;

        // 3. Time check: Show if it's past the reminder time
        const now = new Date();
        const reminderTime = settings.reminderHour * 60 + settings.reminderMinute;
        const currentTime = now.getHours() * 60 + now.getMinutes();

        if (currentTime >= reminderTime) {
            setShowReminder(true);
        }
    }, []);

    const handleDismissReminder = () => {
        setShowReminder(false);
        const todayStr = new Date().toDateString();
        localStorage.setItem('faceLabs_dismissedReminderDate', todayStr);
    };

    const handleImageSelect = async (file: File) => {
        // Convert to Base64 for persistence
        const reader = new FileReader();
        reader.onloadend = async () => {
            const imageUrl = reader.result as string;
            setImage(imageUrl);
            setStep('analyzing');

            try {
                const analysis = await analyzeFaceMock(file);
                setResult(analysis);
                setStep('report');

                // Auto-save to history
                const historyRecord = createRecordFromAnalysis(analysis, imageUrl);
                saveRecord(historyRecord);
                setCurrentRecordId(historyRecord.id);
            } catch (error) {
                console.error("Analysis failed:", error);
                setStep('initial');
            }
        };
        reader.readAsDataURL(file);
    };

    const handleRetake = () => {
        setImage(null);
        setResult(null);
        setStep('initial');
        setCurrentRecordId(null);
    };

    const handleSaveNote = (note: string) => {
        if (currentRecordId) {
            // Dynamically import updateRecordNote to avoid circular dependency if any (though currently clean)
            import('../../services/historyStore').then(({ updateRecordNote }) => {
                updateRecordNote(currentRecordId, note);
            });
        }
    };

    return (
        <div className="pt-6 px-4 pb-12 w-full max-w-md mx-auto">
            {step === 'initial' && (
                <InitialView
                    onImageSelect={handleImageSelect}
                    showReminder={showReminder}
                    onDismissReminder={handleDismissReminder}
                />
            )}
            {step === 'analyzing' && <AnalyzingView image={image} />}
            {step === 'report' && result && image && (
                <ReportView
                    result={result}
                    image={image}
                    onRetake={handleRetake}
                    onSaveNote={handleSaveNote}
                />
            )}
        </div>
    );
}
