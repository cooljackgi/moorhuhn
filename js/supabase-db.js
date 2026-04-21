// supabase-db.js

// Replace these with your actual Supabase URL and anon key
const SUPABASE_URL = 'https://jaeaoajtmjicwqjwtuly.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_uWXUdVQD2X1hYpdCWaxFBw_9SjrWBrT';

// Initialize the Supabase client
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Fetches the top 10 highscores from the database.
 * @returns {Promise<Array>} Array of highscore objects {name, score, created_at}
 */
async function getHighscores() {
    try {
        const { data, error } = await supabaseClient
            .from('highscores')
            .select('name, score, created_at')
            .order('score', { ascending: false })
            .limit(25);

        if (error) {
            console.error("Error fetching highscores:", error);
            return [];
        }

        return data || [];
    } catch (err) {
        console.error("Unexpected error fetching highscores:", err);
        return [];
    }
}

/**
 * Saves a new highscore to the database.
 * @param {string} name The player's name
 * @param {number} score The achieved score
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
async function saveHighscore(name, score) {
    if (!name || name.trim() === '') {
        name = 'Anonymes Huhn';
    }

    try {
        const { error } = await supabaseClient
            .from('highscores')
            .insert([
                { name: name.trim().substring(0, 15), score: parseInt(score, 10) }
            ]);

        if (error) {
            console.error("Error saving highscore:", error);
            return false;
        }

        return true;
    } catch (err) {
        console.error("Unexpected error saving highscore:", err);
        return false;
    }
}

function sanitizeHighscoreName(name) {
    const trimmed = (name || '').trim();
    return trimmed === '' ? 'Anonymes Huhn' : trimmed.substring(0, 15);
}

function sanitizeHighscoreScore(score) {
    const parsed = parseInt(score, 10);
    return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function buildHighscoreMutation(entry) {
    return supabaseClient
        .from('highscores')
        .eq('created_at', entry.created_at)
        .eq('name', entry.name)
        .eq('score', entry.score);
}

async function updateHighscore(entry, updates) {
    try {
        const payload = {
            name: sanitizeHighscoreName(updates.name),
            score: sanitizeHighscoreScore(updates.score)
        };

        const { error } = await buildHighscoreMutation(entry).update(payload);

        if (error) {
            console.error("Error updating highscore:", error);
            return false;
        }

        return true;
    } catch (err) {
        console.error("Unexpected error updating highscore:", err);
        return false;
    }
}

async function deleteHighscore(entry) {
    try {
        const { error } = await buildHighscoreMutation(entry).delete();

        if (error) {
            console.error("Error deleting highscore:", error);
            return false;
        }

        return true;
    } catch (err) {
        console.error("Unexpected error deleting highscore:", err);
        return false;
    }
}

window.db = {
    getHighscores,
    saveHighscore,
    updateHighscore,
    deleteHighscore
};
