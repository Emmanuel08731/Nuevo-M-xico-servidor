/**
 * ECNHACA CORE ENGINE v7.0 - "THE CROSS-SEARCH UPDATE"
 * LÍNEAS: ~160 | Soporte para búsqueda de contenido y usuarios simultánea.
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

const pool = new Pool({
    connectionString: 'postgres://base_datos_global_user:mEDJcu2NtduJqv662gaUvOIuPDh1HFi3@dpg-d6u5u3fkijhs73fhh1hg-a.oregon-postgres.render.com/base_datos_global',
    ssl: { rejectUnauthorized: false }
});

// --- SISTEMA DE BÚSQUEDA HÍBRIDA ---
app.get('/api/search/global', async (req, res) => {
    const { q, myId } = req.query;
    const term = `%${q}%`;
    try {
        // Buscar Usuarios
        const users = await pool.query(
            `SELECT id, username, color, followers_count FROM users 
             WHERE username ILIKE $1 AND id != $2 LIMIT 5`, [term, myId]
        );
        // Buscar Contenido (Posts)
        const posts = await pool.query(
            `SELECT p.*, u.username, u.color FROM posts p 
             JOIN users u ON p.user_id = u.id 
             WHERE p.title ILIKE $1 OR p.category ILIKE $1 OR p.description ILIKE $1 LIMIT 5`, [term]
        );
        res.json({ users: users.rows, posts: posts.rows });
    } catch (e) { res.status(500).send(); }
});

// --- RESTO DE RUTAS (POSTS, AUTH, ETC) ---
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const colors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#ef4444'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        const result = await pool.query(
            "INSERT INTO users (username, email, password, color) VALUES ($1, $2, $3, $4) RETURNING *",
            [username.toLowerCase().trim(), email.toLowerCase().trim(), password, color]
        );
        res.json({ success: true, user: result.rows[0] });
    } catch (e) { res.status(409).json({ error: "Datos ya en uso." }); }
});

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    const result = await pool.query("SELECT * FROM users WHERE username = $1", [username.toLowerCase().trim()]);
    if(result.rows.length === 0 || result.rows[0].password !== password) return res.status(401).json({ error: "Error de acceso." });
    res.json({ success: true, user: result.rows[0] });
});

app.post('/api/posts/create', async (req, res) => {
    const { user_id, title, description, image_url, category } = req.body;
    await pool.query("INSERT INTO posts (user_id, title, description, image_url, category) VALUES ($1, $2, $3, $4, $5)", [user_id, title, description, image_url, category]);
    res.json({ success: true });
});

app.get('/api/posts/feed', async (req, res) => {
    const result = await pool.query("SELECT p.*, u.username, u.color FROM posts p JOIN users u ON p.user_id = u.id ORDER BY p.created_at DESC");
    res.json(result.rows);
});

app.listen(PORT, () => console.log("ECNHACA v7 RUNNING"));
