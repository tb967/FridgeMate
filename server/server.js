require("dotenv").config({ path: "../.env" });

const express = require("express");
const pool = require("./db");
const supabase = require("./supabase");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Check that the Express server is running
app.get("/", (req, res) => {
    res.json({ message: "FridgeMate server is running!" });
});

// Test the original local PostgreSQL connection
app.get("/db-test", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");
        res.json({
            message: "Database connection successful!",
            time: result.rows[0].now
        });
    } catch (error) {
        console.error("Database connection error:", error.message);
        res.status(500).json({
            message: "Database connection failed."
        });
    }
});

// Test the Supabase connection
app.get("/supabase-test", async (req, res) => {
    try {
        const response = await fetch(
            `${process.env.SUPABASE_URL}/auth/v1/health`,
            {
                headers: {
                    apikey: process.env.SUPABASE_PUBLISHABLE_KEY
                }
            }
        );

        if (!response.ok) {
            throw new Error(`Supabase returned status ${response.status}`);
        }

        res.json({
            message: "Supabase Auth service is responding!"
        });
    } catch (error) {
        console.error("Supabase connection error:", error.message);
        res.status(500).json({
            message: "Supabase connection failed."
        });
    }
});



app.get("/inventory-test", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("inventory_items")
            .select("id")
            .limit(1);

        if (error) {
            console.error("Supabase error details:", error);
            return res.status(500).json({
                message: "Supabase database query failed.",
                error: error.message,
                code: error.code,
                details: error.details,
                hint: error.hint
            });
        }

        res.json({
            message: "Supabase database query successful!",
            querySuccessful: true,
            recordsFound: data.length
        });
    } catch (error) {
        console.error("Unexpected error:", error);

        res.status(500).json({
            message: "Unexpected server error.",
            error: error.message
        });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`FridgeMate server running on http://localhost:${PORT}`);
});
