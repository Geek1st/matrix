# AGENTS.md — Matrix Match-3 AI Agent 开发规范

> 本项目为开源项目，遵循良好的工程实践。
> 最后更新: 2026-06-11

---

## 📋 项目概述

- **名称**: Matrix Match-3
- **引擎**: Cocos Creator 3.8.8
- **语言**: TypeScript (strict mode)
- **平台**: 微信小游戏 (主) / Web Mobile (调试)
- **类型**: 三消益智游戏 + AI 集成

---

## 🏗 架构规范

### 分层结构

```
assets/scripts/
├── board/       # 棋盘层：数据 + 显示
├── gameplay/    # 核心算法：匹配/级联/死锁/计分
├── input/       # 输入层：触摸手势
├── game/        # 控制层：状态机
├── effects/     # 视觉特效
└── ai/          # AI 集成：DashScope API
```

### 关键原则

1. **逻辑与显示分离** — 核心算法（MatchDetector, DeadlockChecker）为纯静态类，不依赖 Cocos 组件
2. **数据驱动** — Gem 是纯数据类，BoardManager 管理状态
3. **对象池复用** — GemPool 降低微信小游戏内存压力
4. **AI 可降级** — AIService 支持 Mock 模式，离线可运行
5. **无预制体依赖** — 宝石节点程序化创建，不依赖编辑器预制体

---

## 🔧 编码规范

### TypeScript

- **strict mode** 开启，不允许 `any`（除 InputHandler.gameManager 过渡期）
- 使用 `@ccclass` / `@property` 装饰器注册 Cocos 组件
- 所有 Component 使用 `onLoad` 初始化，`start` 启动逻辑
- 异步操作使用 `async/await` + `tween` Promise 封装

### Cocos Creator 3.8 API

- 使用 `import { _decorator, ... } from 'cc'`
- 装饰器: `const { ccclass, property } = _decorator;`
- 动画: `tween(node).to(duration, props, opts).start()`
- 节点创建: `new Node()` + `addComponent(Sprite)` + `SpriteFrame`
- 坐标: `Vec3` 世界坐标，`UITransform.convertToNodeSpaceAR` 屏幕→本地

### 禁止项

- ❌ 不要使用 `@ccclass` 的 `extends` 链式继承
- ❌ 不要在静态方法中引用 `this` 作为组件实例
- ❌ 不要硬编码 API Key（使用环境变量或后端代理）
- ❌ 不要使用 `fetch`（微信小游戏不支持，使用 `XMLHttpRequest`）
- ❌ 不要直接修改 `.scene` 文件（使用 `scripts/generate-scene.js` 生成）

---

## 🔄 开发流程

### 编码 → 检查 → 构建 → 预览

```bash
# 1. 类型检查 (必须通过)
npm run typecheck

# 2. 构建 Web Mobile (调试用)
npm run build:debug

# 3. 预览
npm run preview
```

### 场景修改

1. 编辑 `scripts/generate-scene.js`
2. 运行 `node scripts/generate-scene.js`
3. 重新构建

---

## 🤖 AI Agent 协作规则

### 代码修改

- 修改代码后 **必须** 运行 `npm run typecheck` 验证
- 新增文件后 **必须** 更新 `generate-scene.js` 中的 UUID 引用
- 不要修改 `library/` 目录（Cocos 自动管理）

### 测试策略

- 核心算法可独立测试（MatchDetector, DeadlockChecker 为纯逻辑）
- 使用 `scripts/debug-runner.js` 进行算法验证
- 构建后在浏览器中验证 UI 交互

### 已知坑点

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| 场景文件为空 | `main.scene` 需要程序化生成 | 运行 `node scripts/generate-scene.js` |
| 宝石不显示 | 无预制体资源 | BoardManager 改为程序化创建 Sprite 节点 |
| Cocos CLI 构建失败 | 编辑器未安装或版本不匹配 | 从 Cocos Dashboard 手动构建 Web Mobile |
| 微信小游戏无 fetch | 平台限制 | AIService 使用 XMLHttpRequest |
| `tween` 动画不触发 | 节点未激活或未挂载 | 确保 `node.active = true` 且 `parent` 已设置 |

