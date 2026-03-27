/** * EMMANUEL SOCIAL ENGINE - BACKEND CORE 
 * Sistema de Red Social con PostgreSQL
 */
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// CONFIGURACIÓN DE CONEXIÓN A RENDER
const pool = new Pool({
    host: 'dpg-d6u5u3fkijhs73fhh1hg-a.oregon-postgres.render.com',
    user: 'base_datos_global_user',
    password: 'mEDJcu2NtduJqv662gaUvOIuPDh1HFi3',
    database: 'base_datos_global',
    port: 5432,
    ssl: { rejectUnauthorized: false }
});

// INICIALIZACIÓN DE TABLAS (REGISTRO, FOLLOWS, PERFILES)
const initDatabase = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                color TEXT DEFAULT '#fe2c55',
                bio TEXT DEFAULT '¡Hola! Soy nuevo en Emmanuel Store.',
                followers_count INTEGER DEFAULT 0,
                is_verified BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        await pool.query(`
            CREATE TABLE IF NOT EXISTS follows (
                id SERIAL PRIMARY KEY,
                follower_id INTEGER REFERENCES users(id),
                following_id INTEGER REFERENCES users(id),
                UNIQUE(follower_id, following_id)
            );
        `);
        console.log("✅ [DATABASE] Emmanuel, Postgres está conectado y tablas listas.");
    } catch (err) {
        console.error("❌ [DB ERROR]:", err.message);
    }
};
initDatabase();

// --- RUTAS DE AUTENTICACIÓN ---

// REGISTRO
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const colors = ['#fe2c55', '#25f4ee', '#ff0050', '#00f2ea', '#000000'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        
        const result = await pool.query(
            "INSERT INTO users (username, email, password, color) VALUES ($1, $2, $3, $4) RETURNING id, username, email, color, bio",
            [username.toLowerCase(), email.toLowerCase(), password, randomColor]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') return res.status(400).json({ error: "El usuario o email ya existe." });
        res.status(500).json({ error: "Error en el servidor al registrar." });
    }
});

// LOGIN
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query(
            "SELECT id, username, email, color, bio, followers_count FROM users WHERE username = $1 AND password = $2",
            [username.toLowerCase(), password]
        );
        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(401).json({ error: "Usuario o contraseña incorrectos." });
        }
    } catch (err) {
        res.status(500).json({ error: "Error en el inicio de sesión." });
    }
});

// --- RUTAS SOCIALES ---

// BUSCADOR (TIKTOK STYLE)
app.get('/api/social/search', async (req, res) => {
    const { q } = req.query;
    try {
        const result = await pool.query(
            "SELECT id, username, color, bio, followers_count, is_verified FROM users WHERE username ILIKE $1 LIMIT 10",
            [`%${q}%`]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: "Error en la búsqueda." });
    }
});

// SEGUIR USUARIO
app.post('/api/social/follow', async (req, res) => {
    const { follower_id, following_id } = req.body;
    if (follower_id == following_id) return res.status(400).json({ error: "No puedes seguirte a ti mismo." });
    
    try {
        await pool.query("INSERT INTO follows (follower_id, following_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [follower_id, following_id]);
        await pool.query("UPDATE users SET followers_count = followers_count + 1 WHERE id = $1", [following_id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Error al seguir." });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Emmanuel Store Online: Puerto ${PORT}`));
