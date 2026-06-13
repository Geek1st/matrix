// ============================================================
// Responsive Layout System — 响应式布局管理器
// Matrix Match-3 Demo
// ============================================================

class ResponsiveManager {
    constructor(canvas, container) {
        this.canvas = canvas;
        this.container = container;
        this.baseCellSize = 80;
        this.basePadding = 4;
        this.cols = 6;
        this.rows = 6;
        this.currentScale = 1;
        this.isMobileDevice = this.detectMobile();
        
        // Store original canvas dimensions (set before ResponsiveManager is created)
        this.originalWidth = parseFloat(canvas.style.width);
        this.originalHeight = parseFloat(canvas.style.height);
        
        this.init();
    }

    init() {
        this.calculateScale();
        this.applyScale();
        this.bindEvents();
    }

    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
            || window.matchMedia('(max-width: 768px)').matches;
    }

    calculateScale() {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Calculate available space (accounting for HUD and other UI)
        const availableWidth = Math.min(viewportWidth * 0.95, 600);
        const availableHeight = Math.min(viewportHeight * 0.7, 600);
        
        // Calculate base board dimensions
        const baseBoardWidth = this.cols * this.baseCellSize + this.basePadding * 2;
        const baseBoardHeight = this.rows * this.baseCellSize + this.basePadding * 2;
        
        // Calculate scale to fit
        const scaleX = availableWidth / baseBoardWidth;
        const scaleY = availableHeight / baseBoardHeight;
        this.currentScale = Math.min(scaleX, scaleY, 1); // Don't scale up beyond 1
        
        // Ensure minimum touch target size on mobile
        if (this.isMobileDevice) {
            const scaledCellSize = this.baseCellSize * this.currentScale;
            if (scaledCellSize < 44) {
                this.currentScale = 44 / this.baseCellSize;
            }
        }
    }

    applyScale() {
        // Set CSS width/height to scaled dimensions based on ORIGINAL size
        // Always use this.originalWidth/Height to avoid compounding scale errors
        this.canvas.style.width = `${this.originalWidth * this.currentScale}px`;
        this.canvas.style.height = `${this.originalHeight * this.currentScale}px`;
        
        // No transform needed - CSS dimensions handle the sizing
        this.canvas.style.transform = 'none';
        
        if (this.container) {
            this.container.style.width = 'auto';
            this.container.style.height = 'auto';
        }
    }

    bindEvents() {
        // Handle window resize
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.calculateScale();
                this.applyScale();
            }, 100);
        });

        // Handle orientation change
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.calculateScale();
                this.applyScale();
            }, 200);
        });
    }

    getOptimalCellSize() {
        return this.baseCellSize * this.currentScale;
    }

    getTouchTargetSize() {
        return Math.max(44, this.baseCellSize * this.currentScale);
    }

    isMobile() {
        return this.isMobileDevice;
    }

    getCurrentScale() {
        return this.currentScale;
    }

    // Convert screen coordinates to canvas coordinates
    screenToCanvas(screenX, screenY) {
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = (screenX - rect.left) / this.currentScale;
        const canvasY = (screenY - rect.top) / this.currentScale;
        return { x: canvasX, y: canvasY };
    }
}

// Touch feedback system
class TouchFeedback {
    constructor(canvas) {
        this.canvas = canvas;
        this.ripples = [];
        this.init();
    }

    init() {
        this.canvas.addEventListener('pointerdown', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            // Convert to canvas logical coordinates (500x500 space)
            const canvasWidth = 6 * 80 + 4 * 2; // COLS * CELL + PAD * 2 = 488
            const x = (e.clientX - rect.left) / rect.width * canvasWidth;
            const y = (e.clientY - rect.top) / rect.height * canvasWidth;
            this.addRipple(x, y);
        });
    }

    addRipple(x, y) {
        this.ripples.push({
            x, y,
            radius: 0,
            maxRadius: 30,
            opacity: 0.6,
            startTime: Date.now()
        });
    }

    update() {
        const now = Date.now();
        this.ripples = this.ripples.filter(ripple => {
            const elapsed = now - ripple.startTime;
            const duration = 400;
            
            if (elapsed > duration) return false;
            
            const progress = elapsed / duration;
            ripple.radius = ripple.maxRadius * progress;
            ripple.opacity = 0.6 * (1 - progress);
            
            return true;
        });
    }

    draw(ctx) {
        this.ripples.forEach(ripple => {
            ctx.save();
            ctx.globalAlpha = ripple.opacity;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        });
    }
}

// Export for use in demo.html
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ResponsiveManager, TouchFeedback };
}
