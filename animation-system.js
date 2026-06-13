// ============================================================
// Animation System — 动画系统
// Matrix Match-3 Demo
// ============================================================

class AnimationManager {
    constructor() {
        this.activeAnimations = [];
        this.particles = [];
        this.trails = []; // 拖尾效果
        this.shockwaves = []; // 冲击波效果
        this.glowEffects = []; // 光晕效果
        this.onFrame = null; // IS-23: 渲染回调，由 demo.html 设置为 drawBoard
        this._framePending = false; // IS-23: 防止同一帧重复渲染
    }

    // IS-24: 清除所有动画状态（游戏重置时调用）
    clearAll() {
        this.activeAnimations = [];
        this.particles = [];
        this.trails = [];
        this.shockwaves = [];
        this.glowEffects = [];
    }

    // IS-23: 通知渲染层刷新 (去重：同一帧内只触发一次 drawBoard)
    _requestFrame() {
        if (this._framePending) return;
        this._framePending = true;
        requestAnimationFrame(() => {
            this._framePending = false;
            if (this.onFrame) this.onFrame();
        });
    }

    // 拖拽跟随动画 - 宝石跟随手指移动
    // startX/startY 是触摸点坐标（canvas 逻辑坐标）
    // 宝石直接跟随手指，保持手指在宝石上的相对位置不变
    startDrag(gem, startX, startY) {
        gem.isDragging = true;
        // 宝石的网格中心坐标（像素）
        const gridCenterX = 4 + gem.x * 80 + 40;
        const gridCenterY = 4 + (5 - gem.y) * 80 + 40;
        // 保存手指相对于宝石中心的偏移
        gem.dragOffsetX = startX - gridCenterX;
        gem.dragOffsetY = startY - gridCenterY;
        // 初始位置：手指位置 - 偏移 = 网格中心（不跳变）
        gem.displayX = startX - gem.dragOffsetX;
        gem.displayY = startY - gem.dragOffsetY;
        gem.scale = 1.1; // 拖拽时略微放大
        gem.shadow = true; // 显示阴影
    }

    updateDrag(gem, currentX, currentY) {
        if (!gem.isDragging) return;
        
        // 宝石中心 = 当前手指位置 - 偏移量
        gem.displayX = currentX - gem.dragOffsetX;
        gem.displayY = currentY - gem.dragOffsetY;
        
        // 添加拖尾效果（在宝石中心位置）
        this.trails.push({
            x: gem.displayX,
            y: gem.displayY,
            radius: 20,
            alpha: 0.5,
            color: GEM_COLORS[gem.type],
            life: 1
        });
        
        // 触发渲染刷新，让拖拽视觉实时更新
        this._requestFrame();
    }

    endDrag(gem) {
        gem.isDragging = false;
        gem.scale = null;
        gem.shadow = false;
        gem.displayX = null;
        gem.displayY = null;
        gem.dragOffsetX = null;
        gem.dragOffsetY = null;
    }

