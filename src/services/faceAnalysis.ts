import type { FaceAnalysisResult, EmotionData, LifestyleData, ReflectionData } from '../types/analysis';
import { analyzeFaceMock } from './mockFaceAnalysis';
import { callGeminiAnalysis, type GeminiFaceAnalysis } from './geminiService';

// Helper to map raw Gemini fields to our domain model
export function formatAnalysisResult(raw: GeminiFaceAnalysis): FaceAnalysisResult {
    // Generate derived fields (mocking logic moved from original function)
    const today_suggestion = "根据你的状态，今天适合多喝水，早点休息。"; // Simplified fallback

    // Pick reflection questions (could be moved to suggestionService entirely, but mapping here for now)
    const summary = raw.tags?.join(' ') || "平静";
    const questions = [
        "此刻身体哪个部位感觉最明显？",
        "如果用一个词形容今天，是什么？"
    ];

    return {
        emotion: {
            summary: summary,
            energy_level: raw.energy_level,
            mood_brightness: raw.mood_brightness,
            tags: raw.tags || [],
            today_suggestion: today_suggestion
        },
        lifestyle: {
            signals: raw.skin_signals || [],
            suggestions: raw.lifestyle_hints || [],
            disclaimer: "以上分析基于面部特征的粗略推断，仅供参考，请勿作为医学依据。"
        },
        reflection: {
            summary: `看起来你处于${summary}的状态。`,
            questions: questions
        },
        timestamp: Date.now(),
        analysis_confidence: raw.analysis_confidence,
        warnings: raw.warnings
    };
}

export async function analyzeFace(image: File | string): Promise<FaceAnalysisResult> {
    // 1. Try Gemini Analysis
    try {
        const rawAnalysis = await callGeminiAnalysis(image);
        return formatAnalysisResult(rawAnalysis);
    } catch (error) {
        console.warn("Gemini Analysis Failed (or no key), falling back to Mock:", error);
        // Fallback to mock
        return analyzeFaceMock(image);
    }
}
