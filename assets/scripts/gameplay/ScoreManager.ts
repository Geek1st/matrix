import { _decorator, Component } from 'cc';

const { ccclass, property } = _decorator;

/**
 * 分数管理器 — 单例，管理分数/连击/关卡
 */
@ccclass('ScoreManager')
export class ScoreManager extends Component {

    @property({ tooltip: '当前分数' })
    public score: number = 0;

    @property({ tooltip: '当前关卡' })
    public level: number = 1;

    @property({ tooltip: '最高分' })
    public highScore: number = 0;

    /** 连击计数 */
    private _comboCount: number = 0;

    /** 单例 */
    private static _instance: ScoreManager | null = null;

    public static get instance(): ScoreManager | null {
        return ScoreManager._instance;
    }

    onLoad(): void {
        if (ScoreManager._instance) {
            this.node.destroy();
            return;
        }
        ScoreManager._instance = this;
        this.loadHighScore();
    }

    // ============ 分数操作 ============

    /**
     * 增加分数
     * @param basePoints 基础分
     * @param comboLevel 当前连击数 (可选，不传则自动递增)
     */
    public addScore(basePoints: number, comboLevel?: number): void {
        if (comboLevel !== undefined) {
            this._comboCount = comboLevel;
        } else {
            this._comboCount++;
        }

        const multiplier = 1 + (this._comboCount - 1) * 0.1;
        const points = Math.floor(basePoints * multiplier);
        this.score += points;

        console.log(`[Score] +${points} (×${multiplier.toFixed(1)}, combo ${this._comboCount})`);

        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.saveHighScore();
        }
    }

    /** 重置连击 */
    public resetCombo(): void {
        this._comboCount = 0;
    }

    // ============ 关卡 ============

    public nextLevel(): void {
        this.level++;
        console.log(`[Score] 进入关卡 ${this.level}`);
    }

    // ============ Getters ============

    public getScore(): number { return this.score; }
    public getLevel(): number { return this.level; }
    public getCombo(): number { return this._comboCount; }
    public getHighScore(): number { return this.highScore; }

    // ============ 持久化 ============

    private saveHighScore(): void {
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('match3_high_score', this.highScore.toString());
            }
        } catch (e) {
            console.warn('[Score] 无法保存最高分:', e);
        }
    }

    private loadHighScore(): void {
        try {
            if (typeof localStorage !== 'undefined') {
                const saved = localStorage.getItem('match3_high_score');
                if (saved) this.highScore = parseInt(saved, 10) || 0;
            }
        } catch (e) {
            // 忽略
        }
    }

    /** 重置当前关卡分数 */
    public reset(): void {
        this.score = 0;
        this.level = 1;
        this._comboCount = 0;
    }
}
