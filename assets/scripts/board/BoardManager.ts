import { _decorator, Component, Node, Vec3, tween, UITransform, Sprite, SpriteFrame, Color, Texture2D, ImageAsset, Graphics } from 'cc';
import { Gem, GemType, GEM_COLORS } from './Gem';
import { DeadlockChecker } from '../gameplay/DeadlockChecker';

const { ccclass, property } = _decorator;

/**
 * 棋盘管理器 — 维护棋盘状态、生成/交换/消除宝石
 * 程序化创建宝石节点，不依赖预制体
 */
@ccclass('BoardManager')
export class BoardManager extends Component {

    @property({ tooltip: '列数' })
    public cols: number = 6;

    @property({ tooltip: '行数' })
    public rows: number = 6;

    @property({ tooltip: '宝石宽度 (px)' })
    public gemSize: number = 80;

    @property({ type: Node, tooltip: '棋盘父节点' })
    public boardNode: Node | null = null;

    // ============ 棋盘数据 ============

    /** board[col][row] — null 表示空格 */
    private _board: (Gem | null)[][] = [];

    public get board(): (Gem | null)[][] {
        return this._board;
    }

    // ============ 棋盘偏移 (居中) ============

    private get _offsetX(): number {
        return -(this.cols - 1) * this.gemSize / 2;
    }

    private get _offsetY(): number {
        return -(this.rows - 1) * this.gemSize / 2;
    }

    // ============ 初始化 ============

    onLoad(): void {
        this._board = [];
    }

    /** 初始化棋盘：生成随机宝石并消除初始匹配 */
    public initBoard(): void {
        // 清空现有节点
        if (this.boardNode) {
            this.boardNode.removeAllChildren();
        }

        // 创建二维数组
        for (let col = 0; col < this.cols; col++) {
            this._board[col] = [];
            for (let row = 0; row < this.rows; row++) {
                const type = Gem.randomType();
                const gem = new Gem(col, row, type);
                const node = this.createGemNode(gem);
                gem.node = node;
                this._board[col][row] = gem;
            }
        }

        // 消除初始匹配
        DeadlockChecker.removeInitialMatches(this._board);

        // 刷新显示
        for (let col = 0; col < this.cols; col++) {
            for (let row = 0; row < this.rows; row++) {
                const gem = this._board[col][row];
                if (gem && gem.node) {
                    this.updateGemNodeAppearance(gem);
                }
            }
        }

        console.log('[BoardManager] 棋盘初始化完成');
    }

    /**
     * 程序化创建宝石节点
     * 使用 Graphics 组件绘制彩色方块
     */
    private createGemNode(gem: Gem): Node | null {
        if (!this.boardNode) return null;

        const node = new Node(`Gem_${gem.x}_${gem.y}`);
        node.parent = this.boardNode;

        // 添加 UITransform
        const uiTransform = node.addComponent(UITransform);
        uiTransform.setContentSize(this.gemSize - 4, this.gemSize - 4);

        // 添加 Graphics 组件绘制彩色方块
        const graphics = node.addComponent(Graphics);
        this.drawGem(graphics, gem.type);

        // 设置位置
        const pos = this.gemToWorld(gem.x, gem.y);
        node.setPosition(pos);

        return node;
    }

    /**
     * 使用 Graphics 绘制宝石形状
     */
    private drawGem(graphics: Graphics, type: GemType): void {
        const size = this.gemSize - 8;
        const half = size / 2;
        const color = this.hexToColor(GEM_COLORS[type]);
        
        graphics.fillColor = color;
        graphics.strokeColor = Color.WHITE;
        graphics.lineWidth = 2;

        // 根据类型绘制不同形状
        switch (type) {
            case GemType.RED: // 圆形
                graphics.circle(0, 0, half);
                break;
            case GemType.BLUE: // 方形
                graphics.rect(-half, -half, size, size);
                break;
            case GemType.GREEN: // 三角形
                graphics.moveTo(0, half);
                graphics.lineTo(half, -half);
                graphics.lineTo(-half, -half);
                graphics.close();
                break;
            case GemType.YELLOW: // 菱形
                graphics.moveTo(0, half);
                graphics.lineTo(half, 0);
                graphics.lineTo(0, -half);
                graphics.lineTo(-half, 0);
                graphics.close();
                break;
            case GemType.PURPLE: // 五角星
                this.drawStar(graphics, 0, 0, 5, half, half * 0.4);
                break;
            case GemType.ORANGE: // 六边形
                this.drawHexagon(graphics, 0, 0, half);
                break;
        }

        graphics.fill();
        graphics.stroke();
    }

    private drawStar(graphics: Graphics, cx: number, cy: number, points: number, outerR: number, innerR: number): void {
        const step = Math.PI / points;
        let angle = -Math.PI / 2;
        
        graphics.moveTo(cx + outerR * Math.cos(angle), cy + outerR * Math.sin(angle));
        for (let i = 0; i < points; i++) {
            angle += step;
            graphics.lineTo(cx + innerR * Math.cos(angle), cy + innerR * Math.sin(angle));
            angle += step;
            graphics.lineTo(cx + outerR * Math.cos(angle), cy + outerR * Math.sin(angle));
        }
        graphics.close();
    }

