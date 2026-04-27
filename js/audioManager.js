// AudioManager für Soundeffekte
// Fallback: Web Audio API Synthesizer, da wir keine externen Dateien haben.
class AudioManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.enabled = true; // Später ggf. muten
        this.bgmPlaying = false;
        this.bgmTimeout = null;
    }

    ensureContext() {
        if (!this.enabled) return false;
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        return true;
    }

    createVoice(type, frequency, at, duration, gain = 0.2, endFrequency = null) {
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(frequency, at);
        if (endFrequency != null && endFrequency > 0) {
            osc.frequency.exponentialRampToValueAtTime(endFrequency, at + duration);
        }

        gainNode.gain.setValueAtTime(0.0001, at);
        gainNode.gain.linearRampToValueAtTime(gain, at + Math.min(0.02, duration * 0.35));
        gainNode.gain.exponentialRampToValueAtTime(0.0001, at + duration);

        osc.connect(gainNode);
        gainNode.connect(this.ctx.destination);
        osc.start(at);
        osc.stop(at + duration + 0.01);
    }

    playShoot() {
        if (!this.ensureContext()) return;
        const now = this.ctx.currentTime;
        this.createVoice('square', 680, now, 0.055, 0.19, 180);
        this.createVoice('triangle', 240, now + 0.01, 0.08, 0.1, 120);
    }

    playEmptyClick() {
        if (!this.ensureContext()) return;
        const now = this.ctx.currentTime;
        this.createVoice('triangle', 980, now, 0.032, 0.12, 620);
        this.createVoice('sine', 330, now + 0.012, 0.035, 0.06, 240);
    }

    playReload() {
        if (!this.ensureContext()) return;
        // Simples Wusch/Klack für Nachladen
        const now = this.ctx.currentTime;
        this.createVoice('sawtooth', 230, now, 0.12, 0.12, 520);
        this.createVoice('triangle', 780, now + 0.13, 0.07, 0.1, 380);
    }

    playChickenHit(options = {}) {
        if (!this.ensureContext()) return;
        const now = this.ctx.currentTime;
        const isRare = Boolean(options.isRare);
        const isCrit = Boolean(options.isCrit);

        this.createVoice('triangle', isRare ? 760 : 540, now, 0.12, 0.2, 200);
        if (isCrit) {
            this.createVoice('sine', 1180, now + 0.01, 0.08, 0.14, 620);
        }
        if (isRare) {
            this.createVoice('square', 980, now + 0.03, 0.12, 0.12, 330);
        }
    }

    playUpgradeHit() {
        if (!this.ensureContext()) return;
        // Magic Sound
        const now = this.ctx.currentTime;
        this.createVoice('sine', 420, now, 0.08, 0.14, 640);
        this.createVoice('sine', 640, now + 0.07, 0.1, 0.12, 980);
        this.createVoice('triangle', 980, now + 0.16, 0.16, 0.1, 1580);
    }

    playCombo(comboCount) {
        if (!this.ensureContext()) return;
        if (comboCount < 3) return;
        const now = this.ctx.currentTime;
        const tier = Math.min(6, Math.floor(comboCount / 3));
        const base = 420 + tier * 90;
        this.createVoice('sine', base, now, 0.07, 0.1, base * 1.3);
        this.createVoice('triangle', base * 1.5, now + 0.045, 0.08, 0.08, base * 1.9);
    }

    playMiss(withShield = false) {
        if (!this.ensureContext()) return;
        const now = this.ctx.currentTime;
        if (withShield) {
            this.createVoice('triangle', 690, now, 0.08, 0.1, 980);
            this.createVoice('sine', 980, now + 0.04, 0.09, 0.08, 1240);
            return;
        }
        this.createVoice('square', 210, now, 0.09, 0.1, 130);
    }

    playAchievement() {
        if (!this.ensureContext()) return;
        const now = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99];
        notes.forEach((freq, index) => {
            this.createVoice('triangle', freq, now + index * 0.06, 0.12, 0.12, freq * 1.1);
        });
    }

    playEndRushStart() {
        if (!this.ensureContext()) return;
        const now = this.ctx.currentTime;
        this.createVoice('sawtooth', 220, now, 0.14, 0.15, 620);
        this.createVoice('square', 620, now + 0.12, 0.11, 0.14, 300);
    }

    playRoundEnd(score = 0) {
        if (!this.ensureContext()) return;
        const now = this.ctx.currentTime;
        const goodRun = score >= 500;
        const melody = goodRun
            ? [392, 523.25, 659.25]
            : [349.23, 293.66, 261.63];
        melody.forEach((freq, index) => {
            this.createVoice('triangle', freq, now + index * 0.09, 0.14, 0.12, freq * 0.92);
        });
    }

    startBGM() {
        if (!this.ensureContext() || this.bgmPlaying) return;

        this.bgmPlaying = true;
        let noteIndex = 0;

        // Bouncy "Country / Yankee Doodle" Vibe
        // Springt auf und ab, klingt viel fröhlicher
        const notes = [
            261.63, 329.63, 392.00, 523.25, // C E G C (hoch)
            440.00, 392.00, 329.63, 261.63, // A G E C (runter)
            293.66, 349.23, 440.00, 392.00, // D F A G (hoch)
            349.23, 293.66, 246.94, 196.00  // F D B G(low) (wieder runter)
        ];

        const tempo = 220; // Etwas schneller für den "peppy" Vibe
        const beatLength = 60 / tempo;

        const scheduleNotes = () => {
            if (!this.bgmPlaying) return;

            const time = this.ctx.currentTime;

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.frequency.value = notes[noteIndex];
            osc.type = 'triangle'; // Weicherer, holziger Sound

            // Kurzer "Pluck"-Sound für Bounciness
            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(0.04, time + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, time + beatLength * 0.8);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(time);
            osc.stop(time + beatLength);

            noteIndex = (noteIndex + 1) % notes.length;

            // Nächste Note im genauen Takt einplanen
            this.bgmTimeout = setTimeout(scheduleNotes, beatLength * 1000);
        };

        scheduleNotes();
    }

    stopBGM() {
        this.bgmPlaying = false;
        if (this.bgmTimeout) {
            clearTimeout(this.bgmTimeout);
            this.bgmTimeout = null;
        }
    }
}
