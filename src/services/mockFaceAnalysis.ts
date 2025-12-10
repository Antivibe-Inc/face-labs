
import type { FaceAnalysisResult } from '../types/analysis';

export async function analyzeFaceMock(_image: File | string): Promise<FaceAnalysisResult> {

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const profiles = [
        {
            emotion: {
                summary: "整体比较平静，但能看出有一点疲惫。",
                energy_level: 4,
                mood_brightness: 6,
                tags: ["平静", "略疲惫", "稳重"],
                today_suggestion: "今天比较适合安静处理一些不太紧急的事情，少安排高冲突的沟通。"
            },
            lifestyle: {
                signals: ["眼下有些暗沉，可能暗示最近睡眠不是特别充足。", "眉头有一点点紧绷，可能带着些许心事。"],
                suggestions: ["今晚尽量早点上床，让自己多睡一会儿。", "睡前一小时减少刷手机的时间，让大脑慢慢安静下来。", "如果可以，傍晚去散个步透透气。"],
                disclaimer: "以上只是基于外观给出的生活方式提示，不构成任何医疗建议。"
            },
            reflection: {
                summary: "今天的你，看起来像是在扛着一些事情，但仍然在尽力稳稳地往前走。",
                questions: ["今天的待办清单里，有没有一件可以不做、先放一放的事情？", "今晚有什么简单的小动作，可以让你的身体放松哪怕10%？", "现在的你是更想一个人静静，还是找人聊聊天？"]
            }
        },
        {
            emotion: {
                summary: "看起来精力还不错，带着一份好奇心。",
                energy_level: 8,
                mood_brightness: 8,
                tags: ["有活力", "好奇", "开放"],
                today_suggestion: "今天可以安排一些需要创造力或沟通的事情，你的状态很棒。"
            },
            lifestyle: {
                signals: ["眼神明亮聚焦。", "肤色看起来比较均匀。", "表情舒展，状态不错。"],
                suggestions: ["多喝水，保持这份好状态。", "试着记录下此刻的好心情。", "把这份积极的能量分享给身边的朋友。"],
                disclaimer: "以上只是基于外观给出的生活方式提示，不构成任何医疗建议。"
            },
            reflection: {
                summary: "你看起来准备好迎接今天了，带着一种稳稳的自信。",
                questions: ["今天你想创造一点什么让自己开心的事情？", "有没有谁今天可能需要你的这一点点支持？", "如何把这份好精力用在最重要的事情上？"]
            }
        },
        {
            emotion: {
                summary: "有些内敛和深思。",
                energy_level: 3,
                mood_brightness: 5,
                tags: ["安静", "内向", "思考"],
                today_suggestion: "今天适合做一些深度思考阅读，或者简单的整理工作。"
            },
            lifestyle: {
                signals: ["目光稍微有些向内收敛。", "眉头微皱，似乎在思考。", "整体气场比较安静。"],
                suggestions: ["允许自己安安静静地待一会儿，不要有负罪感。", "喝杯热茶暖暖身子。", "不要给自己安排太满的行程。"],
                disclaimer: "以上只是基于外观给出的生活方式提示，不构成任何医疗建议。"
            },
            reflection: {
                summary: "今天的状态提示你需要一点向内的时间。",
                questions: ["如果不考虑别人的期待，你现在最想做什么？", "你是不是逼自己太紧了？", "对现在的你来说，什么样的休息最舒服？"]
            }
        }
    ];

    const profile = profiles[Math.floor(Math.random() * profiles.length)];

    console.log("Mock Analysis Result:", profile);

    return {
        ...profile,
        timestamp: Date.now()
    };
}
