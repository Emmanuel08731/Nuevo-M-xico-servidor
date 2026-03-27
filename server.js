const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const pool = new Pool({
    host: 'dpg-d6u5u3fkijhs73fhh1hg-a.oregon-postgres.render.com',
    user: 'base_datos_global_user',
    password: 'mEDJcu2NtduJqv662gaUvOIuPDh1HFi3',
    database: 'base_datos_global',
    port: 5432,
    ssl: { rejectUnauthorized: false }
});

// --- RESET TOTAL DE ECNHACA ---
const resetAndInit = async () => {
    try {
        console.log("⚠️ [SISTEMA] Iniciando limpieza profunda de Ecnhaca...");
        // Borramos todo para cumplir con tu petición de reset
        await pool.query('DROP TABLE IF EXISTS follows CASCADE;');
        await pool.query('DROP TABLE IF EXISTS users CASCADE;');

        // Re-creamos las tablas limpias
        await pool.query(`
            CREATE TABLE users (
                id SERIAL PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                color TEXT DEFAULT '#6366f1',
                bio TEXT DEFAULT '¡Hola! Soy nuevo en Ecnhaca.',
                followers_count INTEGER DEFAULT 0,
                following_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE follows (
                id SERIAL PRIMARY KEY,
                follower_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                following_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE(follower_id, following_id)
            );
        `);
        console.log("✅ [ECNHACA] Base de datos reseteada. 0 usuarios registrados.");
    } catch (e) { console.error("Error Reset:", e); }
};
resetAndInit();

// --- RUTAS DE AUTENTICACIÓN ---
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const colors = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        const result = await pool.query(
            "INSERT INTO users (username, email, password, color) VALUES ($1, $2, $3, $4) RETURNING *",
            [username.toLowerCase().trim(), email.toLowerCase().trim(), password, color]
        );
        res.json(result.rows[0]);
    } catch (e) { res.status(400).json({ error: "El usuario ya existe." }); }
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const result = await pool.query("SELECT * FROM users WHERE username = $1 AND password = $2", [username.toLowerCase().trim(), password]);
    if (result.rows.length > 0) res.json(result.rows[0]);
    else res.status(401).json({ error: "Credenciales inválidas." });
});

// --- RUTAS SOCIALES ---
app.get('/api/search', async (req, res) => {
    const { q, myId } = req.query;
    if (!q) return res.json([]);
    try {
        const result = await pool.query(`
            SELECT u.*, 
            (SELECT COUNT(*) FROM follows WHERE follower_id = $2 AND following_id = u.id) as is_following
            FROM users u WHERE u.username ILIKE $1 AND u.id != $2 LIMIT 15`, 
            [`%${q}%`, myId]);
        res.json(result.rows);
    } catch (e) { res.status(500).json(e); }
});

app.get('/api/user/:id', async (req, res) => {
    try {
        const result = await pool.query("SELECT id, username, color, bio, followers_count, following_count FROM users WHERE id = $1", [req.params.id]);
        res.json(result.rows[0]);
    } catch (e) { res.status(404).send(); }
});

app.post('/api/follow-toggle', async (req, res) => {
    const { myId, targetId } = req.body;
    try {
        const check = await pool.query("SELECT * FROM follows WHERE follower_id = $1 AND following_id = $2", [myId, targetId]);
        
        if (check.rows.length > 0) {
            // UNFOLLOW
            await pool.query("DELETE FROM follows WHERE follower_id = $1 AND following_id = $2", [myId, targetId]);
            await pool.query("UPDATE users SET followers_count = followers_count - 1 WHERE id = $1", [targetId]);
            await pool.query("UPDATE users SET following_count = following_count - 1 WHERE id = $1", [myId]);
            res.json({ action: 'unfollowed' });
        } else {
            // FOLLOW
            await pool.query("INSERT INTO follows (follower_id, following_id) VALUES ($1, $2)", [myId, targetId]);
            await pool.query("UPDATE users SET followers_count = followers_count + 1 WHERE id = $1", [targetId]);
            await pool.query("UPDATE users SET following_count = following_count + 1 WHERE id = $1", [myId]);
            res.json({ action: 'followed' });
        }
    } catch (e) { res.status(500).json(e); }
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.listen(10000, () => console.log("🚀 ECNHACA SERVER ONLINE"));
