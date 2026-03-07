// --- Konfiguration und Globals ---
const GAME_DURATION = 90; // Standard Zeit in Sekunden
const DEFAULT_AMMO = 5;
const KONAMI_CODE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];
const MENU_CHEAT_CODE = 'MOORHUHN';

// Status Enums
const GameState = {
    MENU: 0,
    PLAYING: 1,
    GAMEOVER: 2,
    SHOP: 3,
    HIGHSCORES: 4
};

// --- Klassen ---

class Target {
    constructor(canvasWidth, canvasHeight) {
        this.ctx = null; // Wird beim Rendern gesetzt
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;

        // Entfernungs-Tiers (wie im Original)
        // 0 = Vorne (Groß, langsam), 1 = Mitte, 2 = Hinten (Klein, extrem schnell)
        const rand = Math.random();
        if (rand < 0.2) {
            this.tier = 0; // Vorne
            this.size = 80;
            this.points = 5;
            this.baseSpeed = 1.5;
        } else if (rand < 0.7) {
            this.tier = 1; // Mitte
            this.size = 45;
            this.points = 10;
            this.baseSpeed = 3.5;
        } else {
            this.tier = 2; // Hinten
            this.size = 20;
            this.points = 25;
            this.baseSpeed = 7.0;
        }

        // Startposition (links oder rechts außerhalb vom Bild)
        this.direction = Math.random() > 0.5 ? 1 : -1;
        this.x = this.direction === 1 ? -this.size : canvasWidth + this.size;

        // Hoehe (nicht zu tief)
        this.y = Math.random() * (canvasHeight * 0.6) + 50;

        // Geschwindigkeit abhänging von Tier und Richtung
        this.speedX = (this.baseSpeed + Math.random() * (this.tier + 1)) * this.direction;
        this.speedY = (Math.random() - 0.5) * 1;

        this.markedForDeletion = false;

        // Animations-State (Flügelschlag Sim)
        this.flapTime = 0;
    }

