import { _decorator, Component, Node, Vec3, tween, Label, Color } from 'cc';
import { Gem } from '../board/Gem';
import { BoardManager } from '../board/BoardManager';
import { DeadlockChecker } from '../gameplay/DeadlockChecker';
import { AIService } from './AIService';
import { AIHint } from './AIConfig';

const { ccclass, property } = _decorator;

/**
 * 提示系统 — 向玩家展示推荐走法
 * 支持 AI 远程分析和本地死锁检测两种模式
 */
@ccclass('HintSystem')
export class HintSystem extends Component {

    @property({ type: BoardManager, tooltip: '棋盘管理器' })
    public boardManager: BoardManager | null = null;

    @property({ type: Node, tooltip: '提示箭头节点 (可选)' })
    public hintArrowNode: Node | null = null;

    // ============ 私有状态 ============

    private _aiService: AIService = new AIService();
    private _activeHintNodes: Node[] = [];
    private _useAI: boolean = true;

    // ============ 生命周期 ============

    onLoad(): void {
        // 预创建提示节点
    }

    // ============ 显示提示 ============

    /**
     * 显示最佳走法提示
     */
    public async showHint(): Promise<void> {
        this.clearHint();

        if (this._useAI) {
            try {
                await this.showAIHint();
                return;
            } catch {
                console.log('[HintSystem] AI 提示失败，回退到本地检测');
            }
        }

        // 本地检测：找第一个合法走法
        this.showLocalHint();
    }

    /**
     * AI 驱动的提示
     */
    private async showAIHint(): Promise<void> {
        if (!this.boardManager) return;

        // 构建棋盘快照
        const snapshot: number[][] = [];
        for (let row = 0; row < this.boardManager.rows; row++) {
            const rowData: number[] = [];
            for (let col = 0; col < this.boardManager.cols; col++) {
                const gem = this.boardManager.board[col]?.[row];
                rowData.push(gem?.type ?? -1);
            }
            snapshot.push(rowData);
        }

        const hint: AIHint = await this._aiService.analyzeGameState({
            score: 0,
            level: 1,
            movesLeft: 10,
            comboCount: 0,
            boardSnapshot: snapshot,
        });

        // 验证提示是否有效
        const gem1 = this.boardManager.getGemAt(hint.fromX, hint.fromY);
        const gem2 = this.boardManager.getGemAt(hint.toX, hint.toY);
        if (!gem1 || !gem2) {
            this.showLocalHint();
            return;
        }

        this.highlightGemPair(gem1, gem2, hint.reasoning);
    }

    /**
     * 本地提示 (无 AI)
     */
    private showLocalHint(): void {
        if (!this.boardManager) return;

        const validMoves = DeadlockChecker.findValidMoves(this.boardManager.board);
        if (validMoves.length === 0) {
            console.log('[HintSystem] 无合法走法');
            return;
        }

        const { gem1, gem2 } = validMoves[0];
        this.highlightGemPair(gem1, gem2, '试试这步！');
    }

    // ============ 视觉效果 ============

    /**
     * 高亮一对宝石
     */
    private highlightGemPair(gem1: Gem, gem2: Gem, msg: string): void {
        // 脉冲动画
        [gem1, gem2].forEach(gem => {
            if (!gem.node) return;
            // 高亮放大
            const pulseNode = new Node('HintPulse');
            gem.node.addChild(pulseNode);

            const label = pulseNode.addComponent(Label);
            label.string = '👆';
            label.fontSize = 30;
            label.color = new Color(255, 220, 0);
            pulseNode.setPosition(0, 30, 0);

            tween(pulseNode)
                .to(0.4, { position: new Vec3(0, 45, 0) })
                .to(0.4, { position: new Vec3(0, 30, 0) })
                .union()
                .repeatForever()
                .start();

            this._activeHintNodes.push(pulseNode);
        });

        // 3 秒后自动清除
        this.scheduleOnce(() => this.clearHint(), 3);

        console.log(`[HintSystem] 提示: ${msg}`);
    }

    /**
     * 清除所有提示
     */
    public clearHint(): void {
        this._activeHintNodes.forEach(node => {
            tween(node).stop();
            node.destroy();
        });
        this._activeHintNodes = [];
    }

    // ============ 获取文本建议 ============

    /**
     * 获取 AI 文本策略建议
     */
    public async getAISuggestion(): Promise<string> {
        try {
            return await this._aiService.ask(
                '分析当前局面，给出策略建议',
                '你是消除游戏策略专家。用简短的中文给出建议，不超过40字。',
            );
        } catch {
            return '多观察几次连消的机会';
        }
    }

    // ============ 设置 ============

    public setUseAI(use: boolean): void {
        this._useAI = use;
    }

    public get useAI(): boolean {
        return this._useAI;
    }
}