---

## 🚩 踩坑记录

### 1. Cocos Creator CLI 构建不稳定
**问题**: `CocosCreator.exe --project ... --build` 命令行构建经常崩溃或无输出
**原因**: 编辑器需要完整加载项目后才能构建，CLI 模式下资源导入不完整
**解决**: 
- 先通过 GUI 打开项目完成资源导入
- 或使用独立 HTML Demo 验证核心逻辑
- 生产构建建议在 Cocos Dashboard 中手动操作

### 2. 场景文件为空
**问题**: `assets/scene/main.scene` 初始为空目录
**原因**: Cocos Creator 项目需要编辑器生成场景文件
**解决**: 创建 `scripts/generate-scene.js` 程序化生成场景，包含所有节点和组件绑定

### 3. 预制体依赖问题
**问题**: 原代码依赖编辑器预制体 (`gemPrefabs: Prefab[]`)
**原因**: AI Agent 无法在编辑器中创建预制体资源
**解决**: 重构 `BoardManager` 和 `CascadeSystem`，使用 `new Node()` + `addComponent(Sprite)` 程序化创建宝石节点

### 4. TypeScript 类型检查通过但构建失败
**问题**: `npm run typecheck` 通过，但 Cocos 构建崩溃
**原因**: TS 检查只验证类型，不验证 Cocos 资源完整性
**解决**: 建立独立 HTML Demo 作为逻辑验证层，与 Cocos 构建解耦

### 5. 端口占用问题
**问题**: `EADDRINUSE: address already in use :::7456`
**原因**: 预览服务器未正确关闭
**解决**: 使用 `Get-Process` 查找并终止占用端口的进程

---

## 🎯 关键决策

### 架构决策
1. **逻辑与显示分离**: 核心算法 (MatchDetector, DeadlockChecker) 为纯静态类，可在任何环境测试
2. **程序化资源创建**: 不依赖编辑器预制体，所有节点代码生成
3. **独立验证层**: HTML Demo 提供快速反馈循环，不依赖 Cocos 构建
4. **AI 可降级**: AIService 支持 Mock 模式，离线可运行

### 开发流程决策
1. **TypeScript strict mode**: 强制类型安全，AI 生成代码必须通过类型检查
2. **场景生成脚本**: `generate-scene.js` 作为单一真相源，避免手动编辑场景文件
3. **多 Agent 协作**: 使用 TODO 列表跟踪进度，每个任务独立完成并验证

### 技术选型
- **Cocos Creator 3.8.8**: 微信小游戏官方支持
- **TypeScript 5.4+**: 严格模式，装饰器支持
- **XMLHttpRequest**: 微信小游戏不支持 fetch
- **Canvas 2D**: HTML Demo 使用 Canvas 而非 DOM，性能更好

## 📊 项目统计

- **TypeScript 源文件**: 14 个
- **代码行数**: ~2500 行
- **核心算法**: 4 个 (MatchDetector, CascadeSystem, DeadlockChecker, ScoreManager)
- **AI 集成**: 4 个文件 (AIConfig, AIService, HintSystem, AIDifficulty)
- **构建脚本**: 5 个 PowerShell/Node.js 脚本
- **HTML Demo**: 1 个独立验证文件

---

## 🚀 快速开始

```bash
# 环境检测
npm run detect

# 类型检查
npm run typecheck

# 生成场景
node scripts/generate-scene.js

# 构建 (需要 Cocos Creator)
npm run build:debug

# 预览
npm run preview
```

---

## 📝 变更记录

### 2026-06-11
- 项目初始化：14 个 TypeScript 源文件就绪
- 去除预制体依赖，改为程序化创建宝石节点
- 创建 AGENTS.md 开发规范
- 建立多 Agent 协作开发流程
