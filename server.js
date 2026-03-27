const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const pool = new Pool({
    host: 'dpg-d6u5u3fkijhs73fhh1hg-a.oregon-postgres.render.com',
    user: 'base_datos_global_user',
    password: 'mEDJcu2NtduJqv662gaUvOIuPDh1HFi3',
    database: 'base_datos_global',
    port: 5432,
    ssl: { rejectUnauthorized: false }
});

// INICIALIZACIÓN DE TABLAS PRO
const initDB = async () => {
    try {
        // Tabla de Usuarios
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                color TEXT DEFAULT '#0066ff',
                bio TEXT DEFAULT '¡Hola! Soy nuevo en la red de Emmanuel.',
                followers_count INTEGER DEFAULT 0
            );
        `);
        // Tabla de Seguidores
        await pool.query(`
            CREATE TABLE IF NOT EXISTS follows (
                id SERIAL PRIMARY KEY,
                follower_id INTEGER REFERENCES users(id),
                following_id INTEGER REFERENCES users(id),
                UNIQUE(follower_id, following_id)
            );
        `);
        console.log("🔥 [SISTEMA] Base de datos de Emmanuel Online");
    } catch (e) { console.error("Error DB:", e.message); }
};
initDB();

// --- RUTAS API ---

// Registro
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const color = "#" + Math.floor(Math.random()*16777215).toString(16);
        const result = await pool.query(
            "INSERT INTO users (username, email, password, color) VALUES ($1, $2, $3, $4) RETURNING id, username, color",
            [username, email, password, color]
        );
        res.status(201).json(result.rows[0]);
    } catch (e) { res.status(500).json({ error: "Error al crear cuenta" }); }
});

// Login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query("SELECT * FROM users WHERE username = $1 AND password = $2", [username, password]);
        if (result.rows.length > 0) res.json(result.rows[0]);
        else res.status(401).json({ error: "Datos incorrectos" });
    } catch (e) { res.status(500).json({ error: "Error de conexión" }); }
});

// Buscador de perfiles (TikTok Style)
app.get('/api/search', async (req, res) => {
    const { q } = req.query;
    try {
        const result = await pool.query(
            "SELECT id, username, color, bio, followers_count FROM users WHERE username ILIKE $1 LIMIT 5",
            [`%${q}%`]
        );
        res.json(result.rows);
    } catch (e) { res.json([]); }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Emmanuel Store en puerto ${PORT}`));
