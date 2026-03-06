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
            .limit(10);

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

window.db = {
    getHighscores,
    saveHighscore
};
