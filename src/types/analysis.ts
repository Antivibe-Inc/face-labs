export interface EmotionData {
    summary: string;
    energy_level: number; // 0-10
    mood_brightness: number; // 0-10
    stress_level?: number; // 0-10 (New)
    fatigue_level?: number; // 0-10 (New)
    sleepiness_level?: number; // 0-10 (New: based on eye bags, puffiness)
    tags: string[]; // 1-4 short strings
    today_suggestion: string;
    // AI Dynamic Suggestions
    suggested_questions?: string[];
}

export interface LifestyleData {
    signals: string[];
    suggestions: string[];
    disclaimer: string;
    suggested_plans?: string[]; // AI Generated Action Plans
}

export interface ReflectionData {
    summary: string;
    questions: string[];
    ai_generated_questions?: string[];
}

export interface FaceAnalysisResult {
    emotion: EmotionData;
    lifestyle: LifestyleData;
    reflection: ReflectionData;
    timestamp: number;
    // Optional fields from real AI analysis
    analysis_confidence?: number;
    warnings?: string[];
    deep_reasoning?: string; // AI Reasoning Chain
    // Conversation data
    dialog_summary?: string;
}

export interface ConversationMessage {
    role: 'user' | 'assistant';
    content: string;
}
