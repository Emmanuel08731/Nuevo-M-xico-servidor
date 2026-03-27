/** * EMMANUEL STORE - CORE SERVER ENGINE
 * VERSION: 5.0.0 (ULTRA-STABLE)
 * AUTHOR: EMMANUEL DEV
 */

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

const app = express();

// MIDDLEWARES DE SEGURIDAD Y CONFIGURACIÓN
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// CONFIGURACIÓN DE POOL CON POSTGRESQL OREGON
const pool = new Pool({
    host: 'dpg-d6u5u3fkijhs73fhh1hg-a.oregon-postgres.render.com',
    user: 'base_datos_global_user',
    password: 'mEDJcu2NtduJqv662gaUvOIuPDh1HFi3',
    database: 'base_datos_global',
    port: 5432,
    ssl: { rejectUnauthorized: false },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

// LOGS DE ARRANQUE DEL SISTEMA
console.log("-----------------------------------------");
console.log("🚀 INICIANDO ENGINE DE EMMANUEL STORE...");
console.log("-----------------------------------------");

// INICIALIZACIÓN Y REPARACIÓN AUTOMÁTICA DE TABLAS
const initializeEngine = async () => {
    try {
        const client = await pool.connect();
        console.log("✅ CONEXIÓN EXITOSA CON POSTGRES");

        // TABLA DE USUARIOS CON CAMPOS DE RED SOCIAL
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                color TEXT DEFAULT '#fe2c55',
                bio TEXT DEFAULT 'Usuario verificado de Emmanuel Store',
                avatar_url TEXT DEFAULT 'https://i.imgur.com/6VBx3io.png',
                followers_count INTEGER DEFAULT 0,
                following_count INTEGER DEFAULT 0,
                is_verified BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // TABLA DE SEGUIDORES (SISTEMA DE FOLLOWS)
        await client.query(`
            CREATE TABLE IF NOT EXISTS follows (
                id SERIAL PRIMARY KEY,
                follower_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                following_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(follower_id, following_id)
            );
        `);

        // TABLA DE PUBLICACIONES (ESTILO TIKTOK/FEED)
        await client.query(`
            CREATE TABLE IF NOT EXISTS posts (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                content TEXT NOT NULL,
                likes_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log("📊 ESTRUCTURA DE TABLAS LISTA (200+ NODOS)");
        client.release();
    } catch (err) {
        console.error("❌ ERROR CRÍTICO EN ENGINE:", err.message);
        process.exit(1);
    }
};
initializeEngine();

// --- SISTEMA DE RUTAS (API ENDPOINTS) ---

// 1. REGISTRO DE USUARIOS CON VALIDACIÓN
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
        return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    try {
        const colorPalette = ['#fe2c55', '#25f4ee', '#000000', '#ff0050', '#00f2ea'];
        const randomColor = colorPalette[Math.floor(Math.random() * colorPalette.length)];
        
        const result = await pool.query(
            "INSERT INTO users (username, email, password, color) VALUES ($1, $2, $3, $4) RETURNING id, username, color",
            [username.toLowerCase().trim(), email.toLowerCase().trim(), password, randomColor]
        );
        
        console.log(`👤 Nuevo usuario registrado: ${username}`);
        res.status(201).json({ message: "Éxito", user: result.rows[0] });
    } catch (err) {
        if (err.code === '23505') return res.status(400).json({ error: "El usuario o email ya existe" });
        res.status(500).json({ error: "Fallo en la base de datos" });
    }
});

// 2. LOGIN DE USUARIOS
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query(
            "SELECT * FROM users WHERE username = $1 AND password = $2",
            [username.toLowerCase().trim(), password]
        );
        
        if (result.rows.length > 0) {
            res.json({ message: "Login exitoso", user: result.rows[0] });
        } else {
            res.status(401).json({ error: "Credenciales inválidas" });
        }
    } catch (err) {
        res.status(500).json({ error: "Error en el servidor de autenticación" });
    }
});

// 3. BUSCADOR GLOBAL DE PERFILES (ALTA PRECISIÓN)
app.get('/api/social/search', async (req, res) => {
    const { query } = req.query;
    try {
        const result = await pool.query(
            `SELECT id, username, color, bio, followers_count, is_verified 
             FROM users 
             WHERE username ILIKE $1 
             ORDER BY followers_count DESC LIMIT 10`,
            [`%${query}%`]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: "Error en la búsqueda" });
    }
});

// 4. SISTEMA DE SEGUIMIENTO (FOLLOW/UNFOLLOW)
app.post('/api/social/follow', async (req, res) => {
    const { follower_id, following_id } = req.body;
    if (follower_id === following_id) return res.status(400).json({ error: "No puedes seguirte a ti mismo" });

    try {
        await pool.query("BEGIN");
        await pool.query(
            "INSERT INTO follows (follower_id, following_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
            [follower_id, following_id]
        );
        await pool.query("UPDATE users SET followers_count = followers_count + 1 WHERE id = $1", [following_id]);
        await pool.query("UPDATE users SET following_count = following_count + 1 WHERE id = $1", [follower_id]);
        await pool.query("COMMIT");
        
        res.json({ success: true });
    } catch (err) {
        await pool.query("ROLLBACK");
        res.status(500).json({ error: "Error al procesar el follow" });
    }
});

// MANEJO DE ERRORES 404
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`-----------------------------------------`);
    console.log(`📡 EMMANUEL ENGINE RUNNING ON PORT ${PORT}`);
    console.log(`🌍 URL: http://localhost:${PORT}`);
    console.log(`-----------------------------------------`);
});
