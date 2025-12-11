export interface EmotionData {
    summary: string;
    energy_level: number; // 0-10
    mood_brightness: number; // 0-10
    tags: string[]; // 1-4 short strings
    today_suggestion: string;
}

export interface LifestyleData {
    signals: string[];
    suggestions: string[];
    disclaimer: string;
}

export interface ReflectionData {
    summary: string;
    questions: string[];
}

export interface FaceAnalysisResult {
    emotion: EmotionData;
    lifestyle: LifestyleData;
    reflection: ReflectionData;
    timestamp: number;
    // Optional fields from real AI analysis
    analysis_confidence?: number;
    warnings?: string[];
    // Conversation data
    dialog_summary?: string;
}

export interface ConversationMessage {
    role: 'user' | 'assistant';
    content: string;
}
