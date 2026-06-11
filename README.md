# 🎮 Matrix Match-3 — AI 驱动微信小游戏

> Cocos Creator 3.8 + TypeScript + AI Agent 协作开发 + VS Code 全链路

---

## 🏗 项目架构

```
matrix/
├── assets/scripts/
│   ├── board/              ← 棋盘层
│   │   ├── Gem.ts          # 宝石数据类 + 6 种 GemType
│   │   ├── GemPool.ts      # 对象池 (微信内存优化)
│   │   └── BoardManager.ts # 棋盘管理 (生成/交换/消除/洗牌)
│   ├── gameplay/           ← 核心三消算法
│   │   ├── MatchDetector.ts    # 双遍扫描匹配检测 O(n²)
│   │   ├── CascadeSystem.ts    # 级联消除 (消除→重力→生成→循环)
│   │   ├── DeadlockChecker.ts  # 死锁检测 + 合法走法查找
│   │   └── ScoreManager.ts     # 分数/关卡/连击 + localStorage 持久化
│   ├── input/
│   │   └── InputHandler.ts     # 触摸滑动 → 宝石选择与交换
│   ├── game/
│   │   └── GameManager.ts      # 游戏状态机 (IDLE→SWAP→CASCADE→OVER)
│   ├── effects/
│   │   └── MatchEffects.ts     # 视觉特效 (消除/连击/交换/下落)
│   └── ai/                 ← ⭐ AI 集成
│       ├── AIConfig.ts     # AI 配置 (DashScope/OpenAI 兼容)
│       ├── AIService.ts    # HTTP 通信 + Mock 降级
│       ├── HintSystem.ts   # 智能提示 (AI 分析 + 本地回退)
│       └── AIDifficulty.ts # 动态难度调节 (4 级自适应)
├── scripts/                ← 🔧 VS Code 工具链
│   ├── detect.ps1          # 环境检测
│   ├── build.ps1           # tsc 检查 → Cocos Creator 构建
│   ├── preview.ps1         # 本地 HTTP 服务器预览
│   └── deploy.ps1          # 构建 + 打开微信开发者工具
├── .vscode/                ← ⚙ VS Code 全链路配置
│   ├── tasks.json          # 10 个 Task (构建/预览/部署/检查)
│   ├── launch.json         # Chrome/Edge/WeChat 调试配置
│   ├── settings.json       # 编辑器 + 文件关联 + 搜索排除
│   └── extensions.json     # 推荐扩展列表
├── build/wechatgame/       # 微信小游戏构建输出
└── package.json            # npm scripts 快捷命令
```

---

## 🔄 VS Code 全链路开发闭环

```
┌──────────┐    Ctrl+Shift+B     ┌──────────┐    Ctrl+Shift+D     ┌──────────────┐
│  编码     │ ────────────────→  │  构建     │ ────────────────→  │  部署/预览    │
│  TS 脚本  │                    │  tsc +    │                    │  微信开发者    │
│  .vscode  │ ←──── F5 ──────── │  Cocos    │ ←── LiveServer ── │  工具 / 浏览器 │
└──────────┘    调试断点         └──────────┘                    └──────────────┘
```

### 快捷键

| 快捷键 | Task | 说明 |
|--------|------|------|
| `Ctrl+Shift+B` | 构建: 微信小游戏 | tsc 检查 + Cocos Creator 构建 |
| `Ctrl+Shift+D` | 部署: 微信开发者工具 | 构建后自动打开微信 DevTools |
| `Ctrl+Shift+P` | 预览: 浏览器 | 启动 HTTP 服务器 → 浏览器预览 |
| `Ctrl+Shift+T` | TypeScript: 类型检查 | 仅编译检查 |
| `F5` | Launch Chrome | 构建 Web Mobile → Chrome 调试 |

---

## 🌐 原型验证与迁移说明

当前仓库包含一个独立的纯 HTML5 Canvas 原型文件 `demo.html`，用于快速验证：

- 核心三消匹配逻辑
- 交互与拖拽输入流程
- 消除级联与连击计分
- 高 DPI Canvas 渲染与视觉反馈

`demo.html` 不是最终小游戏构建目标，而是“逻辑验证层”。后续开发应把验证过的算法与状态机迁移到 `assets/scripts/` 中的 Cocos Creator / 微信小游戏实现，确保平台兼容性和性能。

### npm 快捷命令

```bash
npm run detect       # 环境检测
npm run build        # 构建微信小游戏
npm run build:debug  # 调试模式构建
npm run preview      # 浏览器预览
npm run deploy       # 部署到微信开发者工具
npm run typecheck    # TypeScript 类型检查
npm run typewatch    # TypeScript 监视模式
```

---

## 🔧 环境搭建

### 1. 安装必备工具

| 工具 | 下载 | 作用 |
|------|------|------|
| **Cocos Creator 3.8.x** | [cocos.com/creator](https://www.cocos.com/creator) | 场景编辑 + 构建发布 |
| **微信开发者工具** | [developers.weixin.qq.com](https://developers.weixin.qq.com/minigame/dev/devtools/download.html) | 小游戏预览调试 |
| **Node.js** | ✅ v24.16.0 已安装 | TypeScript 编译 |
| **VS Code** | ✅ 已安装 | 主开发环境 |

### 2. 运行环境检测

```bash
npm run detect
```

### 3. 配置 AI

编辑 `assets/scripts/ai/AIConfig.ts`，填入 API Key：

```ts
apiKey: 'sk-your-api-key',
model: 'qwen-plus',  // 或其他 OpenAI 兼容模型
```

> ⚠ 生产环境必须通过后端代理转发请求，不可在前端暴露 Key

---

## 🤖 AI 集成特性

| 特性 | 说明 |
|------|------|
| **远程 AI 分析** | 棋盘快照 → AI → 最优走法 + 策略建议 |
| **本地回退** | AI 不可用时用 DeadlockChecker 找合法走法 |
| **动态难度** | 4 级自适应 (EASY/NORMAL/HARD/EXPERT) |
| **多平台兼容** | OpenAI / DashScope / 任何 `/chat/completions` API |
| **Mock 模式** | 离线开发无需 API Key 即可测试 |

---

## 📐 核心算法

### 匹配检测 (双遍扫描)
```
水平扫描 (逐行) → 垂直扫描 (逐列) → Set 去重 → Match[]
时间复杂度: O(rows × cols)
```

### 级联消除
```
while hasMatches:
  findMatches → animateRemoval → removeFromBoard
  → applyGravity (下落) → spawnNewGems (生成)
  → continue loop
```

### 死锁检测
```
遍历所有相邻对 → 模拟交换 → 局部匹配检测 → boolean
```

---

## 🎯 游戏参数

| 参数 | 值 | 说明 |
|------|-----|------|
| 棋盘大小 | 6×6 | 适配微信移动端 |
| 宝石大小 | 80px | 可触控舒适尺寸 |
| 宝石种类 | 6 种 | RED/BLUE/GREEN/YELLOW/PURPLE/ORANGE |
| 默认步数 | 30 | 可随难度动态调整 |
| 消除计分 | count² × combo | combo 每次递增 0.1× |

---

## 📂 微信小游戏配置

- `build/wechatgame/game.json` — 小游戏配置 (deviceOrientation, networkTimeout)
- `build/wechatgame/project.config.json` — 微信开发者工具项目配置
- ⚠ 使用 `XMLHttpRequest` (微信不支持 fetch)
- ⚠ GemPool 预分配 50% 降低 GC 压力
