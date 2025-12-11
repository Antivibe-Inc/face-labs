
export interface GeminiFaceAnalysis {
    energy_level: number;
    mood_brightness: number;
    tags: string[];
    skin_signals?: string[];
    lifestyle_hints?: string[];
    analysis_confidence?: number;
    warnings?: string[];
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

    const prompt = `你是一个谨慎、保守的“脸部状态观察助手”，而不是医生，也不是心理咨询师。
你将看到一张人脸照片，请你基于**可见的表情、姿态与皮肤状态**，给出一个非常粗略的印象评估。
不要做任何医学、心理疾病、人格诊断，不要使用“抑郁症”“焦虑症患者”“病态”“人格缺陷”等词语。
你只从外观和表情推测当下可能的状态，并且承认这些判断可能是错误的。

你需要输出一个 JSON 对象，字段含义如下（所有字段名必须使用英文）：

- energy_level：数字，0–10，表示看起来的精力状态。
  - 0 = 极度疲惫，几乎撑不住；
  - 5 = 中性、普通；
  - 10 = 非常有精神、状态亢奋。
- mood_brightness：数字，0–10，表示从表情上看，心情的“亮度”。
  - 0 = 非常低落、沉重；
  - 5 = 中性、不明显；
  - 10 = 非常愉快、轻松。
- tags：字符串数组，用 2–5 个简短的中文标签来描述当下的脸部状态。
  - 例子：["略疲惫", "平静", "有点紧绷"]、["放松", "有活力"]
  - 标签要温和、描述状态，不要写诊断类词汇。
- skin_signals：字符串数组，可选，用于描述肉眼可见的皮肤特征。
  - 例如：["轻微黑眼圈", "额头有一些痘痘"]
  - 如果看不清或不确定，可以是空数组。
- lifestyle_hints：字符串数组，可选，根据表情和皮肤非常保守地推测一些可能的生活习惯倾向。
  - 例如：["可能最近睡眠不太规律"]、["长时间用眼的可能性略高"]
  - 如果没有合理依据，请返回空数组。
- analysis_confidence：0–1 之间的小数，表示你对自己判断的信心程度。
  - 如果脸部很模糊、遮挡严重、光线很差，信心就应该很低（例如 0.2）。
- warnings：字符串数组，可选，给出关于图像质量或适用性的提醒。
  - 例如："光线较暗，脸部细节不清晰"、"脸部只占画面很小一部分"。

特别重要：
- 用户只提供了一张照片，你的信息非常有限，很多推测都可能是错的。
- 不要夸大你的判断，只给出“看起来像是……”的粗略印象。
- 不要提及你是模型，也不要输出任何解释性文字，**只输出 JSON**。

输出格式示例（注意：这只是示例，不要照抄数值）：
{
  "energy_level": 4,
  "mood_brightness": 6,
  "tags": ["略疲惫", "平静"],
  "skin_signals": ["轻微黑眼圈"],
  "lifestyle_hints": ["可能最近睡眠时间偏短"],
  "analysis_confidence": 0.6,
  "warnings": []
}

现在请你根据这张照片，输出一个 JSON 对象，必须严格符合上述字段要求，不要输出任何多余文字。`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent?key=${apiKey}`, {
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
    transcript: { role: 'user' | 'assistant'; content: string }[]
): Promise<any> {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) throw new Error("No Gemini API Key provided");

    const analysisContext = JSON.stringify(preliminaryAnalysis);
    const transcriptContext = transcript.map(m => `${m.role}: ${m.content}`).join('\n');

    const prompt = `
你是一个专业的"脸部状态分析师"。请结合初步分析结果以及对话内容，生成一份最终的详细报告。

输入：
1. 初步分析（基于照片）：${analysisContext}
2. 对话内容（用户的真实描述，权重最高）：
${transcriptContext}

任务：
综合初步分析和对话内容，输出最终的 JSON 报告。如果用户的主观描述与照片分析不一致，请在 dialog_summary 中体现这种反差或结合。

输出字段要求（JSON）：
- energy_level (0-10)
- mood_brightness (0-10)
- tags (2-4个标签)
- skin_signals (数组)
- lifestyle_hints (数组)
- dialog_summary：用 1-2 句话精炼总结用户在对话中透露的核心状态或心事（中文）。

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
