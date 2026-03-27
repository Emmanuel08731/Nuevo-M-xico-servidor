/**
 * ECNHACA BACKEND ENGINE - Emmanuel Store Oficial
 * Totalmente optimizado para PostgreSQL en Render
 */
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de conexión con la base de datos de Emmanuel
const pool = new Pool({
    connectionString: 'postgres://base_datos_global_user:mEDJcu2NtduJqv662gaUvOIuPDh1HFi3@dpg-d6u5u3fkijhs73fhh1hg-a.oregon-postgres.render.com/base_datos_global',
    ssl: { rejectUnauthorized: false }
});

// Inicialización de esquema: Limpio y profesional
const setupEcnhacaDB = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                color TEXT DEFAULT '#6366f1',
                bio TEXT DEFAULT 'Explorando el universo de Ecnhaca...',
                followers_count INTEGER DEFAULT 0,
                following_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS follows (
                id SERIAL PRIMARY KEY,
                follower_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                following_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE(follower_id, following_id)
            );
        `);
        console.log("🚀 [DATABASE] Ecnhaca sincronizada correctamente.");
    } catch (err) {
        console.error("❌ [DATABASE] Error al sincronizar:", err);
    }
};
setupEcnhacaDB();

// --- SISTEMA DE AUTENTICACIÓN (LOGIN/REGISTRO) ---

app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const checkUser = await pool.query("SELECT * FROM users WHERE username = $1 OR email = $2", [username.toLowerCase(), email.toLowerCase()]);
        if (checkUser.rows.length > 0) return res.status(400).json({ error: "El nombre o email ya están registrados." });

        const colors = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        const newUser = await pool.query(
            "INSERT INTO users (username, email, password, color) VALUES ($1, $2, $3, $4) RETURNING *",
            [username.toLowerCase().trim(), email.toLowerCase().trim(), password, randomColor]
        );
        res.json({ success: true, user: newUser.rows[0] });
    } catch (e) { res.status(500).json({ error: "Error fatal en el registro." }); }
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const userResult = await pool.query("SELECT * FROM users WHERE username = $1", [username.toLowerCase().trim()]);
        if (userResult.rows.length === 0) return res.status(404).json({ error: "La cuenta no existe en Ecnhaca." });

        const user = userResult.rows[0];
        if (user.password !== password) return res.status(401).json({ error: "Contraseña incorrecta." });

        res.json({ success: true, user: user });
    } catch (e) { res.status(500).json({ error: "Error en el servidor de login." }); }
});

// --- SISTEMA SOCIAL ---

app.get('/api/search', async (req, res) => {
    const { q, myId } = req.query;
    try {
        const users = await pool.query(`
            SELECT id, username, color, followers_count,
            (SELECT COUNT(*) FROM follows WHERE follower_id = $2 AND following_id = users.id) as is_following
            FROM users WHERE username ILIKE $1 AND id != $2 ORDER BY followers_count DESC LIMIT 25`, 
            [`%${q}%`, myId]);
        res.json(users.rows);
    } catch (e) { res.status(500).send(); }
});

app.get('/api/user/:id', async (req, res) => {
    const result = await pool.query("SELECT id, username, color, bio, followers_count, following_count FROM users WHERE id = $1", [req.params.id]);
    res.json(result.rows[0]);
});

app.post('/api/follow-toggle', async (req, res) => {
    const { myId, targetId } = req.body;
    try {
        const isFollowing = await pool.query("SELECT * FROM follows WHERE follower_id = $1 AND following_id = $2", [myId, targetId]);
        if (isFollowing.rows.length > 0) {
            await pool.query("DELETE FROM follows WHERE follower_id = $1 AND following_id = $2", [myId, targetId]);
            await pool.query("UPDATE users SET followers_count = followers_count - 1 WHERE id = $1", [targetId]);
            await pool.query("UPDATE users SET following_count = following_count - 1 WHERE id = $1", [myId]);
            res.json({ action: 'unfollowed' });
        } else {
            await pool.query("INSERT INTO follows (follower_id, following_id) VALUES ($1, $2)", [myId, targetId]);
            await pool.query("UPDATE users SET followers_count = followers_count + 1 WHERE id = $1", [targetId]);
            await pool.query("UPDATE users SET following_count = following_count + 1 WHERE id = $1", [myId]);
            res.json({ action: 'followed' });
        }
    } catch (e) { res.status(500).send(); }
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.listen(10000, () => console.log("--- ECNHACA ONLINE PORT 10000 ---"));
