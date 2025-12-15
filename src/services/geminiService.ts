
export interface GeminiFaceAnalysis {
    energy_level: number;
    mood_brightness: number;
    stress_level?: number;
    fatigue_level?: number;
    sleepiness_level?: number;
    // New 5D Metrics
    vitality_score?: number;
    calmness_score?: number;
    focus_score?: number;
    approachability_score?: number;
    confidence_score?: number;
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
    suggestion?: string; // A general suggestion field, used for today_suggestion
}

// Mapper to convert Gemini response to App internal format
export function mapGeminiToAppResult(gemini: GeminiFaceAnalysis): any {
    return {
        emotion: {
            summary: gemini.deep_reasoning || "AI 正在深度分析中...",
            energy_level: gemini.energy_level,
            mood_brightness: gemini.mood_brightness,
            stress_level: gemini['stress_level'] || 0, // Fallback for safety
            fatigue_level: gemini['fatigue_level'] || 0,
            sleepiness_level: gemini['sleepiness_level'] || 0,
            tags: gemini.tags,
            // 5D Metrics extraction (Allow undefined if missing)
            vitality_score: gemini.vitality_score,
            calmness_score: gemini.calmness_score,
            focus_score: gemini.focus_score,
            approachability_score: gemini.approachability_score,
            confidence_score: gemini.confidence_score,
            today_suggestion: gemini.suggestion || "保持微笑，继续加油！"
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

/**
 * Universal fetcher for Gemini API.
 * 
 * Logic:
 * 1. If VITE_GEMINI_API_KEY is present (Local Dev), call Google directly.
 * 2. If VITE_GEMINI_API_KEY is missing (Production), call our own Serverless Proxy (/api/gemini).
 */
async function fetchGemini(model: string, contents: any[], signal?: AbortSignal): Promise<any> {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (apiKey) {
        // --- Local Dev / Direct Access ---
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ contents }),
            signal
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Gemini API Error: ${response.status} ${response.statusText} - ${errorBody}`);
        }
        return await response.json();

    } else {
        // --- Production / Proxy Access ---
        const response = await fetch(`/api/gemini`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model,
                contents
            }),
            signal
        });

        if (!response.ok) {
            const errorBody = await response.text();
            // Try to parse JSON error if possible
            try {
                const jsonErr = JSON.parse(errorBody);
                throw new Error(jsonErr.error || "Proxy API Error");
            } catch (e) {
                throw new Error(`Proxy API Error: ${response.status} ${response.statusText}`);
            }
        }
        return await response.json();
    }
}

export async function callGeminiAnalysis(image: File | string): Promise<GeminiFaceAnalysis> {
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

- energy_level (0-10): **精力值**。观察眼神光彩和肌肉张力。0-3(低):眼神涣散/眼皮沉重；4-6(中):眼神正常/无强烈光彩；7-10(高):眼神炯炯有神/肌肉紧致。
- mood_brightness (0-10): **心情亮度**。观察嘴角和环境氛围。0-3(低):不悦/悲伤/嘴角下撇；4-6(中):平静/礼貌性微笑；7-10(高):明显开心/大笑/眼神飞扬。
- stress_level (0-10): **压力值**。观察眉间纹和咬肌。0-3(低):面部舒展/无紧绷；4-6(中):眉间轻微皱褶/嘴角用力；7-10(高):咬肌突出/额头紧皱/苦瓜脸。
- fatigue_level (0-10): **疲劳度**。观察肌肉下垂程度。0-3(低):精力充沛；4-6(中):眼神略显疲态；7-10(高):累瘫感/眼袋明显下垂/面部松弛。
- sleepiness_level (0-10): **困倦感**。观察眼睛开合度。0-3(清醒):眼睛睁大；4-6(微困):眼睑略下垂/打哈欠；7-10(极困):眼睛快要闭上。

- vitality_score (0-10): **气色值 (Glow)**。观察皮肤状态。0-3(低):脸色苍白/蜡黄/暗沉/黑眼圈深；4-6(中):肤色正常/无高光；7-10(高):皮肤有光泽/白里透红/健康感强。
- calmness_score (0-10): **平静度 (Stability)**。观察情绪波动。0-3(焦虑):眉间紧锁/眼神游离/不安；4-6(中):正常放松；7-10(宁静):面部有定力/眼神深邃稳定/从容。
- focus_score (0-10): **专注力 (Focus)**。观察眼神聚焦。0-3(涣散):眼神空洞/四处张望；4-6(一般):配合拍照感；7-10(聚焦):目光如炬/有穿透力/在审视。
- approachability_score (0-10): **亲和力 (Openness)**。观察开放度。0-3(冷漠):表情严肃/防御性强；4-6(随和):不排斥但也不热情；7-10(热情):真诚微笑(Duchenne)/令人想亲近。
- confidence_score (0-10): **自信度 (Power)**。观察姿态气场。0-3(畏缩):低头含胸/眼神闪躲；4-6(正常):平视自然；7-10(强大):昂首挺胸/直视镜头/掌控感强。

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
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 120s timeout

    try {
        // User explicitly requested gemini-3-pro-preview
        const model = 'gemini-3-pro-preview';

        const contents = [{
            parts: [
                { text: prompt },
                { inline_data: { mime_type: "image/jpeg", data: base64Image } }
            ]
        }];

        const data = await fetchGemini(model, contents, controller.signal);

        clearTimeout(timeoutId);

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

    const analysisContext = JSON.stringify(preliminaryAnalysis);
    const historyContext = history.map(m => `${m.role}: ${m.content}`).join('\n');

    // 判断是否是第一轮对话
    const isFirstTurn = history.length === 0;

    // 强力系统指令
    const systemInstruction = `
你是一个返回纯 JSON 的状态观察助手。
绝对不要输出任何 markdown 标记、解释文字或开场白。
严禁输出 "Hello" 或 "Here is the JSON" 之类的废话。
只输出一个合法的 JSON 对象。

输入信息：
1. 初步分析结果：${analysisContext}
2. 对话历史：
${historyContext || '(首轮对话)'}

输出格式（严格 JSON）：
{
    "observation": "你的简短回应（50字内）",
    "question": "你的温和追问（20字内）",
    "isFinal": false
}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    // 构建请求体：只有第一轮发送图片
    let parts: any[];
    if (isFirstTurn) {
        const base64Image = image.includes(',') ? image.split(',')[1] : image;
        parts = [
            { text: systemInstruction },
            { inline_data: { mime_type: "image/jpeg", data: base64Image } }
        ];
    } else {
        // 后续轮次只发送文字
        parts = [{ text: systemInstruction }];
    }

    const model = 'gemini-2.0-flash';

    try {
        const contents = [{ parts }];
        const data = await fetchGemini(model, contents, controller.signal);

        clearTimeout(timeoutId);

        const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!textOutput) throw new Error("No output from Gemini");

        // Robust JSON Parsing using Regex
        // Match everything from the first '{' to the last '}'
        const jsonMatch = textOutput.match(/\{[\s\S]*\}/);

        let cleanJson = textOutput;
        if (jsonMatch) {
            cleanJson = jsonMatch[0];
        } else {
            // Fallback: simple cleanup
            cleanJson = textOutput.replace(/```json/g, '').replace(/```/g, '').trim();
        }

        return JSON.parse(cleanJson) as ConversationReply;
    } catch (error) {
        clearTimeout(timeoutId);
        console.error("Gemini Conversation Error:", error);
        // Fallback response to keep app alive
        return {
            observation: "抱歉，我的思维因为网络波动稍微卡了一下。",
            question: "能再说一遍刚才的话吗？",
            isFinal: false
        };
    }
}

export async function analyzeFaceWithConversation(
    preliminaryAnalysis: GeminiFaceAnalysis,
    transcript: { role: 'user' | 'assistant'; content: string }[],
    pastRecords: any[] = [] // New Argument: History Context
): Promise<any> {

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
- stress_level (0-10)
- fatigue_level (0-10)
- sleepiness_level (0-10)
- vitality_score (0-10): **气色值**。重点观察两点：1.皮肤的光泽感与血色（Rosiness/Glow）；2.整张脸透出的“生命力”（Vibrancy）。苍白、暗沉或死气沉沉得0-4分；红润、有光泽、生机勃勃得7-10分。
- calmness_score (0-10): **平静度**。观察面部肌肉的“静止感”。眉间无紧锁、嘴角无紧绷、眼神不游离。焦虑不安得0-4分；安详、定以从容得7-10分。
- focus_score (0-10): **专注力**。观察眼神的“穿透力”与聚焦感（Gaze Intensity）。眼神涣散空洞得0-4分；目光如炬、若有所思得7-10分。
- approachability_score (0-10): **亲和力**。观察面部的“开放度”。是否面带微笑？表情是否柔和？拒人千里或冷漠得0-4分；温暖、友善、令人想亲近得7-10分。
- confidence_score (0-10): **自信度**。观察头颈姿态与眼神的“坚定感”。畏缩、闪躲得0-4分；昂扬、坚定、气场强大得7-10分。

- emotion_summary: String, **情绪快照**。用简短、有诗意的语言总结当下的状态（如“过度兴奋后的疲惫”、“平静的内耗”）。
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
        const contents = [{
            parts: [{ text: prompt }]
        }];

        const data = await fetchGemini('gemini-2.0-flash', contents, controller.signal);

        clearTimeout(timeoutId);

        const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;
        const cleanJson = textOutput.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanJson);
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}
