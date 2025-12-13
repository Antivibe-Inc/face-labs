
export interface GeminiFaceAnalysis {
    energy_level: number;
    mood_brightness: number;
    tags: string[];
    skin_signals?: string[];
    lifestyle_hints?: string[];
    analysis_confidence?: number;
    warnings?: string[];
    // New Deep Vision Fields
    environment_context?: string; // 光线、背景、场景氛围
    eye_state?: string; // 眼神聚焦度、游离感
    micro_expression?: string; // 微表情细节 (此字段仅用于调试或展示Deep Dive)
    deep_reasoning?: string; // 综合推理链
    suggested_questions?: string[]; // AI生成的反思问题
    suggested_plans?: string[]; // AI生成的微行动
}

// Mapper to convert Gemini response to App internal format
export function mapGeminiToAppResult(gemini: GeminiFaceAnalysis): any {
    return {
        emotion: {
            summary: gemini.deep_reasoning || "AI 正在深度分析中...",
            energy_level: gemini.energy_level,
            mood_brightness: gemini.mood_brightness,
            tags: gemini.tags,
            today_suggestion: gemini.environment_context || "保持当下的状态。"
        },
        lifestyle: {
            signals: gemini.skin_signals || [],
            suggestions: gemini.suggested_plans || [],
            disclaimer: "基于 Gemini 1.5 Pro 视觉推理生成的建议，非医疗诊断。"
        },
        reflection: {
            summary: gemini.eye_state || "眼神是心理的窗户。",
            questions: gemini.suggested_questions || []
        },
        timestamp: Date.now(),
        // Pass original raw data for deep dive views
        raw_analysis: gemini
    };
}

export async function callGeminiAnalysis(image: File | string): Promise<GeminiFaceAnalysis> {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("No Gemini API Key provided");
    }

    // Convert image to Base64
    const base64Image = await new Promise<string>((resolve, reject) => {
        if (typeof image === 'string') {
            // Assume it's already a data URL or url we can fetch
            fetch(image)
                .then(r => r.blob())
                .then(blob => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const result = reader.result as string;
                        // Remove "data:image/jpeg;base64," prefix for API
                        const base64 = result.split(',')[1];
                        resolve(base64);
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                })
                .catch(reject);
        } else {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                const base64 = result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(image);
        }
    });

    const prompt = `你是一个极具洞察力的“全息状态观察者”。
你的任务不仅是看脸，更是要通过照片捕捉一个人当下的“完整生命状态”。
使用的是 Google 最先进的多模态模型，请充分发挥你的视觉推理能力。

请按照以下维度进行深度扫描：

1.  **物理与环境场 (Environment & Physics)**：
    -   观察光线（是深夜的台灯？还是清晨的阳光？是阴郁还是明亮？）。
    -   观察背景（是杂乱的工位？温馨的床头？还是空旷的户外？）。
    -   这暗示了什么样的心理安全感或压力源？

2.  **微表情与肌肉张力 (Micro-Expression & Tension)**：
    -   **眼神**：是聚焦且有神？还是游离、涣散？是有光彩还是暗淡？(Eyes are the window to the soul)
    -   **肌肉**：额头是否紧绷？咬肌是否在用力？嘴角是自然上扬还是肌肉牵拉（假笑）？肩膀是否耸起？

3.  **皮肤与生理信号 (Biological Signals)**：
    -   黑眼圈、油光、浮肿、甚至头发的凌乱程度，这些都是身体疲劳的直接证据。

基于上述观察，请输出一个 JSON 对象：

- energy_level (0-10): 综合生理能量。结合眼神光彩和肌肉张力判断。
- mood_brightness (0-10): 综合情绪亮度。结合环境氛围和微表情判断。
- tags (3-5个): 极具画面感的中文短语。如"深夜emo"、"强撑的疲惫"、"松弛感"、"眼神清澈"。相比之前的形容词，要更具体。
- skin_signals (Array): 具体的生理特征。
- environment_context (String): 一句话描述环境氛围与光线对情绪的潜在影响。
- eye_state (String): 专门描述眼神和眼部状态（如"眼神闪躲，略显焦虑"）。
- deep_reasoning (String): 用一句话合成你的“推理链”。
- lifestyle_hints (Array): 基于以上所有信息的推测。
- suggested_questions (Array): 3个基于视觉分析的、直击人心的反思问题（如“你是否在强迫自己假装合群？”）。
- suggested_plans (Array): 3个非常具体的、5分钟内能完成的恢复能量的小行动（如“去茶水间看窗外发呆3分钟”）。
- analysis_confidence (0-1): 信心度。

严格输出 JSON 格式，不要包含 markdown 标记。`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    try {
        // User explicitly requested gemini-3-pro-preview
        const model = 'gemini-3-pro-preview';
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: prompt },
                        { inline_data: { mime_type: "image/jpeg", data: base64Image } }
                    ]
                }]
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorBody = await response.text();
            console.error("Gemini API Error Body:", errorBody);
            throw new Error(`Gemini API Error: ${response.status} ${response.statusText} - ${errorBody}`);
        }

        const data = await response.json();
        const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!textOutput) {
            throw new Error("No output from Gemini");
        }

        // Clean up markdown code blocks if present
        const cleanJson = textOutput.replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            const result = JSON.parse(cleanJson);
            return result as GeminiFaceAnalysis;
        } catch (e) {
            console.error("JSON Parse Error:", textOutput);
            throw new Error("Failed to parse Gemini response");
        }
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

