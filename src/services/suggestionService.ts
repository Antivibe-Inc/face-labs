// ------------------------------------------------------------------
// 1. Reflection Question Library (按类型分组)
// ------------------------------------------------------------------

const QUESTIONS_LIBRARY = {
    // 适配：精力偏低 (0-3)
    body_rhythm: [
        "最近几天，你的身体有没有在用某种方式提醒你需要慢一点？",
        "今天有没有哪个时刻，其实可以允许自己暂停一下，但你还是咬牙扛过去了？",
        "如果身体能给你一个最简单的请求，它现在最想要的会是什么？",
        "有没有一件可以少做一点的事情，让你的身体轻松 10%？",
        "这段时间你的睡眠、饮食、运动节奏，哪一块最想被温柔地调整一下？"
    ],
    // 适配：心情偏沉 (0-3)
    emotion_acceptance: [
        "如果只用 1–2 个词来形容现在的心情，你会怎么说？",
        "今天有没有一个瞬间，你在强行压下本可以表达的情绪？",
        "有没有一种情绪，让你下意识地不想承认它的存在？",
        "如果允许自己对现在的状态说一句实话，那句话会是什么？",
        "这几天，你更容易对谁发脾气或冷淡？这背后可能藏着什么感受？"
    ],
    // 适配：有“紧绷”“压力”“焦虑”等标签
    stress_boundary: [
        "最近哪件事最容易让你的肩膀或下颌不自觉地绷紧？",
        "在你现在的生活里，有没有谁或什么，占用了你太多的精力？",
        "如果今天可以给自己加一个小小的边界，那会是哪一件事？",
        "你有没有习惯性答应的事情，其实是可以学着说“不”的？",
        "过去一周，有没有一件让你明显“超出负荷”的安排？"
    ],
    // 适配：心情中性或略偏好 (4-7)
    connection_nourishment: [
        "最近有没有谁的出现，让你感觉哪怕一点点被看见或被理解？",
        "今天有没有一件小事，让你在当下短暂地松了一口气？",
        "如果给自己安排一个微小的“充电时刻”，你最想怎么度过？",
        "在你目前的生活里，什么事情最能让你感觉“啊，这才是我”？",
        "有没有一种你很想要的支持，但还没来得及开口去要？"
    ],
    // 适配：精力较高且心情较亮 (7-10)
    achievement_meaning: [
        "今天有没有哪件小事，其实值得你为自己点个赞？",
        "最近你做的哪一件事，是和你真正重视的价值有关的？",
        "如果把这段时间的努力浓缩成一句话，那会是什么？",
        "有什么一直拖着没做、但对你很重要的事，可以被拆成今天的一小步？",
        "当你状态不错的时候，最想把时间用在什么事情上？"
    ],
    // 通用 / 兜底
    general: [
        "今天的你，最想对谁说一句谢谢？",
        "如果给今天的自己写一句短评，你会写什么？",
        "最近在反复出现的一个念头或主题是什么？",
        "这段时间，你有没有对自己过于苛刻的地方？",
        "如果今天只记住一件事，你希望是什么？"
    ]
};

// ------------------------------------------------------------------
// 2. Micro-Practice Library (按类型分组)
// ------------------------------------------------------------------

const PRACTICES_LIBRARY = {
    // 适配：精力偏低 (0-3)
    rest_recovery: [
        "今晚比平时提前 30 分钟上床，不刷手机，让自己多睡一会儿。",
        "把今天待办清单里一件“不是非做不可”的事情画掉，作为送给自己的礼物。",
        "留出 10 分钟，只做一件纯放松的事情，比如随便走一走、晒晒太阳。",
        "今天试着给自己一个“不太高效也没关系”的时段。",
        "如果可以的话，给自己安排一顿真正慢慢吃的饭。"
    ],
    // 适配：有“紧绷”“压力”等标签
    relax_body: [
        "找一个安静的地方，做 5 次缓慢而深长的呼吸，吸气数到 4，呼气数到 6。",
        "花 2–3 分钟，做一个轻柔的颈肩拉伸，动作以舒服为准。",
        "闭眼半分钟，只感受脚掌和椅子/地面的接触，让注意力回到身体。",
        "今天刻意放慢走路的速度 1 分钟，感受每一步的落地感。",
        "睡前用温水泡手或泡脚 5 分钟，让身体收到“可以休息”的信号。"
    ],
    // 适配：心情偏沉 (0-3)
    expression_connection: [
        "选一个你信任的人，用一两句话说说“我今天其实有点……”。",
        "在纸上写下现在最让你纠结的一件事，不需要解决，只是写出来。",
        "给过去一周的自己写一句鼓励的话，可以发出去，也可以只留在本子里。",
        "用语音或文字，对一个你在乎的人说一句真诚的感谢。",
        "在聊天软件里，找一个久未联系但你在乎的人，发一句简单的问候。"
    ],
    // 适配：精力高且心情亮 (7-10)
    use_good_state: [
        "用 20–30 分钟，推进一件你真的在意、但一直拖着的小项目。",
        "做一件能让你有成就感的小事，比如整理一个角落、完成一个 mini 任务。",
        "把今天的一段好状态，用在自己而不是别人身上：做一件只为自己开心的事。",
        "写下今天自己做得不错的三件小事，无论大小。",
        "安排一个你期待但一直没定下来的小计划，比如一趟短途、一次见面。"
    ],
    // 适配：状态中性、平稳 (4-6)
    maintain_prep: [
        "为明天的自己准备一件小小的方便，比如提前收拾好包或准备好早餐食材。",
        "用 5 分钟整理一个你每天都会用到的区域，让生活顺一点。",
        "今天为未来一周做一个非常粗略的计划，只要列出 3 件最重要的事情即可。",
        "找一个今天的平静瞬间，把它记在日记或备忘录里。",
        "对今天整体的状态说一句“谢谢你撑住了”，然后允许自己放松一下。"
    ]
};

