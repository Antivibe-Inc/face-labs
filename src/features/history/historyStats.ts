
import type { FaceHistoryRecord } from '../../services/historyStore';

export interface WeeklyStats {
    count: number;
    avgEnergy: number;
    avgMood: number;
}

export interface WeeklySummary {
    title: string;
    description: string;
    tips: string[];
}

export function getWeeklyStats(allRecords: FaceHistoryRecord[]): WeeklyStats | null {
    const now = new Date();
    // Start of 7 days ago (reset time to safe margin if needed, but simple subtraction works for ISO comparison)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const weeklyRecords = allRecords.filter(r => {
        const rDate = new Date(r.date);
        return rDate >= sevenDaysAgo && rDate <= now;
    });

    if (weeklyRecords.length < 2) {
        return null;
    }

    const totalEnergy = weeklyRecords.reduce((sum, r) => sum + r.emotion.energy_level, 0);
    const totalMood = weeklyRecords.reduce((sum, r) => sum + r.emotion.mood_brightness, 0);

    return {
        count: weeklyRecords.length,
        avgEnergy: totalEnergy / weeklyRecords.length,
        avgMood: totalMood / weeklyRecords.length
    };
}

export function buildWeeklySummary(stats: WeeklyStats): WeeklySummary {
    const { avgEnergy, avgMood } = stats;

    let title = "";
    let description = "";
    let tips: string[] = [];

    // Analyze Energy
    // Low: <= 3, Mid: 4-6, High: >= 7
    const energyLevel = avgEnergy <= 3 ? 'low' : avgEnergy >= 7 ? 'high' : 'mid';
    // Analyze Mood
    // Low: <= 3, Mid: 4-6, High: >= 7
    const moodLevel = avgMood <= 3 ? 'low' : avgMood >= 7 ? 'high' : 'mid';

    // Logic Tree for Title & Description
    if (energyLevel === 'low' && moodLevel === 'low') {
        title = "状态有些低滑，需要关怀";
        description = "这一周，你的整体状态似乎处在一个低谷，这完全没关系，每个人都有这样的时刻。";
        tips = [
            "允许自己什么都不做，真正地休息一下。",
            "试着把注意力收回到自己身上，少关注外界的信息。",
            "如果感到吃力，记得像对待好朋友一样对待自己。"
        ];
    } else if (energyLevel === 'low' && moodLevel === 'mid') {
        title = "能量偏低，但心态平稳";
        description = "这一周，你的脸有点“能量偏低但还在努力运转”的感觉，心态上还是稳住的。";
        tips = [
            "看看能不能对待办清单做一些“减法”，给身体和大脑腾一点空。",
            "这周可以刻意为自己留出一点真正休息的时间，而不是只刷手机。",
            "早点睡觉，哪怕只早睡半小时。"
        ];
    } else if (energyLevel === 'low' && moodLevel === 'high') {
        title = "虽然累，但心情不错";
        description = "看起来你在用比较少的能量，维持着很不错的心情，可能是有什么让你开心的事情撑着你。";
        tips = [
            "注意不要过度透支这种好心情带来的兴奋感。",
            "利用心情好的时候，快速解决一两件小事，然后就去休息。",
            "多喝水，补充身体的基本需求。"
        ];
    } else if (energyLevel === 'mid' && moodLevel === 'low') {
        title = "有些心事，略显沉重";
        description = "你的日常运转还可以，但看起来心头上可能压着一些事情，让表情显得有点重。";
        tips = [
            "试着找一个可以安心说话的人聊聊，或者写下来。",
            "去户外走走，看看远处的风景，帮大脑换个频道。",
            "如果不想说话，就安安静静听一首喜欢的歌。"
        ];
    } else if (energyLevel === 'mid' && moodLevel === 'mid') {
        title = "整体平稳，张弛有度";
        description = "这一周，你的脸看起来整体比较平稳，没有太大的起伏，这是一种很可持续的状态。";
        tips = [
            "在平稳的日子里，也可以给自己安排一点小惊喜。",
            "维持目前的节奏就好，不用刻意改变什么。",
            "记得把这种安稳的感觉记录下来。"
        ];
    } else if (energyLevel === 'mid' && moodLevel === 'high') {
        title = "状态不错，轻松自在";
        description = "你给人一种比较轻盈的感觉，生活和工作似乎都在你的掌控之中。";
        tips = [
            "把现在的好状态分享给身边的人。",
            "可以尝试一件一直想做但没做的小事。",
            "保持好的睡眠习惯，延续这份自在。"
        ];
    } else if (energyLevel === 'high' && moodLevel === 'low') {
        title = "正在硬撑，紧绷感明显";
        description = "你看起来很有劲，但心情似乎不高，像是在用强撑的意志力去对抗什么。";
        tips = [
            "这周你辛苦了，试着卸下一点点防备。",
            "问问自己：这件事真的需要现在就拼尽全力吗？",
            "做一个深呼吸，放松一下紧咬的牙关。"
        ];
    } else if (energyLevel === 'high' && moodLevel === 'mid') {
        title = "精力充沛，稳步向前";
        description = "这一周，你看起来很有干劲，情绪也比较稳定，是处理复杂任务的好时机。";
        tips = [
            "可以利用这股状态，安排一些你真正在意、但一直拖延的事情。",
            "记得在全速前进的时候，也给自己留喘口气的空隙。",
            "运动一下，让身体的能量流动起来。"
        ];
    } else { // High Energy, High Mood
        title = "全开状态，光彩照人";
        description = "这一周，你整体给人的感觉是比较有劲、心情也偏明亮，状态非常棒！";
        tips = [
            "尽情享受这段高光时刻吧！",
            "也许可以尝试很有挑战性的新事物。",
            "把你的热情传递给需要鼓励的人。"
        ];
    }

    return { title, description, tips };
}
