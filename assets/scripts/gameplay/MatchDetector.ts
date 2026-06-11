import { Gem } from '../board/Gem';

/** 匹配结果 */
export interface Match {
    /** 匹配到的宝石 */
    gems: Gem[];
    /** 匹配方向 */
    direction: 'horizontal' | 'vertical';
    /** 匹配数量 */
    count: number;
}

/**
 * 匹配检测器 — 核心算法
 * 双遍扫描：水平扫描 → 垂直扫描
 */
export class MatchDetector {

    /**
     * 在当前棋盘上查找所有匹配
     * @returns 匹配列表
     */
    static findMatches(board: (Gem | null)[][]): Match[] {
        const cols = board.length;
        if (cols === 0) return [];
        const rows = board[0].length;

        const matches: Match[] = [];

        // ====== 水平扫描 ======
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const gem = board[col]?.[row];
                if (!gem) continue;

                const type = gem.type;
                let runLen = 1;
                while (
                    col + runLen < cols &&
                    board[col + runLen]?.[row]?.type === type
                ) {
                    runLen++;
                }

                if (runLen >= 3) {
                    const matchGems: Gem[] = [];
                    for (let i = 0; i < runLen; i++) {
                        const g = board[col + i]![row]!;
                        matchGems.push(g);
                    }
                    matches.push({ gems: matchGems, direction: 'horizontal', count: runLen });
                    col += runLen - 1; // Skip the matched run
                }
            }
        }

        // ====== 垂直扫描 ======
        for (let col = 0; col < cols; col++) {
            for (let row = 0; row < rows; row++) {
                const gem = board[col]?.[row];
                if (!gem) continue;

                const type = gem.type;
                let runLen = 1;
                while (
                    row + runLen < rows &&
                    board[col]?.[row + runLen]?.type === type
                ) {
                    runLen++;
                }

                if (runLen >= 3) {
                    const matchGems: Gem[] = [];
                    for (let i = 0; i < runLen; i++) {
                        const g = board[col]![row + i]!;
                        matchGems.push(g);
                    }
                    matches.push({ gems: matchGems, direction: 'vertical', count: runLen });
                    row += runLen - 1; // Skip the matched run
                }
            }
        }

        return matches;
    }

    /**
     * 检测交换两颗宝石后是否会产生匹配
     * ISSUE-18: 只检查受影响的两行两列，而非全板扫描
     */
    static findPotentialMatch(
        board: (Gem | null)[][],
        gem1: Gem,
        gem2: Gem,
    ): Match[] {
        // 模拟交换
        const x1 = gem1.x, y1 = gem1.y;
        const x2 = gem2.x, y2 = gem2.y;

        board[x1][y1] = gem2;
        board[x2][y2] = gem1;
        gem1.x = x2; gem1.y = y2;
        gem2.x = x1; gem2.y = y1;

        // 只检查受影响的两行两列
        const cols = board.length;
        const rows = board[0].length;
        const matches: Match[] = [];
        const matchedSet = new Set<Gem>();

        // 检查 gem1 和 gem2 所在的行和列
        const rowsToCheck = new Set([y1, y2]);
        const colsToCheck = new Set([x1, x2]);

        // 水平扫描 - 只检查受影响的行
        for (const row of rowsToCheck) {
            for (let col = 0; col < cols; col++) {
                const gem = board[col]?.[row];
                if (!gem || matchedSet.has(gem)) continue;

                const type = gem.type;
                let runLen = 1;
                while (col + runLen < cols && board[col + runLen]?.[row]?.type === type) {
                    runLen++;
                }

                if (runLen >= 3) {
                    const matchGems: Gem[] = [];
                    for (let i = 0; i < runLen; i++) {
                        const g = board[col + i]![row]!;
                        matchGems.push(g);
                        matchedSet.add(g);
                    }
                    matches.push({ gems: matchGems, direction: 'horizontal', count: runLen });
                    col += runLen - 1;
                }
            }
        }

        // 垂直扫描 - 只检查受影响的列
        for (const col of colsToCheck) {
            for (let row = 0; row < rows; row++) {
                const gem = board[col]?.[row];
                if (!gem || matchedSet.has(gem)) continue;

                const type = gem.type;
                let runLen = 1;
                while (row + runLen < rows && board[col]?.[row + runLen]?.type === type) {
                    runLen++;
                }

                if (runLen >= 3) {
                    const matchGems: Gem[] = [];
                    for (let i = 0; i < runLen; i++) {
                        const g = board[col]![row + i]!;
                        matchGems.push(g);
                        matchedSet.add(g);
                    }
                    matches.push({ gems: matchGems, direction: 'vertical', count: runLen });
                    row += runLen - 1;
                }
            }
        }

        // 还原
        board[x1][y1] = gem1;
        board[x2][y2] = gem2;
        gem1.x = x1; gem1.y = y1;
        gem2.x = x2; gem2.y = y2;

        return matches;
    }
}
