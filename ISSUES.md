# ISSUES.md — Matrix Match-3 问题追踪

> 多 Agent 审查结果汇总（2026-06-11）
> 参与模型: Qwen3.7 Max ✅ | DeepSeek V4 Pro ✅ | GLM-5.1 ✅ | Kimi K2.5 ✅ | MiMo-V2.5 ✅ | Qwen3.7 Plus ❌ (限流)
> **状态: 全部 22 个 ISSUE 已修复 ✅**

---

## 🔴 高优先级 (6/6 ✅)

| # | 状态 | 说明 |
|---|------|------|
| 01 | ✅ | MatchDetector: 移除 matchedSet，允许 T/L/+ 交叉匹配 |
| 02 | ✅ | BoardManager: 改用 Graphics.drawGem() 绘制彩色形状 |
| 03 | ✅ | GameManager: try/finally + isGameOver 标志保护结束状态 |
| 04 | ✅ | GameManager: attemptSwap 整体 try/finally，异常可恢复 |
| 05 | ✅ | GameManager: onDestroy 清理单例 _instance |
| 06 | ✅ | Demo: Y 方向 `dy > 0 ? -1 : 1` 翻转 |
| 07 | ✅ | Demo: drawBoard 检查 isMatched → 红色半透明 + 圆圈 |

## 🟡 中优先级 (10/10 ✅)

| # | 状态 | 说明 |
|---|------|------|
| 08 | ✅ | DeadlockChecker + Demo: 批量收集→去重替换 |
| 09 | ✅ | DeadlockChecker + Demo: Fisher-Yates + 兜底全量重置 |
| 10 | ✅ | BoardManager: screenToGem 使用 boardNode UITransform |
| 11 | ✅ | BoardManager: removeGem 先 tween.stop() 再 destroy |
| 12 | ✅ | BoardManager: shuffleBoard 交换 Gem 引用而非 type |
| 13 | ✅ | GameManager: resumeGame 添加 GAMEOVER 守卫 |
| 14 | ✅ | InputHandler: attemptSwap 调用加 .catch() |
| 15 | ✅ | Demo: devicePixelRatio 高 DPI 适配 |
| 16 | ✅ | Demo: pointerleave + 智能 window.pointerup |

## 🟢 低优先级 (6/6 ✅)

| # | 状态 | 说明 |
|---|------|------|
| 17 | ✅ | InputHandler: `any` → `GameManager | null` |
| 18 | ✅ | MatchDetector: findPotentialMatch 只检查受影响行/列 |
| 19 | ✅ | Demo: 移除 animate/easeInOut 死代码 |
| 20 | ✅ | Demo: `randomType()` 改用 `GEM_COLORS.length` |
| 21 | ✅ | DeadlockChecker: 移除冗余 checkedPairs Set |
| 22 | ✅ | DeadlockChecker: simulateSwap 使用坐标变量 x1,y1/x2,y2 |

---

## 回归验证

| 验证项 | 状态 |
|--------|------|
| TypeScript strict 编译 | ✅ 0 errors |
| Demo 页面渲染 | ✅ 正常 |
| Demo 交互 (点击/滑动) | ✅ 无 JS error |
| 算法一致性 (TS ↔ JS) | ✅ 两端逻辑已同步 |

---

## 额外修复 (审查中未发现)

| 问题 | 文件 | 说明 |
|------|------|------|
| 空指针崩溃 | `demo.html` | `pointermove` 中 `touchStartPos` 未做空值检查 → 添加 `!touchStartPos` 守卫 |
| 全局 pointerup 过度清除 | `demo.html` | `window.pointerup` 清除 `touchStartPos` 但未联动 `touchStartGem` → 改为仅指针脱离 canvas 时清除两者 |

---

## 🚀 后续开发计划

1. 将 `demo.html` 中验证过的匹配/级联/死锁逻辑与 `assets/scripts/` 中 Cocos 实现对齐。
2. 在 `assets/scripts/ai/` 中补齐 AI 走法提示与本地回退逻辑。
3. 添加更多游戏规则：特殊宝石、关卡目标、道具系统。
4. 增加单元测试或调试脚本，覆盖 `MatchDetector`, `DeadlockChecker`, `CascadeSystem`。
5. 将 `demo.html` 的状态机转化为 `GameManager` 形式，避免全局变量。

## 📝 备注

- `demo.html` 目前可作为开发参考和快速迭代模型。
- 后续正式小游戏版本必须经过 `npm run typecheck` 验证并在 Cocos Creator / 微信开发者工具中测试。

---

*最后更新: 2026-06-11 — 全部 22 个 ISSUE 已修复并验证*