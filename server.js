/**
 * ECNHACA BACKEND CORE v4.1 - Emmanuel Store Oficial
 * ARCHIVO: server.js | Ajustado para evitar error de módulos
 */

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

// Middlewares estándar (Sin Helmet para evitar el error MODULE_NOT_FOUND)
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Pool de Conexión a Render (Postgres) - Emmanuel Database
const pool = new Pool({
    connectionString: 'postgres://base_datos_global_user:mEDJcu2NtduJqv662gaUvOIuPDh1HFi3@dpg-d6u5u3fkijhs73fhh1hg-a.oregon-postgres.render.com/base_datos_global',
    ssl: { rejectUnauthorized: false }
});

// Verificación de Conexión
pool.connect((err, client, release) => {
    if (err) return console.error('❌ Error de conexión a DB:', err.stack);
    console.log('✅ Conexión exitosa a la Base de Datos de Emmanuel');
    release();
});

// Inicialización de Tablas
const initSchema = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password TEXT NOT NULL,
                color VARCHAR(20) DEFAULT '#6366f1',
                bio TEXT DEFAULT 'Nuevo en Ecnhaca. ¡Hola a todos!',
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
        console.log("🚀 Tablas de Ecnhaca listas para operar.");
    } catch (e) { console.error("Error en tablas:", e); }
};
initSchema();

// --- API ROUTES ---

app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const colors = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];
        const userColor = colors[Math.floor(Math.random() * colors.length)];
        const result = await pool.query(
            "INSERT INTO users (username, email, password, color) VALUES ($1, $2, $3, $4) RETURNING *",
            [username.toLowerCase().trim(), email.toLowerCase().trim(), password, userColor]
        );
        res.status(201).json({ success: true, user: result.rows[0] });
    } catch (e) { res.status(409).json({ error: "El usuario o email ya existe." }); }
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query("SELECT * FROM users WHERE username = $1", [username.toLowerCase().trim()]);
        if(result.rows.length === 0) return res.status(404).json({ error: "La cuenta no existe." });
        const user = result.rows[0];
        if(user.password !== password) return res.status(401).json({ error: "Contraseña incorrecta." });
        res.json({ success: true, user: user });
    } catch (e) { res.status(500).json({ error: "Error en el servidor." }); }
});

app.get('/api/search', async (req, res) => {
    const { q, myId } = req.query;
    try {
        const result = await pool.query(`
            SELECT id, username, color, followers_count,
            (SELECT COUNT(*) FROM follows WHERE follower_id = $2 AND following_id = users.id) as is_following
            FROM users WHERE username ILIKE $1 AND id != $2 LIMIT 30`, 
            [`%${q}%`, myId]);
        res.json(result.rows);
    } catch (e) { res.status(500).send(); }
});

app.post('/api/follow-toggle', async (req, res) => {
    const { myId, targetId } = req.body;
    try {
        const check = await pool.query("SELECT id FROM follows WHERE follower_id = $1 AND following_id = $2", [myId, targetId]);
        if (check.rows.length > 0) {
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

app.get('/api/user/:id', async (req, res) => {
    const resUser = await pool.query("SELECT * FROM users WHERE id = $1", [req.params.id]);
    res.json(resUser.rows[0]);
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, () => {
    console.log(`-----------------------------------------`);
    console.log(`🚀 ECNHACA ONLINE EN PUERTO: ${PORT}`);
    console.log(`-----------------------------------------`);
});
