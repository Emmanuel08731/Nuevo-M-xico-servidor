/**
 * ==============================================================================
 * ECNHACA TITAN SERVER CORE - V80.0
 * DESARROLLADO POR: EMMANUEL (NODE.JS SPECIALIST)
 * STATUS: FULL CODE - NO OMISSIONS
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

// CONFIGURACIÓN DE MIDDLEWARES PRO
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// CONEXIÓN A LA BASE DE DATOS GLOBAL (RENDER)
const pool = new Pool({
    connectionString: 'postgres://base_datos_global_user:mEDJcu2NtduJqv662gaUvOIuPDh1HFi3@dpg-d6u5u3fkijhs73fhh1hg-a.oregon-postgres.render.com/base_datos_global',
    ssl: { rejectUnauthorized: false },
    max: 100,
    idleTimeoutMillis: 30000,
});

/**
 * PROTOCOLO DE PURGA Y RECONSTRUCCIÓN AUTOMÁTICA
 * CADA VEZ QUE EMMANUEL REINICIA EL SERVIDOR, SE LIMPIA TODO
 */
const initDatabase = async () => {
    const client = await pool.connect();
    try {
        console.log("[SISTEMA] INICIANDO PURGA DE DATOS EN RENDER...");
        await client.query('BEGIN');
        
        await client.query('DROP TABLE IF EXISTS followers CASCADE');
        await client.query('DROP TABLE IF EXISTS posts CASCADE');
        await client.query('DROP TABLE IF EXISTS users CASCADE');
        
        // CREACIÓN DE USUARIOS
        await client.query(`
            CREATE TABLE users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                avatar_color VARCHAR(20) DEFAULT '#007aff',
                bio TEXT DEFAULT 'Developer en Ecnhaca Platform',
                followers_count INTEGER DEFAULT 0,
                following_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // CREACIÓN DE POSTS
        await client.query(`
            CREATE TABLE posts (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                category VARCHAR(50) NOT NULL,
                media_url TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // CREACIÓN DE SEGUIDORES
        await client.query(`
            CREATE TABLE followers (
                follower_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                following_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                PRIMARY KEY (follower_id, following_id)
            );
        `);

        await client.query('COMMIT');
        console.log("[SISTEMA] BASE DE DATOS REESTABLECIDA Y LISTA.");
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("[ERROR] Fallo al purgar base de datos:", err);
    } finally {
        client.release();
    }
};

initDatabase();

/**
 * RUTAS DE AUTENTICACIÓN ELITE
 */

app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const u = username.toLowerCase().trim();
        const colors = ['#FF3B30', '#34C759', '#007AFF', '#AF52DE', '#FF9500', '#5856D6', '#00C7BE', '#FF2D55'];
        const c = colors[Math.floor(Math.random() * colors.length)];
        const result = await pool.query(
            "INSERT INTO users (username, email, password_hash, avatar_color) VALUES ($1, $2, $3, $4) RETURNING id, username, avatar_color",
            [u, email.toLowerCase(), password, c]
        );
        res.json({ success: true, user: result.rows[0] });
    } catch (e) {
        res.status(400).json({ success: false, error: "El usuario ya existe o datos inválidos." });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const u = username.toLowerCase().trim();
        const user = await pool.query("SELECT * FROM users WHERE username = $1 OR email = $1", [u]);
        
        if (user.rows.length === 0) {
            return res.status(404).json({ success: false, type: 'NOT_FOUND', error: "La cuenta no existe en el sistema." });
        }
        
        if (user.rows[0].password_hash !== password) {
            return res.status(401).json({ success: false, type: 'WRONG_PASS', error: "La contraseña es incorrecta." });
        }
        
        res.json({ success: true, user: { id: user.rows[0].id, username: user.rows[0].username, color: user.rows[0].avatar_color } });
    } catch (e) {
        res.status(500).json({ success: false, error: "Error interno del servidor." });
    }
});

/**
 * MOTOR DE BÚSQUEDA PROFUNDA
 */
app.get('/api/search/deep', async (req, res) => {
    const { q, type } = req.query;
    const term = `%${q}%`;
    try {
        if (type === 'users') {
            const data = await pool.query("SELECT id, username, avatar_color, bio, followers_count FROM users WHERE username ILIKE $1 LIMIT 50", [term]);
            res.json(data.rows);
        } else {
            const data = await pool.query("SELECT p.*, u.username, u.avatar_color FROM posts p JOIN users u ON p.user_id = u.id WHERE p.title ILIKE $1 OR p.content ILIKE $1 LIMIT 50", [term]);
            res.json(data.rows);
        }
    } catch (e) {
        res.status(500).json({ error: "Error en la búsqueda dinámica." });
    }
});

/**
 * GESTIÓN DE CONTENIDO
 */
app.post('/api/posts/create', async (req, res) => {
    const { user_id, title, content, category, media } = req.body;
    try {
        await pool.query("INSERT INTO posts (user_id, title, content, category, media_url) VALUES ($1, $2, $3, $4, $5)", [user_id, title, content, category, media]);
        res.json({ success: true });
    } catch (e) {
        res.status(500).send();
    }
});

app.get('/api/posts/feed', async (req, res) => {
    const data = await pool.query(`
        SELECT p.*, u.username, u.avatar_color 
        FROM posts p 
        JOIN users u ON p.user_id = u.id 
        ORDER BY p.created_at DESC 
        LIMIT 100
    `);
    res.json(data.rows);
});

app.get('/api/users/profile/:id', async (req, res) => {
    try {
        const user = await pool.query("SELECT * FROM users WHERE id = $1", [req.params.id]);
        const posts = await pool.query("SELECT * FROM posts WHERE user_id = $1 ORDER BY created_at DESC", [req.params.id]);
        res.json({ user: user.rows[0], posts: posts.rows });
    } catch (e) {
        res.status(404).send();
    }
});

// LOGS DE OPERACIONES
app.use((req, res, next) => {
    console.log(`[ECNHACA LOG] ${new Date().toISOString()} | ${req.method} | ${req.url}`);
    next();
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`\n>>> ECNHACA TITAN v80.0 ACTIVADO EN PUERTO ${PORT}`);
    console.log(`>>> MODO: EMMANUEL (DESARROLLO COMPLETO)\n`);
});
