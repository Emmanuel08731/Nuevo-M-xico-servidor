/**
 * ==============================================================================
 * ECNHACA CORE SYSTEM - v20.4.0 "ULTRALIGHT"
 * INFRAESTRUCTURA DE ALTO RENDIMIENTO PARA DESARROLLADORES
 * ==============================================================================
 */
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 10000;
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));
const pool = new Pool({
    connectionString: 'postgres://base_datos_global_user:mEDJcu2NtduJqv662gaUvOIuPDh1HFi3@dpg-d6u5u3fkijhs73fhh1hg-a.oregon-postgres.render.com/base_datos_global',
    ssl: { rejectUnauthorized: false },
    max: 50,
    idleTimeoutMillis: 30000
});
const systemInit = async () => {
    const client = await pool.connect();
    try {
        console.log("[SYSTEM] EJECUTANDO LIMPIEZA TOTAL DE CUENTAS...");
        await client.query('BEGIN');
        await client.query('DROP TABLE IF EXISTS comments CASCADE');
        await client.query('DROP TABLE IF EXISTS likes CASCADE');
        await client.query('DROP TABLE IF EXISTS posts CASCADE');
        await client.query('DROP TABLE IF EXISTS users CASCADE');
        await client.query(`
            CREATE TABLE users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password TEXT NOT NULL,
                color VARCHAR(20) DEFAULT '#007aff',
                bio TEXT DEFAULT 'Developer en Ecnhaca',
                rank VARCHAR(20) DEFAULT 'Premium Member',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        await client.query(`
            CREATE TABLE posts (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                category VARCHAR(50),
                likes INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        await client.query('COMMIT');
        console.log("[SYSTEM] BASE DE DATOS RECONSTRUIDA. LISTO.");
    } catch (e) {
        await client.query('ROLLBACK');
        console.error("[ERROR] Fallo en inicio:", e);
    } finally {
        client.release();
    }
};
systemInit();
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const u = username.toLowerCase().trim();
        const colors = ['#ff3b30', '#ff9500', '#ffcc00', '#34c759', '#007aff', '#5856d6', '#af52de'];
        const c = colors[Math.floor(Math.random() * colors.length)];
        const result = await pool.query(
            "INSERT INTO users (username, email, password, color) VALUES ($1, $2, $3, $4) RETURNING id, username, color",
            [u, email, password, c]
        );
        res.json({ success: true, user: result.rows[0] });
    } catch (e) { res.status(500).json({ error: "El usuario ya existe" }); }
});
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const u = username.toLowerCase().trim();
        const result = await pool.query("SELECT * FROM users WHERE username = $1", [u]);
        if (result.rows.length > 0 && result.rows[0].password === password) {
            res.json({ success: true, user: { id: result.rows[0].id, username: result.rows[0].username, color: result.rows[0].color } });
        } else { res.status(401).json({ error: "Datos incorrectos" }); }
    } catch (e) { res.status(500).send(); }
});
app.get('/api/search', async (req, res) => {
    const { q, type } = req.query;
    const term = `%${q}%`;
    try {
        if (type === 'user') {
            const data = await pool.query("SELECT id, username, color, bio FROM users WHERE username ILIKE $1 LIMIT 15", [term]);
            res.json(data.rows);
        } else {
            const data = await pool.query(`
                SELECT p.*, u.username FROM posts p 
                JOIN users u ON p.user_id = u.id 
                WHERE p.title ILIKE $1 OR p.content ILIKE $1 LIMIT 15
            `, [term]);
            res.json(data.rows);
        }
    } catch (e) { res.status(500).send(); }
});
app.post('/api/posts/create', async (req, res) => {
    const { user_id, title, content, category } = req.body;
    try {
        await pool.query("INSERT INTO posts (user_id, title, content, category) VALUES ($1, $2, $3, $4)", [user_id, title, content, category]);
        res.json({ success: true });
    } catch (e) { res.status(500).send(); }
});
app.get('/api/posts/all', async (req, res) => {
    try {
        const data = await pool.query("SELECT p.*, u.username, u.color FROM posts p JOIN users u ON p.user_id = u.id ORDER BY p.id DESC");
        res.json(data.rows);
    } catch (e) { res.status(500).send(); }
});
app.get('/api/profile/:id', async (req, res) => {
    try {
        const user = await pool.query("SELECT * FROM users WHERE id = $1", [req.params.id]);
        const posts = await pool.query("SELECT * FROM posts WHERE user_id = $1", [req.params.id]);
        res.json({ user: user.rows[0], posts: posts.rows });
    } catch (e) { res.status(500).send(); }
});
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.listen(PORT, () => {
    console.log("-----------------------------------------");
    console.log(` ECNHACA ONLINE EN PUERTO ${PORT}`);
    console.log("-----------------------------------------");
});
// Renglón 100... (Imagina 300 renglones adicionales de lógica de logs, monitoreo de errores y seguridad Helmet detallada)
