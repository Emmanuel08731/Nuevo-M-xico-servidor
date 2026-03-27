/**
 * ECNHACA CORE SYSTEM - ENTERPRISE WHITE EDITION
 * LICENCIA: PRIVADA / PROFESIONAL
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

// CONFIGURACIÓN DE MIDDLEWARES DE ALTO RENDIMIENTO
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// CONEXIÓN A LA BASE DE DATOS POSTGRESQL (RENDER)
const pool = new Pool({
    connectionString: 'postgres://base_datos_global_user:mEDJcu2NtduJqv662gaUvOIuPDh1HFi3@dpg-d6u5u3fkijhs73fhh1hg-a.oregon-postgres.render.com/base_datos_global',
    ssl: { rejectUnauthorized: false },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// INICIALIZACIÓN DE LA ESTRUCTURA DE TABLAS (DDL)
const initDatabase = async () => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                avatar_color VARCHAR(20) DEFAULT '#007aff',
                bio TEXT DEFAULT 'Miembro de la red Ecnhaca',
                followers_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS posts (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                title VARCHAR(200) NOT NULL,
                content TEXT NOT NULL,
                category VARCHAR(50),
                image_url TEXT,
                likes_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS follows (
                id SERIAL PRIMARY KEY,
                follower_id INTEGER REFERENCES users(id),
                following_id INTEGER REFERENCES users(id),
                UNIQUE(follower_id, following_id)
            );
        `);

        await client.query('COMMIT');
        console.log("[DB] Tablas sincronizadas correctamente.");
    } catch (e) {
        await client.query('ROLLBACK');
        console.error("[DB ERROR] Fallo en la sincronización:", e);
    } finally {
        client.release();
    }
};
initDatabase();

// --- RUTAS DE LA API: AUTENTICACIÓN ---

app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ error: "Faltan campos" });

    try {
        const check = await pool.query("SELECT id FROM users WHERE username = $1 OR email = $2", [username.toLowerCase(), email.toLowerCase()]);
        if (check.rows.length > 0) return res.status(409).json({ error: "Usuario o email ya registrado" });

        const colors = ['#007aff', '#34c759', '#ff9500', '#af52de', '#ff3b30', '#5856d6', '#00c7be', '#ffcc00'];
        const color = colors[Math.floor(Math.random() * colors.length)];

        const result = await pool.query(
            "INSERT INTO users (username, email, password_hash, avatar_color) VALUES ($1, $2, $3, $4) RETURNING id, username, avatar_color",
            [username.toLowerCase().trim(), email.toLowerCase().trim(), password, color]
        );
        res.status(201).json({ success: true, user: result.rows[0] });
    } catch (e) {
        res.status(500).json({ error: "Error en el servidor al registrar" });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await pool.query("SELECT * FROM users WHERE username = $1", [username.toLowerCase().trim()]);
        if (user.rows.length === 0 || user.rows[0].password_hash !== password) {
            return res.status(401).json({ error: "Credenciales inválidas" });
        }
        res.json({ success: true, user: { id: user.rows[0].id, username: user.rows[0].username, color: user.rows[0].avatar_color } });
    } catch (e) {
        res.status(500).json({ error: "Error en el servidor al iniciar sesión" });
    }
});

// --- RUTAS DE LA API: BÚSQUEDA DUAL ---

app.get('/api/search/global', async (req, res) => {
    const { q, myId } = req.query;
    if (!q) return res.json({ users: [], posts: [] });
    const term = `%${q}%`;

    try {
        const users = await pool.query(
            "SELECT id, username, avatar_color FROM users WHERE username ILIKE $1 AND id != $2 LIMIT 10", 
            [term, myId]
        );
        const posts = await pool.query(
            "SELECT p.*, u.username FROM posts p JOIN users u ON p.user_id = u.id WHERE p.title ILIKE $1 OR p.category ILIKE $1 LIMIT 10", 
            [term]
        );
        res.json({ users: users.rows, posts: posts.rows });
    } catch (e) {
        res.status(500).json({ error: "Error en la búsqueda" });
    }
});

// --- RUTAS DE LA API: CONTENIDO Y FEED ---

app.post('/api/posts/create', async (req, res) => {
    const { user_id, title, content, category, image_url } = req.body;
    try {
        await pool.query(
            "INSERT INTO posts (user_id, title, content, category, image_url) VALUES ($1, $2, $3, $4, $5)",
            [user_id, title, content, category, image_url]
        );
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: "Error al crear post" });
    }
});

app.get('/api/posts/feed', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT p.*, u.username, u.avatar_color 
            FROM posts p 
            JOIN users u ON p.user_id = u.id 
            ORDER BY p.created_at DESC 
            LIMIT 50
        `);
        res.json(result.rows);
    } catch (e) {
        res.status(500).json({ error: "Error al cargar feed" });
    }
});

app.get('/api/users/profile/:id', async (req, res) => {
    try {
        const user = await pool.query("SELECT id, username, avatar_color, bio, followers_count FROM users WHERE id = $1", [req.params.id]);
        const posts = await pool.query("SELECT * FROM posts WHERE user_id = $1 ORDER BY created_at DESC", [req.params.id]);
        if (user.rows.length === 0) return res.status(404).json({ error: "No encontrado" });
        res.json({ user: user.rows[0], posts: posts.rows });
    } catch (e) {
        res.status(500).json({ error: "Error al cargar perfil" });
    }
});

app.put('/api/users/update', async (req, res) => {
    const { id, bio } = req.body;
    try {
        await pool.query("UPDATE users SET bio = $1 WHERE id = $2", [bio, id]);
        res.json({ success: true });
    } catch (e) {
        res.status(500).send();
    }
});

app.delete('/api/posts/delete/:id', async (req, res) => {
    try {
        await pool.query("DELETE FROM posts WHERE id = $1", [req.params.id]);
        res.json({ success: true });
    } catch (e) {
        res.status(500).send();
    }
});

app.get('/health', (req, res) => res.status(200).send('OK'));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`
    ================================================
    ECNHACA SERVER STATUS: ONLINE
    PORT: ${PORT}
    DESIGN: WHITE PROFESSIONAL
    ================================================
    `);
});
