// ============================================================
// Animation System — 动画系统
// Matrix Match-3 Demo
// ============================================================

class AnimationManager {
    constructor() {
        this.activeAnimations = [];
        this.particles = [];
    }

    // B1: Swap animation - smooth position interpolation
    animateSwap(gem1, gem2, duration = 250) {
        return new Promise(resolve => {
            const startPos1 = { x: gem1.x, y: gem1.y };
            const startPos2 = { x: gem2.x, y: gem2.y };
            const endPos1 = { x: gem2.x, y: gem2.y };
            const endPos2 = { x: gem1.x, y: gem1.y };
            
            const startTime = Date.now();
            
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const eased = this.easeOutCubic(progress);
                
                // Interpolate positions
                gem1.displayX = startPos1.x + (endPos1.x - startPos1.x) * eased;
                gem1.displayY = startPos1.y + (endPos1.y - startPos1.y) * eased;
                gem2.displayX = startPos2.x + (endPos2.x - startPos2.x) * eased;
                gem2.displayY = startPos2.y + (endPos2.y - startPos2.y) * eased;
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    gem1.displayX = null;
                    gem1.displayY = null;
                    gem2.displayX = null;
                    gem2.displayY = null;
                    resolve();
                }
            };
            
            animate();
        });
    }

    // B2: Fall animation - gravity + bounce
    animateFall(gem, fromY, toY, duration = 300) {
        return new Promise(resolve => {
            const startTime = Date.now();
            const distance = toY - fromY;
            
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const eased = this.easeOutBounce(progress);
                
                gem.displayY = fromY + distance * eased;
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    gem.displayY = null;
                    resolve();
                }
            };
            
            animate();
        });
    }

    // B3: Match explosion effect - particles + scale/fade
    animateExplosion(x, y, color, duration = 400) {
        return new Promise(resolve => {
            const particleCount = 12;
            const particles = [];
            
            for (let i = 0; i < particleCount; i++) {
                const angle = (Math.PI * 2 * i) / particleCount;
                const speed = 2 + Math.random() * 2;
                particles.push({
                    x, y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    radius: 3 + Math.random() * 2,
                    color,
                    alpha: 1,
                    life: 1
                });
            }
            
            const startTime = Date.now();
            
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                particles.forEach(p => {
                    p.x += p.vx;
                    p.y += p.vy;
                    p.vy += 0.1; // gravity
                    p.life = 1 - progress;
                    p.alpha = p.life;
                    p.radius *= 0.98;
                });
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
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
                } else {
                    gem.scale = null;
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

    // Render particles
    renderParticles(ctx) {
        this.particles.forEach(p => {
            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
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
