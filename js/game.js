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

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.audio = new AudioManager();

        this.state = GameState.MENU;

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

    openHighscores() {
        this.state = GameState.HIGHSCORES;
        this.hideAllScreens();
        this.ui.highscoreMenu.classList.remove('hidden');
        this.ui.highscoreMenu.classList.add('active');

        this.ui.highscoreList.innerHTML = '';
        if (this.meta.highscores.length === 0) {
            this.ui.highscoreList.innerHTML = '<li>Noch keine Einträge</li>';
        } else {
            this.meta.highscores.forEach((hs, i) => {
                const li = document.createElement('li');
                li.innerHTML = `<span>#${i + 1}</span> <span>${hs} Pkt</span>`;
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

        // Prüfen ob es ein neuer Rekord ist (nur wenn er an pos 1 gelistet wurde und es davor schon werte gab bzw. >0)
        if (this.meta.highscores[0] === this.score && this.score > 0) {
            isNewHS = true;
        }

        // Behalte nur Top 5
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
                this.targets.push(new Target(this.canvas.width, this.canvas.height));
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
        // Clear (Hintergrund ist über CSS gesetzt, canvas ist transparent)
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Im Menü passiert nichts auf dem Canvas, wir lassen es leer
        if (this.state !== GameState.PLAYING && this.targets.length === 0 && this.particles.length === 0) return;

        // Entities zeichnen
        this.targets.forEach(t => t.draw(this.ctx));
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
