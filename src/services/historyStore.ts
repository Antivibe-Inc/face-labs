
import type { FaceAnalysisResult } from '../types/analysis';

export interface FaceHistoryRecord {
    id: string;
    date: string;       // ISO string
    dateLabel: string;  // e.g. "2025年12月10日"
    thumbnail: string;  // data URL or blob URL (persisted as string)
    emotion: {
        summary: string;
        energy_level: number;
        mood_brightness: number;
        tags: string[];
    };
    lifestyle: {
        signals: string[];
        suggestions: string[];
    };
    reflection: {
        summary: string;
        questions: string[];
    };
    note?: string;      // User-written note
    // Conversation History
    conversationTranscript?: { role: 'user' | 'assistant'; content: string }[];
    dialogSummary?: string;
}

const STORAGE_KEY = 'faceLabs_history';

export function loadHistory(): FaceHistoryRecord[] {
    try {
        const json = localStorage.getItem(STORAGE_KEY);
        if (!json) return [];
        const records = JSON.parse(json) as FaceHistoryRecord[];

        // Filter out old blob URLs that might cause 404s
        return records.filter(r => !r.thumbnail.startsWith('blob:'));
    } catch (e) {
        console.error('Failed to load history:', e);
        return [];
    }
}

// Helper: Check if two dates are the same day (ignoring time)
export function isSameDay(d1: Date, d2: Date): boolean {
    return d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();
}

export function hasTodayRecord(): boolean {
    const history = loadHistory();
    const now = new Date();
    return history.some(r => isSameDay(new Date(r.date), now));
}

export function saveRecord(record: FaceHistoryRecord, options?: { ignoreDailyLimit?: boolean }): boolean {
    const history = loadHistory();

    // Daily Limit Check
    if (!options?.ignoreDailyLimit) {
        const recordDate = new Date(record.date);
        const hasTodayRecord = history.some(r => isSameDay(new Date(r.date), recordDate));

        if (hasTodayRecord) {
            return false; // Block creation
        }
    }

    // New logic: Always append, never replace.
    // Add new record to the list
    history.push(record);

    // Sort by date descending (newest first)
    history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
        return true;
    } catch (e) {
        console.error('Failed to save history:', e);
        return false;
    }
}

export function updateRecordNote(id: string, note: string): void {
    const history = loadHistory();
    const record = history.find(r => r.id === id);
    if (record) {
        record.note = note;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
        } catch (e) {
            console.error('Failed to update record note:', e);
        }
    }
}

export function deleteRecord(id: string): void {
    const history = loadHistory();
    const newHistory = history.filter(r => r.id !== id);
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
    } catch (e) {
        console.error('Failed to delete history record:', e);
    }
}

export function clearHistory(): void {
    localStorage.removeItem(STORAGE_KEY);
}

// Helper to convert analysis result to history record
export function createRecordFromAnalysis(
    analysis: FaceAnalysisResult,
    image: string
): FaceHistoryRecord {
    const date = new Date();
    // Format: "2025年12月10日 22:34"
    const dateLabel = date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });

    return {
        // Unique ID per record
        id: Date.now().toString(36) + Math.random().toString(36).substr(2),
        date: date.toISOString(),
        dateLabel,
        thumbnail: image,
        emotion: {
            summary: analysis.emotion.summary,
            energy_level: analysis.emotion.energy_level,
            mood_brightness: analysis.emotion.mood_brightness,
            tags: analysis.emotion.tags,
        },
        lifestyle: {
            signals: analysis.lifestyle.signals,
            suggestions: analysis.lifestyle.suggestions,
        },
        reflection: {
            summary: analysis.reflection.summary,
            questions: analysis.reflection.questions,
        },
        // Conversation (optional)
        dialogSummary: analysis.dialog_summary,
        // Transcript passed separately or attached to analysis? 
        // For now, let's assume we pass it in if available, or it's not in the base create function yet.
        // Logic will be handled in caller usually, but let's allow it to be injected if we update signature.
    };
}

export function createRecordWithConversation(
    analysis: FaceAnalysisResult,
    image: string,
    transcript: { role: 'user' | 'assistant'; content: string }[]
): FaceHistoryRecord {
    const record = createRecordFromAnalysis(analysis, image);
    record.conversationTranscript = transcript;
    return record;
}
