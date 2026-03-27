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

const initEcnhaca = async () => {
    try {
        // RESET: Aseguramos que las tablas existan con los nuevos campos
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                color TEXT DEFAULT '#6366f1',
                bio TEXT DEFAULT 'Explorando Ecnhaca...',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS follows (
                id SERIAL PRIMARY KEY,
                follower_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                following_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE(follower_id, following_id)
            );
        `);
        console.log("🚀 [ECNHACA] Sistema reseteado y listo.");
    } catch (e) { console.log(e); }
};
initEcnhaca();

// API AUTH
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const colors = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#ef4444'];
        const color = colors[Math.floor(Math.random()*colors.length)];
        const result = await pool.query(
            "INSERT INTO users (username, email, password, color) VALUES ($1, $2, $3, $4) RETURNING *",
            [username.toLowerCase(), email.toLowerCase(), password, color]
        );
        res.json(result.rows[0]);
    } catch (e) { res.status(400).json({error: "Usuario ya existe"}); }
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const result = await pool.query("SELECT * FROM users WHERE username = $1 AND password = $2", [username.toLowerCase(), password]);
    if (result.rows.length > 0) res.json(result.rows[0]);
    else res.status(401).json({error: "Error"});
});

// BUSCADOR (No muestra nada si el query está vacío)
app.get('/api/search', async (req, res) => {
    const { q, myId } = req.query;
    if(!q) return res.json([]);
    const result = await pool.query(`
        SELECT u.id, u.username, u.color, u.bio,
        (SELECT COUNT(*) FROM follows WHERE following_id = u.id) as followers,
        (SELECT COUNT(*) FROM follows WHERE follower_id = ${myId} AND following_id = u.id) as am_following
        FROM users u WHERE u.username ILIKE $1 AND u.id != $2 LIMIT 10`, 
        [`%${q}%`, myId]);
    res.json(result.rows);
});

// SEGUIR
app.post('/api/follow', async (req, res) => {
    const { myId, targetId } = req.body;
    try {
        await pool.query("INSERT INTO follows (follower_id, following_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [myId, targetId]);
        res.json({success: true});
    } catch (e) { res.status(500).send(); }
});

// DATOS DE PERFIL (CONTADORES)
app.get('/api/profile-stats/:id', async (req, res) => {
    const { id } = req.params;
    const followers = await pool.query("SELECT COUNT(*) FROM follows WHERE following_id = $1", [id]);
    const following = await pool.query("SELECT COUNT(*) FROM follows WHERE follower_id = $1", [id]);
    res.json({ followers: followers.rows[0].count, following: following.rows[0].count });
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(10000, () => console.log("Ecnhaca Online"));
