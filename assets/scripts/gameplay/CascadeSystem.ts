import { tween, Vec3, Node, UITransform, Sprite, Color } from 'cc';
import { Gem, GemType, GEM_COLORS } from '../board/Gem';
import { BoardManager } from '../board/BoardManager';
import { MatchDetector, Match } from './MatchDetector';

/** 级联结果 */
export interface CascadeResult {
    totalScore: number;
    cascadeCount: number;
    allMatches: Match[];
}

/**
 * 级联消除系统 — 处理宝石消除、重力下落、新宝石生成
 */
export class CascadeSystem {

    /** 动画延迟 (ms) */
    private static readonly REMOVAL_DELAY = 150;
    private static readonly FALL_DELAY = 250;
    private static readonly SPAWN_DELAY = 150;

    /**
     * 执行完整的级联消除流程
     */
    static async executeCascade(
        board: (Gem | null)[][],
        boardMgr: BoardManager,
    ): Promise<CascadeResult> {
        const result: CascadeResult = {
            totalScore: 0,
            cascadeCount: 0,
            allMatches: [],
        };

        let hasMatches = true;

        while (hasMatches) {
            const matches = MatchDetector.findMatches(board);
            if (matches.length === 0) {
                hasMatches = false;
                break;
            }

            result.cascadeCount++;
            result.allMatches.push(...matches);

            // Step 1: 标记并消除匹配的宝石
            const matchedGems = new Set<Gem>();
            for (const match of matches) {
                for (const gem of match.gems) {
                    gem.isMatched = true;
                    matchedGems.add(gem);
                }
                // 计分: count²
                result.totalScore += match.count * match.count * result.cascadeCount;
            }

            // 播放消除动画
            await this.animateRemovals([...matchedGems]);

            // 从棋盘移除
            for (const gem of matchedGems) {
                boardMgr.removeGem(gem);
            }

            // Step 2: 重力下落
            const drops = this.applyGravity(board);
            await this.animateFalls(drops, boardMgr);

            // Step 3: 生成新宝石填补顶部空位
            const spawns = this.spawnGems(board);
            await this.animateSpawns(spawns, boardMgr);
        }

        return result;
    }

    // ============ 动画 ============

    private static async animateRemovals(gems: Gem[]): Promise<void> {
        await new Promise<void>(resolve => {
            let completed = 0;
            if (gems.length === 0) { resolve(); return; }
            for (const gem of gems) {
                if (!gem.node) {
                    completed++;
                    if (completed >= gems.length) resolve();
                    continue;
                }
                gem.isMatched = true;
                tween(gem.node)
                    .to(0.12, { scale: new Vec3(0, 0, 1) })
                    .call(() => {
                        completed++;
                        if (completed >= gems.length) resolve();
                    })
                    .start();
            }
        });
    }

    // ============ 重力 ============

    private static applyGravity(board: (Gem | null)[][]): Array<{ gem: Gem; targetRow: number }> {
        const cols = board.length;
        const rows = board[0].length;
        const drops: Array<{ gem: Gem; targetRow: number }> = [];

        for (let col = 0; col < cols; col++) {
            let writeRow = rows - 1;

            // 从下往上扫描
            for (let readRow = rows - 1; readRow >= 0; readRow--) {
                const gem = board[col]?.[readRow];
                if (gem) {
                    if (readRow !== writeRow) {
                        // 需要下落
                        board[col]![writeRow] = gem;
                        board[col]![readRow] = null;
                        gem.y = writeRow;
                        drops.push({ gem, targetRow: writeRow });
                    }
                    writeRow--;
                }
            }
        }

        return drops;
    }

    private static async animateFalls(
        drops: Array<{ gem: Gem; targetRow: number }>,
        boardMgr: BoardManager,
    ): Promise<void> {
        if (drops.length === 0) return;
        await new Promise<void>(resolve => {
            let completed = 0;
            for (const { gem } of drops) {
                if (!gem.node) {
                    completed++;
                    if (completed >= drops.length) resolve();
                    continue;
                }
                const targetPos = boardMgr.gemToWorld(gem.x, gem.y);
                tween(gem.node)
                    .to(0.25, { position: targetPos }, { easing: 'backIn' })
                    .call(() => {
                        completed++;
                        if (completed >= drops.length) resolve();
                    })
                    .start();
            }
            if (completed >= drops.length) resolve();
        });
    }

    // ============ 生成新宝石 ============

    private static spawnGems(board: (Gem | null)[][]): Array<{ gem: Gem; col: number; row: number }> {
        const cols = board.length;
        const rows = board[0].length;
        const spawns: Array<{ gem: Gem; col: number; row: number }> = [];

        for (let col = 0; col < cols; col++) {
            for (let row = 0; row < rows; row++) {
                if (!board[col]?.[row]) {
                    const gem = new Gem(col, row, Gem.randomType());
                    board[col]![row] = gem;
                    spawns.push({ gem, col, row });
                }
            }
        }

        return spawns;
    }

    private static async animateSpawns(
        spawns: Array<{ gem: Gem; col: number; row: number }>,
        boardMgr: BoardManager,
    ): Promise<void> {
        if (spawns.length === 0) return;

        // 为每个新宝石创建节点 — 使用 BoardManager 的公开方法
        for (const { gem } of spawns) {
            // 通过 boardMgr 创建节点 (需要暴露或重新实现)
            const node = new Node(`Gem_${gem.x}_${gem.y}`);
            if (boardMgr.boardNode) {
                node.parent = boardMgr.boardNode;
            }

            // 添加 UITransform
            const uiTransform = node.addComponent(UITransform);
            uiTransform.setContentSize(boardMgr.gemSize - 4, boardMgr.gemSize - 4);

            // 添加 Sprite
            const sprite = node.addComponent(Sprite);
            sprite.type = Sprite.Type.SIMPLE;
            sprite.sizeMode = Sprite.SizeMode.CUSTOM;
            sprite.color = this.hexToColor(GEM_COLORS[gem.type]);

            gem.node = node;

            // 从顶部外飞入
            const targetPos = boardMgr.gemToWorld(gem.x, gem.y);
            const startPos = boardMgr.gemToWorld(gem.x, -2); // above board
            node.setPosition(startPos);
            tween(node)
                .to(0.3, { position: targetPos }, { easing: 'backOut' })
                .start();
        }

        await new Promise(r => setTimeout(r, 350));
    }

    private static hexToColor(hex: string): Color {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return new Color(r, g, b, 255);
    }
}
