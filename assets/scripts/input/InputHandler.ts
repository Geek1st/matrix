import { _decorator, Component, Node, Vec3, input, Input, EventTouch, UITransform, tween } from 'cc';
import { Gem } from '../board/Gem';
import { BoardManager } from '../board/BoardManager';
import { GameManager } from '../game/GameManager';

const { ccclass, property } = _decorator;

/**
 * 输入处理器 — 处理触摸/滑动手势，实现宝石选择和交换
 */
@ccclass('InputHandler')
export class InputHandler extends Component {

    @property({ type: BoardManager, tooltip: '棋盘管理器' })
    public boardManager: BoardManager | null = null;

    // ISSUE-17: 使用 GameManager 类型替代 any
    @property({ type: GameManager, tooltip: '游戏管理器' })
    public gameManager: GameManager | null = null;

    @property({ type: Node, tooltip: '触摸区域节点' })
    public boardArea: Node | null = null;

    // ============ 私有状态 ============

    private _selectedGem: Gem | null = null;
    private _touchStartPos: Vec3 = new Vec3();
    private _isEnabled: boolean = false;

    // ============ 配置 ============

    private readonly SWIPE_THRESHOLD = 20;  // 最小滑动距离 (px)

    // ============ 生命周期 ============

    onLoad(): void {
        const target = this.boardArea || this.node;
        target.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
        target.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        target.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    onDestroy(): void {
        const target = this.boardArea || this.node;
        target.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
        target.off(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        target.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    // ============ 启用/禁用 ============

    public enable(): void {
        this._isEnabled = true;
    }

    public disable(): void {
        this._isEnabled = false;
        this.deselectGem();
    }

    // ============ 触摸事件 ============

    private onTouchStart(event: EventTouch): void {
        if (!this._isEnabled || !this.boardManager) return;

        const uiPos = event.getUILocation();
        const boardPos = this.screenToBoardPos(uiPos.x, uiPos.y);
        if (!boardPos) return;

        const gem = this.boardManager.getGemAt(boardPos.col, boardPos.row);
        if (!gem) return;

        // 选中宝石
        this.selectGem(gem);
        this._touchStartPos.set(uiPos.x, uiPos.y, 0);
    }

    private onTouchMove(event: EventTouch): void {
        if (!this._selectedGem || !this._isEnabled) return;

        // 可选：显示滑动方向提示
    }

    private onTouchEnd(event: EventTouch): void {
        if (!this._selectedGem || !this._isEnabled || !this.boardManager || !this.gameManager) {
            this.deselectGem();
            return;
        }

        const uiPos = event.getUILocation();
        const dx = uiPos.x - this._touchStartPos.x;
        const dy = uiPos.y - this._touchStartPos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.SWIPE_THRESHOLD) {
            // 滑动距离不够，取消选择
            this.deselectGem();
            return;
        }

        // 确定滑动方向 (4-way)
        let targetGem: Gem | null = null;

        if (Math.abs(dx) > Math.abs(dy)) {
            // 水平滑动
            if (dx > 0) {
                targetGem = this.boardManager.getGemAt(this._selectedGem.x + 1, this._selectedGem.y);
            } else {
                targetGem = this.boardManager.getGemAt(this._selectedGem.x - 1, this._selectedGem.y);
            }
        } else {
            // 垂直滑动
            if (dy > 0) {
                targetGem = this.boardManager.getGemAt(this._selectedGem.x, this._selectedGem.y + 1);
            } else {
                targetGem = this.boardManager.getGemAt(this._selectedGem.x, this._selectedGem.y - 1);
            }
        }

        if (targetGem) {
            // 执行交换
            const gem1 = this._selectedGem;
            this.deselectGem();
            // ISSUE-14: 处理异步调用的异常
            this.gameManager.attemptSwap(gem1, targetGem).catch((error: Error) => {
                console.error('[InputHandler] attemptSwap failed:', error);
            });
        } else {
            this.deselectGem();
        }
    }

    // ============ 宝石选中/取消 ============

    private selectGem(gem: Gem): void {
        this.deselectGem();
        this._selectedGem = gem;

        if (gem.node) {
            // 视觉反馈：放大
            tween(gem.node)
                .to(0.1, { scale: new Vec3(1.2, 1.2, 1) })
                .start();
        }
    }

    private deselectGem(): void {
        if (this._selectedGem?.node) {
            tween(this._selectedGem.node)
                .to(0.1, { scale: new Vec3(1, 1, 1) })
                .start();
        }
        this._selectedGem = null;
    }

    // ============ 坐标转换 ============

    /**
     * 屏幕点击坐标 → 棋盘格子坐标
     */
    private screenToBoardPos(screenX: number, screenY: number): { col: number; row: number } | null {
        if (!this.boardManager || !this.boardArea) return null;

        // 获取 boardArea 的 UITransform 来转换坐标
        const uiTransform = this.boardArea.getComponent(UITransform);
        if (!uiTransform) return null;

        // 将屏幕坐标转换为 boardArea 的本地坐标
        const localPos = uiTransform.convertToNodeSpaceAR(new Vec3(screenX, screenY, 0));

        // 使用 BoardManager 的坐标转换
        return this.boardManager.screenToGem(localPos.x, localPos.y);
    }

    // ============ Getter ============

    public get selectedGem(): Gem | null {
        return this._selectedGem;
    }
}