// ------------------------------------------------------------------
// 3. Helper Functions
// ------------------------------------------------------------------

export interface EmotionState {
    energy_level: number;
    mood_brightness: number;
    tags: string[];
}

export interface RecordLike {
    emotion: EmotionState;
}

/**
 * 随机打乱数组并取前 N 个
 */
function pickRandom<T>(arr: T[], count: number): T[] {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

/**
 * 检查是否包含压力相关标签
 */
function hasStressTags(tags: string[]): boolean {
    const stressKeywords = ['紧绷', '压力', '焦虑', '崩', '疲惫', '累', '烦'];
    return tags.some(t => stressKeywords.some(k => t.includes(k)));
}

// ------------------------------------------------------------------
// 4. Main Service Logic
// ------------------------------------------------------------------

/**
 * 为记录生成反射问题 (2-4条)
 */
export function pickQuestionsForRecord(record: RecordLike): string[] {
    const { energy_level, mood_brightness, tags } = record.emotion;
    let candidates: string[] = [];

    // 1. 规则匹配
    if (energy_level <= 3) {
        candidates = candidates.concat(QUESTIONS_LIBRARY.body_rhythm);
    }

    if (mood_brightness <= 3) {
        candidates = candidates.concat(QUESTIONS_LIBRARY.emotion_acceptance);
    }

    if (hasStressTags(tags)) {
        candidates = candidates.concat(QUESTIONS_LIBRARY.stress_boundary);
    }

    // 中间状态 (4-7ish logic adapted to 0-10 scale instructions)
    // User requested: Energy Mid, Mood Plain/Brightish (4-7) -> Connection
    if (energy_level >= 4 && energy_level <= 7 && mood_brightness >= 4 && mood_brightness <= 7) {
        candidates = candidates.concat(QUESTIONS_LIBRARY.connection_nourishment);
    }

    if (energy_level >= 7 && mood_brightness >= 7) {
        candidates = candidates.concat(QUESTIONS_LIBRARY.achievement_meaning);
    }

    // 2. 整合与兜底
    // 如果候选池太小，用通用问题补充
    if (candidates.length < 2) {
        candidates = candidates.concat(QUESTIONS_LIBRARY.general);
    }

    // 去重
    const uniqueCandidates = Array.from(new Set(candidates));

    // 3. 选取逻辑
    // 至少 2 条，最多 4 条
    // 如果只有 2 条，全拿
    // 如果 > 4 条，随机选 4 条
    // 为了保证多样性，打乱后取
    // simpler: random number between 2 and 4 inclusive.
    const count = Math.floor(Math.random() * (4 - 2 + 1)) + 2;

    return pickRandom(uniqueCandidates, count);
}

/**
 * 为记录生成小练习建议 (1-3条)
 */
export function pickPracticesForRecord(record: RecordLike): string[] {
    const { energy_level, mood_brightness, tags } = record.emotion;
    let candidates: string[] = [];

    // 1. 规则匹配
    if (energy_level <= 3) {
        candidates = candidates.concat(PRACTICES_LIBRARY.rest_recovery);
    }

    if (hasStressTags(tags)) {
        candidates = candidates.concat(PRACTICES_LIBRARY.relax_body);
    }

    if (mood_brightness <= 3) {
        candidates = candidates.concat(PRACTICES_LIBRARY.expression_connection);
    }

    if (energy_level >= 7 && mood_brightness >= 7) {
        candidates = candidates.concat(PRACTICES_LIBRARY.use_good_state);
    }

    // 中间状态判断: Energy & Mood both roughly 4-6
    if (energy_level >= 4 && energy_level <= 6 && mood_brightness >= 4 && mood_brightness <= 6) {
        candidates = candidates.concat(PRACTICES_LIBRARY.maintain_prep);
    }

    // 2. 兜底
    // 如果没有任何规则命中（极少见），使用维持类
    if (candidates.length === 0) {
        candidates = candidates.concat(PRACTICES_LIBRARY.maintain_prep);
    }

    // 去重
    const uniqueCandidates = Array.from(new Set(candidates));

    // 3. 选取 1-3 条
    const count = Math.floor(Math.random() * 3) + 1; // 1 to 3
    return pickRandom(uniqueCandidates, count);
}