// --- Conversation & Final Analysis ---

export interface ConversationReply {
    observation: string;
    question: string;
    isFinal: boolean;
}

export async function generateConversationReply(
    image: string,
    preliminaryAnalysis: GeminiFaceAnalysis,
    history: { role: 'user' | 'assistant'; content: string }[]
): Promise<ConversationReply> {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) throw new Error("No Gemini API Key provided");

    const analysisContext = JSON.stringify(preliminaryAnalysis);
    const historyContext = history.map(m => `${m.role}: ${m.content}`).join('\n');

    // 判断是否是第一轮对话
    const isFirstTurn = history.length === 0;

    const prompt = `
角色：你是一个温暖、敏锐的"脸部状态观察助手"。
任务：基于用户的照片分析结果，与用户自由对话，倾听他们的状态和心事。

输入信息：
1. 初步分析结果：${analysisContext}
2. 对话历史：
${historyContext || '(首轮对话)'}

要求：
1. **引导或跟上节奏**：根据用户的回复，自然地延续对话。可以：
   - 对用户说的内容表示理解或共鸣
   - 提出相关的开放式问题，深入了解
   - 或者就用户关心的话题展开讨论
2. **不做诊断**：绝对禁止医学或心理学诊断，只描述状态（累、紧绷、放松）。
3. **简洁自然**：每次回复不超过 50 字，像朋友聊天一样自然。
4. **永远不要主动结束对话**：isFinal 始终设为 false。用户想结束时会自己点击按钮。

输出格式（JSON）：
{
    "observation": "你的回应...",
    "question": "你的追问或话题延续...",
    "isFinal": false
}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    // 构建请求体：只有第一轮发送图片
    let parts: any[];
    if (isFirstTurn) {
        const base64Image = image.includes(',') ? image.split(',')[1] : image;
        parts = [
            { text: prompt },
            { inline_data: { mime_type: "image/jpeg", data: base64Image } }
        ];
    } else {
        // 后续轮次只发送文字，使用更快的模型
        parts = [{ text: prompt }];
    }

    // 后续轮次使用更快的 flash 模型
    const model = 'gemini-2.0-flash';

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts }]
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) throw new Error("Conversation API failed");
        const data = await response.json();
        const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!textOutput) throw new Error("No output from Gemini");

        const cleanJson = textOutput.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanJson) as ConversationReply;
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

export async function analyzeFaceWithConversation(
    preliminaryAnalysis: GeminiFaceAnalysis,
    transcript: { role: 'user' | 'assistant'; content: string }[],
    pastRecords: any[] = [] // New Argument: History Context
): Promise<any> {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) throw new Error("No Gemini API Key provided");

    const analysisContext = JSON.stringify(preliminaryAnalysis);
    const transcriptContext = transcript.map(m => `${m.role}: ${m.content}`).join('\n');

    // Format History Context
    const historyContext = pastRecords.map(r =>
        `[${r.dateLabel}]: Energy=${r.emotion.energy_level}, Mood=${r.emotion.mood_brightness}, Tags=${r.emotion.tags.join(',')}, Summary=${r.emotion.summary}`
    ).join('\n');

    const prompt = `
你是一个专业的"脸部状态分析师"。请结合初步分析结果、对话内容以及**用户的历史状态趋势**，生成一份最终的详细报告。

输入：
1. 初步分析（基于照片）：${analysisContext}
2. 历史记录（过去几天的状态，用于分析趋势）：
${historyContext || "(无历史记录)"}
3. 对话内容（用户的真实描述，权重最高）：
${transcriptContext}

任务：
综合以上信息，输出最终 JSON。请特别注意：
1. **纵向分析**：如果能从历史记录中发现趋势（如连续疲劳、情绪突然低落），请在 deep_reasoning 中指出。
2. **显式归因**：你的建议必须有理有据。
3. **微行动框架**：suggested_plans 必须使用 **"当[触发场景]时，[具体行动]"** 的格式。

输出字段要求（JSON）：
- energy_level (0-10)
- mood_brightness (0-10)
- emotion_summary: String, **情绪快照**。用简短、有诗意的语言总结当下的状态（如“过度兴奋后的疲惫”、“平静的内耗”）。
- tags (2-4个标签)
- tags (2-4个标签)
- skin_signals (数组)
- lifestyle_hints (数组)
- dialog_summary：用 1-2 句话精炼总结用户在对话中透露的核心状态或心事（中文）。
- deep_reasoning: String, **必须包含对历史趋势的分析**（如果存在），并解释为什么给出下面的建议。
- suggested_questions: Array<String>, 3个基于对话深度生成的反思问题。
- suggested_plans: Array<String>, 3个小练习。**严格格式要求："[Trigger] -> [Action]"**。例如："当你感到肩膀酸痛时 -> 做一个扩胸运动"。

请返回 JSON 对象。`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
        // 不需要再发送图片，使用更快的模型
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) throw new Error("Final Analysis API failed");
        const data = await response.json();
        const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;
        const cleanJson = textOutput.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanJson);
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}
