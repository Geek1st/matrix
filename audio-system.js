// ============================================================
// Audio System — Web Audio API 音效管理器
// Matrix Match-3 Demo
// ============================================================

class AudioManager {
    constructor() {
        this.audioContext = null;
        this.isMuted = false;
        this.masterVolume = 0.3;
        this.sounds = {};
        this.init();
    }

    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.createSounds();
        } catch (e) {
            console.warn('[AudioManager] Web Audio API not supported:', e);
        }
    }

    createSounds() {
        // Define sound generators for each effect
        this.sounds = {
            swap: { type: 'sine', frequency: 400, duration: 0.1, attack: 0.01, decay: 0.05 },
            match: { type: 'sine', frequency: 600, duration: 0.15, attack: 0.01, decay: 0.08 },
            combo: { type: 'square', frequency: 800, duration: 0.2, attack: 0.01, decay: 0.1 },
            invalid: { type: 'sawtooth', frequency: 200, duration: 0.1, attack: 0.01, decay: 0.05 },
            gameover: { type: 'sine', frequency: 300, duration: 0.5, attack: 0.01, decay: 0.4 }
        };
    }

    playSound(soundName, pitchMultiplier = 1.0) {
        if (!this.audioContext || this.isMuted) return;

        const soundDef = this.sounds[soundName];
        if (!soundDef) {
            console.warn(`[AudioManager] Unknown sound: ${soundName}`);
            return;
        }

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.type = soundDef.type;
        oscillator.frequency.value = soundDef.frequency * pitchMultiplier;

        // Envelope
        const now = this.audioContext.currentTime;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(this.masterVolume, now + soundDef.attack);
        gainNode.gain.linearRampToValueAtTime(0, now + soundDef.duration);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.start(now);
        oscillator.stop(now + soundDef.duration);
    }

    playComboSound(comboCount) {
        // Escalating pitch for combos
        const pitchMultiplier = 1.0 + (comboCount - 1) * 0.2;
        this.playSound('combo', pitchMultiplier);
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        return this.isMuted;
    }

    getMuted() {
        return this.isMuted;
    }

    setVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
    }

    resumeContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
}

// Export for use in demo.html
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AudioManager;
}
