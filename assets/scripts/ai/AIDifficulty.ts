import { GemType, GEM_TYPES } from '../board/Gem';

/**
 * AI 难度调节器 — 根据玩家表现动态调整游戏难度
 */
export class AIDifficulty {

    static readonly DIFFICULTY = {
        EASY: 0,
        NORMAL: 1,
        HARD: 2,
        EXPERT: 3,
    } as const;

    // ============ 难度计算 ============

    /**
     * 根据玩家表现计算当前难度
     */
    static calculateDifficulty(
        score: number,
        level: number,
        movesUsed: number,
        maxMoves: number,
    ): number {
        const efficiency = movesUsed > 0 ? score / movesUsed : 0;
        const movesRatio = movesUsed / maxMoves;

        // 综合评分 (0-1)
        const performance = Math.min(efficiency / 100, 1);

        if (performance > 0.8 && movesRatio < 0.6) return AIDifficulty.DIFFICULTY.EXPERT;
        if (performance > 0.6 && movesRatio < 0.7) return AIDifficulty.DIFFICULTY.HARD;
        if (performance > 0.4) return AIDifficulty.DIFFICULTY.NORMAL;
        return AIDifficulty.DIFFICULTY.EASY;
    }

    // ============ 宝石分布调整 ============

    /**
     * 根据难度调整宝石生成权重
     * 返回加权后的宝石类型数组 (权重越高越容易出现)
     */
    static adjustGemDistribution(difficulty: number): GemType[] {
        const weighted: GemType[] = [];

        switch (difficulty) {
            case AIDifficulty.DIFFICULTY.EASY:
                // 简单：减少种类，增加同类出现概率
                for (const type of [GemType.RED, GemType.BLUE, GemType.GREEN]) {
                    for (let i = 0; i < 6; i++) weighted.push(type);
                }
                for (const type of [GemType.YELLOW, GemType.PURPLE, GemType.ORANGE]) {
                    for (let i = 0; i < 2; i++) weighted.push(type);
                }
                break;

            case AIDifficulty.DIFFICULTY.HARD:
                // 困难：均匀分布，更难匹配
                for (const type of GEM_TYPES) {
                    for (let i = 0; i < 4; i++) weighted.push(type);
                }
                break;

            case AIDifficulty.DIFFICULTY.EXPERT:
                // 专家：更多颜色，完全均匀
                for (const type of GEM_TYPES) {
                    for (let i = 0; i < 3; i++) weighted.push(type);
                }
                // 添加一些额外的分散类型
                weighted.push(GemType.PURPLE, GemType.ORANGE, GemType.YELLOW);
                break;

            case AIDifficulty.DIFFICULTY.NORMAL:
            default:
                // 普通：轻微偏向常见色
                for (const type of GEM_TYPES) {
                    for (let i = 0; i < 3; i++) weighted.push(type);
                }
                weighted.push(GemType.RED, GemType.BLUE);
                break;
        }

        return weighted;
    }

    /**
     * 从权重数组中随机选一个宝石类型
     */
    static pickGemType(distribution: GemType[]): GemType {
        return distribution[Math.floor(Math.random() * distribution.length)];
    }

    // ============ 步数限制 ============

    static getMaxMoves(difficulty: number): number {
        switch (difficulty) {
            case AIDifficulty.DIFFICULTY.EASY: return 40;
            case AIDifficulty.DIFFICULTY.HARD: return 25;
            case AIDifficulty.DIFFICULTY.EXPERT: return 20;
            default: return 30;
        }
    }

    // ============ 时间限制 (秒, 0 = 无限制) ============

    static getTimeLimit(difficulty: number): number {
        switch (difficulty) {
            case AIDifficulty.DIFFICULTY.EASY: return 0;
            case AIDifficulty.DIFFICULTY.HARD: return 120;
            case AIDifficulty.DIFFICULTY.EXPERT: return 60;
            default: return 180;
        }
    }

    // ============ AI 个性 ============

    /**
     * 根据难度调整 AI 系统提示的语气
     */
    static getAIPersonality(difficulty: number): string {
        switch (difficulty) {
            case AIDifficulty.DIFFICULTY.EASY:
                return '你是友善的消除游戏导师。用鼓励的语气给出提示，帮助新手玩家。';
            case AIDifficulty.DIFFICULTY.HARD:
                return '你是严肃的消除游戏策略师。给出精准的最优解分析。';
            case AIDifficulty.DIFFICULTY.EXPERT:
                return '你是冷酷的消除大师。只给出最高效的解法，无需多余解释。';
            default:
                return '你是专业的消除游戏助教。给出简洁有力的策略建议。';
        }
    }
}
