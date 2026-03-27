/**
 * ECNHACA CORE ENGINE v5.0
 * SISTEMA: Gestión de Usuarios, Seguidores y Publicaciones Dinámicas
 */
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Conexión Segura a Base de Datos
const pool = new Pool({
    connectionString: 'postgres://base_datos_global_user:mEDJcu2NtduJqv662gaUvOIuPDh1HFi3@dpg-d6u5u3fkijhs73fhh1hg-a.oregon-postgres.render.com/base_datos_global',
    ssl: { rejectUnauthorized: false }
});

// Inicialización de Arquitectura (Usuarios, Seguidores y Posts)
const initEcnhacaDB = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password TEXT NOT NULL,
                color VARCHAR(20) DEFAULT '#6366f1',
                bio TEXT DEFAULT 'Explorando las fronteras de Ecnhaca...',
                followers_count INTEGER DEFAULT 0,
                following_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS posts (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                title VARCHAR(100) NOT NULL,
                description TEXT NOT NULL,
                image_url TEXT,
                category VARCHAR(50),
                likes_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS follows (
                id SERIAL PRIMARY KEY,
                follower_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                following_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE(follower_id, following_id)
            );
        `);
        console.log("------------------------------------------");
        console.log("🚀 SISTEMA ECNHACA INICIALIZADO CORRECTAMENTE");
        console.log("------------------------------------------");
    } catch (e) { console.error("Error DB:", e); }
};
initEcnhacaDB();

// --- RUTAS DE IDENTIDAD ---
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const colors = ['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        const result = await pool.query(
            "INSERT INTO users (username, email, password, color) VALUES ($1, $2, $3, $4) RETURNING *",
            [username.toLowerCase().trim(), email.toLowerCase().trim(), password, color]
        );
        res.json({ success: true, user: result.rows[0] });
    } catch (e) { res.status(400).json({ error: "Credenciales ya registradas." }); }
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const result = await pool.query("SELECT * FROM users WHERE username = $1", [username.toLowerCase().trim()]);
    if(result.rows.length === 0 || result.rows[0].password !== password) {
        return res.status(401).json({ error: "Usuario o contraseña no válidos." });
    }
    res.json({ success: true, user: result.rows[0] });
});

// --- SISTEMA DE PUBLICACIONES (POSTS) ---
app.post('/api/posts', async (req, res) => {
    const { user_id, title, description, image_url, category } = req.body;
    try {
        const result = await pool.query(
            "INSERT INTO posts (user_id, title, description, image_url, category) VALUES ($1, $2, $3, $4, $5) RETURNING *",
            [user_id, title, description, image_url, category]
        );
        res.json(result.rows[0]);
    } catch (e) { res.status(500).send(); }
});

app.get('/api/posts', async (req, res) => {
    const result = await pool.query(`
        SELECT p.*, u.username, u.color 
        FROM posts p JOIN users u ON p.user_id = u.id 
        ORDER BY p.created_at DESC LIMIT 50`);
    res.json(result.rows);
});

// --- SISTEMA SOCIAL ---
app.get('/api/search', async (req, res) => {
    const { q, myId } = req.query;
    const result = await pool.query(`
        SELECT id, username, color, followers_count,
        (SELECT COUNT(*) FROM follows WHERE follower_id = $2 AND following_id = users.id) as is_following
        FROM users WHERE username ILIKE $1 AND id != $2 LIMIT 20`, [`%${q}%`, myId]);
    res.json(result.rows);
});

app.post('/api/follow-toggle', async (req, res) => {
    const { myId, targetId } = req.body;
    const check = await pool.query("SELECT * FROM follows WHERE follower_id = $1 AND following_id = $2", [myId, targetId]);
    if (check.rows.length > 0) {
        await pool.query("DELETE FROM follows WHERE follower_id = $1 AND following_id = $2", [myId, targetId]);
        await pool.query("UPDATE users SET followers_count = followers_count - 1 WHERE id = $1", [targetId]);
        res.json({ action: 'unfollowed' });
    } else {
        await pool.query("INSERT INTO follows (follower_id, following_id) VALUES ($1, $2)", [myId, targetId]);
        await pool.query("UPDATE users SET followers_count = followers_count + 1 WHERE id = $1", [targetId]);
        res.json({ action: 'followed' });
    }
});

app.get('/api/user/:id', async (req, res) => {
    const user = await pool.query("SELECT * FROM users WHERE id = $1", [req.params.id]);
    res.json(user.rows[0]);
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.listen(PORT, () => console.log(`ECNHACA ONLINE >> PUERTO ${PORT}`));
