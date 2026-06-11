import { _decorator, Component, Label, director } from 'cc';
import { Gem } from '../board/Gem';
import { BoardManager } from '../board/BoardManager';
import { MatchDetector } from '../gameplay/MatchDetector';
import { CascadeSystem } from '../gameplay/CascadeSystem';
import { DeadlockChecker } from '../gameplay/DeadlockChecker';
import { ScoreManager } from '../gameplay/ScoreManager';
import { InputHandler } from '../input/InputHandler';

const { ccclass, property } = _decorator;

/** 游戏状态枚举 */
export enum GameState {
    IDLE = 'idle',
    SWAPPING = 'swapping',
    CASCADING = 'cascading',
    GAMEOVER = 'gameover',
    PAUSED = 'paused',
}

/**
 * 游戏主控 — 管理游戏流程、状态机、操作入口
 */
@ccclass('GameManager')
export class GameManager extends Component {

    // ============ 属性 ============

    @property({ type: BoardManager, tooltip: '棋盘管理器' })
    public boardManager: BoardManager | null = null;

    @property({ type: ScoreManager, tooltip: '分数管理器' })
    public scoreManager: ScoreManager | null = null;

    @property({ type: InputHandler, tooltip: '输入处理器' })
    public inputHandler: InputHandler | null = null;

    @property({ type: Label, tooltip: '剩余步数标签' })
    public movesLabel: Label | null = null;

    @property({ type: Label, tooltip: '分数标签' })
    public scoreLabel: Label | null = null;

    @property({ type: Label, tooltip: '连击标签' })
    public comboLabel: Label | null = null;

    @property({ type: Label, tooltip: '游戏结束标签' })
    public gameOverLabel: Label | null = null;

    @property({ tooltip: '最大步数' })
    public maxMoves: number = 30;

    // ============ 私有状态 ============

    private _gameState: GameState = GameState.IDLE;
    private _movesRemaining: number = 0;
    private _isProcessing: boolean = false;

    private static _instance: GameManager | null = null;

    public static get instance(): GameManager | null {
        return GameManager._instance;
    }

    // ============ 生命周期 ============

    onLoad(): void {
        if (GameManager._instance) {
            this.node.destroy();
            return;
        }
        GameManager._instance = this;
    }

    onDestroy(): void {
        if (GameManager._instance === this) {
            GameManager._instance = null;
        }
    }

    start(): void {
        this.initGame();
    }

    // ============ 初始化 ============

    private initGame(): void {
        this._gameState = GameState.IDLE;
        this._movesRemaining = this.maxMoves;

        if (this.scoreManager) this.scoreManager.reset();

        if (this.boardManager) {
            this.boardManager.initBoard();
            // 确保有合法走法
            DeadlockChecker.ensureSolvable(this.boardManager.board);
        }

        if (this.inputHandler) this.inputHandler.enable();

        if (this.gameOverLabel) this.gameOverLabel.node.active = false;

        this.updateUI();
        console.log('[GameManager] 游戏开始！');
    }

    // ============ 核心：交换尝试 ============

    /**
     * 玩家尝试交换两颗宝石
     */
    public async attemptSwap(gem1: Gem, gem2: Gem): Promise<void> {
        if (this._isProcessing) return;
        if (this._gameState === GameState.GAMEOVER || this._gameState === GameState.PAUSED) return;
        if (!this.boardManager) return;

        this._isProcessing = true;
        this._gameState = GameState.SWAPPING;
        this.inputHandler?.disable();

        let isGameOver = false;

        try {
            // 执行交换动画
            await this.boardManager.swapGems(gem1, gem2);

            // 检测匹配
            const matches = MatchDetector.findMatches(this.boardManager.board);

            if (matches.length > 0) {
                // 有匹配 → 执行级联消除
                this._gameState = GameState.CASCADING;
                const result = await CascadeSystem.executeCascade(
                    this.boardManager.board,
                    this.boardManager,
                );

                // 加分
                if (this.scoreManager) {
                    this.scoreManager.addScore(result.totalScore, result.cascadeCount);
                }

                // 更新连击显示
                this.showCombo(result.cascadeCount);

                // 消耗步数
                this._movesRemaining--;
                this.updateUI();
            } else {
                // 无匹配 → 交换回来
                await this.boardManager.swapGems(gem1, gem2);
                this.scoreManager?.resetCombo();
            }

            // 检查死锁
            if (!DeadlockChecker.hasValidMoves(this.boardManager.board)) {
                console.log('[GameManager] 无合法走法，洗牌...');
                DeadlockChecker.ensureSolvable(this.boardManager.board);
            }

            // 检查游戏结束
            this.checkGameOver();
            isGameOver = ((this._gameState as GameState) === GameState.GAMEOVER);
        } catch (error) {
            console.error('[GameManager] attemptSwap error:', error);
        } finally {
            // ISSUE-03, ISSUE-13: 游戏结束后不再恢复为 IDLE
            if (!isGameOver) {
                this._gameState = GameState.IDLE;
                this.inputHandler?.enable();
            }
            this._isProcessing = false;
            this.updateUI();
        }
    }

    // ============ 游戏结束 ============

    private checkGameOver(): void {
        if (this._movesRemaining <= 0) {
            this._gameState = GameState.GAMEOVER;
            this.inputHandler?.disable();
            if (this.gameOverLabel) {
                this.gameOverLabel.string = `游戏结束!\n得分: ${this.scoreManager?.getScore() ?? 0}`;
                this.gameOverLabel.node.active = true;
            }
            console.log('[GameManager] 游戏结束！');
        }
    }

    public isGameOver(): boolean {
        return this._gameState === GameState.GAMEOVER;
    }

    // ============ UI 更新 ============

    private updateUI(): void {
        if (this.movesLabel) {
            this.movesLabel.string = `步数: ${this._movesRemaining}`;
        }
        if (this.scoreLabel) {
            this.scoreLabel.string = `分数: ${this.scoreManager?.getScore() ?? 0}`;
        }
    }

    private showCombo(comboCount: number): void {
        if (!this.comboLabel || comboCount <= 1) return;
        this.comboLabel.string = `${comboCount} COMBO!`;
        this.comboLabel.node.active = true;
        // 2 秒后隐藏
        this.scheduleOnce(() => {
            if (this.comboLabel) this.comboLabel.node.active = false;
        }, 2);
    }

    // ============ 控制 ============

    public restartGame(): void {
        director.loadScene(director.getScene()!.name);
    }

    public pauseGame(): void {
        this._gameState = GameState.PAUSED;
        this.inputHandler?.disable();
        director.pause();
    }

    public resumeGame(): void {
        if (this._gameState === GameState.GAMEOVER) return; // ISSUE-13
        this._gameState = GameState.IDLE;
        this.inputHandler?.enable();
        director.resume();
    }

    // ============ Getters ============

    public get gameState(): GameState { return this._gameState; }
    public get movesRemaining(): number { return this._movesRemaining; }
}
