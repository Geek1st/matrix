import { AIConfig, ChatMessage, AIResponse, GameContext, AIHint } from './AIConfig';

/**
 * AI 服务 — 封装与远程 AI API 的通信
 *
 * 支持 OpenAI 兼容 API (ChatGPT / DashScope 等)
 * 微信小游戏中使用 XMLHttpRequest (不支持 fetch)
 */
export class AIService {

    private config = { ...AIConfig };

    /** 更新配置 */
    public updateConfig(partial: Partial<typeof AIConfig>): void {
        Object.assign(this.config, partial);
    }

    // ============ 核心 API ============

    /**
     * 发送多轮对话
     */
    public async chat(...messages: ChatMessage[]): Promise<AIResponse> {
        if (!this.config.enabled) {
            return { content: 'AI disabled' };
        }

        // Mock 模式
        if (this.config.mockMode) {
            return this.mockResponse(messages);
        }

        try {
            return await this.httpRequest(messages);
        } catch (err) {
            console.warn('[AIService] API 失败，降级 mock:', err);
            return this.mockResponse(messages);
        }
    }

    /**
     * 单轮问答
     */
    public async ask(prompt: string, systemPrompt?: string): Promise<string> {
        const messages: ChatMessage[] = [];
        if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
        messages.push({ role: 'user', content: prompt });
        const resp = await this.chat(...messages);
        return resp.content;
    }

    /**
     * 分析游戏局面，给出最佳移动建议
     */
    public async analyzeGameState(ctx: GameContext): Promise<AIHint> {
        const systemPrompt = `你是一个消除游戏策略 AI。根据棋盘状态，找出最优的一步交换。
返回严格的 JSON 格式（不要包含任何其他文字）：
{"fromX":0,"fromY":0,"toX":1,"toY":0,"reasoning":"简短说明"}`;

        const boardStr = ctx.boardSnapshot
            ? ctx.boardSnapshot.map(row => row.join(',')).join('\n')
            : '无棋盘数据';

        const prompt = `当前状态：
- 分数: ${ctx.score}，关卡: ${ctx.level}
- 剩余步数: ${ctx.movesLeft}，连击数: ${ctx.comboCount}

棋盘 (6×6, 数字代表宝石类型):
${boardStr}

请找出最优的一步交换。`;

        try {
            const content = await this.ask(prompt, systemPrompt);
            // 尝试解析 JSON
            const match = content.match(/\{[\s\S]*\}/);
            if (match) {
                const parsed = JSON.parse(match[0]);
                return {
                    fromX: parsed.fromX ?? 0,
                    fromY: parsed.fromY ?? 0,
                    toX: parsed.toX ?? 1,
                    toY: parsed.toY ?? 0,
                    reasoning: parsed.reasoning ?? 'AI 建议',
                };
            }
        } catch {
            console.warn('[AIService] AI 返回格式异常，使用 mock');
        }

        return this.mockHint();
    }

    // ============ HTTP 请求 ============

    private httpRequest(messages: ChatMessage[]): Promise<AIResponse> {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            const timer = setTimeout(() => {
                xhr.abort();
                reject(new Error('AI 请求超时'));
            }, this.config.timeout);

            xhr.onload = () => {
                clearTimeout(timer);
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const data = JSON.parse(xhr.responseText);
                        resolve({
                            content: data.choices?.[0]?.message?.content ?? '',
                            model: data.model,
                            usage: data.usage ? {
                                promptTokens: data.usage.prompt_tokens ?? 0,
                                completionTokens: data.usage.completion_tokens ?? 0,
                                totalTokens: data.usage.total_tokens ?? 0,
                            } : undefined,
                        });
                    } catch {
                        reject(new Error('JSON 解析失败'));
                    }
                } else {
                    reject(new Error(`HTTP ${xhr.status}`));
                }
            };

            xhr.onerror = () => {
                clearTimeout(timer);
                reject(new Error('网络错误'));
            };

            xhr.open('POST', this.config.endpoint);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.setRequestHeader('Authorization', `Bearer ${this.config.apiKey}`);

            xhr.send(JSON.stringify({
                model: this.config.model,
                messages,
                max_tokens: this.config.maxTokens,
                temperature: this.config.temperature,
            }));
        });
    }

    // ============ Mock 响应 ============

    private mockResponse(messages: ChatMessage[]): AIResponse {
        const lastMsg = messages.filter(m => m.role === 'user').pop();
        const prompt = lastMsg?.content ?? '';

        let content = '保持当前策略，观察局面变化。';
        if (prompt.includes('棋盘') || prompt.includes('最优')) {
            content = '{"fromX":2,"fromY":2,"toX":3,"toY":2,"reasoning":"中间区域交换可触发连消"}';
        }
        return { content, model: 'mock' };
    }

    private mockHint(): AIHint {
        return {
            fromX: 2,
            fromY: 2,
            toX: 3,
            toY: 2,
            reasoning: 'Mock 提示：尝试中间区域的交换',
        };
    }
}