    update(deltaTime, speedMultiplier = 1) {
        this.x += this.speedX * (deltaTime / 16) * speedMultiplier;
        this.y += this.speedY * (deltaTime / 16) * speedMultiplier;

        // Leichtes Auf und Ab
        this.y += Math.sin(Date.now() / 200) * 1.5;

        // Wenn aus dem Bildschirm raus
        if ((this.direction === 1 && this.x > this.canvasWidth + this.size) ||
            (this.direction === -1 && this.x < -this.size)) {
            this.markedForDeletion = true;
        }

        this.flapTime += deltaTime;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        const s = this.size;

        // In Flugrichtung schauen
        if (this.direction === -1) {
            ctx.scale(-1, 1);
        }

        // --- ORIGINAL Moorhuhn Style (riesige Glubschaugen!) ---

        // Füße (baumeln beim Fliegen, zuerst = hinten)
        ctx.strokeStyle = '#D4901A';
        ctx.lineWidth = 2.5;
        const footDangle = Math.sin(this.flapTime / 80) * 0.15;
        ctx.beginPath();
        ctx.moveTo(-s * 0.1, s * 0.3);
        ctx.lineTo(-s * 0.15, s * 0.7 + footDangle * s);
        ctx.lineTo(-s * 0.3, s * 0.8 + footDangle * s);
        ctx.moveTo(-s * 0.15, s * 0.7 + footDangle * s);
        ctx.lineTo(-s * 0.05, s * 0.82 + footDangle * s);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(s * 0.1, s * 0.3);
        ctx.lineTo(s * 0.15, s * 0.7 - footDangle * s);
        ctx.lineTo(s * 0.0, s * 0.82 - footDangle * s);
        ctx.moveTo(s * 0.15, s * 0.7 - footDangle * s);
        ctx.lineTo(s * 0.3, s * 0.8 - footDangle * s);
        ctx.stroke();

        // Schwanzfedern
        ctx.fillStyle = '#5D3A1A';
        ctx.beginPath();
        ctx.moveTo(-s * 0.5, -s * 0.1);
        ctx.lineTo(-s * 0.9, -s * 0.6);
        ctx.lineTo(-s * 0.65, -s * 0.15);
        ctx.lineTo(-s * 1.0, -s * 0.35);
        ctx.lineTo(-s * 0.6, 0);
        ctx.closePath();
        ctx.fill();

        // Flügel (animiert)
        const flapAngle = Math.sin(this.flapTime / 55) * 0.7;
        ctx.save();
        ctx.translate(-s * 0.1, s * 0.05);
        ctx.rotate(flapAngle);
        ctx.fillStyle = '#7A5230';
        ctx.beginPath();
        ctx.ellipse(0, 0, s * 0.5, s * 0.2, Math.PI / 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#5D3A1A';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();

        // Körper (KLEIN im Verhältnis zum Kopf wie im Original)
        ctx.fillStyle = '#9B6B42';
        ctx.beginPath();
        ctx.ellipse(0, s * 0.05, s * 0.4, s * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#6D4020';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Brust (heller)
        ctx.fillStyle = '#B8946A';
        ctx.beginPath();
        ctx.ellipse(s * 0.1, s * 0.15, s * 0.25, s * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Kopf (RIESIG, Hauptmerkmal!)
        ctx.fillStyle = '#9B6B42';
        ctx.beginPath();
        ctx.arc(s * 0.3, -s * 0.35, s * 0.45, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#6D4020';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // KAMM (hoch, rot, wie im Original - eine große Zacke)
        ctx.fillStyle = '#DD1111';
        ctx.beginPath();
        ctx.moveTo(s * 0.05, -s * 0.65);
        ctx.quadraticCurveTo(s * 0.15, -s * 1.3, s * 0.35, -s * 0.9);
        ctx.quadraticCurveTo(s * 0.45, -s * 1.15, s * 0.55, -s * 0.7);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#AA0000';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // AUGEN (RIESIG! Googly-Eyes wie im Original!)
        // Linkes Auge
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.ellipse(s * 0.2, -s * 0.4, s * 0.22, s * 0.26, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // Rechtes Auge
        ctx.beginPath();
        ctx.ellipse(s * 0.55, -s * 0.38, s * 0.22, s * 0.26, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Pupillen (etwas schielend wie im Original)
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.arc(s * 0.28, -s * 0.38, s * 0.09, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(s * 0.5, -s * 0.36, s * 0.09, 0, Math.PI * 2);
        ctx.fill();

        // Glanzpunkte
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(s * 0.24, -s * 0.44, s * 0.04, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(s * 0.46, -s * 0.42, s * 0.04, 0, Math.PI * 2);
        ctx.fill();

        // SCHNABEL (groß, gelb-orange, wie im Original)
        ctx.fillStyle = '#F0B020';
        // Oberschnabel
        ctx.beginPath();
        ctx.moveTo(s * 0.6, -s * 0.25);
        ctx.lineTo(s * 1.1, -s * 0.15);
        ctx.lineTo(s * 0.6, -s * 0.08);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#C8880B';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // Unterschnabel
        ctx.fillStyle = '#E09818';
        ctx.beginPath();
        ctx.moveTo(s * 0.6, -s * 0.05);
        ctx.lineTo(s * 0.95, s * 0.02);
        ctx.lineTo(s * 0.6, s * 0.06);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // KEHLWAMPE (rot, hängt unter dem Schnabel)
        ctx.fillStyle = '#DD1111';
        ctx.beginPath();
        ctx.ellipse(s * 0.45, s * 0.08, s * 0.08, s * 0.14, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#AA0000';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.restore();
    }

    checkHit(px, py) {
        // Simple kreisförmige Hitbox basierend auf size
        const dx = px - this.x;
        const dy = py - this.y;
        return (dx * dx + dy * dy) < (this.size * this.size * 1.5);
    }
}

class InGameUpgrade extends Target {
    constructor(canvasWidth, canvasHeight, type) {
        super(canvasWidth, canvasHeight);
        this.type = type; // e.g. 'time', 'machinegun', 'slowmo'
        this.size = 35; // Feste Gröe
        this.points = 0; // Bringt keine Punkte, nur den Buff

        // Fliegt immer von unten nach oben quer durchs Bild wie ein Ballon
        this.x = Math.random() * (canvasWidth - 100) + 50;
        this.y = canvasHeight + this.size;
        this.speedX = (Math.random() - 0.5) * 2;
        this.speedY = -(Math.random() * 2 + 2);
    }

    update(deltaTime) {
        this.x += this.speedX * (deltaTime / 16);
        this.y += this.speedY * (deltaTime / 16);

        // Sinus-Wackeln für Ballon-Effekt
        this.x += Math.sin(this.y / 20) * 1.5;

        // Oben aus dem Bild
        if (this.y < -this.size * 2) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Fäden zum Korb
        ctx.beginPath();
        ctx.moveTo(-15, this.size * 0.8);
        ctx.lineTo(-10, this.size * 1.5);
        ctx.moveTo(15, this.size * 0.8);
        ctx.lineTo(10, this.size * 1.5);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Korb (Basket)
        ctx.fillStyle = '#D4A373';
        ctx.fillRect(-15, this.size * 1.5, 30, 20);
        ctx.strokeStyle = '#8B5A2B';
        ctx.lineWidth = 2;
        ctx.strokeRect(-15, this.size * 1.5, 30, 20);
        // Korb-Muster
        ctx.beginPath();
        ctx.moveTo(-15, this.size * 1.5 + 5);
        ctx.lineTo(15, this.size * 1.5 + 5);
        ctx.moveTo(-15, this.size * 1.5 + 10);
        ctx.lineTo(15, this.size * 1.5 + 10);
        ctx.moveTo(-15, this.size * 1.5 + 15);
        ctx.lineTo(15, this.size * 1.5 + 15);
        ctx.lineWidth = 1;
        ctx.stroke();

        // Extra Kiste/Sandsack am Korb basierend auf Upgrade
        let boxColor = '#8e44ad';
        let boxText = '?';
        if (this.type === 'time') { boxColor = '#3498db'; boxText = '+10s'; }
        if (this.type === 'machinegun') { boxColor = '#e74c3c'; boxText = 'MG'; }
        if (this.type === 'slowmo') { boxColor = '#9b59b6'; boxText = 'Slo'; }
        if (this.type === 'shotgun') { boxColor = '#f39c12'; boxText = 'SHG'; }
        if (this.type === 'fever') { boxColor = '#FF8C00'; boxText = 'Fvr'; }
        if (this.type === 'coins') { boxColor = '#FFD700'; boxText = 'Coin'; }

        ctx.fillStyle = boxColor;
        ctx.fillRect(-8, this.size * 1.5 + 20, 16, 16);
        ctx.strokeRect(-8, this.size * 1.5 + 20, 16, 16);

        // Ballon-Körper Rendern (Vertikale Streifen)
        // Wir zeichnen den Grundballon in Braun/Schwarz und legen dann rote Streifen (Arcs) darüber
        ctx.fillStyle = '#111111'; // Dunkle Basis
        ctx.beginPath();
        ctx.ellipse(0, 0, this.size, this.size * 1.2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Rote Gores (Streifen)
        ctx.fillStyle = '#CC1111';
        ctx.beginPath();
        // Mittlerer Stern
        ctx.ellipse(0, 0, this.size * 0.3, this.size * 1.2, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        // Linker Streifen
        ctx.ellipse(-this.size * 0.7, 0, this.size * 0.2, this.size * 1.15, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        // Rechter Streifen
        ctx.ellipse(this.size * 0.7, 0, this.size * 0.2, this.size * 1.15, 0, 0, Math.PI * 2);
        ctx.fill();

        // Dunkle Outlines zwischen den Streifen für Form
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.size, this.size * 1.2, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(0, 0, this.size * 0.5, this.size * 1.2, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Moorhuhn Schriftzug auf dem Ballon
        ctx.fillStyle = '#FFD700'; // Gold
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 2;
        ctx.fillText('Moorhuhn', 0, -5);
        ctx.shadowBlur = 0; // reset

        // Text auf dem Päckchen
        ctx.fillStyle = '#fff';
        ctx.font = '10px "Fredoka One"';
        ctx.fillText(boxText, 0, this.size * 1.5 + 32);

        // Glanzpunkt für den 3D-Effekt
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.beginPath();
        ctx.ellipse(-this.size * 0.3, -this.size * 0.5, this.size * 0.2, this.size * 0.4, Math.PI / 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    checkHit(px, py) {
        // Kiste und Ballon als Hitbox
        const dx = px - this.x;
        const dy = py - this.y;
        const hitBalloon = (dx * dx + dy * dy) < (this.size * this.size * 1.5);

        // hitBox = die Kiste unten
        const hitSquare = (px > this.x - 20 && px < this.x + 20 && py > this.y + this.size + 20 && py < this.y + this.size + 80);

        return hitBalloon || hitSquare;
    }
}

// Seltenes goldenes Huhn (Gimmick: 18% Chance bei speziellen Spawns)
class RareTarget extends Target {
    constructor(canvasWidth, canvasHeight) {
        super(canvasWidth, canvasHeight);
        this.size = 28; // Etwas größer für bessere Sichtbarkeit
        this.points = 75; // 3x normale Punkte
        this.baseSpeed = 8.5; // Schneller
        this.isRare = true;
    }

    draw(ctx) {
        // Golden aura effect
        ctx.save();
        ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Draw golden circle glow
        ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 1.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw the chicken body (slightly golden)
        ctx.fillStyle = '#FDD835';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.size * 0.7, this.size * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw head
        ctx.fillStyle = '#FBC02D';
        ctx.beginPath();
        ctx.arc(this.x, this.y - this.size * 0.3, this.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw eyes
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.x - this.size * 0.25, this.y - this.size * 0.4, this.size * 0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + this.size * 0.25, this.y - this.size * 0.4, this.size * 0.15, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

class HiddenTarget {
    constructor(canvasWidth, canvasHeight, obstacle) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.obstacle = obstacle; // {x, y, popDirection: 'up'|'left'|'right'}

        this.size = 40;
        this.points = 25; // Mehr Punkte weil schwerer zu treffen

        // Position = am Versteck
        this.homeX = obstacle.x;
        this.homeY = obstacle.y;
        this.x = this.homeX;
        this.y = this.homeY;

        // State Machine: 'hiding' -> 'popping' -> 'exposed' -> 'ducking' -> 'gone'
        this.phase = 'hiding';
        this.phaseTimer = 0;
        this.popOffset = 0; // Wie weit das Huhn herausschaut (0 = versteckt, 1 = komplett draussen)

        // Timing
        this.hideDelay = Math.random() * 500 + 200; // Wartezeit bevor es rauskommt
        this.popDuration = 400; // Wie lange das Rauskommen dauert (ms)
        this.exposedDuration = Math.random() * 1500 + 1000; // Wie lange es sichtbar bleibt
        this.duckDuration = 300; // Wie lange das Wegducken dauert

        this.markedForDeletion = false;
        this.flapTime = 0;
    }

    update(deltaTime) {
        this.phaseTimer += deltaTime;
        this.flapTime += deltaTime;

        const popDistance = 70; // Pixel die es sich bewegt

        switch (this.phase) {
            case 'hiding':
                if (this.phaseTimer > this.hideDelay) {
                    this.phase = 'popping';
                    this.phaseTimer = 0;
                }
                break;

            case 'popping':
                this.popOffset = Math.min(1, this.phaseTimer / this.popDuration);
                // Smooth easing
                const easeOut = 1 - Math.pow(1 - this.popOffset, 3);
                if (this.obstacle.popDirection === 'up') {
                    this.y = this.homeY - easeOut * popDistance;
                } else if (this.obstacle.popDirection === 'left') {
                    this.x = this.homeX - easeOut * popDistance;
                } else {
                    this.x = this.homeX + easeOut * popDistance;
                }
                if (this.phaseTimer >= this.popDuration) {
                    this.phase = 'exposed';
                    this.phaseTimer = 0;
                }
                break;

            case 'exposed':
                // Leichtes Wackeln
                if (this.obstacle.popDirection === 'up') {
                    this.y = (this.homeY - popDistance) + Math.sin(this.flapTime / 200) * 3;
                } else {
                    this.x = (this.obstacle.popDirection === 'left' ? this.homeX - popDistance : this.homeX + popDistance) + Math.sin(this.flapTime / 200) * 3;
                }
                if (this.phaseTimer >= this.exposedDuration) {
                    this.phase = 'ducking';
                    this.phaseTimer = 0;
                }
                break;

            case 'ducking':
                this.popOffset = Math.max(0, 1 - this.phaseTimer / this.duckDuration);
                const easeIn = 1 - Math.pow(1 - this.popOffset, 2);
                if (this.obstacle.popDirection === 'up') {
                    this.y = this.homeY - easeIn * popDistance;
                } else if (this.obstacle.popDirection === 'left') {
                    this.x = this.homeX - easeIn * popDistance;
                } else {
                    this.x = this.homeX + easeIn * popDistance;
                }
                if (this.phaseTimer >= this.duckDuration) {
                    this.phase = 'gone';
                    this.markedForDeletion = true;
                }
                break;
        }
    }

    draw(ctx) {
        // Nicht zeichnen wenn komplett versteckt
        if (this.phase === 'hiding' || this.phase === 'gone') return;

        ctx.save();
        ctx.translate(this.x, this.y);
        const s = this.size;

        // --- Original Moorhuhn Style (sitzendes Huhn, Glubschaugen) ---

        // Körper (klein, sitzend)
        ctx.fillStyle = '#9B6B42';
        ctx.beginPath();
        ctx.ellipse(0, s * 0.05, s * 0.4, s * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#6D4020';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Flügel
        ctx.fillStyle = '#7A5230';
        ctx.beginPath();
        ctx.ellipse(s * 0.2, s * 0.05, s * 0.25, s * 0.15, 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Kopf (RIESIG)
        ctx.fillStyle = '#9B6B42';
        ctx.beginPath();
        ctx.arc(0, -s * 0.35, s * 0.38, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#6D4020';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Kamm (hoch, rot)
        ctx.fillStyle = '#DD1111';
        ctx.beginPath();
        ctx.moveTo(-s * 0.15, -s * 0.6);
        ctx.quadraticCurveTo(-s * 0.05, -s * 1.15, s * 0.08, -s * 0.75);
        ctx.quadraticCurveTo(s * 0.18, -s * 1.0, s * 0.25, -s * 0.6);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#AA0000';
        ctx.lineWidth = 1;
        ctx.stroke();

        // AUGEN (RIESIG! Googly!)
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.ellipse(-s * 0.12, -s * 0.4, s * 0.18, s * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(s * 0.18, -s * 0.38, s * 0.18, s * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Pupillen
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.arc(-s * 0.06, -s * 0.38, s * 0.07, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(s * 0.14, -s * 0.36, s * 0.07, 0, Math.PI * 2);
        ctx.fill();

        // Glanz
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(-s * 0.1, -s * 0.44, s * 0.03, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(s * 0.1, -s * 0.42, s * 0.03, 0, Math.PI * 2);
        ctx.fill();

        // Schnabel
        ctx.fillStyle = '#F0B020';
        ctx.beginPath();
        ctx.moveTo(s * 0.25, -s * 0.22);
        ctx.lineTo(s * 0.55, -s * 0.15);
        ctx.lineTo(s * 0.25, -s * 0.08);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#C8880B';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Kehlwampe
        ctx.fillStyle = '#DD1111';
        ctx.beginPath();
        ctx.ellipse(s * 0.1, -s * 0.02, s * 0.06, s * 0.1, 0.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    checkHit(px, py) {
        // Nur treffbar wenn exposed oder popping (also sichtbar)
        if (this.phase !== 'exposed' && this.phase !== 'popping') return false;
        const dx = px - this.x;
        const dy = py - this.y;
        return (dx * dx + dy * dy) < (this.size * this.size * 1.2);
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 8 + 4;
        this.speedX = (Math.random() - 0.5) * 10;
        this.speedY = (Math.random() - 0.5) * 10;
        this.life = 1.0;
        this.markedForDeletion = false;
    }
    update(deltaTime) {
        this.x += this.speedX * (deltaTime / 16);
        this.y += this.speedY * (deltaTime / 16);
        this.life -= 0.02 * (deltaTime / 16);
        if (this.life <= 0) this.markedForDeletion = true;
    }
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class ScorePopup {
    constructor(x, y, text, color = '#ffd700') {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.life = 1.0;
        this.markedForDeletion = false;
    }
    update(deltaTime) {
        this.y -= 2 * (deltaTime / 16); // Steigt auf
        this.life -= 0.02 * (deltaTime / 16);
        if (this.life <= 0) this.markedForDeletion = true;
    }
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.font = 'bold 30px "Fredoka One"';
        ctx.fillStyle = this.color;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.strokeText(this.text, this.x, this.y);
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
    }
}

// --- Hauptspiel Logik ---

class Landscape {
    constructor(canvasWidth, canvasHeight) {
        this.width = canvasWidth;
        this.height = canvasHeight;

        // Wolken generieren (Parallax Layer 1)
        this.clouds = [];
        for (let i = 0; i < 6; i++) {
            this.clouds.push({
                x: Math.random() * this.width,
                y: Math.random() * (this.height * 0.4), // Obere Hälfte
                size: Math.random() * 40 + 30,
                speed: Math.random() * 10 + 5 // Langsame Bewegung
            });
        }

        // Interaktive Elemente State
        this.windmill = {
            rotation: 0.4,
            spinSpeed: 0,
            x: this.width * 0.85,
            y: this.height * 0.76 - 75 // Zentrum der Flügel
        };

        this.signpost = {
            x: this.width * 0.25,
            y: this.height * 0.85
        };

        this.sun = {
            hit: false,
            x: this.width * 0.8,
            y: this.height * 0.15,
            radius: 60
        };

        this.tree = {
            shakeTimer: 0,
            x: this.width * 0.12,
            y: this.height * 0.78 - 150, // Mitte der Krone
            radius: 50
        };

        this.scarecrow = {
            spinSpeed: 0,
            rotation: 0,
            x: this.width * 0.65,
            y: this.height * 0.65
        };

        this.zeppelin = {
            active: true,
            x: -100,
            y: this.height * 0.25,
            speed: 20 // sehr langsam
        };

        this.church = {
            x: this.width * 0.45,
            y: this.height * 0.42,
            ringing: 0 // Timer für den Glocken-Effekt
        };

        this.mole = {
            x: this.width * 0.35,
            y: this.height * 0.82,
            state: 'hidden', // hidden, peeking
            timer: 0,
            angryTimer: 0 // Zum Schütteln der Faust
        };

        this.rainCloud = {
            x: this.width * 0.7,
            y: this.height * 0.1,
            size: 60,
            speed: 8,
            rainingTimer: 0
        };

        this.ufo = {
            active: false,
            hit: false,
            x: -50,
            y: this.height * 0.08,
            speed: 400
        };

        this.coinRock = {
            hitCount: 0,
            cracked: false,
            coinTimer: 0
        };

        this.frog = {
            state: 'hidden', // hidden, jumping
            x: this.width * 0.7,
            y: this.height * 0.85,
            jumpX: 0,
            jumpY: 0,
            jumpVX: 0,
            jumpVY: 0,
            timer: 0
        };

        this.chimney = {
            x: this.width * 0.55,
            y: this.height * 0.52,
            hitSmoke: false,
            smokeParticles: []
        };

        this.branch = {
            intact: true,
            fallY: 0,
            fallSpeed: 0
        };

        this.signFlipped = false;

        // Hindernisse/Verstecke (Positionen relativ zur Canvas-Größe)
        this.updateObstaclePositions();
    }

    updateObstaclePositions() {
        this.windmill.x = this.width * 0.85;
        this.windmill.y = this.height * 0.76 - 75;
        this.signpost.x = this.width * 0.25;
        this.signpost.y = this.height * 0.85;
        this.sun.x = this.width * 0.8;
        this.sun.y = this.height * 0.15;
        this.tree.x = this.width * 0.12;
        this.tree.y = this.height * 0.78 - 150;
        this.scarecrow.x = this.width * 0.65;
        this.scarecrow.y = this.height * 0.65;
        this.church.x = this.width * 0.45;
        this.church.y = this.height * 0.42;
        this.mole.x = this.width * 0.35;
        this.mole.y = this.height * 0.82;

        // Positionen der Verstecke, relativ zur Canvas-Größe
        this.obstacles = [
            { id: 'tree', x: this.width * 0.12, y: this.height * 0.72, popDirection: 'right' },
            { id: 'rock', x: this.width * 0.5, y: this.height * 0.82, popDirection: 'up' },
            { id: 'windmill', x: this.width * 0.85, y: this.height * 0.75, popDirection: 'left' },
        ];
    }

    getRandomObstacle() {
        return this.obstacles[Math.floor(Math.random() * this.obstacles.length)];
    }

    resize(canvasWidth, canvasHeight) {
        this.width = canvasWidth;
        this.height = canvasHeight;
        this.updateObstaclePositions();
    }

    update(deltaTime) {
        // Wolken ziehen lassen
        this.clouds.forEach(c => {
            c.x -= c.speed * (deltaTime / 1000);
            if (c.x < -c.size * 2) {
                c.x = this.width + c.size * 2;
                c.y = Math.random() * (this.height * 0.4);
            }
        });

        // Windmühle drehen lassen wenn abgeschossen
        if (this.windmill.spinSpeed > 0) {
            this.windmill.rotation += this.windmill.spinSpeed * (deltaTime / 16);
            this.windmill.spinSpeed *= 0.99; // Langsam wieder auslaufen
            if (this.windmill.spinSpeed < 0.001) this.windmill.spinSpeed = 0;
        }

        // Baum wackeln lassen
        if (this.tree && this.tree.shakeTimer > 0) {
            this.tree.shakeTimer -= (deltaTime / 16);
            if (this.tree.shakeTimer < 0) this.tree.shakeTimer = 0;
        }

        // Vogelscheuche drehen lassen
        if (this.scarecrow && this.scarecrow.spinSpeed > 0) {
            this.scarecrow.rotation += this.scarecrow.spinSpeed * (deltaTime / 16);
            this.scarecrow.spinSpeed *= 0.95; // Reibung
            if (this.scarecrow.spinSpeed < 0.001) this.scarecrow.spinSpeed = 0;
        }

        // Zeppelin bewegen
        if (this.zeppelin.active) {
            this.zeppelin.x += this.zeppelin.speed * (deltaTime / 1000);
            if (this.zeppelin.x > this.width + 100) {
                this.zeppelin.x = -100;
                this.zeppelin.y = this.height * (0.15 + Math.random() * 0.2);
            }
        }

        // Kirchenglocke Timer
        if (this.church.ringing > 0) {
            this.church.ringing -= deltaTime;
            if (this.church.ringing < 0) this.church.ringing = 0;
        }

        // Maulwurf Timer
        if (this.mole.state === 'peeking') {
            this.mole.timer -= deltaTime;
            if (this.mole.timer <= 0) {
                this.mole.state = 'hidden';
                this.mole.timer = 3000 + Math.random() * 5000; // Nächstes Auftauchen
            }
        } else if (this.mole.state === 'hidden') {
            this.mole.timer -= deltaTime;
            if (this.mole.timer <= 0) {
                this.mole.state = 'peeking';
                this.mole.timer = 2000 + Math.random() * 2000; // Wie lange er oben bleibt
            }
        }
        if (this.mole.angryTimer > 0) this.mole.angryTimer -= deltaTime;

        // Regenwolke Regen-Timer
        if (this.rainCloud.rainingTimer > 0) {
            this.rainCloud.rainingTimer -= deltaTime;
            if (this.rainCloud.rainingTimer < 0) this.rainCloud.rainingTimer = 0;
        }

        // Frosch Sprung-Animation
        if (this.frog.state === 'jumping') {
            this.frog.jumpVY += 0.3 * (deltaTime / 16); // Gravitation
            this.frog.jumpX += this.frog.jumpVX * (deltaTime / 16);
            this.frog.jumpY += this.frog.jumpVY * (deltaTime / 16);
            if (this.frog.jumpY > this.frog.y) {
                this.frog.state = 'hidden';
                this.frog.timer = 5000 + Math.random() * 8000;
            }
        } else if (this.frog.state === 'hidden') {
            this.frog.timer -= deltaTime;
            if (this.frog.timer <= 0) {
                // Frosch springt!
                this.frog.state = 'jumping';
                this.frog.jumpX = this.frog.x;
                this.frog.jumpY = this.frog.y;
                this.frog.jumpVX = (Math.random() > 0.5 ? 1 : -1) * (2 + Math.random() * 2);
                this.frog.jumpVY = -(8 + Math.random() * 4);
            }
        }

        // Rauch-Partikel vom Kamin
        if (this.chimney) {
            // Rauch erzeugen (wenige pro Frame)
            if (Math.random() < 0.3) {
                this.chimney.smokeParticles.push({
                    x: this.chimney.x + 12,
                    y: this.chimney.y - 25,
                    size: 3 + Math.random() * 3,
                    speedY: -(0.3 + Math.random() * 0.3),
                    speedX: (Math.random() - 0.5) * 0.3,
                    life: 1
                });
            }
            // Rauch aktualisieren
            for (let i = this.chimney.smokeParticles.length - 1; i >= 0; i--) {
                const p = this.chimney.smokeParticles[i];
                p.x += p.speedX * (deltaTime / 16);
                p.y += p.speedY * (deltaTime / 16);
                p.size += 0.05 * (deltaTime / 16);
                p.life -= 0.01 * (deltaTime / 16);
                if (p.life <= 0) this.chimney.smokeParticles.splice(i, 1);
            }
        }

        // Ast fallen lassen
        if (this.branch && !this.branch.intact && this.branch.fallY < this.height) {
            this.branch.fallSpeed += 0.2 * (deltaTime / 16);
            this.branch.fallY += this.branch.fallSpeed * (deltaTime / 16);
        }

        // Coin Rock Coins-Timer
        if (this.coinRock.coinTimer > 0) {
            this.coinRock.coinTimer -= deltaTime;
            if (this.coinRock.coinTimer < 0) this.coinRock.coinTimer = 0;
        }
    }

    // Prüft ob bestimmte Landschaftselemente (Windmühle, Schild) getroffen wurden
    // Gibt false oder ein Objekt { points: 50, type: 'windmill' } zurück
    checkHits(px, py) {
        // 1. Windmühlenflügel prüfen
        const dxW = px - this.windmill.x;
        const dyW = py - this.windmill.y;
        if (dxW * dxW + dyW * dyW < 60 * 60) { // Radius 60
            this.windmill.spinSpeed = 0.2; // Anschubsen
            return { points: 50, type: 'windmill', x: this.windmill.x, y: this.windmill.y };
        }

        // 2. Schild prüfen (Moorhuhn Jagd verboten!)
        if (!this.signFlipped) {
            const signTopY = this.signpost.y - 40;
            if (px > this.signpost.x - 30 && px < this.signpost.x + 30 && py > signTopY - 20 && py < signTopY + 20) {
                return { points: -25, type: 'sign', x: this.signpost.x, y: signTopY };
            }
        }

        // 3. Coole Sonne prüfen
        if (!this.sun.hit) {
            const dxS = px - this.sun.x;
            const dyS = py - this.sun.y;
            if (dxS * dxS + dyS * dyS < this.sun.radius * this.sun.radius) {
                this.sun.hit = true;
                return { points: 50, type: 'sun', x: this.sun.x, y: this.sun.y };
            }
        }

        // 4. Baumkrone prüfen
        if (this.tree && this.tree.shakeTimer <= 0) { // Cooldown
            const dxT = px - this.tree.x;
            const dyT = py - this.tree.y;
            // Etwas größere Hitbox, weil die Krone aus mehreren Kreisen besteht
            if (dxT * dxT + dyT * dyT < (this.tree.radius + 30) * (this.tree.radius + 30)) {
                this.tree.shakeTimer = 30; // ~ 0.5s wackeln
                return { points: 10, type: 'tree', x: this.tree.x, y: this.tree.y };
            }
        }

        // 5. Vogelscheuche prüfen
        const scTopY = this.scarecrow.y - 60;
        if (px > this.scarecrow.x - 25 && px < this.scarecrow.x + 25 && py > scTopY - 10 && py < scTopY + 80) {
            this.scarecrow.spinSpeed = 1.0;
            return { points: 25, type: 'scarecrow', x: this.scarecrow.x, y: scTopY };
        }

        // 6. Zeppelin prüfen (winzig, 100 Punkte)
        if (this.zeppelin.active) {
            if (px > this.zeppelin.x - 20 && px < this.zeppelin.x + 20 &&
                py > this.zeppelin.y - 8 && py < this.zeppelin.y + 8) {
                this.zeppelin.active = false; // Platzt und verschwindet
                return { points: 100, type: 'zeppelin', x: this.zeppelin.x, y: this.zeppelin.y };
            }
        }

        // 7. Kirchenglocke prüfen
        if (this.church.ringing <= 0) {
            if (px > this.church.x - 15 && px < this.church.x + 15 &&
                py > this.church.y - 30 && py < this.church.y) {
                this.church.ringing = 3000; // 3 Sekunden klingeln
                return { points: 50, type: 'church', x: this.church.x, y: this.church.y - 15 };
            }
        }

        // 8. Maulwurf prüfen
        if (this.mole.state === 'peeking') {
            const mDist = Math.sqrt((px - this.mole.x) ** 2 + (py - this.mole.y) ** 2);
            if (mDist < 20) {
                // Direkt getroffen = Punktabzug!
                this.mole.state = 'hidden';
                this.mole.timer = 8000;
                return { points: -50, type: 'mole_hit', x: this.mole.x, y: this.mole.y };
            } else if (mDist < 60) {
                // Knapp daneben = Maulwurf erschreckt sich, Bonus!
                this.mole.angryTimer = 1500;
                this.mole.state = 'hidden';
                this.mole.timer = 5000;
                return { points: 25, type: 'mole_miss', x: this.mole.x, y: this.mole.y };
            }
        }

        // 9. Regenwolke prüfen (dunkle Wolke)
        if (this.rainCloud.rainingTimer <= 0) {
            const rcDx = px - this.rainCloud.x;
            const rcDy = py - this.rainCloud.y;
            if (rcDx * rcDx + rcDy * rcDy < this.rainCloud.size * this.rainCloud.size) {
                this.rainCloud.rainingTimer = 5000; // 5 Sek Regen
                return { points: 15, type: 'raincloud', x: this.rainCloud.x, y: this.rainCloud.y };
            }
        }

        // 10. Frosch im Sprung prüfen
        if (this.frog.state === 'jumping') {
            const fDist = Math.sqrt((px - this.frog.jumpX) ** 2 + (py - this.frog.jumpY) ** 2);
            if (fDist < 20) {
                this.frog.state = 'hidden';
                this.frog.timer = 10000;
                return { points: 20, type: 'frog', x: this.frog.jumpX, y: this.frog.jumpY };
            }
        }

        // 11. Schornstein prüfen
        if (!this.chimney.hitSmoke) {
            if (px > this.chimney.x - 10 && px < this.chimney.x + 25 &&
                py > this.chimney.y - 35 && py < this.chimney.y - 15) {
                this.chimney.hitSmoke = true; // Rauch wird bunt
                return { points: 30, type: 'chimney', x: this.chimney.x + 10, y: this.chimney.y - 25 };
            }
        }

        // 12. Ast am Baum prüfen
        if (this.branch.intact) {
            const branchX = this.width * 0.12 + 55;
            const branchY = this.height * 0.78 - 120;
            if (px > branchX - 10 && px < branchX + 30 && py > branchY - 6 && py < branchY + 6) {
                this.branch.intact = false;
                this.branch.fallY = branchY;
                this.branch.fallSpeed = 0;
                return { points: 40, type: 'branch', x: branchX, y: branchY };
            }
        }

        // 13. Schildpfahl statt Schild prüfen (flip)
        if (!this.signFlipped) {
            // Pfahl ist schmaler und unter dem Schild
            if (px > this.signpost.x - 5 && px < this.signpost.x + 5 &&
                py > this.signpost.y - 10 && py < this.signpost.y + 20) {
                this.signFlipped = true;
                return { points: 10, type: 'signflip', x: this.signpost.x, y: this.signpost.y };
            }
        }

        // 14. Stein prüfen (Münz-Stein, 3x treffen für Coins)
        const rockX = this.width * 0.5;
        const rockY = this.height * 0.83 - 25;
        if (!this.coinRock.cracked) {
            const rDist = Math.sqrt((px - rockX) ** 2 + (py - rockY) ** 2);
            if (rDist < 40) {
                this.coinRock.hitCount++;
                if (this.coinRock.hitCount >= 3) {
                    this.coinRock.cracked = true;
                    this.coinRock.coinTimer = 2000; // 2 Sek Münz-Animation
                    return { points: 0, type: 'coinrock', x: rockX, y: rockY, coins: 50 };
                }
                return { points: 5, type: 'rock_hit', x: rockX, y: rockY };
            }
        }

        return null;
    }

    draw(ctx) {
        // 1. Himmel
        const skyGradient = ctx.createLinearGradient(0, 0, 0, this.height);
        skyGradient.addColorStop(0, '#78AACC'); // Etwas graueres Blau
        skyGradient.addColorStop(1, '#B0D0E0');
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, this.width, this.height);

        // 2. Sonne
        ctx.save();
        ctx.translate(this.sun.x, this.sun.y);

        ctx.fillStyle = '#FFF9D0';
        if (this.sun.hit) {
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = 20;
        }
        ctx.beginPath();
        ctx.arc(0, 0, this.sun.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0; // reset

        // Sonnenbrille zeichnen wenn getroffen
        if (this.sun.hit) {
            ctx.fillStyle = '#111'; // Schwarz
            ctx.beginPath();
            // Linkes Glas
            ctx.arc(-20, -10, 18, 0, Math.PI);
            // Rechtes Glas
            ctx.arc(20, -10, 18, 0, Math.PI);
            ctx.fill();

            // Steg
            ctx.strokeStyle = '#111';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(-10, -10);
            ctx.lineTo(10, -10);
            ctx.stroke();

            // Glanz auf der Brille
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.beginPath();
            ctx.arc(-25, -15, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(15, -15, 6, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        // 3. Bergkette im Hintergrund
        ctx.fillStyle = '#6D8A96';
        ctx.beginPath();
        ctx.moveTo(0, this.height);
        ctx.lineTo(0, this.height * 0.45);
        ctx.lineTo(this.width * 0.3, this.height * 0.35);
        ctx.lineTo(this.width * 0.6, this.height * 0.5);
        ctx.lineTo(this.width * 0.8, this.height * 0.3);
        ctx.lineTo(this.width, this.height * 0.45);
        ctx.lineTo(this.width, this.height);
        ctx.closePath();
        ctx.fill();

        // Kirche auf dem Berg
        this._drawChurch(ctx);

        // Kleines Haus mit Kamin
        this._drawChimney(ctx);

        // 4. Hügelkette (Middleground - Golden Brown)
        ctx.fillStyle = '#C28E42';
        ctx.beginPath();
        ctx.moveTo(0, this.height);
        ctx.lineTo(0, this.height * 0.6);
        ctx.quadraticCurveTo(this.width * 0.3, this.height * 0.5, this.width * 0.6, this.height * 0.65);
        ctx.quadraticCurveTo(this.width * 0.8, this.height * 0.7, this.width, this.height * 0.55);
        ctx.lineTo(this.width, this.height);
        ctx.closePath();
        ctx.fill();

        // 5. Vordergrund-Weizenfeld (Vibrant Golden Yellow)
        ctx.fillStyle = '#EBC034';
        ctx.beginPath();
        ctx.moveTo(0, this.height * 0.75);
        ctx.quadraticCurveTo(this.width * 0.2, this.height * 0.68, this.width * 0.5, this.height * 0.72);
        ctx.quadraticCurveTo(this.width * 0.8, this.height * 0.78, this.width, this.height * 0.7);
        ctx.lineTo(this.width, this.height);
        ctx.lineTo(0, this.height);
        ctx.closePath();
        ctx.fill();

        // Weizen-Stoppeln/Textur
        ctx.strokeStyle = 'rgba(0,0,0,0.05)';
        ctx.lineWidth = 1;
        for (let i = 0; i < this.width; i += 40) {
            ctx.beginPath();
            ctx.moveTo(i, this.height * 0.7);
            ctx.lineTo(i + 5, this.height * 0.75);
            ctx.stroke();
        }

        // 6. Wolken zeichnen (über den Bergen, im Himmel)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.clouds.forEach(c => {
            ctx.beginPath();
            ctx.arc(c.x, c.y, c.size, 0, Math.PI * 2);
            ctx.arc(c.x + c.size * 0.8, c.y - c.size * 0.3, c.size * 0.8, 0, Math.PI * 2);
            ctx.arc(c.x + c.size * 1.6, c.y, c.size * 0.9, 0, Math.PI * 2);
            ctx.fill();
        });

        // Dunkle Regenwolke zeichnen
        this._drawRainCloud(ctx);

        // Zeppelin im Hintergrund
        this._drawZeppelin(ctx);

        // UFO (nur wenn aktiv)
        this._drawUFO(ctx);

        // Regen Partikel
        this._drawRain(ctx);
    }

    // Vordergrund-Objekte (werden NACH den Hühnern gezeichnet, damit sie davor liegen)
    drawForeground(ctx) {
        this._drawMoleHill(ctx);
        this._drawFrog(ctx);
        this._drawScarecrow(ctx);
        this._drawTree(ctx);
        this._drawBranch(ctx);
        this._drawRock(ctx);
        this._drawWindmill(ctx);
        this._drawSignpost(ctx);
    }
    // === NEUE SECRET DRAW METHODEN ===

    _drawChurch(ctx) {
        const x = this.church.x;
        const y = this.church.y;
        ctx.save();
        // Gebäude
        ctx.fillStyle = '#8B7D6B';
        ctx.fillRect(x - 12, y - 15, 24, 20);
        // Dach
        ctx.fillStyle = '#5C4033';
        ctx.beginPath();
        ctx.moveTo(x - 15, y - 15);
        ctx.lineTo(x, y - 28);
        ctx.lineTo(x + 15, y - 15);
        ctx.closePath();
        ctx.fill();
        // Turmspitze
        ctx.fillRect(x - 3, y - 35, 6, 8);
        // Kreuz
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y - 42);
        ctx.lineTo(x, y - 35);
        ctx.moveTo(x - 3, y - 39);
        ctx.lineTo(x + 3, y - 39);
        ctx.stroke();
        // Glocken-Effekt (Wackeln/Leuchten)
        if (this.church.ringing > 0) {
            const glowSize = Math.sin(this.church.ringing * 0.02) * 3 + 5;
            ctx.fillStyle = 'rgba(255, 215, 0, 0.4)';
            ctx.beginPath();
            ctx.arc(x, y - 38, glowSize, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    _drawChimney(ctx) {
        const x = this.chimney.x;
        const y = this.chimney.y;
        ctx.save();
        // Haus
        ctx.fillStyle = '#A0522D';
        ctx.fillRect(x - 18, y - 12, 36, 18);
        // Dach
        ctx.fillStyle = '#8B0000';
        ctx.beginPath();
        ctx.moveTo(x - 22, y - 12);
        ctx.lineTo(x, y - 25);
        ctx.lineTo(x + 22, y - 12);
        ctx.closePath();
        ctx.fill();
        // Schornstein
        ctx.fillStyle = '#555';
        ctx.fillRect(x + 8, y - 28, 8, 15);
        // Tür
        ctx.fillStyle = '#5C4033';
        ctx.fillRect(x - 5, y - 3, 10, 10);
        // Fenster
        ctx.fillStyle = '#FFE4B5';
        ctx.fillRect(x - 14, y - 8, 6, 5);
        ctx.fillRect(x + 8, y - 8, 6, 5);
        // Rauch-Partikel zeichnen
        this.chimney.smokeParticles.forEach(p => {
            const smokeColor = this.chimney.hitSmoke
                ? `hsla(${(p.y * 3) % 360}, 80%, 60%, ${p.life * 0.6})`
                : `rgba(150, 150, 150, ${p.life * 0.5})`;
            ctx.fillStyle = smokeColor;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();
    }

    _drawRainCloud(ctx) {
        ctx.save();
        const rc = this.rainCloud;
        ctx.fillStyle = rc.rainingTimer > 0 ? 'rgba(60, 60, 80, 0.9)' : 'rgba(100, 100, 120, 0.7)';
        ctx.beginPath();
        ctx.arc(rc.x, rc.y, rc.size * 0.7, 0, Math.PI * 2);
        ctx.arc(rc.x + rc.size * 0.5, rc.y - rc.size * 0.2, rc.size * 0.5, 0, Math.PI * 2);
        ctx.arc(rc.x + rc.size, rc.y, rc.size * 0.6, 0, Math.PI * 2);
        ctx.fill();
        // Blitz wenn gerade getroffen
        if (rc.rainingTimer > 4500) {
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(rc.x + 10, rc.y + rc.size * 0.5);
            ctx.lineTo(rc.x + 5, rc.y + rc.size);
            ctx.lineTo(rc.x + 15, rc.y + rc.size);
            ctx.lineTo(rc.x + 8, rc.y + rc.size * 1.5);
            ctx.stroke();
        }
        ctx.restore();
    }

    _drawZeppelin(ctx) {
        if (!this.zeppelin.active) return;
        ctx.save();
        ctx.translate(this.zeppelin.x, this.zeppelin.y);
        // Körper (winzig!)
        ctx.fillStyle = '#C0C0C0';
        ctx.beginPath();
        ctx.ellipse(0, 0, 18, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 1;
        ctx.stroke();
        // Kabine
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-5, 6, 10, 4);
        // Streifen
        ctx.strokeStyle = '#d32f2f';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-10, 0); ctx.lineTo(10, 0);
        ctx.stroke();
        ctx.restore();
    }

    _drawUFO(ctx) {
        if (!this.ufo.active || this.ufo.hit) return;
        ctx.save();
        ctx.translate(this.ufo.x, this.ufo.y);
        // Körper
        ctx.fillStyle = '#76ff03';
        ctx.beginPath();
        ctx.ellipse(0, 0, 20, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        // Kuppel
        ctx.fillStyle = 'rgba(118, 255, 3, 0.5)';
        ctx.beginPath();
        ctx.arc(0, -5, 8, Math.PI, 0);
        ctx.fill();
        // Lichter
        for (let i = -12; i <= 12; i += 6) {
            ctx.fillStyle = `hsl(${Date.now() / 10 + i * 30}, 100%, 70%)`;
            ctx.beginPath();
            ctx.arc(i, 3, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    _drawRain(ctx) {
        if (this.rainCloud.rainingTimer <= 0) return;
        ctx.save();
        ctx.strokeStyle = 'rgba(100, 150, 255, 0.4)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 60; i++) {
            const rx = Math.random() * this.width;
            const ry = Math.random() * this.height;
            ctx.beginPath();
            ctx.moveTo(rx, ry);
            ctx.lineTo(rx - 1, ry + 8);
            ctx.stroke();
        }
        ctx.restore();
    }

    _drawMoleHill(ctx) {
        const x = this.mole.x;
        const y = this.mole.y;
        ctx.save();
        // Erdhaufen
        ctx.fillStyle = '#6B4226';
        ctx.beginPath();
        ctx.ellipse(x, y + 5, 25, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#8B5A2B';
        ctx.beginPath();
        ctx.arc(x, y + 2, 18, Math.PI, 0);
        ctx.fill();
        // Maulwurf wenn er rausschaut
        if (this.mole.state === 'peeking') {
            ctx.fillStyle = '#3E2723';
            ctx.beginPath();
            ctx.arc(x, y - 8, 10, 0, Math.PI * 2);
            ctx.fill();
            // Augen
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(x - 4, y - 10, 3, 0, Math.PI * 2);
            ctx.arc(x + 4, y - 10, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(x - 4, y - 10, 1.5, 0, Math.PI * 2);
            ctx.arc(x + 4, y - 10, 1.5, 0, Math.PI * 2);
            ctx.fill();
            // Nase
            ctx.fillStyle = '#D4A373';
            ctx.beginPath();
            ctx.arc(x, y - 5, 3, 0, Math.PI * 2);
            ctx.fill();
            // Wütende Faust wenn angryTimer aktiv
            if (this.mole.angryTimer > 0) {
                const shakeX = Math.sin(this.mole.angryTimer * 0.03) * 3;
                ctx.fillStyle = '#3E2723';
                ctx.beginPath();
                ctx.arc(x + 15 + shakeX, y - 18, 5, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.restore();
    }

    _drawFrog(ctx) {
        if (this.frog.state !== 'jumping') return;
        ctx.save();
        ctx.translate(this.frog.jumpX, this.frog.jumpY);
        // Körper
        ctx.fillStyle = '#4CAF50';
        ctx.beginPath();
        ctx.ellipse(0, 0, 10, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        // Augen
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(-5, -7, 4, 0, Math.PI * 2);
        ctx.arc(5, -7, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-5, -7, 2, 0, Math.PI * 2);
        ctx.arc(5, -7, 2, 0, Math.PI * 2);
        ctx.fill();
        // Beine
        ctx.strokeStyle = '#388E3C';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-8, 5);
        ctx.lineTo(-15, 12);
        ctx.moveTo(8, 5);
        ctx.lineTo(15, 12);
        ctx.stroke();
        ctx.restore();
    }

    _drawBranch(ctx) {
        const treeX = this.width * 0.12;
        const branchStartX = treeX + 15;
        const branchStartY = this.height * 0.78 - 120;
        if (this.branch.intact) {
            // Intakter Ast (am Baum)
            ctx.strokeStyle = '#5D4037';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(branchStartX, branchStartY);
            ctx.lineTo(branchStartX + 35, branchStartY - 8);
            ctx.lineTo(branchStartX + 50, branchStartY - 5);
            ctx.stroke();
        } else if (this.branch.fallY < this.height) {
            // Fallender Ast
            ctx.save();
            ctx.translate(branchStartX + 25, this.branch.fallY);
            ctx.rotate(this.branch.fallSpeed * 0.1);
            ctx.strokeStyle = '#5D4037';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(-20, 0);
            ctx.lineTo(15, -5);
            ctx.lineTo(25, -2);
            ctx.stroke();
            ctx.restore();
        }
    }

    _drawScarecrow(ctx) {
        const x = this.scarecrow.x;
        const groundY = this.scarecrow.y;

        ctx.save();
        ctx.translate(x, groundY - 40);

        // Der Pfosten bleibt starr
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(-3, 0, 6, 45);

        // Rotation auf den Rest (Körper) anwenden, es dreht sich um die Y-Achse (Simuliert durch ScaleX und Translation)
        // Einfache 2D-Flip Animation
        const spinScale = Math.cos(this.scarecrow.rotation);
        ctx.scale(spinScale, 1);

        // Querpfosten (Arme)
        ctx.fillRect(-25, -15, 50, 4);

        // Stroh an den Armen
        ctx.fillStyle = '#EBC034';
        ctx.beginPath();
        for (let i = 0; i < 3; i++) {
            ctx.moveTo(-25 + i * 3, -15); ctx.lineTo(-30 + i * 5, 0);
            ctx.moveTo(25 - i * 3, -15); ctx.lineTo(30 - i * 5, 0);
        }
        ctx.stroke();

        // Hemd
        ctx.fillStyle = '#d35400';
        ctx.beginPath();
        ctx.moveTo(-15, -15);
        ctx.lineTo(15, -15);
        ctx.lineTo(20, 10);
        ctx.lineTo(-20, 10);
        ctx.closePath();
        ctx.fill();

        // Kopf
        ctx.fillStyle = '#EDC9AF';
        ctx.beginPath();
        ctx.arc(0, -30, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#D4A373';
        ctx.stroke();

        // Gesicht
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-4, -32, 2, 0, Math.PI * 2);
        ctx.arc(4, -32, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-5, -27);
        ctx.lineTo(5, -27);
        ctx.stroke();

        // Hut
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-18, -42, 36, 4); // Krempe
        ctx.fillRect(-10, -55, 20, 15); // Zylinder
        ctx.fillStyle = '#D2691E';
        ctx.fillRect(-10, -45, 20, 3); // Band

        ctx.restore();
    }

    _drawTree(ctx) {
        const x = this.width * 0.12;
        const groundY = this.height * 0.78;

        ctx.save();
        // Baum wackeln lassen wenn getroffen
        if (this.tree && this.tree.shakeTimer > 0) {
            const shakeAmount = Math.sin(this.tree.shakeTimer * 50) * 3;
            ctx.translate(shakeAmount, 0);
        }

        // Stamm
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(x - 15, groundY - 160, 30, 180);
        ctx.strokeStyle = '#3E2723';
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 15, groundY - 160, 30, 180);

        // Rinde Details
        ctx.strokeStyle = '#4E342E';
        ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
            const ry = groundY - 150 + i * 30;
            ctx.beginPath();
            ctx.moveTo(x - 10, ry);
            ctx.quadraticCurveTo(x, ry + 5, x + 10, ry);
            ctx.stroke();
        }

        // Krone
        ctx.fillStyle = '#2E7D32';
        ctx.beginPath();
        ctx.arc(x - 40, groundY - 150, 45, 0, Math.PI * 2);
        ctx.arc(x + 40, groundY - 155, 40, 0, Math.PI * 2);
        ctx.arc(x, groundY - 190, 50, 0, Math.PI * 2);
        ctx.arc(x - 20, groundY - 170, 42, 0, Math.PI * 2);
        ctx.arc(x + 20, groundY - 170, 42, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#1B5E20';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#43A047';
        ctx.beginPath();
        ctx.arc(x - 30, groundY - 180, 20, 0, Math.PI * 2);
        ctx.arc(x + 15, groundY - 195, 18, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
    _drawRock(ctx) {
        const x = this.width * 0.5;
        const groundY = this.height * 0.83;

        ctx.fillStyle = '#78909C';
        ctx.beginPath();
        ctx.moveTo(x - 60, groundY + 20);
        ctx.lineTo(x - 55, groundY - 30);
        ctx.lineTo(x - 30, groundY - 50);
        ctx.lineTo(x + 10, groundY - 55);
        ctx.lineTo(x + 40, groundY - 40);
        ctx.lineTo(x + 55, groundY - 15);
        ctx.lineTo(x + 60, groundY + 20);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#546E7A';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#90A4AE';
        ctx.beginPath();
        ctx.moveTo(x - 30, groundY - 45);
        ctx.lineTo(x - 10, groundY - 50);
        ctx.lineTo(x + 5, groundY - 40);
        ctx.lineTo(x - 15, groundY - 30);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#558B2F';
        ctx.beginPath();
        ctx.ellipse(x - 20, groundY - 45, 15, 5, -0.3, 0, Math.PI * 2);
        ctx.fill();
    }


    _drawWindmill(ctx) {
        const x = this.windmill.x;
        const groundY = this.height * 0.76;

        // Turm
        ctx.fillStyle = '#8D6E63';
        ctx.beginPath();
        ctx.moveTo(x - 25, groundY);
        ctx.lineTo(x + 25, groundY);
        ctx.lineTo(x + 15, groundY - 80);
        ctx.lineTo(x - 15, groundY - 80);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#4E342E';
        ctx.stroke();

        // Dach
        ctx.fillStyle = '#5D4037';
        ctx.beginPath();
        ctx.moveTo(x - 20, groundY - 80);
        ctx.lineTo(x + 20, groundY - 80);
        ctx.lineTo(x, groundY - 105);
        ctx.closePath();
        ctx.fill();

        // Rotierende Flügel
        ctx.strokeStyle = '#D7CCC8';
        ctx.lineWidth = 4;
        for (let i = 0; i < 4; i++) {
            ctx.save();
            ctx.translate(this.windmill.x, this.windmill.y);
            ctx.rotate(i * Math.PI / 2 + this.windmill.rotation);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, 60);
            // Flügelgitter
            ctx.lineWidth = 2;
            ctx.moveTo(-10, 20);
            ctx.lineTo(10, 20);
            ctx.moveTo(-10, 40);
            ctx.lineTo(10, 40);
            ctx.stroke();
            ctx.restore();
        }
    }

    _drawSignpost(ctx) {
        const x = this.signpost.x;
        const groundY = this.signpost.y;

        // Pfosten
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(x - 4, groundY - 40, 8, 40);

        // Schild
        const signTopY = groundY - 40;

        if (this.signFlipped) {
            // Umgedrehtes Schild: "Jagd ERLAUBT!"
            ctx.fillStyle = '#C8E6C9'; // Grün
            ctx.fillRect(x - 30, signTopY - 20, 60, 40);
            ctx.strokeStyle = '#4CAF50';
            ctx.lineWidth = 2;
            ctx.strokeRect(x - 30, signTopY - 20, 60, 40);
            // Text
            ctx.font = 'bold 8px sans-serif';
            ctx.fillStyle = '#2E7D32';
            ctx.textAlign = 'center';
            ctx.fillText('JAGD', x, signTopY - 4);
            ctx.fillText('ERLAUBT!', x, signTopY + 8);
            ctx.textAlign = 'start';
            // Häkchen
            ctx.strokeStyle = '#2E7D32';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(x - 5, signTopY + 14);
            ctx.lineTo(x, signTopY + 18);
            ctx.lineTo(x + 8, signTopY + 10);
            ctx.stroke();
        } else {
            // Original Verbotsschild
            ctx.fillStyle = '#E0E0E0';
            ctx.fillRect(x - 30, signTopY - 20, 60, 40);
            ctx.strokeStyle = '#999';
            ctx.lineWidth = 2;
            ctx.strokeRect(x - 30, signTopY - 20, 60, 40);
            // Roter Rand (Verbotsschild-Style)
            ctx.strokeStyle = '#D32F2F';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(x, signTopY, 15, 0, Math.PI * 2);
            ctx.stroke();
            // Diagonale Linie
            ctx.beginPath();
            ctx.moveTo(x - 10, signTopY - 10);
            ctx.lineTo(x + 10, signTopY + 10);
            ctx.stroke();
        }
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.audio = new AudioManager();

        this.state = GameState.MENU;

        // Touch device detection
        this.isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

        this.landscape = new Landscape(this.canvas.width, this.canvas.height);

        // Spieler Stats (Meta Progression)
        this.meta = this.loadMeta();

        // In-Game State
        this.score = 0;
        this.timeRemaining = 0;
        this.maxAmmo = DEFAULT_AMMO + this.meta.upgrades.magazine;
        this.ammo = this.maxAmmo;
        this.isReloading = false;

        // Active Buffs
        this.activeBuffs = {
            machinegun: 0, // Zeit in ms
            slowmo: 0,
            shotgun: 0
        };

        this.targets = [];
        this.particles = [];
        this.popups = [];

        // Gimmick-Tracking
        this.comboCount = 0;
        this.comboTimer = 0;
        this.comboWindowMs = 2200;
        this.feverModeTimer = 0;
        this.endRushMode = false;
        this.swarmCooldownTimer = 0;
        this.swarmIsActive = false;
        this.swarmSpawnTimer = 0;
        this.konamiProgress = 0;
        this.menuCheatProgress = 0;
        this.unlockedAchievements = {};

        this.lastTime = 0;
        this.spawnTimer = 0;
        this.upgradeSpawnTimer = 0;

        // DOM Elemente Zwischenspeichern
        this.ui = {
            mainMenu: document.getElementById('main-menu'),
            hud: document.getElementById('hud'),
            shopMenu: document.getElementById('shop-menu'),
            highscoreMenu: document.getElementById('highscore-menu'),
            gameOver: document.getElementById('game-over-screen'),

            score: document.getElementById('hud-score'),
            time: document.getElementById('hud-time'),
            ammoContainer: document.getElementById('ammo-container'),
            reloadHint: document.getElementById('reload-hint'),
            buffsContainer: document.getElementById('buffs-container'),

            menuCoins: document.getElementById('menu-coins'),
            shopCoins: document.getElementById('shop-coins'),
            highscoreList: document.getElementById('highscore-list'),

            resScore: document.getElementById('result-score'),
            resCoins: document.getElementById('result-coins'),
            newHsMsg: document.getElementById('new-highscore-msg'),

            // Global Highscore UI
            playerNameInput: document.getElementById('player-name-input'),
            btnSubmitScore: document.getElementById('btn-submit-score'),
            scoreSubmitMsg: document.getElementById('score-submit-msg'),
            highscoreSubmissionDiv: document.getElementById('highscore-submission'),

            cursor: document.getElementById('custom-cursor'),
            btnReload: document.getElementById('btn-reload')
        };

        this.initEvents();
        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.updateMenuUI();

        // Start Loop
        requestAnimationFrame((ts) => this.gameLoop(ts));
    }

    loadMeta() {
        const saved = localStorage.getItem('moorhuhn_meta');
        if (saved) {
            return JSON.parse(saved);
        }
        return {
            coins: 0,
            highscores: [], // max 5
            upgrades: {
                magazine: 0, // +x capacity
                reloadSpeed: 0, // Level
                timeBonus: 0, // +x seconds
                shotgun: 0 // +x seconds duration
            }
        };
    }

    saveMeta() {
        localStorage.setItem('moorhuhn_meta', JSON.stringify(this.meta));
        this.updateMenuUI();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        if (this.landscape) {
            this.landscape.resize(this.canvas.width, this.canvas.height);
        }
    }

    initEvents() {
        // Mausbewegung für Fadenkreuz (Canvas und UI)
        document.addEventListener('mousemove', (e) => {
            if (this.state === GameState.PLAYING) {
                this.ui.cursor.style.left = e.clientX + 'px';
                this.ui.cursor.style.top = e.clientY + 'px';
            }
        });

        // Schießen auf dem Canvas
        this.canvas.addEventListener('mousedown', (e) => {
            if (this.state === GameState.PLAYING) {
                if (e.button === 0) { // Linksklick
                    this.shoot(e.clientX, e.clientY);
                } else if (e.button === 2) { // Rechtsklick
                    this.reload();
                }
            }
        });

        // Verhindere Kontextmenü für Rechtsklick
        window.addEventListener('contextmenu', e => e.preventDefault());

        // Tastatur Nachladen
        window.addEventListener('keydown', (e) => {
            if (this.state === GameState.PLAYING && e.code === 'Space') {
                this.reload();
            }
            // Gimmick: Secret codes tracking
            this.trackSecretCodes(e);
        });

        // Menü Buttons
        document.getElementById('btn-start').addEventListener('click', () => this.startGame());
        document.getElementById('btn-shop').addEventListener('click', () => this.openShop());
        document.getElementById('btn-highscores').addEventListener('click', () => this.openHighscores());

        document.getElementById('btn-shop-back').addEventListener('click', () => this.showMainMenu());
        document.getElementById('btn-highscores-back').addEventListener('click', () => this.showMainMenu());

        document.getElementById('btn-play-again').addEventListener('click', () => this.startGame());
        document.getElementById('btn-gameover-menu').addEventListener('click', () => this.showMainMenu());

        // Global Highscore Submit
        this.ui.btnSubmitScore.addEventListener('click', () => this.submitGlobalScore());

        // --- Touch Events für Mobile ---
        this.canvas.addEventListener('touchstart', (e) => {
            if (this.state === GameState.PLAYING) {
                e.preventDefault();
                const touch = e.touches[0];
                this.shoot(touch.clientX, touch.clientY);
            }
        }, { passive: false });

        // Mobile Reload Button
        this.ui.btnReload.addEventListener('click', (e) => {
            e.stopPropagation();
            this.reload();
        });
        this.ui.btnReload.addEventListener('touchstart', (e) => {
            e.stopPropagation();
            e.preventDefault();
            this.reload();
        }, { passive: false });
    }

    updateMenuUI() {
        this.ui.menuCoins.innerText = this.meta.coins;
        this.ui.shopCoins.innerText = this.meta.coins;
    }

    showMainMenu() {
        this.state = GameState.MENU;
        this.audio.stopBGM();
        this.hideAllScreens();
        this.ui.mainMenu.classList.remove('hidden');
        this.ui.mainMenu.classList.add('active');
        this.ui.cursor.style.display = 'none'; // Normaler cursor im Menü
        document.body.style.cursor = 'default';
        this.ui.btnReload.classList.add('hidden');
        this.ui.btnReload.classList.remove('visible');
        this.updateMenuUI();

        // Initialize main menu ad once the menu is visible and layout has settled.
        if (typeof window.initAdWhenReady === 'function') {
            setTimeout(() => window.initAdWhenReady('ad-main-menu', 20, 250), 0);
        }
    }

    hideAllScreens() {
        ['mainMenu', 'hud', 'shopMenu', 'highscoreMenu', 'gameOver'].forEach(s => {
            this.ui[s].classList.remove('active');
            this.ui[s].classList.add('hidden');
        });
    }

    openShop() {
        this.state = GameState.SHOP;
        this.hideAllScreens();
        this.ui.shopMenu.classList.remove('hidden');
        this.ui.shopMenu.classList.add('active');
        this.renderShopItems();
    }

    async openHighscores() {
        this.state = GameState.HIGHSCORES;
        this.hideAllScreens();
        this.ui.highscoreMenu.classList.remove('hidden');
        this.ui.highscoreMenu.classList.add('active');

        this.ui.highscoreList.innerHTML = '<li>Lade Highscores...</li>';

        const scores = await window.db.getHighscores();

        this.ui.highscoreList.innerHTML = '';
        if (scores.length === 0) {
            this.ui.highscoreList.innerHTML = '<li>Noch keine Einträge oder Fehler beim Laden.</li>';
        } else {
            scores.forEach((hs, i) => {
                const li = document.createElement('li');
                // Format: #1 Name 150 Pkt
                li.innerHTML = `<span>#${i + 1} <b>${hs.name}</b></span> <span>${hs.score} Pkt</span>`;
                this.ui.highscoreList.appendChild(li);
            });
        }
    }

    renderShopItems() {
        const container = document.getElementById('shop-items-container');
        container.innerHTML = '';

        // Definiere Shop Items
        const items = [
            { id: 'magazine', name: 'Zusatzmagazin', desc: '+2 Schuss Kapazität', cost: 100 * (this.meta.upgrades.magazine + 1), max: 3, current: this.meta.upgrades.magazine },
            { id: 'reloadSpeed', name: 'Schnelllader', desc: '15% schneller nachladen', cost: 150 * (this.meta.upgrades.reloadSpeed + 1), max: 3, current: this.meta.upgrades.reloadSpeed },
            { id: 'timeBonus', name: 'Stoppuhr', desc: '+10 Sekunden Spielzeit', cost: 200 * (this.meta.upgrades.timeBonus + 1), max: 3, current: this.meta.upgrades.timeBonus },
            { id: 'shotgun', name: 'Schrotflinte', desc: '+2s Dauer (Ballon)', cost: 250 * ((this.meta.upgrades.shotgun || 0) + 1), max: 3, current: this.meta.upgrades.shotgun || 0 }
        ];

        items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'shop-item';

            let btnHtml = '';
            if (item.current >= item.max) {
                btnHtml = `<button class="btn btn-secondary" disabled>MAX LEVEL</button>`;
            } else {
                const canAfford = this.meta.coins >= item.cost;
                btnHtml = `<button class="btn btn-primary" onclick="window.game.buyUpgrade('${item.id}', ${item.cost})" ${!canAfford ? 'disabled style="filter: grayscale(1);"' : ''}>Kaufen</button>`;
            }

            div.innerHTML = `
                <h3>${item.name} (Lvl ${item.current}/${item.max})</h3>
                <p>${item.desc}</p>
                <div class="price">💰 ${item.current >= item.max ? '-' : item.cost}</div>
                ${btnHtml}
            `;
            container.appendChild(div);
        });
    }

    // ACHTUNG: Auf globalen Context angewiesen wegen onclick im HTML string.
    buyUpgrade(id, cost) {
        if (this.meta.coins >= cost && this.meta.upgrades[id] < 3) {
            this.meta.coins -= cost;
            this.meta.upgrades[id]++;
            this.saveMeta();
            this.renderShopItems();
            this.audio.playUpgradeHit(); // Success sound resusen
        }
    }

    startGame() {
        if (this.audio.ctx.state === 'suspended') {
            this.audio.ctx.resume();
        }

        this.state = GameState.PLAYING;
        this.audio.startBGM();
        this.hideAllScreens();
        this.ui.hud.classList.remove('hidden');
        this.ui.hud.classList.add('active');

        document.body.style.cursor = this.isTouchDevice ? 'default' : 'none';
        this.ui.cursor.style.display = this.isTouchDevice ? 'none' : 'block';

        // Show reload button on touch devices
        if (this.isTouchDevice) {
            this.ui.btnReload.classList.remove('hidden');
            this.ui.btnReload.classList.add('visible');
        }

        // Init Stats
        this.score = 0;
        this.timeRemaining = GAME_DURATION + (this.meta.upgrades.timeBonus * 10);
        this.maxAmmo = DEFAULT_AMMO + (this.meta.upgrades.magazine * 2);
        this.ammo = this.maxAmmo;
        this.isReloading = false;
        this.activeBuffs = { machinegun: 0, slowmo: 0, shotgun: 0 };
        this.chickenSpeedBoost = 0;

        this.targets = [];
        this.particles = [];
        this.popups = [];

        // Landscape Secrets zur\u00fccksetzen
        this.landscape.sun.hit = false;
        this.landscape.signFlipped = false;
        this.landscape.coinRock.hitCount = 0;
        this.landscape.coinRock.cracked = false;
        this.landscape.branch.intact = true;
        this.landscape.branch.fallY = 0;
        this.landscape.chimney.hitSmoke = false;
        this.landscape.zeppelin.active = true;
        this.landscape.zeppelin.x = -100;
        this.landscape.ufo.active = false;
        this.landscape.ufo.hit = false;

        this.lastTime = performance.now();
        this.updateHUD();
    }

    updateHUD() {
        this.ui.score.innerText = this.score;
        this.ui.time.innerText = Math.ceil(this.timeRemaining);

        // Render Ammo
        this.ui.ammoContainer.innerHTML = '';
        const limitType = this.activeBuffs.machinegun > 0;

        for (let i = 0; i < this.maxAmmo; i++) {
            const div = document.createElement('div');
            div.className = 'bullet';
            if (limitType) {
                div.style.background = 'linear-gradient(to right, #ff0000, #ff5722)'; // MG Ammo
            } else if (i >= this.ammo && !this.isReloading) {
                div.classList.add('empty');
            }
            this.ui.ammoContainer.appendChild(div);
        }

        if (this.ammo === 0 && !this.isReloading && !limitType) {
            this.ui.reloadHint.classList.remove('hidden');
        } else {
            this.ui.reloadHint.classList.add('hidden');
        }

        // Render Buffs
        let buffsHtml = '';
        if (this.activeBuffs.machinegun > 0) buffsHtml += `<span style="color:#e74c3c;">MG-Modus (${(this.activeBuffs.machinegun / 1000).toFixed(1)}s)</span><br>`;
        if (this.activeBuffs.slowmo > 0) buffsHtml += `<span style="color:#9b59b6;">SlowMo (${(this.activeBuffs.slowmo / 1000).toFixed(1)}s)</span><br>`;
        if (this.activeBuffs.shotgun > 0) buffsHtml += `<span style="color:#f1c40f;">Shotgun (${(this.activeBuffs.shotgun / 1000).toFixed(1)}s)</span><br>`;
        // Gimmick: Combo anzeigen
        if (this.comboCount > 0) {
            const multiplier = this.getScoreMultiplier();
            buffsHtml += `<span style="color:#FFD700; font-weight:bold;">Kombo x${this.comboCount} (${multiplier.toFixed(1)}x)</span><br>`;
        }
        // Gimmick: Fever anzeigen
        if (this.feverModeTimer > 0) {
            buffsHtml += `<span style="color:#FF8C00; font-weight:bold;">FEVER (${(this.feverModeTimer / 1000).toFixed(1)}s)</span><br>`;
        }
        // Gimmick: Endspurt anzeigen
        if (this.endRushMode) {
            buffsHtml += `<span style="color:#FF0000; font-weight:bold; text-shadow: 0 0 10px #FF0000;">⚡ ENDSPURT! ⚡</span><br>`;
        }
        this.ui.buffsContainer.innerHTML = buffsHtml;

        // Fadenkreuz anpassen
        if (this.activeBuffs.shotgun > 0) {
            this.ui.cursor.style.width = '120px';
            this.ui.cursor.style.height = '120px';
            this.ui.cursor.style.marginLeft = '-60px';
            this.ui.cursor.style.marginTop = '-60px';
            this.ui.cursor.style.borderColor = 'rgba(241, 196, 15, 0.8)';
            this.ui.cursor.style.borderWidth = '4px';
        } else {
            this.ui.cursor.style.width = '40px';
            this.ui.cursor.style.height = '40px';
            this.ui.cursor.style.marginLeft = '-20px';
            this.ui.cursor.style.marginTop = '-20px';
            this.ui.cursor.style.borderColor = 'rgba(255, 0, 0, 0.8)';
            this.ui.cursor.style.borderWidth = '2px';
        }
    }

    shoot(x, y) {
        if (this.state !== GameState.PLAYING || this.isReloading) return;

        const hasInfiniteAmmo = this.activeBuffs.machinegun > 0;

        if (this.ammo > 0 || hasInfiniteAmmo) {
            if (!hasInfiniteAmmo) this.ammo--;

            // Fadenkreuz Animation
            this.ui.cursor.classList.add('shoot');
            setTimeout(() => this.ui.cursor.classList.remove('shoot'), 50);

            this.audio.playShoot();
            this.updateHUD();
            const hitAnything = this.checkHits(x, y);
            if (!hitAnything && this.state === GameState.PLAYING) {
                this.registerMiss(); // Combo wird zurückgesetzt
            }
        } else {
            this.audio.playEmptyClick();
        }
    }

    reload() {
        if (this.state !== GameState.PLAYING || this.isReloading || this.ammo === this.maxAmmo) return;

        this.isReloading = true;
        this.ui.ammoContainer.innerHTML = '<div style="font-size:20px; color:yellow; margin-top:10px;">Nachladen...</div>';
        this.ui.reloadHint.classList.add('hidden');
        this.audio.playReload();

        // Basiszeit 1000ms, abzüglich 15% pro Upgrade Level
        const reloadTime = 1000 * (1 - (this.meta.upgrades.reloadSpeed * 0.15));

        setTimeout(() => {
            if (this.state === GameState.PLAYING) {
                this.ammo = this.maxAmmo;
                this.isReloading = false;
                this.updateHUD();
            }
        }, reloadTime);
    }

    checkHits(x, y) {
        let hitSomething = false;
        const isShotgun = this.activeBuffs.shotgun > 0;
        const hitRadius = isShotgun ? 60 : 1; // Shotgun hat 60px Radius = riesige Hitbox

        // 1. Zuerst normale Ziele prüfen (Rückwärts wegen Überlappung)
        for (let i = this.targets.length - 1; i >= 0; i--) {
            const t = this.targets[i];

            // Erweiterte Hit-Logik für Shotgun:
            let isHit = false;
            if (isShotgun) {
                // Fallback Hit-Check mit extra Radius
                const dx = x - t.x;
                const dy = y - t.y;
                isHit = (dx * dx + dy * dy) < ((t.size + hitRadius) * (t.size + hitRadius));
            } else {
                isHit = t.checkHit(x, y);
            }

            if (!t.markedForDeletion && isHit) {
                t.markedForDeletion = true;
                hitSomething = true;

                // Effekte spawnen
                this.createExplosion(t.x, t.y, t instanceof InGameUpgrade ? '#3498db' : '#8B4513');

                if (t instanceof InGameUpgrade) {
                    this.audio.playUpgradeHit();
                    this.applyBuff(t.type);
                    this.popups.push(new ScorePopup(t.x, t.y, 'BUFF!', '#3498db'));
                } else {
                    this.audio.playChickenHit();
                    // Shotgun gibt nur halbe Punkte weil es zu einfach ist
                    const basePoints = isShotgun ? Math.max(1, Math.floor(t.points / 2)) : t.points;
                    const multiplier = this.getScoreMultiplier();
                    const pointsGained = Math.floor(basePoints * multiplier);
                    this.score += pointsGained;
                    this.registerHit(); // Combo-Tracking
                    this.popups.push(new ScorePopup(t.x, t.y, `+${pointsGained}`));
                    if (multiplier > 1) {
                        this.popups.push(new ScorePopup(t.x, t.y - 30, `x${multiplier.toFixed(1)}`, '#FFD700'));
                    }
                }

                if (!isShotgun) {
                    break; // Normal weicht ein Ziel durch den Schuss aus / blockt ihn. Shotgun durchdringt / trifft mehrere.
                }
            }
        }

        // 2. Wenn kein Ziel getroffen wurde (oder Shotgun), Umgebung prüfen (Geheimnisse)
        if (!hitSomething || isShotgun) {
            const sceneryHit = this.landscape.checkHits(x, y);
            if (sceneryHit) {
                this.score += sceneryHit.points;

                // Farbe für Popup: Rot bei Minus, Gold bei Plus
                const color = sceneryHit.points > 0 ? '#ffd700' : '#e74c3c';
                const prefix = sceneryHit.points > 0 ? '+' : '';
                this.popups.push(new ScorePopup(sceneryHit.x, sceneryHit.y, `${prefix}${sceneryHit.points}`, color));

                // Partikel für spezifische Umgebungsobjekte
                if (sceneryHit.type === 'tree') {
                    for (let i = 0; i < 8; i++) {
                        const px = sceneryHit.x + (Math.random() - 0.5) * 80;
                        const py = sceneryHit.y + (Math.random() - 0.5) * 80;
                        const leaf = new Particle(px, py, ['#2E7D32', '#43A047', '#81C784'][Math.floor(Math.random() * 3)]);
                        leaf.speedX = (Math.random() - 0.5) * 2;
                        leaf.speedY = Math.random() * 3 + 2;
                        this.particles.push(leaf);
                    }
                } else if (sceneryHit.type === 'scarecrow') {
                    for (let i = 0; i < 10; i++) {
                        const px = sceneryHit.x + (Math.random() - 0.5) * 40;
                        const py = sceneryHit.y - 40 + (Math.random() - 0.5) * 40;
                        const straw = new Particle(px, py, '#EBC034');
                        this.particles.push(straw);
                    }
                } else if (sceneryHit.type === 'zeppelin') {
                    // Explosion-Partikel
                    this.createExplosion(sceneryHit.x, sceneryHit.y, '#C0C0C0');
                } else if (sceneryHit.type === 'church') {
                    // Kirchenglocke: Hühner erschrecken (schneller für 3s)
                    this.chickenSpeedBoost = 3000;
                } else if (sceneryHit.type === 'frog') {
                    this.createExplosion(sceneryHit.x, sceneryHit.y, '#4CAF50');
                } else if (sceneryHit.type === 'coinrock') {
                    // +50 Münzen direkt!
                    this.meta.coins += sceneryHit.coins;
                    this.saveMeta();
                    this.popups.push(new ScorePopup(sceneryHit.x, sceneryHit.y - 20, '+50 Münzen!', '#FFD700'));
                    this.createExplosion(sceneryHit.x, sceneryHit.y, '#FFD700');
                } else if (sceneryHit.type === 'branch') {
                    this.createExplosion(sceneryHit.x, sceneryHit.y, '#5D4037');
                } else if (sceneryHit.type === 'signflip') {
                    this.popups.push(new ScorePopup(sceneryHit.x, sceneryHit.y - 30, 'ERLAUBT!', '#4CAF50'));
                } else if (sceneryHit.type === 'raincloud') {
                    this.popups.push(new ScorePopup(sceneryHit.x, sceneryHit.y - 20, 'Regen!', '#64B5F6'));
                } else if (sceneryHit.type === 'chimney') {
                    this.popups.push(new ScorePopup(sceneryHit.x, sceneryHit.y - 20, 'Bunt!', '#E91E63'));
                }

                // Einfacher "Pluck" Sound für Umgebungstreffer
                this.audio.playEmptyClick();
                this.updateHUD();
            }
        }

        // Schuss-Partikel
        const particleCount = isShotgun ? 8 : 3;
        const spread = isShotgun ? hitRadius : 0;
        for (let i = 0; i < particleCount; i++) {
            const px = x + (Math.random() - 0.5) * spread * 2;
            const py = y + (Math.random() - 0.5) * spread * 2;
            this.particles.push(new Particle(px, py, '#fff'));
        }

        return hitSomething;
    }

    applyBuff(type) {
        if (type === 'time') {
            this.timeRemaining += 10;
        } else if (type === 'machinegun') {
            this.activeBuffs.machinegun = 5000; // 5 sekunden
            this.ammo = this.maxAmmo; // Magazin füllen
        } else if (type === 'slowmo') {
            this.activeBuffs.slowmo = 8000; // 8 sekunden
        } else if (type === 'shotgun') {
            this.activeBuffs.shotgun = 6000 + ((this.meta.upgrades.shotgun || 0) * 2000); // 6 sek + 2 sek pro Level
        } else if (type === 'fever') {
            this.feverModeTimer = 10000; // 10 sekunden Fever Mode
            this.unlockAchievement('fever', 'Fever-Mode aktiviert!');
        } else if (type === 'coins') {
            this.meta.coins += 50;
            this.popups.push(new ScorePopup(this.canvas.width / 2, this.canvas.height / 2, '+50 Coins!', '#FFD700'));
            this.unlockAchievement('coins', 'Bonus-Coins gesammelt!');
        }
    }

    createExplosion(x, y, color) {
        for (let i = 0; i < 15; i++) {
            this.particles.push(new Particle(x, y, color));
            // Ein paar Federn bei Huehnern
            if (color === '#8B4513') {
                this.particles.push(new Particle(x, y, '#ffffff'));
            }
        }
    }

    async endGame() {
        this.state = GameState.GAMEOVER;
        this.audio.stopBGM();
        this.hideAllScreens();
        this.ui.gameOver.classList.remove('hidden');
        this.ui.gameOver.classList.add('active');

        // Initialize game-over ad only when the screen is actually shown.
        if (typeof window.initAdWhenReady === 'function') {
            setTimeout(() => window.initAdWhenReady('ad-game-over', 20, 250), 0);
        }

        this.ui.cursor.style.display = 'none';
        document.body.style.cursor = 'default';

        // Calc Coins (z.B. 10 Punkte = 1 Münze)
        const earnedCoins = Math.floor(this.score / 10);
        this.meta.coins += earnedCoins;

        let isNewHS = false;
        this.meta.highscores.push(this.score);
        this.meta.highscores.sort((a, b) => b - a);

        // Prüfen ob es ein neuer lokaler Rekord ist
        if (this.meta.highscores[0] === this.score && this.score > 0) {
            isNewHS = true;
        }

        // Behalte nur Top 5 lokal (für Historie/Backup falls gewünscht)
        this.meta.highscores = this.meta.highscores.slice(0, 5);
        this.saveMeta();

        // UI Update
        this.ui.resScore.innerText = this.score;
        this.ui.resCoins.innerText = `+${earnedCoins}`;

        if (isNewHS) {
            this.ui.newHsMsg.classList.remove('hidden');
        } else {
            this.ui.newHsMsg.classList.add('hidden');
        }

        // Reset Global Submission UI
        if (this.score > 0) {
            this.ui.highscoreSubmissionDiv.style.display = 'block';
            this.ui.btnSubmitScore.disabled = false;
            this.ui.scoreSubmitMsg.classList.add('hidden');
            this.ui.playerNameInput.value = localStorage.getItem('moorhuhn_last_name') || '';
        } else {
            this.ui.highscoreSubmissionDiv.style.display = 'none';
        }

        // Highscores laden und anzeigen
        const hsList = document.getElementById('gameover-hs-list');
        hsList.innerHTML = '<li style="color:#aaa;">Lade...</li>';
        try {
            const scores = await window.db.getHighscores();
            hsList.innerHTML = '';
            if (scores.length === 0) {
                hsList.innerHTML = '<li style="color:#aaa;">Noch keine Eintr\u00e4ge.</li>';
            } else {
                scores.slice(0, 5).forEach((hs, i) => {
                    const li = document.createElement('li');
                    const isYou = hs.score === this.score;
                    li.innerHTML = `<span>${isYou ? '\u27a1\ufe0f ' : ''}#${i + 1} <b>${hs.name}</b></span> <span>${hs.score} Pkt</span>`;
                    if (isYou) li.style.color = '#ffd700';
                    hsList.appendChild(li);
                });
            }
        } catch (e) {
            hsList.innerHTML = '<li style="color:#e74c3c;">Fehler beim Laden.</li>';
        }
    }

    async submitGlobalScore() {
        const name = this.ui.playerNameInput.value.trim();
        if (this.score <= 0) return;

        this.ui.btnSubmitScore.disabled = true;
        this.ui.scoreSubmitMsg.innerText = 'Speichere...';
        this.ui.scoreSubmitMsg.style.color = 'white';
        this.ui.scoreSubmitMsg.classList.remove('hidden');

        try {
            const success = await window.db.saveHighscore(name, this.score);
            if (success) {
                // ===== GIMMICK: Name Easter Egg =====
                const upperName = name.toUpperCase();
                if (upperName === 'ADMIN' || upperName === 'MOORHUHN') {
                    this.meta.coins += 100;
                    this.saveMeta();
                    this.unlockAchievement('nameEasterEgg', '🗝️ Namens-Geheimnis (100 Coins)!');
                }

                this.ui.scoreSubmitMsg.innerText = 'Score gespeichert!';
                this.ui.scoreSubmitMsg.style.color = '#2ecc71';
                if (name) localStorage.setItem('moorhuhn_last_name', name);

                // Hide inputs after 1 second
                setTimeout(() => {
                    this.ui.highscoreSubmissionDiv.style.display = 'none';
                }, 1500);
            } else {
                this.ui.scoreSubmitMsg.innerText = 'Fehler beim Speichern!';
                this.ui.scoreSubmitMsg.style.color = '#e74c3c';
                this.ui.btnSubmitScore.disabled = false;
            }
        } catch (e) {
            this.ui.scoreSubmitMsg.innerText = 'Fehler beim Speichern!';
            this.ui.scoreSubmitMsg.style.color = '#e74c3c';
            this.ui.btnSubmitScore.disabled = false;
        }
    }

    // --- Rendern & Update ---

    gameLoop(timestamp) {
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        if (this.state === GameState.PLAYING) {
            this.update(deltaTime);
        }

        this.draw();

        requestAnimationFrame((ts) => this.gameLoop(ts));
    }

    update(deltaTime) {
        this.timeRemaining -= deltaTime / 1000;
        if (this.timeRemaining <= 0) {
            this.timeRemaining = 0;
            this.endGame();
            return;
        }

        // Umgebungs-Updates (geht auch im Menü, wenn wir dort Bewegung haben wollen)
        this.landscape.update(deltaTime);

        // Buff Timers
        if (this.activeBuffs.machinegun > 0) {
            this.activeBuffs.machinegun -= deltaTime;
            if (this.activeBuffs.machinegun <= 0) this.ammo = this.maxAmmo; // Nach ablauf magazin voll
        }
        if (this.activeBuffs.slowmo > 0) {
            this.activeBuffs.slowmo -= deltaTime;
        }
        if (this.activeBuffs.shotgun > 0) {
            this.activeBuffs.shotgun -= deltaTime;
        }

        // Update HUD min. jeden Frame wg Buff-Timer
        this.updateHUD();

        // ===== GIMMICK: Combo Timer countdown =====
        if (this.comboTimer > 0) {
            this.comboTimer -= deltaTime;
            if (this.comboTimer <= 0) {
                this.comboCount = 0;
                this.comboTimer = 0;
            }
        }

        // ===== GIMMICK: Fever Mode Timer =====
        if (this.feverModeTimer > 0) {
            this.feverModeTimer -= deltaTime;
        }

        // ===== GIMMICK: Endspurt-Modus (Stress bei <5s) =====
        if (this.timeRemaining < 5 && !this.endRushMode) {
            this.endRushMode = true;
            this.popups.push(new ScorePopup(this.canvas.width / 2, 100, 'FINALER ENDSPURT!', '#FF0000'));
        }
        if (this.timeRemaining >= 5) {
            this.endRushMode = false;
        }

        const speedMultiplier = (this.activeBuffs.slowmo > 0 ? 0.3 : 1.0) * (this.chickenSpeedBoost > 0 ? 2.0 : 1.0) * (this.endRushMode ? 1.3 : 1.0);

        // Chicken Speed Boost Timer (Kirchenglocke)
        if (this.chickenSpeedBoost > 0) {
            this.chickenSpeedBoost -= deltaTime;
            if (this.chickenSpeedBoost < 0) this.chickenSpeedBoost = 0;
        }

        // UFO aktivieren bei genau 10 Sekunden
        if (!this.landscape.ufo.hit && !this.landscape.ufo.active && this.timeRemaining <= 10 && this.timeRemaining > 9) {
            this.landscape.ufo.active = true;
            this.landscape.ufo.x = -50;
            this.landscape.ufo.y = this.canvas.height * 0.08;
        }
        // UFO bewegen
        if (this.landscape.ufo.active) {
            this.landscape.ufo.x += this.landscape.ufo.speed * (deltaTime / 1000);
            if (this.landscape.ufo.x > this.canvas.width + 50) {
                this.landscape.ufo.active = false;
            }
        }

        // Spawnen
        this.spawnTimer += deltaTime;
        if (this.spawnTimer > 1000) { // Jede sekunde Chance auf neues Huhn
            this.spawnTimer = 0;
            if (Math.random() > 0.3 && this.targets.length < 8) {
                // 30% Chance auf ein verstecktes Huhn, 70% fliegendes
                if (Math.random() < 0.3) {
                    const obstacle = this.landscape.getRandomObstacle();
                    this.targets.push(new HiddenTarget(this.canvas.width, this.canvas.height, obstacle));
                } else {
                    this.targets.push(new Target(this.canvas.width, this.canvas.height));
                }
            }
        }

        this.upgradeSpawnTimer += deltaTime;
        if (this.upgradeSpawnTimer > 8000) { // Alle ~8 Sekunden
            this.upgradeSpawnTimer = 0;
            if (Math.random() > 0.5) { // 50% chance
                const types = ['time', 'machinegun', 'slowmo', 'shotgun', 'fever', 'coins'];
                const t = types[Math.floor(Math.random() * types.length)];
                this.targets.push(new InGameUpgrade(this.canvas.width, this.canvas.height, t));
            }
        }

        // ===== GIMMICK: Swarm Event =====
        this.swarmCooldownTimer -= deltaTime;
        if (this.swarmCooldownTimer <= 0) {
            if (Math.random() < 0.02) { // 2% Chance pro Frame (~100ms) = ~alle 50 Frames
                this.swarmIsActive = true;
                this.swarmSpawnTimer = 0;
                this.swarmCooldownTimer = 30000; // 30s cooldown nach Swarm
                this.popups.push(new ScorePopup(this.canvas.width / 2, 150, 'SCHWARM-EREIGNIS!', '#FF00FF'));
            }
        }

        // Swarm spawning
        if (this.swarmIsActive) {
            this.swarmSpawnTimer += deltaTime;
            // 18 Ziele auf 5 Sekunden spawnen = alle 278ms
            if (this.swarmSpawnTimer > 278) {
                if (this.targets.length < 18) {
                    this.targets.push(this.createSwarmTarget());
                    this.swarmSpawnTimer = 0; // Reset timer
                } else {
                    this.swarmIsActive = false;
                }
            }
        }

        // Update Entity Listen
        [this.targets, this.particles, this.popups].forEach(list => {
            list.forEach(item => item.update(deltaTime, item instanceof Target ? speedMultiplier : undefined));
        });

        // Cleanup
        this.targets = this.targets.filter(t => !t.markedForDeletion);
        this.particles = this.particles.filter(p => !p.markedForDeletion);
        this.popups = this.popups.filter(p => !p.markedForDeletion);
    }

    draw() {
        // Hintergrundlandschaft immer zeichnen (auch im Menü)
        this.landscape.draw(this.ctx);

        // Im Menü passiert nichts auf dem Canvas bzgl Targets, wir brechen hier ab. 
        // Die Landschaft ist schon gerendert und bleibt als cooles Menü-Hintergrundbild.
        if (this.state !== GameState.PLAYING && this.targets.length === 0 && this.particles.length === 0) {
            // Trotzdem Vordergrund zeichnen (damit er auch im Menü cool aussieht)
            this.landscape.drawForeground(this.ctx);
            return;
        }

        // Layer-Reihenfolge:
        // 1. Hintergrund (bereits gezeichnet oben)
        // 2. Alle Targets (Hühner fliegen HINTER den Hindernissen)
        this.targets.forEach(t => t.draw(this.ctx));
        // 3. Vordergrund-Objekte (Baum, Fels, Holzstapel) ÜBER den Hühnern
        this.landscape.drawForeground(this.ctx);
        // 4. Partikel und Popups (sollen über allem schweben)
        this.particles.forEach(p => p.draw(this.ctx));
        this.popups.forEach(p => p.draw(this.ctx));

        // Optional: Vignette Effekt über das Canvas legen
        const gradient = this.ctx.createRadialGradient(
            this.canvas.width / 2, this.canvas.height / 2, Math.min(this.canvas.width, this.canvas.height) / 2,
            this.canvas.width / 2, this.canvas.height / 2, Math.max(this.canvas.width, this.canvas.height)
        );
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.5)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // SlowMo Overlay
        if (this.state === GameState.PLAYING && this.activeBuffs.slowmo > 0) {
            this.ctx.fillStyle = 'rgba(155, 89, 182, 0.1)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        // Endspurt Overlay (rote Pulsierung)
        if (this.state === GameState.PLAYING && this.endRushMode) {
            const pulse = Math.sin(Date.now() / 100) * 0.5 + 0.5; // 0..1 pulsing
            this.ctx.fillStyle = `rgba(255, 0, 0, ${pulse * 0.15})`;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    // ===== GIMMICK-METHODEN =====
    
    getScoreMultiplier() {
        let multiplier = 1.0;
        if (this.comboCount >= 5) {
            multiplier += (Math.min(this.comboCount, 20) - 5) * 0.1; // +0.1 pro Combo über 5
        }
        if (this.feverModeTimer > 0) {
            multiplier += 0.5; // +50% bei Fever
        }
        return Math.min(multiplier, 3.0); // Max 3x
    }

    registerHit() {
        this.comboCount++;
        this.comboTimer = this.comboWindowMs;
        
        if (this.comboCount === 5) {
            this.unlockAchievement('combo5', 'Kombo-Master 5x');
        }
        if (this.comboCount === 10) {
            this.unlockAchievement('combo10', 'Kombo-Master 10x');
        }
    }

    registerMiss() {
        if (this.comboCount >= 5) {
            const msg = `Kombo weg! (${this.comboCount}x)`;
            this.popups.push(new ScorePopup(this.canvas.width / 2, this.canvas.height / 2, msg, 'combo-break'));
        }
        this.comboCount = 0;
        this.comboTimer = 0;
    }

    unlockAchievement(id, title) {
        if (!this.unlockedAchievements[id]) {
            this.unlockedAchievements[id] = true;
            const msg = `🏆 ${title}!`;
            this.popups.push(new ScorePopup(this.canvas.width / 2, 100, msg, 'achievement'));
        }
    }

    activateKonamiBonus() {
        this.activeBuffs.machinegun = Math.max(this.activeBuffs.machinegun, 10);
        this.activeBuffs.shotgun = Math.max(this.activeBuffs.shotgun, 8);
        this.timeRemaining += 15;
        this.unlockAchievement('konami', 'Konami-Code Aktiviert!');
    }

    activateMenuCheat() {
        // Alle Upgrades auf Maximum
        this.meta.upgrades.magazine = 3;
        this.meta.upgrades.reloadSpeed = 3;
        this.meta.upgrades.timeBonus = 3;
        this.meta.upgrades.shotgun = 3;
        this.meta.coins += 500;
        this.unlockAchievement('menucheat', 'Geheimcode: MOORHUHN');
        this.saveMeta();
    }

    trackSecretCodes(e) {
        if (this.state === GameState.PLAYING) {
            // Konami Code tracking
            if (e.code === KONAMI_CODE[this.konamiProgress]) {
                this.konamiProgress++;
                if (this.konamiProgress === KONAMI_CODE.length) {
                    this.activateKonamiBonus();
                    this.konamiProgress = 0;
                }
            } else {
                this.konamiProgress = 0;
            }
        } else if (this.state === GameState.MENU) {
            // Menu cheat code: MOORHUHN
            const char = e.key.toUpperCase();
            const codeChars = MENU_CHEAT_CODE.split('');
            if (char === codeChars[this.menuCheatProgress]) {
                this.menuCheatProgress++;
                if (this.menuCheatProgress === codeChars.length) {
                    this.activateMenuCheat();
                    this.menuCheatProgress = 0;
                }
            } else {
                this.menuCheatProgress = 0;
            }
        }
    }

    createSwarmTarget() {
        // 18% Chance on Rare, 82% normal
        let target;
        if (Math.random() < 0.18) {
            target = new RareTarget(this.canvas.width, this.canvas.height);
            this.unlockAchievement('goldenhuhn', 'Goldhuhn erwischt!');
        } else {
            target = new Target(this.canvas.width, this.canvas.height);
        }
        // Swarm-Modifikationen: kleiner, mehr Punkte
        target.size *= 0.75;
        target.points = Math.floor(target.points * 1.4);
        return target;
    }

}

// Bootstrap
window.onload = () => {
    window.game = new Game();
};
