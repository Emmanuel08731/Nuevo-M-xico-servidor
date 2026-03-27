/**
 * ==============================================================================
 * ECNHACA CORE ENGINE - ARQUITECTURA EMMANUEL v70.0
 * STATUS: TITAN MODE ACTIVE | SECURITY: LEVEL 7
 * ==============================================================================
 */

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

// MIDDLEWARES DE ALTA DISPONIBILIDAD Y SEGURIDAD
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// CONEXIÓN POSTGRESQL (OPTIMIZADA PARA RENDER)
const pool = new Pool({
    connectionString: 'postgres://base_datos_global_user:mEDJcu2NtduJqv662gaUvOIuPDh1HFi3@dpg-d6u5u3fkijhs73fhh1hg-a.oregon-postgres.render.com/base_datos_global',
    ssl: { rejectUnauthorized: false },
    max: 150,
    idleTimeoutMillis: 60000,
    connectionTimeoutMillis: 5000,
});

/**
 * PROTOCOLO DE REINICIO TOTAL (OMNI-REBIRTH)
 * Limpia la base de datos cada vez que Emmanuel despliega en Render.
 */
const systemRebirth = async () => {
    const client = await pool.connect();
    try {
        console.log("--------------------------------------------------");
        console.log("[CRITICAL] EJECUTANDO LIMPIEZA DE DATOS ECNHACA...");
        await client.query('BEGIN');
        await client.query('DROP TABLE IF EXISTS followers CASCADE');
        await client.query('DROP TABLE IF EXISTS posts CASCADE');
        await client.query('DROP TABLE IF EXISTS users CASCADE');
        
        // TABLA DE USUARIOS PROFESIONALES
        await client.query(`
            CREATE TABLE users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(60) UNIQUE NOT NULL,
                email VARCHAR(150) UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                avatar_color VARCHAR(30) DEFAULT '#007aff',
                bio TEXT DEFAULT 'Programador Senior en Ecnhaca Platform',
                followers_count INTEGER DEFAULT 0,
                following_count INTEGER DEFAULT 0,
                is_premium BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // TABLA DE PUBLICACIONES ELITE
        await client.query(`
            CREATE TABLE posts (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                category VARCHAR(100) NOT NULL,
                media_url TEXT,
                likes INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // TABLA DE RELACIONES SOCIALES
        await client.query(`
            CREATE TABLE followers (
                follower_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                following_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                PRIMARY KEY (follower_id, following_id)
            );
        `);

        await client.query('COMMIT');
        console.log("[SYSTEM] ECNHACA REESTABLECIDO CORRECTAMENTE.");
        console.log("--------------------------------------------------");
    } catch (e) {
        await client.query('ROLLBACK');
        console.error("[ERROR DATABASE]", e);
    } finally { 
        client.release(); 
    }
};

// EJECUTAR PURGA AUTOMÁTICA
systemRebirth();

/**
 * RUTAS DE API: AUTENTICACIÓN Y SEGURIDAD
 */
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ success: false, error: "Campos incompletos" });
    try {
        const u = username.toLowerCase().trim();
        const colors = ['#FF3B30', '#34C759', '#007AFF', '#AF52DE', '#FF9500', '#5856D6', '#00C7BE', '#FF2D55'];
        const c = colors[Math.floor(Math.random() * colors.length)];
        const result = await pool.query(
            "INSERT INTO users (username, email, password_hash, avatar_color) VALUES ($1, $2, $3, $4) RETURNING id, username, avatar_color",
            [u, email.toLowerCase(), password, c]
        );
        res.json({ success: true, user: result.rows[0] });
    } catch (err) { res.status(409).json({ success: false, error: "El usuario ya existe" }); }
});

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const u = username.toLowerCase().trim();
        const res_user = await pool.query("SELECT * FROM users WHERE username = $1 OR email = $1", [u]);
        if (res_user.rows.length === 0) {
            return res.status(404).json({ success: false, type: 'NOT_FOUND', error: "Usuario no registrado" });
        }
        if (res_user.rows[0].password_hash !== password) {
            return res.status(401).json({ success: false, type: 'WRONG_PASS', error: "Contraseña incorrecta" });
        }
        res.json({ success: true, user: { id: res_user.rows[0].id, username: res_user.rows[0].username, color: res_user.rows[0].avatar_color } });
    } catch (err) { res.status(500).json({ success: false }); }
});

/**
 * MOTOR DE BÚSQUEDA AVANZADO
 */
app.get('/api/search/deep', async (req, res) => {
    const { q, type } = req.query;
    const term = `%${q}%`;
    try {
        if (type === 'users') {
            const data = await pool.query("SELECT id, username, avatar_color, bio, followers_count FROM users WHERE username ILIKE $1 LIMIT 30", [term]);
            res.json(data.rows);
        } else {
            const data = await pool.query("SELECT p.*, u.username FROM posts p JOIN users u ON p.user_id = u.id WHERE p.title ILIKE $1 OR p.content ILIKE $1 LIMIT 30", [term]);
            res.json(data.rows);
        }
    } catch (e) { res.status(500).send(); }
});

// GESTIÓN DE POSTS
app.post('/api/posts/create', async (req, res) => {
    const { user_id, title, content, category, media } = req.body;
    try {
        await pool.query("INSERT INTO posts (user_id, title, content, category, media_url) VALUES ($1, $2, $3, $4, $5)", [user_id, title, content, category, media]);
        res.json({ success: true });
    } catch (e) { res.status(500).send(); }
});

app.get('/api/posts/feed', async (req, res) => {
    const data = await pool.query("SELECT p.*, u.username, u.avatar_color FROM posts p JOIN users u ON p.user_id = u.id ORDER BY p.created_at DESC LIMIT 50");
    res.json(data.rows);
});

// LOGS DE ACTIVIDAD
app.use((req, res, next) => {
    console.log(`[LOG] ${new Date().toLocaleTimeString()} - ${req.method} ${req.url}`);
    next();
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, () => {
    console.log("==================================================");
    console.log(` ECNHACA TITAN ENGINE RUNNING ON: ${PORT}`);
    console.log("==================================================");
});
