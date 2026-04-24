// AudioManager für Soundeffekte
// Fallback: Web Audio API Synthesizer, da wir keine externen Dateien haben.
class AudioManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.enabled = true; // Später ggf. muten
    }

    playShoot() {
        if (!this.enabled) return;
        // Kraftvollerer Schusssound mit Noise-Element
        const t = this.ctx.currentTime;
        const dur = 0.2;
        
        // Oszillator für den Knall
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.exponentialRampToValueAtTime(10, t + dur);
        oscGain.gain.setValueAtTime(0.8, t);
        oscGain.gain.exponentialRampToValueAtTime(0.01, t + dur);
        osc.connect(oscGain);
        oscGain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + dur);

        // Weißes Rauschen (White Noise) für die Explosion
        const bufferSize = this.ctx.sampleRate * dur;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.value = 1000;
        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.5, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, t + dur);
        
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);
        
        noise.start(t);
    }

    playEmptyClick() {
        if (!this.enabled) return;
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.05);

        gainNode.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);

        osc.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.05);
    }

    playReload() {
        if (!this.enabled) return;
        // Simples Wusch/Klack für Nachladen
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(600, this.ctx.currentTime + 0.2);

        gainNode.gain.setValueAtTime(0, this.ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, this.ctx.currentTime + 0.1);
        gainNode.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.2);

        osc.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.2);
    }

    playChickenHit() {
        if (!this.enabled) return;
        // Kurzes, knackiges Quiek / Plopp (näher am Original)
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.15); // Kürzer (0.15s statt 0.3s)

        gainNode.gain.setValueAtTime(0.5, this.ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

        osc.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
    }

    playUpgradeHit() {
        if (!this.enabled) return;
        // Magic Sound
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, this.ctx.currentTime);
        osc.frequency.setValueAtTime(600, this.ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(800, this.ctx.currentTime + 0.2);
        osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.3);

        gainNode.gain.setValueAtTime(0.5, this.ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);

        osc.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.4);
    }

    startBGM() {
        if (!this.enabled || this.bgmPlaying) return;

        // AudioContext muss evtl resume() aufgerufen werden wg Browser Policies
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

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