    // B1: Swap animation - smooth position interpolation with rotation
    // Uses pixel coordinates for displayX/displayY (consistent with drawBoard)
    animateSwap(gem1, gem2, duration = 250) {
        return new Promise(resolve => {
            // Convert grid positions to pixel coordinates
            const PAD = 4, CELL = 80, ROWS = 6;
            const startPx1 = { x: PAD + gem1.x * CELL + CELL / 2, y: PAD + (ROWS - 1 - gem1.y) * CELL + CELL / 2 };
            const startPx2 = { x: PAD + gem2.x * CELL + CELL / 2, y: PAD + (ROWS - 1 - gem2.y) * CELL + CELL / 2 };
            const endPx1 = { x: PAD + gem2.x * CELL + CELL / 2, y: PAD + (ROWS - 1 - gem2.y) * CELL + CELL / 2 };
            const endPx2 = { x: PAD + gem1.x * CELL + CELL / 2, y: PAD + (ROWS - 1 - gem1.y) * CELL + CELL / 2 };
            
            const startTime = Date.now();
            
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const eased = this.easeOutCubic(progress);
                
                // Interpolate pixel positions
                gem1.displayX = startPx1.x + (endPx1.x - startPx1.x) * eased;
                gem1.displayY = startPx1.y + (endPx1.y - startPx1.y) * eased;
                gem2.displayX = startPx2.x + (endPx2.x - startPx2.x) * eased;
                gem2.displayY = startPx2.y + (endPx2.y - startPx2.y) * eased;
                
                // Add rotation during swap
                gem1.rotation = eased * Math.PI * 0.5;
                gem2.rotation = -eased * Math.PI * 0.5;
                
                // Scale pulse in the middle
                const pulse = Math.sin(progress * Math.PI);
                gem1.scale = 1 + pulse * 0.15;
                gem2.scale = 1 + pulse * 0.15;
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                    this._requestFrame(); // IS-23: 触发渲染刷新
                } else {
                    gem1.displayX = null;
                    gem1.displayY = null;
                    gem1.rotation = null;
                    gem1.scale = null;
                    gem2.displayX = null;
                    gem2.displayY = null;
                    gem2.rotation = null;
                    gem2.scale = null;
                    this._requestFrame(); // IS-23: 最终帧渲染
                    resolve();
                }
            };
            
            animate();
        });
    }

    // B2: Fall animation - gravity + bounce + squash/stretch
    animateFall(gem, fromY, toY, duration = 300) {
        return new Promise(resolve => {
            const startTime = Date.now();
            const distance = toY - fromY;
            const isDownward = distance > 0;
            
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const eased = this.easeOutBounce(progress);
                
                gem.displayY = fromY + distance * eased;
                
                // Squash and stretch effect
                // Stretch when falling fast, squash when landing
                const velocity = this.easeOutBounce(Math.min(progress + 0.05, 1)) - eased;
                const stretchFactor = Math.abs(velocity) * 8;
                
                if (progress < 0.85) {
                    // Stretch vertically while falling
                    gem.scaleX = 1 - stretchFactor * 0.3;
                    gem.scaleY = 1 + stretchFactor * 0.5;
                } else {
                    // Squash when landing
                    const landProgress = (progress - 0.85) / 0.15;
                    const squashAmount = Math.sin(landProgress * Math.PI) * 0.2;
                    gem.scaleX = 1 + squashAmount;
                    gem.scaleY = 1 - squashAmount;
                }
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                    this._requestFrame(); // IS-23
                } else {
                    gem.displayY = null;
                    gem.scaleX = null;
                    gem.scaleY = null;
                    this._requestFrame(); // IS-23: 最终帧渲染
                    resolve();
                }
            };
            
            animate();
        });
    }

    // B3: Match explosion effect - enhanced particles + shockwave + glow
    animateExplosion(x, y, color, duration = 500) {
        return new Promise(resolve => {
            const particleCount = 20; // 增加粒子数量
            const particles = [];
            const startTime = Date.now();
            
            // 创建主爆炸粒子
            for (let i = 0; i < particleCount; i++) {
                const angle = (Math.PI * 2 * i) / particleCount;
                const speed = 3 + Math.random() * 3;
                particles.push({
                    x, y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    radius: 4 + Math.random() * 3,
                    color,
                    alpha: 1,
                    life: 1,
                    type: 'main'
                });
            }
            
            // 创建火花粒子（更小更快）
            for (let i = 0; i < 15; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 5 + Math.random() * 4;
                particles.push({
                    x, y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    radius: 2 + Math.random() * 2,
                    color: '#ffffff',
                    alpha: 1,
                    life: 1,
                    type: 'spark'
                });
            }
            
            // 添加冲击波效果
            this.shockwaves.push({
                x, y,
                radius: 0,
                maxRadius: 60,
                alpha: 0.8,
                color,
                startTime
            });
            
            // 添加光晕效果
            this.glowEffects.push({
                x, y,
                radius: 30,
                alpha: 1,
                color,
                startTime,
                duration: 300
            });
            
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                particles.forEach(p => {
                    p.x += p.vx;
                    p.y += p.vy;
                    p.vy += 0.15; // 增强重力
                    p.vx *= 0.98; // 空气阻力
                    p.life = 1 - progress;
                    p.alpha = p.life;
                    p.radius *= 0.97;
                    
                    // 火花粒子消失更快
                    if (p.type === 'spark') {
                        p.alpha = p.life * 0.8;
                    }
                });
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                    this._requestFrame(); // IS-23
                } else {
                    this._requestFrame(); // IS-23: 最终帧渲染
                    resolve();
                }
            };
            
            // Store particles for rendering
            this.particles.push(...particles);
            animate();
            
            // Clean up after animation
            setTimeout(() => {
                this.particles = this.particles.filter(p => !particles.includes(p));
            }, duration);
        });
    }

    // Animate scale for matched gems
    animateScale(gem, fromScale, toScale, duration = 200) {
        return new Promise(resolve => {
            const startTime = Date.now();
            
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const eased = this.easeOutQuad(progress);
                
                gem.scale = fromScale + (toScale - fromScale) * eased;
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                    this._requestFrame(); // IS-23
                } else {
                    gem.scale = null;
                    this._requestFrame(); // IS-23: 最终帧渲染
                    resolve();
                }
            };
            
            animate();
        });
    }

    // Easing functions
    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    easeOutQuad(t) {
        return 1 - (1 - t) * (1 - t);
    }

    easeOutBounce(t) {
        const n1 = 7.5625;
        const d1 = 2.75;
        
        if (t < 1 / d1) {
            return n1 * t * t;
        } else if (t < 2 / d1) {
            return n1 * (t -= 1.5 / d1) * t + 0.75;
        } else if (t < 2.5 / d1) {
            return n1 * (t -= 2.25 / d1) * t + 0.9375;
        } else {
            return n1 * (t -= 2.625 / d1) * t + 0.984375;
        }
    }

    // Render particles with enhanced effects
    renderParticles(ctx) {
        // 渲染拖尾效果
        this.trails.forEach((trail, index) => {
            trail.life -= 0.05;
            if (trail.life <= 0) {
                this.trails.splice(index, 1);
                return;
            }
            ctx.save();
            ctx.globalAlpha = trail.alpha * trail.life;
            ctx.fillStyle = trail.color;
            ctx.beginPath();
            ctx.arc(trail.x, trail.y, trail.radius * trail.life, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
        
        // 渲染冲击波效果
        this.shockwaves.forEach((wave, index) => {
            const elapsed = Date.now() - wave.startTime;
            const progress = elapsed / 400; // 400ms duration
            
            if (progress >= 1) {
                this.shockwaves.splice(index, 1);
                return;
            }
            
            wave.radius = wave.maxRadius * progress;
            wave.alpha = 0.8 * (1 - progress);
            
            ctx.save();
            ctx.globalAlpha = wave.alpha;
            ctx.strokeStyle = wave.color;
            ctx.lineWidth = 3 * (1 - progress);
            ctx.beginPath();
            ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        });
        
        // 渲染光晕效果
        this.glowEffects.forEach((glow, index) => {
            const elapsed = Date.now() - glow.startTime;
            const progress = elapsed / glow.duration;
            
            if (progress >= 1) {
                this.glowEffects.splice(index, 1);
                return;
            }
            
            const currentAlpha = glow.alpha * (1 - progress);
            const currentRadius = glow.radius * (1 + progress * 0.5);
            
            ctx.save();
            ctx.globalAlpha = currentAlpha;
            const gradient = ctx.createRadialGradient(glow.x, glow.y, 0, glow.x, glow.y, currentRadius);
            gradient.addColorStop(0, glow.color);
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(glow.x, glow.y, currentRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
        
        // 渲染主粒子和火花 (IS-24: 同时清理过期粒子)
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            if (p.life <= 0 || p.alpha <= 0) {
                this.particles.splice(i, 1);
                continue;
            }
            ctx.save();
            ctx.globalAlpha = p.alpha;
            
            if (p.type === 'spark') {
                // 火花粒子 - 白色发光效果
                const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
                gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
                gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius * 1.5, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // 主粒子 - 带发光效果
                ctx.shadowBlur = 10;
                ctx.shadowColor = p.color;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
        }
    }

    hasActiveAnimations() {
        return this.activeAnimations.length > 0;
    }
}

// Score popup animation
class ScorePopup {
    constructor(x, y, score, color = '#FFD700') {
        this.x = x;
        this.y = y;
        this.score = score;
        this.color = color;
        this.alpha = 1;
        this.scale = 1;
        this.vy = -2;
        this.life = 1;
        this.duration = 1000;
        this.startTime = Date.now();
    }

    update() {
        const elapsed = Date.now() - this.startTime;
        const progress = Math.min(elapsed / this.duration, 1);
        
        this.y += this.vy;
        this.vy *= 0.95;
        this.life = 1 - progress;
        this.alpha = this.life;
        this.scale = 1 + (1 - this.life) * 0.5;
        
        return progress < 1;
    }

    render(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.font = `bold ${24 * this.scale}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(`+${this.score}`, this.x, this.y);
        ctx.restore();
    }
}

// Export for use in demo.html
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AnimationManager, ScorePopup };
}
