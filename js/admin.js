class AdminApp {
    constructor() {
        this.user = null;
        this.highscores = [];
        this.editingHighscoreIndex = -1;
        this.authSubscription = null;
        this.config = { ...window.db.DEFAULT_GAME_CONFIG };

        this.ui = {
            loginPanel: document.getElementById('admin-login-panel'),
            dashboard: document.getElementById('admin-dashboard'),
            email: document.getElementById('admin-page-email'),
            password: document.getElementById('admin-page-password'),
            loginButton: document.getElementById('btn-admin-login-page'),
            logoutButton: document.getElementById('btn-admin-logout-page'),
            refreshButton: document.getElementById('btn-admin-refresh'),
            message: document.getElementById('admin-page-message'),
            highscoreMessage: document.getElementById('admin-highscore-message'),
            settingsMessage: document.getElementById('admin-settings-message'),
            highscoreList: document.getElementById('admin-highscore-list'),
            sessionsBody: document.getElementById('admin-sessions-body'),
            statSessionsToday: document.getElementById('stat-sessions-today'),
            statCompletedToday: document.getElementById('stat-completed-today'),
            statAvgScore: document.getElementById('stat-avg-score'),
            statBestScore: document.getElementById('stat-best-score'),
            statTotalSessions: document.getElementById('stat-total-sessions'),
            statHighscoreCount: document.getElementById('stat-highscore-count'),
            settingTimeLimit: document.getElementById('setting-time-limit'),
            settingGameEnabled: document.getElementById('setting-game-enabled'),
            settingAnnouncement: document.getElementById('setting-announcement'),
            saveSettingsButton: document.getElementById('btn-save-settings')
        };

        this.bindEvents();
        this.init();
    }

    bindEvents() {
        this.ui.loginButton.addEventListener('click', () => this.login());
        this.ui.logoutButton.addEventListener('click', () => this.logout());
        this.ui.refreshButton.addEventListener('click', () => this.loadDashboard());
        this.ui.saveSettingsButton.addEventListener('click', () => this.saveSettings());
        this.ui.password.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                this.login();
            }
        });
    }

    async init() {
        this.user = await window.db.getCurrentUser();
        this.updateShell();

        this.authSubscription = window.db.onAuthStateChange((user) => {
            this.user = user;
            this.updateShell();
            if (this.isAdmin()) {
                this.loadDashboard();
            }
        });

        if (this.isAdmin()) {
            await this.loadDashboard();
        }
    }

    isAdmin() {
        return window.db.isAdminUser(this.user);
    }

    setMessage(target, message, isError = false) {
        if (!target) return;

        if (!message) {
            target.textContent = '';
            target.classList.add('hidden');
            target.classList.remove('error');
            return;
        }

        target.textContent = message;
        target.classList.remove('hidden');
        target.classList.toggle('error', isError);
    }

    updateShell() {
        const admin = this.isAdmin();

        this.ui.loginPanel.classList.toggle('hidden', admin);
        this.ui.dashboard.classList.toggle('hidden', !admin);
        this.ui.logoutButton.classList.toggle('hidden', !admin);
        this.ui.refreshButton.classList.toggle('hidden', !admin);

        if (!admin && this.user && this.user.email) {
            this.setMessage(this.ui.message, `Eingeloggt als ${this.user.email}, aber nicht als Admin freigeschaltet.`, true);
        }
    }

    async login() {
        const email = this.ui.email.value.trim();
        const password = this.ui.password.value;

        if (!email || !password) {
            this.setMessage(this.ui.message, 'Bitte E-Mail und Passwort eingeben.', true);
            return;
        }

        this.setMessage(this.ui.message, 'Login läuft...');
        const result = await window.db.signInAdmin(email, password);

        if (!result.success) {
            this.setMessage(this.ui.message, result.error || 'Login fehlgeschlagen.', true);
            return;
        }

        if (!window.db.isAdminUser(result.user)) {
            await window.db.signOutAdmin();
            this.setMessage(this.ui.message, 'Dieser Account ist nicht als Admin freigeschaltet.', true);
            return;
        }

        this.ui.password.value = '';
        this.user = result.user;
        this.setMessage(this.ui.message, '');
        this.updateShell();
        await this.loadDashboard();
    }

    async logout() {
        const success = await window.db.signOutAdmin();
        if (!success) {
            this.setMessage(this.ui.message, 'Logout fehlgeschlagen.', true);
            return;
        }

        this.user = null;
        this.highscores = [];
        this.editingHighscoreIndex = -1;
        this.updateShell();
        this.setMessage(this.ui.message, 'Ausgeloggt.');
    }

    async loadDashboard() {
        if (!this.isAdmin()) return;

        this.setMessage(this.ui.highscoreMessage, 'Lade Dashboard...');
        const data = await window.db.getAdminDashboardData();
        this.highscores = data.highscores || [];
        this.editingHighscoreIndex = -1;
        this.config = data.config || { ...window.db.DEFAULT_GAME_CONFIG };

        this.ui.statSessionsToday.textContent = data.stats.sessionsToday;
        this.ui.statCompletedToday.textContent = data.stats.completedToday;
        this.ui.statAvgScore.textContent = data.stats.avgTodayScore;
        this.ui.statBestScore.textContent = data.stats.bestTodayScore;
        this.ui.statTotalSessions.textContent = data.stats.totalSessions;
        this.ui.statHighscoreCount.textContent = data.stats.highscoreEntries;

        this.ui.settingTimeLimit.value = this.config.time_limit_seconds;
        this.ui.settingGameEnabled.checked = Boolean(this.config.game_enabled);
        this.ui.settingAnnouncement.value = this.config.announcement_text || '';

        this.renderHighscores();
        this.renderSessions(data.recentSessions || []);
        this.setMessage(this.ui.highscoreMessage, '');
        this.setMessage(this.ui.settingsMessage, '');
    }

    async saveSettings() {
        if (!this.isAdmin()) return;

        this.setMessage(this.ui.settingsMessage, 'Speichere Einstellungen...');
        const success = await window.db.upsertGameConfig({
            time_limit_seconds: this.ui.settingTimeLimit.value,
            game_enabled: this.ui.settingGameEnabled.checked,
            announcement_text: this.ui.settingAnnouncement.value
        });

        if (!success) {
            this.setMessage(this.ui.settingsMessage, 'Speichern fehlgeschlagen. Prüfe die Config-Policies.', true);
            return;
        }

        await this.loadDashboard();
        this.setMessage(this.ui.settingsMessage, 'Einstellungen gespeichert.');
    }

    renderHighscores() {
        this.ui.highscoreList.innerHTML = '';

        if (this.highscores.length === 0) {
            this.ui.highscoreList.innerHTML = '<li>Keine Highscores gefunden.</li>';
            return;
        }

        this.highscores.forEach((entry, index) => {
            const li = document.createElement('li');
            li.className = 'highscore-item';

            if (this.editingHighscoreIndex === index) {
                li.innerHTML = `
                    <div class="highscore-edit-fields">
                        <input id="admin-hs-name-${index}" class="highscore-edit-input" type="text" maxlength="15" value="${this.escapeHtml(entry.name)}">
                        <input id="admin-hs-score-${index}" class="highscore-edit-input highscore-score-input" type="number" min="0" step="1" value="${entry.score}">
                    </div>
                    <div class="highscore-actions">
                        <button class="btn btn-primary highscore-action-btn" data-action="save" data-index="${index}">Speichern</button>
                        <button class="btn btn-secondary highscore-action-btn" data-action="cancel" data-index="${index}">Abbrechen</button>
                    </div>
                `;
            } else {
                li.innerHTML = `
                    <div class="highscore-main">
                        <span>#${index + 1} <b>${this.escapeHtml(entry.name)}</b></span>
                        <span>${entry.score} Pkt</span>
                    </div>
                    <div class="highscore-actions">
                        <button class="btn btn-secondary highscore-action-btn" data-action="edit" data-index="${index}">Bearbeiten</button>
                        <button class="btn btn-secondary highscore-action-btn danger" data-action="delete" data-index="${index}">Loeschen</button>
                    </div>
                `;
            }

            this.ui.highscoreList.appendChild(li);
        });

        this.ui.highscoreList.querySelectorAll('button[data-action]').forEach((button) => {
            button.addEventListener('click', () => this.handleHighscoreAction(button.dataset.action, Number(button.dataset.index)));
        });
    }

    async handleHighscoreAction(action, index) {
        if (action === 'edit') {
            this.editingHighscoreIndex = index;
            this.renderHighscores();
            return;
        }

        if (action === 'cancel') {
            this.editingHighscoreIndex = -1;
            this.renderHighscores();
            return;
        }

        const entry = this.highscores[index];
        if (!entry) return;

        if (action === 'save') {
            const nameInput = document.getElementById(`admin-hs-name-${index}`);
            const scoreInput = document.getElementById(`admin-hs-score-${index}`);
            this.setMessage(this.ui.highscoreMessage, 'Speichere Highscore...');

            const success = await window.db.updateHighscore(entry, {
                name: nameInput ? nameInput.value : entry.name,
                score: scoreInput ? scoreInput.value : entry.score
            });

            if (!success) {
                this.setMessage(this.ui.highscoreMessage, 'Speichern fehlgeschlagen. Prüfe die Admin-Policies.', true);
                return;
            }

            await this.loadDashboard();
            this.setMessage(this.ui.highscoreMessage, 'Highscore aktualisiert.');
            return;
        }

        if (action === 'delete') {
            this.setMessage(this.ui.highscoreMessage, 'Lösche Highscore...');
            const success = await window.db.deleteHighscore(entry);

            if (!success) {
                this.setMessage(this.ui.highscoreMessage, 'Löschen fehlgeschlagen. Prüfe die Admin-Policies.', true);
                return;
            }

            await this.loadDashboard();
            this.setMessage(this.ui.highscoreMessage, 'Highscore gelöscht.');
        }
    }

    renderSessions(sessions) {
        this.ui.sessionsBody.innerHTML = '';

        if (sessions.length === 0) {
            this.ui.sessionsBody.innerHTML = '<tr><td colspan="5">Noch keine Sessions gefunden.</td></tr>';
            return;
        }

        sessions.forEach((session) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${this.formatDate(session.started_at)}</td>
                <td>${session.completed ? 'Beendet' : 'Offen'}</td>
                <td>${session.score || 0}</td>
                <td>${session.duration_seconds || 0}s</td>
                <td>${this.escapeHtml(session.exit_reason || '-')}</td>
            `;
            this.ui.sessionsBody.appendChild(tr);
        });
    }

    formatDate(value) {
        if (!value) return '-';
        return new Date(value).toLocaleString('de-DE');
    }

    escapeHtml(text) {
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
}

window.addEventListener('load', () => {
    window.adminApp = new AdminApp();
});
