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

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${apiKey}`, {
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
        })
    });

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
}
