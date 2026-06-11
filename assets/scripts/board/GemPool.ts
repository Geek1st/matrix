import { _decorator, Component, Node, Vec3, tween, instantiate, Prefab, NodePool, UITransform, Sprite, Color } from 'cc';
import { Gem, GemType, GEM_COLORS } from './Gem';

const { ccclass, property } = _decorator;

/**
 * Gem 对象池 — 复用 gem Node，降低微信小游戏内存压力
 * 预分配 50% (18 个)，按需增长
 */
@ccclass('GemPool')
export class GemPool extends Component {

    @property({ type: Prefab, tooltip: 'Gem 预制体 (需包含 Sprite 组件)' })
    public gemPrefab: Prefab | null = null;

    private _pool: NodePool = new NodePool();
    private _preAllocated: boolean = false;

    /** 预分配一半棋盘大小的 gem */
    public preallocate(count: number = 18): void {
        if (this._preAllocated) return;
        for (let i = 0; i < count; i++) {
            if (!this.gemPrefab) break;
            const node = instantiate(this.gemPrefab);
            node.active = false;
            this._pool.put(node);
        }
        this._preAllocated = true;
        console.log(`[GemPool] 预分配 ${count} 个 gem`);
    }

    /** 从池中获取 gem node */
    public getGem(): Node | null {
        if (!this.gemPrefab) return null;
        let node: Node;
        if (this._pool.size() > 0) {
            node = this._pool.get()!;
        } else {
            node = instantiate(this.gemPrefab);
        }
        node.active = true;
        return node;
    }

    /** 回收 gem node 到池 */
    public returnGem(node: Node): void {
        node.active = false;
        node.parent = null;
        // 重置变换
        node.setScale(1, 1, 1);
        node.setPosition(0, 0, 0);
        const sprite = node.getComponent(Sprite);
        if (sprite) sprite.color = Color.WHITE;
        this._pool.put(node);
    }

    public getPoolSize(): number {
        return this._pool.size();
    }

    /** 清理多余 gem */
    public cleanup(): void {
        while (this._pool.size() > 18) {
            const node = this._pool.get();
            if (node) node.destroy();
        }
    }
}
