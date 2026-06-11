/**
 * Gem 类型枚举 — 6 种宝石确保 6x6 棋盘丰富度
 */
export enum GemType {
    RED = 0,
    BLUE = 1,
    GREEN = 2,
    YELLOW = 3,
    PURPLE = 4,
    ORANGE = 5,
}

/** 所有宝石类型列表 */
export const GEM_TYPES: GemType[] = [
    GemType.RED,
    GemType.BLUE,
    GemType.GREEN,
    GemType.YELLOW,
    GemType.PURPLE,
    GemType.ORANGE,
];

/** 宝石颜色映射 (十六进制) */
export const GEM_COLORS: Record<GemType, string> = {
    [GemType.RED]:    '#FF4444',
    [GemType.BLUE]:   '#4488FF',
    [GemType.GREEN]:  '#44CC44',
    [GemType.YELLOW]: '#FFCC00',
    [GemType.PURPLE]: '#CC44FF',
    [GemType.ORANGE]: '#FF8844',
};

/** 宝石数据类 — 纯数据，非 Component */
export class Gem {
    /** 列索引 (0-based) */
    public x: number = 0;
    /** 行索引 (0-based) */
    public y: number = 0;
    /** 宝石类型 */
    public type: GemType = GemType.RED;
    /** 关联的 Cocos Node (显示用) */
    public node: import('cc').Node | null = null;
    /** 是否已匹配 (待消除) */
    public isMatched: boolean = false;
    /** 是否正在移动动画中 */
    public isMoving: boolean = false;

    constructor(x: number, y: number, type: GemType) {
        this.x = x;
        this.y = y;
        this.type = type;
    }

    /** 生成随机宝石类型 */
    static randomType(): GemType {
        return GEM_TYPES[Math.floor(Math.random() * GEM_TYPES.length)];
    }
}
