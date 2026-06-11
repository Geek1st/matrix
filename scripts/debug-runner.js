/**
 * Matrix Match-3 — VS Code F5 调试入口
 *
 * 运行: node scripts/debug-runner.js
 * 功能: TypeScript 编译 + 核心算法单元测试 (纯 JS，无需 Cocos)
 */

const { execSync } = require('child_process');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
let failed = false;

function assert(condition, msg) {
    if (condition) {
        console.log(`  \x1b[32m✓\x1b[0m ${msg}`);
    } else {
        console.log(`  \x1b[31m✗\x1b[0m ${msg}`);
        failed = true;
    }
}

function section(title) {
    console.log(`\n\x1b[36m${title}\x1b[0m`);
}

// ================================================================
// Phase 1: TypeScript 类型检查
// ================================================================
console.log('');
console.log('\x1b[1m═══════════════════════════════════════════\x1b[0m');
console.log('\x1b[1m  Matrix Match-3 — Debug Runner\x1b[0m');
console.log('\x1b[1m═══════════════════════════════════════════\x1b[0m');

section('🔍 Phase 1: TypeScript 类型检查');

try {
    execSync('npx tsc --noEmit', { cwd: PROJECT_ROOT, stdio: 'pipe' });
    console.log('  \x1b[32m✓ TypeScript: 0 errors\x1b[0m');
} catch (e) {
    console.log('  \x1b[31m✗ TypeScript: 编译错误\x1b[0m');
    console.log(e.stdout?.toString() || e.message);
    failed = true;
}

// ================================================================
// Phase 2: 核心算法单元测试
// ================================================================
section('📐 Phase 2: Match-3 算法验证');

// --- 宝石类型 ---
const GemType = { RED: 0, BLUE: 1, GREEN: 2, YELLOW: 3, PURPLE: 4, ORANGE: 5 };

class Gem {
    constructor(x, y, type) {
        this.x = x; this.y = y; this.type = type;
        this.isMatched = false;
    }
    static randomType() { return Math.floor(Math.random() * 6); }
}

// --- MatchDetector (JS 移植) ---
class MatchDetector {
    static findMatches(board) {
        const cols = board.length, rows = board[0].length;
        const matched = new Set();
        const matches = [];

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const gem = board[c][r];
                if (!gem || matched.has(gem)) continue;
                let len = 1;
                while (c + len < cols && board[c + len][r]?.type === gem.type) len++;
                if (len >= 3) {
                    const group = [];
                    for (let i = 0; i < len; i++) { group.push(board[c + i][r]); matched.add(board[c + i][r]); }
                    matches.push(group);
                }
            }
        }

        for (let c = 0; c < cols; c++) {
            for (let r = 0; r < rows; r++) {
                const gem = board[c][r];
                if (!gem || matched.has(gem)) continue;
                let len = 1;
                while (r + len < rows && board[c][r + len]?.type === gem.type) len++;
                if (len >= 3) {
                    const group = [];
                    for (let i = 0; i < len; i++) { group.push(board[c][r + i]); matched.add(board[c][r + i]); }
                    matches.push(group);
                }
            }
        }
        return matches;
    }
}

// --- Board helpers ---
function createBoard(cols = 6, rows = 6) {
    const b = [];
    const types = [0, 1, 2, 3, 4, 5];
    for (let c = 0; c < cols; c++) {
        b[c] = [];
        for (let r = 0; r < rows; r++) {
            // 交替填充避免初始匹配
            b[c][r] = new Gem(c, r, types[(c + r) % 6]);
        }
    }
    // 清理初始匹配
    let hasMatch = true, iter = 0;
    while (hasMatch && iter++ < 50) {
        hasMatch = false;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const g = b[c][r];
                if (c + 2 < cols && b[c + 1][r].type === g.type && b[c + 2][r].type === g.type) {
                    g.type = (g.type + 1) % 6; hasMatch = true;
                }
                if (r + 2 < rows && b[c][r + 1].type === g.type && b[c][r + 2].type === g.type) {
                    g.type = (g.type + 2) % 6; hasMatch = true;
                }
            }
        }
    }
    return b;
}

