// supabase-db.js

const SUPABASE_URL = 'https://jaeaoajtmjicwqjwtuly.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_uWXUdVQD2X1hYpdCWaxFBw_9SjrWBrT';

// Add your admin email(s) here. The same email(s) must also be used in the SQL policies.
const ADMIN_EMAILS = [
    'becker.bubenrod@gmail.com'
];

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

async function getHighscores() {
    try {
        const { data, error } = await supabaseClient
            .from('highscores')
            .select('name, score, created_at')
            .order('score', { ascending: false })
            .limit(25);

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

window.db = {
    getHighscores,
    saveHighscore,
    updateHighscore,
    deleteHighscore,
    signInAdmin,
    signOutAdmin,
    getCurrentUser,
    onAuthStateChange,
    isAdminUser,
    ADMIN_EMAILS
};
