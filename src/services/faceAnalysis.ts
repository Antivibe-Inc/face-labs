import type { FaceAnalysisResult, EmotionData, LifestyleData, ReflectionData } from '../types/analysis';
import { analyzeFaceMock } from './mockFaceAnalysis';
import { callGeminiAnalysis } from './geminiService';

// Helper to generate rich text based on scores if Gemini doesn't provide it
function generateRichContent(energy: number, mood: number): {
    summary: string;
    today_suggestion: string;
    questions: string[];
} {
    // 1. Summary
    let summary = `看起来精力${energy >= 7 ? '充沛' : energy >= 4 ? '尚可' : '稍显不足'}，心情${mood >= 7 ? '不错' : mood >= 4 ? '平静' : '有些低落'}。`;
    // Removed redundant tags from text summary since they are displayed below


    // 2. Suggestion
    let suggestion = "";
    if (energy < 4) {
        suggestion = "今天适合做减法，允许自己慢下来，不要强求效率。";
    } else if (energy > 7) {
        suggestion = "能量很棒！适合去推进那些重要或困难的任务。";
    } else {
        suggestion = "按部就班地推进就好，保持现在的节奏。";
    }

    // 3. Questions (Simple pool)
    const questionsPool = [
        "此时此刻，身体哪个部位感觉最明显？",
        "如果你能给自己一个拥抱，你会说什么？",
        "今天有没有一件小事让你觉得‘还不错’？",
        "现在的你，最需要的是什么？",
        "如果把现在的状态比作天气，是什么样的？",
        "今晚想给自己什么样的小奖励？"
    ];
    // Shuffle and pick 3
    const questions = questionsPool.sort(() => 0.5 - Math.random()).slice(0, 3);

    return { summary, today_suggestion: suggestion, questions };
}

export async function analyzeFace(image: File | string): Promise<FaceAnalysisResult> {
    // 1. Try Gemini Analysis
    try {
        const geminiResult = await callGeminiAnalysis(image);

        console.log("Gemini Analysis Success:", geminiResult);

        const { energy_level, mood_brightness, tags, skin_signals, lifestyle_hints, analysis_confidence, warnings } = geminiResult;

        const richContent = generateRichContent(energy_level, mood_brightness);

        const emotion: EmotionData = {
            summary: richContent.summary,
            energy_level,
            mood_brightness,
            tags,
            today_suggestion: richContent.today_suggestion,
        };

        const lifestyle: LifestyleData = {
            signals: skin_signals || [],
            suggestions: lifestyle_hints || [],
            disclaimer: "以上只是基于外观给出的粗略印象，不是医疗建议。"
        };

        const reflection: ReflectionData = {
            summary: "基于当下的状态，试着问自己：",
            questions: richContent.questions
        };

        return {
            emotion,
            lifestyle,
            reflection,
            timestamp: Date.now(),
            analysis_confidence,
            warnings
        };

    } catch (error) {
        console.warn("Gemini Analysis Failed (or no key), falling back to Mock:", error);
        // Fallback to mock
        return analyzeFaceMock(image);
    }
}
