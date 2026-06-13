import { Node, Vec3, tween, Label, Color, UITransform, instantiate, Prefab } from 'cc';

/**
 * 视觉特效工具类 — 静态方法，播放 Match-3 动画特效
 * IS-24: 追踪活跃特效节点，支持 cleanup 防止残留
 */
export class MatchEffects {

    /** 活跃的特效节点集合（用于清理） */
    private static _activeEffects: Set<Node> = new Set();

    /**
     * 播放消除特效
     */
    static playMatchEffect(parentNode: Node, position: Vec3): void {
        const effect = new Node('MatchEffect');
        effect.setPosition(position);
        effect.setScale(0.3, 0.3, 1);
        parentNode.addChild(effect);

        // 追踪
        this._activeEffects.add(effect);

        // 简单圆形指示 (用白色 Label 模拟)
        const label = effect.addComponent(Label);
        label.string = '✨';
        label.fontSize = 40;
        label.color = new Color(255, 255, 100, 255);

        tween(effect)
            .to(0.3, { scale: new Vec3(1.2, 1.2, 1) })
            .to(0.2, { scale: new Vec3(0, 0, 1) })
            .call(() => {
                this._activeEffects.delete(effect);
                if (effect.isValid) effect.destroy();
            })
            .start();
    }

    /**
     * 显示连击文字
     */
    static playComboText(
        parentNode: Node,
        position: Vec3,
        comboCount: number,
        score: number,
    ): void {
        const textNode = new Node('ComboText');
        textNode.setPosition(position.x, position.y + 40, 0);
        parentNode.addChild(textNode);

        // 追踪
        this._activeEffects.add(textNode);

        const label = textNode.addComponent(Label);
        label.string = `${comboCount} COMBO!\n+${score}`;
        label.fontSize = 28;
        label.color = new Color(255, 220, 0, 255);
        label.lineHeight = 32;

        tween(textNode)
            .to(0.8, { position: new Vec3(position.x, position.y + 120, 0) }, { easing: 'sineOut' })
            .to(0.3, { scale: new Vec3(0.5, 0.5, 1) })
            .call(() => {
                this._activeEffects.delete(textNode);
                if (textNode.isValid) textNode.destroy();
            })
            .start();
    }

    /**
     * IS-24: 清除所有活跃特效（场景重置/游戏结束时调用）
     */
    static clearAllEffects(): void {
        for (const node of this._activeEffects) {
            if (node && node.isValid) {
                tween(node).stop();
                node.destroy();
            }
        }
        this._activeEffects.clear();
    }

    /**
     * 交换动画 — 两个节点互换位置
     */
    static async playSwapAnimation(
        node1: Node,
        node2: Node,
        duration: number = 0.2,
    ): Promise<void> {
        const pos1 = node1.position.clone();
        const pos2 = node2.position.clone();

        await Promise.all([
            new Promise<void>(r => {
                tween(node1)
                    .to(duration, { position: pos2 }, { easing: 'sineInOut' })
                    .call(() => r())
                    .start();
            }),
            new Promise<void>(r => {
                tween(node2)
                    .to(duration, { position: pos1 }, { easing: 'sineInOut' })
                    .call(() => r())
                    .start();
            }),
        ]);
    }

    /**
     * 消除动画 — 缩小到 0
     */
    static async playRemovalAnimation(node: Node): Promise<void> {
        return new Promise(resolve => {
            tween(node)
                .to(0.12, { scale: new Vec3(0, 0, 1) })
                .call(() => {
                    node.active = false;
                    resolve();
                })
                .start();
        });
    }

    /**
     * 下落动画 — 自然重力效果
     */
    static async playFallAnimation(node: Node, targetY: number): Promise<void> {
        return new Promise(resolve => {
            const current = node.position.clone();
            tween(node)
                .to(0.25, { position: new Vec3(current.x, targetY, current.z) }, { easing: 'backOut' })
                .call(() => resolve())
                .start();
        });
    }

    /**
     * 选中高亮动画 — 呼吸缩放
     */
    static playSelectPulse(node: Node): void {
        tween(node)
            .to(0.3, { scale: new Vec3(1.1, 1.1, 1) }, { easing: 'sineInOut' })
            .to(0.3, { scale: new Vec3(1, 1, 1) }, { easing: 'sineInOut' })
            .union()
            .repeatForever()
            .start();
    }

    /**
     * 停止选中动画
     */
    static stopSelectPulse(node: Node): void {
        tween(node).stop();
        node.setScale(1, 1, 1);
    }
}