// ===== Test 1: 水平3连 =====
(() => {
    const b = createBoard();
    b[0][0].type = GemType.RED;
    b[1][0].type = GemType.RED;
    b[2][0].type = GemType.RED;
    const m = MatchDetector.findMatches(b);
    assert(m.length === 1, `水平3连: 找到 ${m.length} 组匹配`);
    assert(m[0].length === 3, `水平3连: 匹配 ${m[0].length} 个宝石`);
})();

// ===== Test 2: 垂直3连 =====
(() => {
    const b = createBoard();
    b[0][0].type = GemType.BLUE;
    b[0][1].type = GemType.BLUE;
    b[0][2].type = GemType.BLUE;
    const m = MatchDetector.findMatches(b);
    assert(m.length === 1, `垂直3连: 找到 ${m.length} 组匹配`);
})();

// ===== Test 3: 无匹配 =====
(() => {
    const b = createBoard();
    const types = [0, 1, 2, 3, 4, 5];
    for (let c = 0; c < 6; c++)
        for (let r = 0; r < 6; r++)
            b[c][r].type = types[(c + r) % 6];
    const m = MatchDetector.findMatches(b);
    assert(m.length === 0, `无匹配棋盘: 找到 ${m.length} 组匹配`);
})();

// ===== Test 4: 十字5连+3连 =====
(() => {
    const b = createBoard();
    for (let c = 0; c < 5; c++) b[c][2].type = GemType.RED;
    b[2][0].type = GemType.RED;
    b[2][1].type = GemType.RED;
    const m = MatchDetector.findMatches(b);
    const totalGems = m.reduce((sum, g) => sum + g.length, 0);
    assert(totalGems >= 5, `十字匹配: 共 ${totalGems} 个宝石被匹配`);
})();

// ===== Test 5: 5连 =====
(() => {
    const b = createBoard();
    for (let c = 0; c < 5; c++) b[c][0].type = GemType.GREEN;
    const m = MatchDetector.findMatches(b);
    assert(m.length === 1 && m[0].length === 5, `5连: ${m[0].length} 个宝石`);
})();

// ===== Test 6: 6连 =====
(() => {
    const b = createBoard();
    for (let c = 0; c < 6; c++) b[c][3].type = GemType.YELLOW;
    const m = MatchDetector.findMatches(b);
    assert(m.length === 1 && m[0].length === 6, `6连: ${m[0].length} 个宝石`);
})();

// ================================================================
// Phase 3: 文件结构验证
// ================================================================
section('📁 Phase 3: 项目文件完整性');

const fs = require('fs');
const expectedFiles = [
    'assets/scripts/board/Gem.ts',
    'assets/scripts/board/BoardManager.ts',
    'assets/scripts/board/GemPool.ts',
    'assets/scripts/gameplay/MatchDetector.ts',
    'assets/scripts/gameplay/CascadeSystem.ts',
    'assets/scripts/gameplay/DeadlockChecker.ts',
    'assets/scripts/gameplay/ScoreManager.ts',
    'assets/scripts/game/GameManager.ts',
    'assets/scripts/input/InputHandler.ts',
    'assets/scripts/effects/MatchEffects.ts',
    'assets/scripts/ai/AIConfig.ts',
    'assets/scripts/ai/AIService.ts',
    'assets/scripts/ai/HintSystem.ts',
    'assets/scripts/ai/AIDifficulty.ts',
];
for (const f of expectedFiles) {
    const p = path.join(PROJECT_ROOT, f);
    assert(fs.existsSync(p), `${f}`);
}

// ================================================================
// 总结
// ================================================================
console.log('');
console.log('\x1b[1m═══════════════════════════════════════════\x1b[0m');
if (failed) {
    console.log('\x1b[31m  ⚠️  部分检查失败，请查看上方详情\x1b[0m');
    process.exit(1);
} else {
    console.log('\x1b[32m  ✅ 全部通过！TypeScript 0 错误 + 算法验证 OK + 文件完整\x1b[0m');
    console.log('');
    console.log('  \x1b[33m后续步骤:\x1b[0m');
    console.log('  1. Cocos Dashboard → 下载 Creator 3.8.x');
    console.log('  2. 用 Creator 打开本项目 → 菜单: 项目 → 构建');
    console.log('  3. npm run preview → Chrome 打开 http://localhost:7456');
}
console.log('\x1b[1m═══════════════════════════════════════════\x1b[0m');
console.log('');
