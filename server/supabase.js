
const { createClient } = require("@supabase/supabase-js");
const path = require("path");

require("dotenv").config({
    path: path.resolve(__dirname, "../.env")
});

// Standard Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_PUBLISHABLE_KEY
);

// Create a Supabase client authenticated as the logged-in user
function createAuthenticatedClient(accessToken) {
    return createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_PUBLISHABLE_KEY,
        {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false
            },
            global: {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            }
        }
    );
}

module.exports = supabase;
module.exports.createAuthenticatedClient = createAuthenticatedClient;
