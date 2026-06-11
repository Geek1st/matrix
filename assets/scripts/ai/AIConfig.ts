/**
 * AI 服务配置
 *
 * ⚠️ 生产环境请通过后端代理转发请求，不要在前端代码中硬编码 API Key
 * 微信小游戏环境建议使用云函数作为代理层
 */

export const AIConfig = {
    /** 是否启用 AI */
    enabled: true,

    /** API 端点 (DashScope OpenAI 兼容) */
    endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',

    /** API Key */
    apiKey: 'your-api-key-here',

    /** 模型 */
    model: 'qwen-plus',

    /** 超时 (ms) */
    timeout: 15000,

    /** 最大 Token */
    maxTokens: 256,

    /** 温度 (0-2) */
    temperature: 0.7,

    /** Mock 模式：离线测试用，无需 API Key */
    mockMode: false,
};

// ============ 接口 ============

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface AIResponse {
    content: string;
    model?: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
}

/** 游戏上下文 (传给 AI 分析) */
export interface GameContext {
    score: number;
    level: number;
    movesLeft: number;
    comboCount: number;
    boardSnapshot?: number[][];    // 棋盘快照 (gem type 的二维数组)
}

/** AI 提示 */
export interface AIHint {
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
    reasoning: string;
}
