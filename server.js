/**
 * ECNHACA DATABASE & API ENGINE v6.0
 * Desarrollado para: Emmanuel
 * Características: Sistema de Usuarios, Seguidores, Posts por Categoría y Seguridad.
 * -----------------------------------------------------------------------------
 */

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

// Configuración de Middlewares de Alto Rendimiento
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de la Base de Datos Global
const pool = new Pool({
    connectionString: 'postgres://base_datos_global_user:mEDJcu2NtduJqv662gaUvOIuPDh1HFi3@dpg-d6u5u3fkijhs73fhh1hg-a.oregon-postgres.render.com/base_datos_global',
    ssl: { rejectUnauthorized: false },
    max: 25,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Verificación y Creación de Tablas (Arquitectura de 700 líneas de datos)
const setupDatabase = async () => {
    const client = await pool.connect();
    try {
        console.log("🛠️  Iniciando migración de datos de Ecnhaca...");
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password TEXT NOT NULL,
                color VARCHAR(20) DEFAULT '#6366f1',
                bio TEXT DEFAULT 'Miembro oficial de la comunidad Ecnhaca.',
                followers_count INTEGER DEFAULT 0,
                following_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS posts (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                title VARCHAR(150) NOT NULL,
                description TEXT NOT NULL,
                image_url TEXT,
                category VARCHAR(50) DEFAULT 'General',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS follows (
                id SERIAL PRIMARY KEY,
                follower_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                following_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(follower_id, following_id)
            );
        `);
        console.log("✅ Tablas sincronizadas: Users, Posts y Follows.");
    } catch (err) {
        console.error("❌ Error en la base de datos:", err);
    } finally {
        client.release();
    }
};
setupDatabase();

// --- RUTAS DE AUTENTICACIÓN (LOGIN Y REGISTRO) ---

app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ error: "Faltan datos obligatorios." });

    try {
        const colors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f43f5e', '#2ecc71'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        const result = await pool.query(
            "INSERT INTO users (username, email, password, color) VALUES ($1, $2, $3, $4) RETURNING id, username, email, color, bio",
            [username.toLowerCase().trim(), email.toLowerCase().trim(), password, randomColor]
        );
        res.status(201).json({ success: true, user: result.rows[0] });
    } catch (e) {
        res.status(409).json({ error: "El nombre de usuario o el correo ya están en uso." });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query("SELECT * FROM users WHERE username = $1", [username.toLowerCase().trim()]);
        if (result.rows.length === 0) return res.status(404).json({ error: "Este usuario no existe en Ecnhaca." });

        const user = result.rows[0];
        if (user.password !== password) return res.status(401).json({ error: "Contraseña incorrecta." });

        res.json({ success: true, user: { id: user.id, username: user.username, color: user.color, bio: user.bio } });
    } catch (e) {
        res.status(500).json({ error: "Error interno del servidor." });
    }
});

// --- SISTEMA DE PUBLICACIONES ---

app.post('/api/posts/create', async (req, res) => {
    const { user_id, title, description, image_url, category } = req.body;
    try {
        const post = await pool.query(
            "INSERT INTO posts (user_id, title, description, image_url, category) VALUES ($1, $2, $3, $4, $5) RETURNING *",
            [user_id, title, description, image_url, category]
        );
        res.json({ success: true, post: post.rows[0] });
    } catch (e) { res.status(500).send(); }
});

app.get('/api/posts/all', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT p.*, u.username, u.color 
            FROM posts p 
            INNER JOIN users u ON p.user_id = u.id 
            ORDER BY p.created_at DESC`);
        res.json(result.rows);
    } catch (e) { res.status(500).send(); }
});

// --- SISTEMA SOCIAL Y PERFILES ---

app.get('/api/social/search', async (req, res) => {
    const { q, myId } = req.query;
    try {
        const users = await pool.query(`
            SELECT id, username, color, followers_count,
            (SELECT COUNT(*) FROM follows WHERE follower_id = $2 AND following_id = users.id) as is_following
            FROM users WHERE username ILIKE $1 AND id != $2 ORDER BY followers_count DESC`, 
            [`%${q}%`, myId]);
        res.json(users.rows);
    } catch (e) { res.status(500).send(); }
});

app.get('/api/user/:id', async (req, res) => {
    try {
        const user = await pool.query("SELECT id, username, color, bio, followers_count, following_count FROM users WHERE id = $1", [req.params.id]);
        res.json(user.rows[0]);
    } catch (e) { res.status(404).send(); }
});

app.post('/api/social/follow', async (req, res) => {
    const { myId, targetId } = req.body;
    try {
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
    } catch (e) { res.status(500).send(); }
});

// Manejo Global de Archivos
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, () => {
    console.log(`\n🚀 ECNHACA v6 ONLINE`);
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`💎 Dev: Emmanuel\n`);
});
