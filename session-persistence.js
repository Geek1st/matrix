// ============================================================
// Session Persistence — 会话持久化系统
// Matrix Match-3 Demo
// ============================================================

class SessionManager {
    constructor() {
        this.storageKey = 'matrix_match3_save';
        this.version = 1;
    }

    saveGameState(gameState) {
        try {
            const saveData = {
                version: this.version,
                timestamp: Date.now(),
                score: gameState.score,
                movesLeft: gameState.movesLeft,
                comboCount: gameState.comboCount,
                board: this.serializeBoard(gameState.board),
                gameOver: gameState.gameOver
            };
            
            localStorage.setItem(this.storageKey, JSON.stringify(saveData));
            console.log('[SessionManager] Game state saved');
            return true;
        } catch (e) {
            console.error('[SessionManager] Failed to save game state:', e);
            return false;
        }
    }

    loadGameState() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (!saved) {
                console.log('[SessionManager] No save data found');
                return null;
            }
            
            const saveData = JSON.parse(saved);
            
            // Version check
            if (saveData.version !== this.version) {
                console.warn('[SessionManager] Save data version mismatch, clearing');
                this.clearSave();
                return null;
            }
            
            // Validate data structure
            if (!this.validateSaveData(saveData)) {
                console.warn('[SessionManager] Invalid save data, clearing');
                this.clearSave();
                return null;
            }
            
            const gameState = {
                score: saveData.score,
                movesLeft: saveData.movesLeft,
                comboCount: saveData.comboCount,
                board: this.deserializeBoard(saveData.board),
                gameOver: saveData.gameOver
            };
            
            console.log('[SessionManager] Game state loaded');
            return gameState;
        } catch (e) {
            console.error('[SessionManager] Failed to load game state:', e);
            this.clearSave();
            return null;
        }
    }

    clearSave() {
        try {
            localStorage.removeItem(this.storageKey);
            console.log('[SessionManager] Save data cleared');
        } catch (e) {
            console.error('[SessionManager] Failed to clear save:', e);
        }
    }

    hasSave() {
        return localStorage.getItem(this.storageKey) !== null;
    }

    serializeBoard(board) {
        // Convert 2D array of Gem objects to JSON-safe format
        return board.map(col => 
            col.map(gem => {
                if (!gem) return null;
                return {
                    x: gem.x,
                    y: gem.y,
                    type: gem.type,
                    isMatched: gem.isMatched
                };
            })
        );
    }

    deserializeBoard(boardData) {
        // Reconstruct board with Gem objects
        return boardData.map(col => 
            col.map(gemData => {
                if (!gemData) return null;
                const gem = new Gem(gemData.x, gemData.y, gemData.type);
                gem.isMatched = gemData.isMatched;
                return gem;
            })
        );
    }

    validateSaveData(data) {
        // Basic validation
        if (typeof data.score !== 'number' || data.score < 0) return false;
        if (typeof data.movesLeft !== 'number' || data.movesLeft < 0) return false;
        if (typeof data.comboCount !== 'number') return false;
        if (!Array.isArray(data.board)) return false;
        if (data.board.length !== 6) return false;
        if (!data.board.every(col => Array.isArray(col) && col.length === 6)) return false;
        
        return true;
    }

    // Get save metadata
    getSaveInfo() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (!saved) return null;
            
            const saveData = JSON.parse(saved);
            return {
                timestamp: saveData.timestamp,
                age: Date.now() - saveData.timestamp,
                score: saveData.score,
                movesLeft: saveData.movesLeft
            };
        } catch (e) {
            return null;
        }
    }
}

// Export for use in demo.html
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SessionManager;
}