    private drawHexagon(graphics: Graphics, cx: number, cy: number, radius: number): void {
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 6;
            const x = cx + radius * Math.cos(angle);
            const y = cy + radius * Math.sin(angle);
            if (i === 0) {
                graphics.moveTo(x, y);
            } else {
                graphics.lineTo(x, y);
            }
        }
        graphics.close();
    }

    private updateGemNodeAppearance(gem: Gem): void {
        if (!gem.node) return;
        const sprite = gem.node.getComponent(Sprite);
        if (sprite) {
            sprite.color = this.hexToColor(GEM_COLORS[gem.type]);
        }
        const pos = this.gemToWorld(gem.x, gem.y);
        gem.node.setPosition(pos);
    }

    // ============ 坐标转换 ============

    /** 棋盘坐标 → 世界坐标 */
    public gemToWorld(col: number, row: number): Vec3 {
        return new Vec3(
            this._offsetX + col * this.gemSize,
            this._offsetY + row * this.gemSize,
            0
        );
    }

    /**
     * 屏幕坐标 → 棋盘坐标
     * ISSUE-10: 使用 boardNode 的 UITransform 做坐标转换，避免与 InputHandler 的 boardArea 偏移重复计算
     */
    public screenToGem(screenX: number, screenY: number): { col: number; row: number } | null {
        let localX = screenX;
        let localY = screenY;

        // 如果有 boardNode，将坐标转换到 boardNode 本地空间
        if (this.boardNode) {
            const boardUITransform = this.boardNode.getComponent(UITransform);
            if (boardUITransform) {
                const worldPos = new Vec3(screenX, screenY, 0);
                const nodePos = boardUITransform.convertToNodeSpaceAR(worldPos);
                localX = nodePos.x;
                localY = nodePos.y;
            }
        }

        const col = Math.floor((localX - this._offsetX) / this.gemSize);
        const row = Math.floor((localY - this._offsetY) / this.gemSize);

        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) {
            return null;
        }
        return { col, row };
    }

    // ============ 基础操作 ============

    /** 获取指定位置的宝石 */
    public getGemAt(col: number, row: number): Gem | null {
        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) {
            return null;
        }
        return this._board[col]?.[row] ?? null;
    }

    /** 设置指定位置的宝石 */
    public setGemAt(col: number, row: number, gem: Gem | null): void {
        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return;
        this._board[col][row] = gem;
        if (gem) {
            gem.x = col;
            gem.y = row;
        }
    }

    /** 移除宝石 */
    public removeGem(gem: Gem): void {
        if (gem.x >= 0 && gem.x < this.cols && gem.y >= 0 && gem.y < this.rows) {
            this._board[gem.x][gem.y] = null;
        }
        if (gem.node) {
            // ISSUE-11: 先停止 tween 再销毁
            tween(gem.node).stop();
            gem.node.active = false;
            gem.node.destroy();
            gem.node = null;
        }
    }

    // ============ 交换 ============

    /**
     * 交换两颗宝石 (带动画)
     * 返回 Promise，在动画完成后 resolve
     */
    public async swapGems(gem1: Gem, gem2: Gem): Promise<void> {
        // 更新棋盘数据
        this._board[gem1.x][gem1.y] = gem2;
        this._board[gem2.x][gem2.y] = gem1;

        const tmpX = gem1.x;
        const tmpY = gem1.y;
        gem1.x = gem2.x;
        gem1.y = gem2.y;
        gem2.x = tmpX;
        gem2.y = tmpY;

        // 播放交换动画
        const pos1 = this.gemToWorld(gem1.x, gem1.y);
        const pos2 = this.gemToWorld(gem2.x, gem2.y);

        await Promise.all([
            this.moveGemNode(gem1, pos1, 0.2),
            this.moveGemNode(gem2, pos2, 0.2),
        ]);
    }

    /** 移动单个 gem 节点 */
    public async moveGemNode(gem: Gem, targetPos: Vec3, duration: number): Promise<void> {
        if (!gem.node) return;
        gem.isMoving = true;
        return new Promise(resolve => {
            tween(gem.node!)
                .to(duration, { position: targetPos }, { easing: 'sineInOut' })
                .call(() => {
                    gem.isMoving = false;
                    resolve();
                })
                .start();
        });
    }

    // ============ 重排 ============

    /** Fisher-Yates 洗牌 — 交换宝石在 board 数组中的位置 */
    public shuffleBoard(): void {
        // ISSUE-12: 交换 board 数组中的 Gem 引用，而非只交换 type
        const gems: Gem[] = [];
        for (let col = 0; col < this.cols; col++) {
            for (let row = 0; row < this.rows; row++) {
                const gem = this._board[col]?.[row];
                if (gem) gems.push(gem);
            }
        }

        // Fisher-Yates shuffle on the array
        for (let i = gems.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [gems[i], gems[j]] = [gems[j], gems[i]];
        }

        // Rebuild board with shuffled gems
        let idx = 0;
        for (let col = 0; col < this.cols; col++) {
            for (let row = 0; row < this.rows; row++) {
                const gem = gems[idx++];
                this._board[col][row] = gem;
                gem.x = col;
                gem.y = row;
            }
        }

        DeadlockChecker.removeInitialMatches(this._board);

        for (const gem of gems) {
            this.updateGemNodeAppearance(gem);
        }
    }

    // ============ 工具 ============

    private hexToColor(hex: string): Color {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return new Color(r, g, b, 255);
    }

    /** 棋盘宽度 */
    public get boardWidth(): number {
        return this.cols * this.gemSize;
    }

    /** 棋盘高度 */
    public get boardHeight(): number {
        return this.rows * this.gemSize;
    }
}
