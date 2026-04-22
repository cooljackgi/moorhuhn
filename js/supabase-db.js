// supabase-db.js

const SUPABASE_URL = 'https://jaeaoajtmjicwqjwtuly.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_uWXUdVQD2X1hYpdCWaxFBw_9SjrWBrT';

const ADMIN_EMAILS = [
    'becker.bubenrod@gmail.com'
];

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const DEFAULT_GAME_CONFIG = {
    time_limit_seconds: 90,
    game_enabled: true,
    announcement_text: ''
};

function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
}

function sanitizeHighscoreName(name) {
    const trimmed = String(name || '').trim();
    return trimmed === '' ? 'Anonymes Huhn' : trimmed.substring(0, 15);
}

function sanitizeHighscoreScore(score) {
    const parsed = parseInt(score, 10);
    return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function isAdminUser(user) {
    if (!user || !user.email) return false;
    const email = normalizeEmail(user.email);
    return ADMIN_EMAILS.map(normalizeEmail).includes(email);
}

function buildHighscoreMutation(entry) {
    return supabaseClient
        .from('highscores')
        .eq('created_at', entry.created_at)
        .eq('name', entry.name)
        .eq('score', entry.score);
}

function generateClientSessionId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
        return window.crypto.randomUUID();
    }

    return `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getTodayStartIso() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return todayStart.toISOString();
}

function normalizeGameConfig(rows) {
    const config = { ...DEFAULT_GAME_CONFIG };

    (rows || []).forEach((row) => {
        if (!row || !row.key) return;

        if (row.key === 'time_limit_seconds') {
            const parsed = parseInt(row.value, 10);
            if (Number.isFinite(parsed)) {
                config.time_limit_seconds = Math.max(15, Math.min(parsed, 600));
            }
        }

        if (row.key === 'game_enabled') {
            config.game_enabled = String(row.value).toLowerCase() !== 'false';
        }

        if (row.key === 'announcement_text') {
            config.announcement_text = String(row.value || '').substring(0, 280);
        }
    });

    return config;
}

async function getHighscores(limit = 25) {
    try {
        const { data, error } = await supabaseClient
            .from('highscores')
            .select('name, score, created_at')
            .order('score', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Error fetching highscores:', error);
            return [];
        }

        return data || [];
    } catch (err) {
        console.error('Unexpected error fetching highscores:', err);
        return [];
    }
}

async function saveHighscore(name, score) {
    try {
        const { error } = await supabaseClient
            .from('highscores')
            .insert([
                {
                    name: sanitizeHighscoreName(name),
                    score: sanitizeHighscoreScore(score)
                }
            ]);

        if (error) {
            console.error('Error saving highscore:', error);
            return false;
        }

        return true;
    } catch (err) {
        console.error('Unexpected error saving highscore:', err);
        return false;
    }
}

async function updateHighscore(entry, updates) {
    try {
        const { error } = await buildHighscoreMutation(entry).update({
            name: sanitizeHighscoreName(updates.name),
            score: sanitizeHighscoreScore(updates.score)
        });

        if (error) {
            console.error('Error updating highscore:', error);
            return false;
        }

        return true;
    } catch (err) {
        console.error('Unexpected error updating highscore:', err);
        return false;
    }
}

async function deleteHighscore(entry) {
    try {
        const { error } = await buildHighscoreMutation(entry).delete();

        if (error) {
            console.error('Error deleting highscore:', error);
            return false;
        }

        return true;
    } catch (err) {
        console.error('Unexpected error deleting highscore:', err);
        return false;
    }
}

async function startGameSession() {
    const clientSessionId = generateClientSessionId();

    try {
        const { error } = await supabaseClient
            .from('game_sessions')
            .insert([{
                client_session_id: clientSessionId,
                started_at: new Date().toISOString(),
                completed: false,
                page_path: window.location.pathname,
                user_agent: navigator.userAgent
            }]);

        if (error) {
            console.error('Error starting game session:', error);
            return null;
        }

        return clientSessionId;
    } catch (err) {
        console.error('Unexpected error starting game session:', err);
        return null;
    }
}

async function finishGameSession(clientSessionId, payload = {}) {
    if (!clientSessionId) return false;

    try {
        const { error } = await supabaseClient
            .from('game_sessions')
            .update({
                ended_at: new Date().toISOString(),
                completed: Boolean(payload.completed),
                score: sanitizeHighscoreScore(payload.score),
                coins_earned: sanitizeHighscoreScore(payload.coins_earned || 0),
                duration_seconds: Math.max(0, Math.round(payload.duration_seconds || 0)),
                exit_reason: String(payload.exit_reason || 'unknown').substring(0, 40)
            })
            .eq('client_session_id', clientSessionId);

        if (error) {
            console.error('Error finishing game session:', error);
            return false;
        }

        return true;
    } catch (err) {
        console.error('Unexpected error finishing game session:', err);
        return false;
    }
}

async function signInAdmin(email, password) {
    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: String(email || '').trim(),
            password: String(password || '')
        });

        if (error) {
            console.error('Error signing in admin:', error);
            return { success: false, error: error.message, user: null };
        }

        return { success: true, error: '', user: data.user || null };
    } catch (err) {
        console.error('Unexpected error signing in admin:', err);
        return { success: false, error: 'Login fehlgeschlagen.', user: null };
    }
}

async function signOutAdmin() {
    try {
        const { error } = await supabaseClient.auth.signOut({ scope: 'local' });
        if (error) {
            console.error('Error signing out admin:', error);
            return false;
        }

        return true;
    } catch (err) {
        console.error('Unexpected error signing out admin:', err);
        return false;
    }
}

async function getCurrentUser() {
    try {
        const { data, error } = await supabaseClient.auth.getUser();
        if (error) {
            console.error('Error getting current user:', error);
            return null;
        }

        return data.user || null;
    } catch (err) {
        console.error('Unexpected error getting current user:', err);
        return null;
    }
}

function onAuthStateChange(callback) {
    return supabaseClient.auth.onAuthStateChange((_event, session) => {
        callback(session ? session.user : null);
    });
}

async function getAdminDashboardData() {
    const todayStartIso = getTodayStartIso();

    try {
        const [
            configResult,
            highscores,
            recentSessionsResult,
            totalSessionsResult,
            todaySessionsResult,
            todayCompletedResult,
            todayScoresResult
        ] = await Promise.all([
            supabaseClient
                .from('game_config')
                .select('key, value'),
            getHighscores(50),
            supabaseClient
                .from('game_sessions')
                .select('started_at, ended_at, completed, score, coins_earned, duration_seconds, exit_reason, page_path')
                .order('started_at', { ascending: false })
                .limit(30),
            supabaseClient
                .from('game_sessions')
                .select('*', { count: 'exact', head: true }),
            supabaseClient
                .from('game_sessions')
                .select('*', { count: 'exact', head: true })
                .gte('started_at', todayStartIso),
            supabaseClient
                .from('game_sessions')
                .select('*', { count: 'exact', head: true })
                .gte('started_at', todayStartIso)
                .eq('completed', true),
            supabaseClient
                .from('game_sessions')
                .select('score')
                .gte('started_at', todayStartIso)
                .eq('completed', true)
        ]);

        if (configResult.error) throw configResult.error;
        if (recentSessionsResult.error) throw recentSessionsResult.error;
        if (totalSessionsResult.error) throw totalSessionsResult.error;
        if (todaySessionsResult.error) throw todaySessionsResult.error;
        if (todayCompletedResult.error) throw todayCompletedResult.error;
        if (todayScoresResult.error) throw todayScoresResult.error;

        const todayScores = (todayScoresResult.data || []).map((row) => row.score || 0);
        const avgTodayScore = todayScores.length
            ? Math.round(todayScores.reduce((sum, value) => sum + value, 0) / todayScores.length)
            : 0;
        const bestTodayScore = todayScores.length ? Math.max(...todayScores) : 0;

        return {
            config: normalizeGameConfig(configResult.data || []),
            highscores,
            recentSessions: recentSessionsResult.data || [],
            stats: {
                totalSessions: totalSessionsResult.count || 0,
                sessionsToday: todaySessionsResult.count || 0,
                completedToday: todayCompletedResult.count || 0,
                avgTodayScore,
                bestTodayScore,
                highscoreEntries: highscores.length
            }
        };
    } catch (err) {
        console.error('Unexpected error loading admin dashboard:', err);
        return {
            config: { ...DEFAULT_GAME_CONFIG },
            highscores: [],
            recentSessions: [],
            stats: {
                totalSessions: 0,
                sessionsToday: 0,
                completedToday: 0,
                avgTodayScore: 0,
                bestTodayScore: 0,
                highscoreEntries: 0
            }
        };
    }
}

async function getPublicGameConfig() {
    try {
        const { data, error } = await supabaseClient
            .from('game_config')
            .select('key, value');

        if (error) {
            console.error('Error loading game config:', error);
            return { ...DEFAULT_GAME_CONFIG };
        }

        return normalizeGameConfig(data || []);
    } catch (err) {
        console.error('Unexpected error loading game config:', err);
        return { ...DEFAULT_GAME_CONFIG };
    }
}

async function upsertGameConfig(config) {
    const rows = [
        {
            key: 'time_limit_seconds',
            value: String(Math.max(15, Math.min(parseInt(config.time_limit_seconds, 10) || DEFAULT_GAME_CONFIG.time_limit_seconds, 600)))
        },
        {
            key: 'game_enabled',
            value: String(Boolean(config.game_enabled))
        },
        {
            key: 'announcement_text',
            value: String(config.announcement_text || '').substring(0, 280)
        }
    ];

    try {
        const { error } = await supabaseClient
            .from('game_config')
            .upsert(rows, { onConflict: 'key' });

        if (error) {
            console.error('Error saving game config:', error);
            return false;
        }

        return true;
    } catch (err) {
        console.error('Unexpected error saving game config:', err);
        return false;
    }
}

window.db = {
    getHighscores,
    saveHighscore,
    updateHighscore,
    deleteHighscore,
    startGameSession,
    finishGameSession,
    getAdminDashboardData,
    getPublicGameConfig,
    upsertGameConfig,
    signInAdmin,
    signOutAdmin,
    getCurrentUser,
    onAuthStateChange,
    isAdminUser,
    ADMIN_EMAILS,
    DEFAULT_GAME_CONFIG
};
