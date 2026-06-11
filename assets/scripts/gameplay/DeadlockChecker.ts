import { Gem, GemType } from '../board/Gem';

/**
 * 死锁检测器 — 确保棋盘始终有合法走法
 */
export class DeadlockChecker {

    /**
     * 检查棋盘是否有合法走法
     */
    static hasValidMoves(board: (Gem | null)[][]): boolean {
        const cols = board.length;
        if (cols === 0) return false;
        const rows = board[0].length;

        for (let col = 0; col < cols; col++) {
            for (let row = 0; row < rows; row++) {
                const gem = board[col]?.[row];
                if (!gem) continue;

                // 尝试与右侧交换
                if (col + 1 < cols) {
                    const neighbor = board[col + 1]?.[row];
                    if (neighbor) {
                        const simulated = this.simulateSwap(board, gem, neighbor);
                        if (simulated) return true;
                    }
                }

                // 尝试与下方交换
                if (row + 1 < rows) {
                    const neighbor = board[col]?.[row + 1];
                    if (neighbor) {
                        const simulated = this.simulateSwap(board, gem, neighbor);
                        if (simulated) return true;
                    }
                }
            }
        }

        return false;
    }

    /**
     * 找出所有合法走法
     */
    static findValidMoves(board: (Gem | null)[][]): Array<{ gem1: Gem; gem2: Gem }> {
        const cols = board.length;
        if (cols === 0) return [];
        const rows = board[0].length;
        const validMoves: Array<{ gem1: Gem; gem2: Gem }> = [];

        // ISSUE-21: 移除冗余的 checkedPairs Set
        for (let col = 0; col < cols; col++) {
            for (let row = 0; row < rows; row++) {
                const gem = board[col]?.[row];
                if (!gem) continue;

                // 右邻
                if (col + 1 < cols) {
                    const nb = board[col + 1]?.[row];
                    if (nb && this.simulateSwap(board, gem, nb)) {
                        validMoves.push({ gem1: gem, gem2: nb });
                    }
                }

                // 下邻
                if (row + 1 < rows) {
                    const nb = board[col]?.[row + 1];
                    if (nb && this.simulateSwap(board, gem, nb)) {
                        validMoves.push({ gem1: gem, gem2: nb });
                    }
                }
            }
        }

        return validMoves;
    }

    /**
     * 模拟交换两颗宝石，检查是否产生匹配
     */
    private static simulateSwap(board: (Gem | null)[][], gem1: Gem, gem2: Gem): boolean {
        const x1 = gem1.x, y1 = gem1.y;
        const x2 = gem2.x, y2 = gem2.y;

        // 交换
        board[x1][y1] = gem2;
        board[x2][y2] = gem1;

        // ISSUE-22: 使用明确的坐标变量，避免语义混淆
        // 检查 gem2 新位置 (x1, y1)
        const m1 = this.checkGemMatches(board, x1, y1);
        // 检查 gem1 新位置 (x2, y2)
        const m2 = this.checkGemMatches(board, x2, y2);

        // 还原
        board[x1][y1] = gem1;
        board[x2][y2] = gem2;

        return m1 || m2;
    }

    /**
     * 检查某位置是否有 3+ 匹配
     */
    private static checkGemMatches(board: (Gem | null)[][], col: number, row: number): boolean {
        const gem = board[col]?.[row];
        if (!gem) return false;
        const type = gem.type;
        const cols = board.length;
        const rows = board[0].length;

        // 水平检查
        let hCount = 1;
        let c = col - 1;
        while (c >= 0 && board[c]?.[row]?.type === type) { hCount++; c--; }
        c = col + 1;
        while (c < cols && board[c]?.[row]?.type === type) { hCount++; c++; }
        if (hCount >= 3) return true;

        // 垂直检查
        let vCount = 1;
        let r = row - 1;
        while (r >= 0 && board[col]?.[r]?.type === type) { vCount++; r--; }
        r = row + 1;
        while (r < rows && board[col]?.[r]?.type === type) { vCount++; r++; }
        if (vCount >= 3) return true;

        return false;
    }

    /**
     * 消除初始棋盘上的匹配 (收集后批量替换，避免顺序干扰)
     */
    static removeInitialMatches(board: (Gem | null)[][]): void {
        const cols = board.length;
        const rows = board[0].length;

        let hasMatch = true;
        let iterations = 0;
        const maxIterations = 100;

        while (hasMatch && iterations < maxIterations) {
            hasMatch = false;
            iterations++;

            // ISSUE-08: 先收集所有需要替换的位置，再批量替换
            const toReplace: Array<{ col: number; row: number }> = [];

            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    const gem = board[col]?.[row];
                    if (!gem) continue;

                    // 检查右侧 2 个
                    if (
                        col + 2 < cols &&
                        board[col + 1]?.[row]?.type === gem.type &&
                        board[col + 2]?.[row]?.type === gem.type
                    ) {
                        toReplace.push({ col, row });
                        hasMatch = true;
                    }

                    // 检查下方 2 个
                    if (
                        row + 2 < rows &&
                        board[col]?.[row + 1]?.type === gem.type &&
                        board[col]?.[row + 2]?.type === gem.type
                    ) {
                        toReplace.push({ col, row });
                        hasMatch = true;
                    }
                }
            }

            // 批量替换（去重）
            const replaced = new Set<string>();
            for (const pos of toReplace) {
                const key = `${pos.col},${pos.row}`;
                if (!replaced.has(key)) {
                    replaced.add(key);
                    const gem = board[pos.col]?.[pos.row];
                    if (gem) gem.type = Gem.randomType();
                }
            }
        }
    }

    /**
     * 确保棋盘可解 (优化策略)
     */
    static ensureSolvable(board: (Gem | null)[][]): void {
        let safety = 0;
        const maxAttempts = 50;
        
        while (!DeadlockChecker.hasValidMoves(board) && safety < maxAttempts) {
            safety++;
            
            // ISSUE-09: 定向修复策略 - 只修改可能导致死锁的区域
            const cols = board.length;
            const rows = board[0].length;
            
            // 找出所有宝石，随机选择 30% 进行替换
            const allGems: Array<{ col: number; row: number }> = [];
            for (let col = 0; col < cols; col++) {
                for (let row = 0; row < rows; row++) {
                    if (board[col]?.[row]) {
                        allGems.push({ col, row });
                    }
                }
            }
            
            // Fisher-Yates 洗牌后取前 30%
            for (let i = allGems.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [allGems[i], allGems[j]] = [allGems[j], allGems[i]];
            }
            
            const replaceCount = Math.ceil(allGems.length * 0.3);
            for (let i = 0; i < replaceCount && i < allGems.length; i++) {
                const { col, row } = allGems[i];
                const gem = board[col]?.[row];
                if (gem) gem.type = Gem.randomType();
            }
            
            this.removeInitialMatches(board);
        }
        
        // ISSUE-09: 如果仍然无解，强制重新生成整个棋盘
        if (!DeadlockChecker.hasValidMoves(board)) {
            const cols = board.length;
            const rows = board[0].length;
            for (let col = 0; col < cols; col++) {
                for (let row = 0; row < rows; row++) {
                    const gem = board[col]?.[row];
                    if (gem) gem.type = Gem.randomType();
                }
            }
            this.removeInitialMatches(board);
        }
    }
}
