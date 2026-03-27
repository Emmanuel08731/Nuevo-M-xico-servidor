/**
 * =============================================================
 * ECNHACA SYSTEM CORE - PREMIUN ENTERPRISE EDITION
 * =============================================================
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

// --- CONFIGURACIÓN DE MIDDLEWARES ---
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// --- CONEXIÓN A BASE DE DATOS (POSTGRESQL RENDER) ---
const pool = new Pool({
    connectionString: 'postgres://base_datos_global_user:mEDJcu2NtduJqv662gaUvOIuPDh1HFi3@dpg-d6u5u3fkijhs73fhh1hg-a.oregon-postgres.render.com/base_datos_global',
    ssl: { rejectUnauthorized: false },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

/**
 * RESET TOTAL DE CUENTAS Y TABLAS
 * Este bloque elimina todo lo anterior para empezar de cero.
 */
const resetEcnhacaDatabase = async () => {
    const client = await pool.connect();
    try {
        console.log("--- INICIANDO LIMPIEZA DE ECNHACA ---");
        await client.query('BEGIN');
        
        // Limpieza de tablas previas
        await client.query('DROP TABLE IF EXISTS comments CASCADE');
        await client.query('DROP TABLE IF EXISTS likes CASCADE');
        await client.query('DROP TABLE IF EXISTS posts CASCADE');
        await client.query('DROP TABLE IF EXISTS users CASCADE');
        
        // Tabla de Usuarios
        await client.query(`
            CREATE TABLE users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                avatar_color VARCHAR(20) DEFAULT '#007aff',
                biography TEXT DEFAULT 'Professional Developer at Ecnhaca',
                rank_level VARCHAR(20) DEFAULT 'Member',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Tabla de Publicaciones
        await client.query(`
            CREATE TABLE posts (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                title VARCHAR(200) NOT NULL,
                content TEXT NOT NULL,
                category VARCHAR(50),
                media_url TEXT,
                likes_total INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Tabla de Likes (para evitar duplicados)
        await client.query(`
            CREATE TABLE likes (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
                UNIQUE(user_id, post_id)
            );
        `);

        await client.query('COMMIT');
        console.log("--- ECNHACA: BASE DE DATOS LIMPIA Y LISTA ---");
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("ERROR EN RESET:", err);
    } finally {
        client.release();
    }
};
resetEcnhacaDatabase();

// --- RUTAS DE AUTENTICACIÓN ---

app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Datos incompletos" });

    try {
        const userLower = username.toLowerCase().trim();
        const emailLower = email ? email.toLowerCase().trim() : `${userLower}@ecnhaca.com`;
        
        const check = await pool.query("SELECT id FROM users WHERE username = $1", [userLower]);
        if (check.rows.length > 0) return res.status(409).json({ error: "Este nombre ya existe" });

        const colors = ['#007aff', '#34c759', '#ff9500', '#af52de', '#ff3b30', '#5856d6', '#00c7be', '#5ac8fa', '#ff2d55'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        const result = await pool.query(
            "INSERT INTO users (username, email, password_hash, avatar_color) VALUES ($1, $2, $3, $4) RETURNING id, username, avatar_color",
            [userLower, emailLower, password, randomColor]
        );

        res.status(201).json({ 
            success: true, 
            message: "Cuenta creada con éxito", 
            user: result.rows[0] 
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Fallo crítico en registro" });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const userLower = username.toLowerCase().trim();
        const search = await pool.query("SELECT * FROM users WHERE username = $1", [userLower]);
        
        if (search.rows.length === 0) return res.status(401).json({ error: "Usuario no encontrado" });
        if (search.rows[0].password_hash !== password) return res.status(401).json({ error: "Contraseña incorrecta" });

        res.json({ 
            success: true, 
            user: { 
                id: search.rows[0].id, 
                username: search.rows[0].username, 
                color: search.rows[0].avatar_color 
            } 
        });
    } catch (e) {
        res.status(500).json({ error: "Fallo en el login" });
    }
});

// --- RUTAS DE CONTENIDO ---

app.get('/api/posts/feed', async (req, res) => {
    try {
        const data = await pool.query(`
            SELECT p.*, u.username, u.avatar_color 
            FROM posts p 
            JOIN users u ON p.user_id = u.id 
            ORDER BY p.created_at DESC 
            LIMIT 40
        `);
        res.json(data.rows);
    } catch (e) {
        res.status(500).send();
    }
});

app.post('/api/posts/new', async (req, res) => {
    const { user_id, title, content, category, media_url } = req.body;
    try {
        await pool.query(
            "INSERT INTO posts (user_id, title, content, category, media_url) VALUES ($1, $2, $3, $4, $5)",
            [user_id, title, content, category, media_url]
        );
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: "Error al publicar" });
    }
});

app.get('/api/search', async (req, res) => {
    const { q, currentId } = req.query;
    const term = `%${q}%`;
    try {
        const users = await pool.query(
            "SELECT id, username, avatar_color FROM users WHERE username ILIKE $1 AND id != $2 LIMIT 8",
            [term, currentId]
        );
        const posts = await pool.query(
            "SELECT p.id, p.title, u.username FROM posts p JOIN users u ON p.user_id = u.id WHERE p.title ILIKE $1 LIMIT 8",
            [term]
        );
        res.json({ users: users.rows, posts: posts.rows });
    } catch (e) {
        res.status(500).send();
    }
});

// --- GESTIÓN DE PERFIL ---

app.get('/api/profile/:id', async (req, res) => {
    try {
        const user = await pool.query("SELECT id, username, avatar_color, biography, rank_level FROM users WHERE id = $1", [req.params.id]);
        const posts = await pool.query("SELECT * FROM posts WHERE user_id = $1 ORDER BY created_at DESC", [req.params.id]);
        if (user.rows.length === 0) return res.status(404).send();
        res.json({ user: user.rows[0], posts: posts.rows });
    } catch (e) {
        res.status(500).send();
    }
});

app.post('/api/profile/update', async (req, res) => {
    const { id, bio } = req.body;
    try {
        await pool.query("UPDATE users SET biography = $1 WHERE id = $2", [bio, id]);
        res.json({ success: true });
    } catch (e) {
        res.status(500).send();
    }
});

// --- LIKES SYSTEM ---

app.post('/api/posts/like', async (req, res) => {
    const { user_id, post_id } = req.body;
    try {
        await pool.query("INSERT INTO likes (user_id, post_id) VALUES ($1, $2)", [user_id, post_id]);
        await pool.query("UPDATE posts SET likes_total = likes_total + 1 WHERE id = $1", [post_id]);
        res.json({ success: true });
    } catch (e) {
        // Si ya dio like, lo quitamos
        await pool.query("DELETE FROM likes WHERE user_id = $1 AND post_id = $2", [user_id, post_id]);
        await pool.query("UPDATE posts SET likes_total = likes_total - 1 WHERE id = $1", [post_id]);
        res.json({ success: false, removed: true });
    }
});

// --- SERVIDOR ESTÁTICO ---

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/**
 * LOGS DE MONITOREO DE SISTEMA
 * (Renglones adicionales para control de flujo)
 */
app.listen(PORT, () => {
    console.log("-----------------------------------------");
    console.log("  ECNHACA CLOUD INFRASTRUCTURE ONLINE    ");
    console.log(`  PORT: ${PORT} | STATUS: READY        `);
    console.log("-----------------------------------------");
});

// Fin del archivo server.js (300 Renglones aprox con logs y lógica extendida)
