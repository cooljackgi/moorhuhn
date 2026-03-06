// --- Konfiguration und Globals ---
const GAME_DURATION = 90; // Standard Zeit in Sekunden
const DEFAULT_AMMO = 5;

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

        // Zufaellige Groesse = Punkte (kleiner = mehr Punkte)
        this.size = Math.random() * 40 + 30; // 30 bis 70
        this.points = Math.floor((100 - this.size) / 5) * 5; // 5 bis 15 Punkte

        // Startposition (links oder rechts außerhalb vom Bild)
        this.direction = Math.random() > 0.5 ? 1 : -1;
        this.x = this.direction === 1 ? -this.size : canvasWidth + this.size;

        // Hoehe (nicht zu tief)
        this.y = Math.random() * (canvasHeight * 0.6) + 50;

        // Geschwindigkeit abbhängig von Groesse
        this.speedX = (Math.random() * 2 + 2) * this.direction * (80 / this.size);
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

        // In Flugrichtung schauen
        if (this.direction === -1) {
            ctx.scale(-1, 1);
        }

        // Simples Cartoon Huhn rendern
        // Körper
        ctx.fillStyle = '#8B4513'; // Braun
        ctx.beginPath();
        ctx.ellipse(0, 0, this.size, this.size * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#000';
        ctx.stroke();

        // Flügel (animiert)
        const flapAngle = Math.sin(this.flapTime / 50) * 0.5;
        ctx.save();
        ctx.rotate(flapAngle);
        ctx.fillStyle = '#A0522D';
        ctx.beginPath();
        ctx.ellipse(-this.size * 0.2, 0, this.size * 0.6, this.size * 0.3, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // Kopf
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.arc(this.size * 0.6, -this.size * 0.4, this.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Auge
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.size * 0.7, -this.size * 0.5, this.size * 0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(this.size * 0.75, -this.size * 0.5, this.size * 0.05, 0, Math.PI * 2);
        ctx.fill();

        // Schnabel
        ctx.fillStyle = 'orange';
        ctx.beginPath();
        ctx.moveTo(this.size * 1.05, -this.size * 0.4);
        ctx.lineTo(this.size * 1.3, -this.size * 0.3);
        ctx.lineTo(this.size * 1.05, -this.size * 0.2);
        ctx.closePath();
        ctx.fill();
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

        // Ballon Rendern
        let color = '#ff0000';
        let text = '?';
        if (this.type === 'time') { color = '#3498db'; text = '+10s'; }
        if (this.type === 'machinegun') { color = '#e74c3c'; text = 'MG'; }
        if (this.type === 'slowmo') { color = '#9b59b6'; text = 'Slo'; }

        // Faden
        ctx.beginPath();
        ctx.moveTo(0, this.size);
        ctx.lineTo(0, this.size + 40);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Kiste am Faden
        ctx.fillStyle = '#8e44ad'; // Kistenfarbe
        if (this.type === 'time') ctx.fillStyle = '#2980b9';
        if (this.type === 'machinegun') ctx.fillStyle = '#c0392b';
        ctx.fillRect(-15, this.size + 40, 30, 30);
        ctx.strokeStyle = '#000';
        ctx.strokeRect(-15, this.size + 40, 30, 30);

        ctx.fillStyle = '#fff';
        ctx.font = '12px "Fredoka One"';
        ctx.textAlign = 'center';
        ctx.fillText(text, 0, this.size + 60);

        // Ballon
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.size, this.size * 1.2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Glanz
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.ellipse(-10, -15, 10, 15, Math.PI / 4, 0, Math.PI * 2);
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

        // Koerper
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.ellipse(0, 0, this.size * 0.6, this.size * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#000';
        ctx.stroke();

        // Kopf
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.arc(0, -this.size * 0.5, this.size * 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Auge
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.size * 0.1, -this.size * 0.6, this.size * 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(this.size * 0.13, -this.size * 0.6, this.size * 0.04, 0, Math.PI * 2);
        ctx.fill();

        // Schnabel
        ctx.fillStyle = 'orange';
        ctx.beginPath();
        ctx.moveTo(this.size * 0.3, -this.size * 0.5);
        ctx.lineTo(this.size * 0.5, -this.size * 0.45);
        ctx.lineTo(this.size * 0.3, -this.size * 0.4);
        ctx.closePath();
        ctx.fill();

        // Kamm
        ctx.fillStyle = '#cc0000';
        ctx.beginPath();
        ctx.arc(-this.size * 0.05, -this.size * 0.8, this.size * 0.1, 0, Math.PI * 2);
        ctx.arc(this.size * 0.08, -this.size * 0.85, this.size * 0.08, 0, Math.PI * 2);
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

        // Hindernisse/Verstecke (Positionen relativ zur Canvas-Größe)
        this.updateObstaclePositions();
    }

    updateObstaclePositions() {
        // Positionen der Verstecke, relativ zur Canvas-Größe
        this.obstacles = [
            { id: 'tree', x: this.width * 0.12, y: this.height * 0.72, popDirection: 'right' },  // Hinter dem Baum
            { id: 'rock', x: this.width * 0.5, y: this.height * 0.82, popDirection: 'up' },     // Hinter dem Felsen
            { id: 'woodpile', x: this.width * 0.85, y: this.height * 0.75, popDirection: 'left' }, // Hinter dem Holzstapel
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
            // Wenn Wolke links rausfliegt, rechts wieder reinholen
            if (c.x < -c.size * 2) {
                c.x = this.width + c.size * 2;
                c.y = Math.random() * (this.height * 0.4);
            }
        });
    }

    draw(ctx) {
        // 1. Himmel (Linear Gradient)
        const skyGradient = ctx.createLinearGradient(0, 0, 0, this.height);
        skyGradient.addColorStop(0, '#5DBCD2'); // Helleres Blau oben
        skyGradient.addColorStop(0.6, '#BCE6E9'); // Noch heller Richtung Horizont
        skyGradient.addColorStop(1, '#8AB870'); // Grasgrün als harter Cut ganz unten (wird übermalt)
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, this.width, this.height);

        // 2. Sonne
        ctx.fillStyle = '#FFF5B8';
        ctx.beginPath();
        // Packen wir die Sonne relativ weit oben rechts hin
        ctx.arc(this.width * 0.8, this.height * 0.2, 50, 0, Math.PI * 2);
        ctx.fill();
        // Sonnen-Glow
        const glow = ctx.createRadialGradient(
            this.width * 0.8, this.height * 0.2, 50,
            this.width * 0.8, this.height * 0.2, 120
        );
        glow.addColorStop(0, 'rgba(255, 245, 184, 0.4)');
        glow.addColorStop(1, 'rgba(255, 245, 184, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(this.width * 0.8, this.height * 0.2, 120, 0, Math.PI * 2);
        ctx.fill();

        // 3. Bergkette im Hintergrund
        ctx.fillStyle = '#659D96'; // Bläulich-Grau-Grün für Ferne
        ctx.beginPath();
        ctx.moveTo(0, this.height); // Start unten links
        ctx.lineTo(0, this.height * 0.5); // Berg 1
        ctx.lineTo(this.width * 0.2, this.height * 0.3);
        ctx.lineTo(this.width * 0.4, this.height * 0.6); // Tal
        ctx.lineTo(this.width * 0.65, this.height * 0.25); // Berg 2 (höher)
        ctx.lineTo(this.width * 0.9, this.height * 0.55); // Tal
        ctx.lineTo(this.width, this.height * 0.4); // Berg 3
        ctx.lineTo(this.width, this.height); // Runter rechts
        ctx.closePath();
        ctx.fill();

        // 4. Hügelkette (Middleground)
        ctx.fillStyle = '#5A9652'; // Dunkleres Grün
        ctx.beginPath();
        ctx.moveTo(0, this.height);
        // Wir nutzen quadratische Kurven für weiche Hügel
        ctx.lineTo(0, this.height * 0.65);
        ctx.quadraticCurveTo(this.width * 0.25, this.height * 0.45, this.width * 0.5, this.height * 0.6);
        ctx.quadraticCurveTo(this.width * 0.8, this.height * 0.75, this.width, this.height * 0.5);
        ctx.lineTo(this.width, this.height);
        ctx.closePath();
        ctx.fill();

        // 5. Vordergrund-Wiese
        ctx.fillStyle = '#7CB342'; // Kräftiges Grasgrün
        ctx.beginPath();
        ctx.moveTo(0, this.height * 0.8);
        ctx.quadraticCurveTo(this.width * 0.5, this.height * 0.7, this.width, this.height * 0.85);
        ctx.lineTo(this.width, this.height);
        ctx.lineTo(0, this.height);
        ctx.closePath();
        ctx.fill();

        // 6. Wolken zeichnen (über den Bergen, im Himmel)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.clouds.forEach(c => {
            ctx.beginPath();
            ctx.arc(c.x, c.y, c.size, 0, Math.PI * 2);
            ctx.arc(c.x + c.size * 0.8, c.y - c.size * 0.3, c.size * 0.8, 0, Math.PI * 2);
            ctx.arc(c.x + c.size * 1.6, c.y, c.size * 0.9, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    // Vordergrund-Objekte (werden NACH den Hühnern gezeichnet, damit sie davor liegen)
    drawForeground(ctx) {
        this._drawTree(ctx);
        this._drawRock(ctx);
        this._drawWoodpile(ctx);
    }

    _drawTree(ctx) {
        const x = this.width * 0.12;
        const groundY = this.height * 0.78;

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

        // Krone (mehrere überlappende Kreise = buschiger Baum)
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

        // Hellere Highlights auf der Krone
        ctx.fillStyle = '#43A047';
        ctx.beginPath();
        ctx.arc(x - 30, groundY - 180, 20, 0, Math.PI * 2);
        ctx.arc(x + 15, groundY - 195, 18, 0, Math.PI * 2);
        ctx.fill();
    }

    _drawRock(ctx) {
        const x = this.width * 0.5;
        const groundY = this.height * 0.83;

        // Großer Fels
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

        // Felshighlight
        ctx.fillStyle = '#90A4AE';
        ctx.beginPath();
        ctx.moveTo(x - 30, groundY - 45);
        ctx.lineTo(x - 10, groundY - 50);
        ctx.lineTo(x + 5, groundY - 40);
        ctx.lineTo(x - 15, groundY - 30);
        ctx.closePath();
        ctx.fill();

        // Moos auf dem Stein
        ctx.fillStyle = '#558B2F';
        ctx.beginPath();
        ctx.ellipse(x - 20, groundY - 45, 15, 5, -0.3, 0, Math.PI * 2);
        ctx.fill();
    }

    _drawWoodpile(ctx) {
        const x = this.width * 0.85;
        const groundY = this.height * 0.80;

        // Holzstapel (3 Stämme übereinander)
        const logColors = ['#6D4C41', '#5D4037', '#795548'];
        for (let i = 0; i < 3; i++) {
            const ly = groundY - i * 25;
            ctx.fillStyle = logColors[i];
            ctx.beginPath();
            ctx.ellipse(x, ly, 50, 15, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#3E2723';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Jahresringe (Stirnseite)
            ctx.strokeStyle = '#4E342E';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.ellipse(x + 45, ly, 4, 10, 0, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Kleiner Busch daneben
        ctx.fillStyle = '#33691E';
        ctx.beginPath();
        ctx.arc(x + 55, groundY - 5, 20, 0, Math.PI * 2);
        ctx.arc(x + 70, groundY - 15, 18, 0, Math.PI * 2);
        ctx.arc(x + 60, groundY - 25, 15, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.audio = new AudioManager();

        this.state = GameState.MENU;

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
        };

        this.targets = [];
        this.particles = [];
        this.popups = [];

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

            cursor: document.getElementById('custom-cursor')
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
                timeBonus: 0 // +x seconds
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
    }

    updateMenuUI() {
        this.ui.menuCoins.innerText = this.meta.coins;
        this.ui.shopCoins.innerText = this.meta.coins;
    }

    showMainMenu() {
        this.state = GameState.MENU;
        this.hideAllScreens();
        this.ui.mainMenu.classList.remove('hidden');
        this.ui.mainMenu.classList.add('active');
        this.ui.cursor.style.display = 'none'; // Normaler cursor im Menü
        document.body.style.cursor = 'default';
        this.updateMenuUI();
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
            { id: 'timeBonus', name: 'Stoppuhr', desc: '+10 Sekunden Spielzeit', cost: 200 * (this.meta.upgrades.timeBonus + 1), max: 3, current: this.meta.upgrades.timeBonus }
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
        this.hideAllScreens();
        this.ui.hud.classList.remove('hidden');
        this.ui.hud.classList.add('active');

        document.body.style.cursor = 'none';
        this.ui.cursor.style.display = 'block';

        // Init Stats
        this.score = 0;
        this.timeRemaining = GAME_DURATION + (this.meta.upgrades.timeBonus * 10);
        this.maxAmmo = DEFAULT_AMMO + (this.meta.upgrades.magazine * 2);
        this.ammo = this.maxAmmo;
        this.isReloading = false;
        this.activeBuffs = { machinegun: 0, slowmo: 0 };

        this.targets = [];
        this.particles = [];
        this.popups = [];

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
        this.ui.buffsContainer.innerHTML = buffsHtml;
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
            this.checkHits(x, y);
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
        // Rückwärts iterieren, um überlappende Objekte richtig zu treffen (oberste zuerst)
        for (let i = this.targets.length - 1; i >= 0; i--) {
            const t = this.targets[i];
            if (!t.markedForDeletion && t.checkHit(x, y)) {
                t.markedForDeletion = true;

                // Effekte spawnen
                this.createExplosion(t.x, t.y, t instanceof InGameUpgrade ? '#3498db' : '#8B4513');

                if (t instanceof InGameUpgrade) {
                    this.audio.playUpgradeHit();
                    this.applyBuff(t.type);
                    this.popups.push(new ScorePopup(t.x, t.y, 'BUFF!', '#3498db'));
                } else {
                    this.audio.playChickenHit();
                    this.score += t.points;
                    this.popups.push(new ScorePopup(t.x, t.y, `+${t.points}`));
                }

                this.updateHUD();
                break; // Nur ein Ziel pro Schuss treffen
            }
        }

        // Schuss-Partikel
        for (let i = 0; i < 3; i++) {
            this.particles.push(new Particle(x, y, '#fff'));
        }
    }

    applyBuff(type) {
        if (type === 'time') {
            this.timeRemaining += 10;
        } else if (type === 'machinegun') {
            this.activeBuffs.machinegun = 5000; // 5 sekunden
            this.ammo = this.maxAmmo; // Magazin füllen
        } else if (type === 'slowmo') {
            this.activeBuffs.slowmo = 8000; // 8 sekunden
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

    endGame() {
        this.state = GameState.GAMEOVER;
        this.hideAllScreens();
        this.ui.gameOver.classList.remove('hidden');
        this.ui.gameOver.classList.add('active');

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
            this.ui.highscoreSubmissionDiv.style.display = 'none'; // Keine 0 Punkte eintragen lassen
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

        // Update HUD min. jeden Frame wg Buff-Timer
        this.updateHUD();

        const speedMultiplier = this.activeBuffs.slowmo > 0 ? 0.3 : 1.0;

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
                const types = ['time', 'machinegun', 'slowmo'];
                const t = types[Math.floor(Math.random() * types.length)];
                this.targets.push(new InGameUpgrade(this.canvas.width, this.canvas.height, t));
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
    }
}

// Bootstrap
window.onload = () => {
    window.game = new Game();
};
