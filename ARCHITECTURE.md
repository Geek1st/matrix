# Matrix Match-3 架构图

## 系统架构

```mermaid
graph TB
    subgraph "用户界面层"
        A[HTML Canvas]
        B[HUD 显示]
        C[游戏结束界面]
    end
    
    subgraph "输入处理层"
        D[触摸/鼠标事件]
        E[手势识别]
        F[坐标转换]
    end
    
    subgraph "游戏逻辑层"
        G[GameManager<br/>游戏状态管理]
        H[BoardManager<br/>棋盘管理]
        I[MatchDetector<br/>匹配检测]
        J[CascadeSystem<br/>级联消除]
        K[DeadlockChecker<br/>死锁检测]
        L[ScoreManager<br/>计分系统]
    end
    
    subgraph "特效层"
        M[AnimationManager<br/>动画管理]
        N[AudioManager<br/>音效管理]
        O[TouchFeedback<br/>触摸反馈]
        P[ScorePopup<br/>分数弹出]
    end
    
    subgraph "数据持久层"
        Q[SessionManager<br/>存档管理]
        R[localStorage]
    end
    
    subgraph "响应式层"
        S[ResponsiveManager<br/>响应式布局]
    end
    
    A --> D
    D --> E
    E --> F
    F --> G
    G --> H
    H --> I
    I --> J
    J --> K
    J --> L
    J --> M
    J --> N
    D --> O
    L --> P
    G --> Q
    Q --> R
    A --> S
```

## 核心模块关系

```mermaid
sequenceDiagram
    participant U as 用户
    participant I as InputHandler
    participant G as GameManager
    participant B as BoardManager
    participant M as MatchDetector
    participant C as CascadeSystem
    participant A as AnimationManager
    participant S as ScoreManager
    
    U->>I: 触摸/点击
    I->>G: attemptSwap(gem1, gem2)
    G->>B: swapGems()
    B->>M: findMatches()
    M-->>G: matches[]
    alt 有匹配
        G->>C: processCascade()
        loop 级联循环
            C->>M: findMatches()
            M-->>C: matches[]
            C->>B: removeMatches()
            C->>A: playExplosion()
            C->>B: applyGravity()
            C->>A: playFallAnimation()
            C->>B: spawnNewGems()
            C->>S: addScore()
            C->>A: playScorePopup()
        end
        C-->>G: cascade complete
    else 无匹配
        G->>B: swapBack()
    end
    G->>B: drawBoard()
    B-->>U: 渲染更新
```

## 数据流

```mermaid
graph LR
    A[用户输入] --> B[InputHandler]
    B --> C[GameManager]
    C --> D[BoardManager]
    D --> E[MatchDetector]
    E --> F{有匹配?}
    F -->|是| G[CascadeSystem]
    F -->|否| H[撤销交换]
    G --> I[消除宝石]
    G --> J[应用重力]
    G --> K[生成新宝石]
    G --> L[更新分数]
    I --> M[AnimationManager]
    J --> M
    K --> M
    L --> N[ScoreManager]
    M --> O[Canvas渲染]
    N --> P[HUD更新]
    O --> Q[用户界面]
    P --> Q
```

## 类结构

```mermaid
classDiagram
    class Gem {
        +int x
        +int y
        +int type
        +boolean isMatched
        +string specialType
        +float alpha
        +float scale
        +float displayX
        +float displayY
        +randomType() int
    }
    
    class MatchDetector {
        +findMatches(board) Match[]
        +createSpecialGem(match, board) Gem
        +activateSpecialGem(gem, board) Gem[]
    }
    
    class CascadeSystem {
        +processCascade() void
    }
    
    class BoardManager {
        +board Gem[][]
        +initBoard() void
        +swapGems(g1, g2) void
        +removeMatches(matches) void
        +applyGravity() void
        +spawnNewGems() void
        +drawBoard() void
    }
    
    class GameManager {
        -score int
        -movesLeft int
        -comboCount int
        -isProcessing boolean
        -gameOver boolean
        +attemptSwap(g1, g2) void
        +checkGameOver() void
        +restartGame() void
    }
    
    class AnimationManager {
        +animateSwap(g1, g2) Promise
        +animateFall(gem, fromY, toY) Promise
        +animateExplosion(x, y, color) Promise
        +renderParticles(ctx) void
    }
    
    class AudioManager {
        -audioContext AudioContext
        -isMuted boolean
        +playSound(soundName) void
        +playMatchSound(combo) void
        +toggleMute() void
    }
    
    class SessionManager {
        +saveGameState(state) void
        +loadGameState() GameState
        +clearSave() void
    }
    
    GameManager --> BoardManager
    BoardManager --> MatchDetector
    BoardManager --> CascadeSystem
    CascadeSystem --> MatchDetector
    CascadeSystem --> AnimationManager
    CascadeSystem --> AudioManager
    GameManager --> SessionManager
    BoardManager --> AnimationManager
```

## 文件结构

```
matrix/
├── demo.html                 # 主游戏文件
├── audio-system.js           # 音效系统
├── animation-system.js       # 动画系统
├── responsive-layout.js      # 响应式布局
├── session-persistence.js    # 存档系统
├── demo-README.md            # 用户指南
├── BROWSER_TEST.md           # 浏览器测试清单
├── MOBILE_TEST.md            # 移动端测试清单
├── ARCHITECTURE.md           # 架构图（本文件）
├── DEVELOPMENT_PLAN.md       # 开发计划
├── DEMO_GAPS.md              # 差距分析
├── AGENTS.md                 # 项目规范
└── README.md                 # 项目说明
```

## 技术栈

- **前端框架**: 纯 HTML5 + Canvas
- **编程语言**: JavaScript (ES6+)
- **渲染**: Canvas 2D API
- **动画**: requestAnimationFrame
- **音效**: Web Audio API
- **存储**: localStorage
- **构建**: 无需构建工具，直接运行

## 设计原则

1. **模块化**: 每个功能独立模块，职责单一
2. **可测试**: 核心逻辑与渲染分离
3. **可扩展**: 易于添加新功能和特殊宝石
4. **性能优先**: 使用对象池、批量处理
5. **用户体验**: 流畅动画、即时反馈

---

**文档版本**: 1.0  
**最后更新**: 2026-06-11
