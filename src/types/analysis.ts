export interface EmotionData {
    summary: string;
    energy_level: number; // 0-10
    mood_brightness: number; // 0-10
    stress_level?: number; // 0-10 (New)
    fatigue_level?: number; // 0-10 (New)
    sleepiness_level?: number; // 0-10 (New: based on eye bags, puffiness)
    // Face Wellness 5D Metrics
    vitality_score?: number;      // 气色值 (Core Vitality)
    calmness_score?: number;      // 平静度 (Emotional Valence)
    focus_score?: number;         // 专注力 (Cognitive Readiness)
    approachability_score?: number; // 亲和力 (Social Radiance)
    confidence_score?: number;    // 自信度 (Social Radiance)
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
