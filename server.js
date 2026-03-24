/**
 * DEVROOT ENGINE V100 - EMMANUEL EDITION
 * POSTGRESQL DATABASE INTEGRATION
 */
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// MIDDLEWARES
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// CONFIGURACIÓN DE POSTGRESQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } 
});

// Inicialización de la Base de Datos Global
const initDatabase = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                color TEXT DEFAULT '#0066ff',
                bio TEXT DEFAULT 'Miembro de Emmanuel Store',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("✅ [DB] Base de datos PostgreSQL conectada y lista.");
    } catch (err) {
        console.error("❌ [DB] Error crítico al inicializar:", err.message);
    }
};
initDatabase();

// --- RUTAS DE LA API ---

// 1. Registro (Guardar en Postgres)
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Faltan datos." });

    try {
        const color = "#" + Math.floor(Math.random()*16777215).toString(16);
        const query = "INSERT INTO users (username, password, color) VALUES ($1, $2, $3) RETURNING id, username, color";
        const result = await pool.query(query, [username, password, color]);
        
        console.log(`👤 Usuario registrado: ${username}`);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') {
            res.status(400).json({ error: "Este nombre de usuario ya está en uso." });
        } else {
            res.status(500).json({ error: "Error en el servidor de base de datos." });
        }
    }
});

// 2. Login (Buscar en Postgres)
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const query = "SELECT id, username, color, bio FROM users WHERE username = $1 AND password = $2";
        const result = await pool.query(query, [username, password]);

        if (result.rows.length > 0) {
            console.log(`🔑 Login exitoso: ${username}`);
            res.json(result.rows[0]);
        } else {
            res.status(401).json({ error: "Credenciales inválidas." });
        }
    } catch (err) {
        res.status(500).json({ error: "Error de conexión." });
    }
});

// 3. Buscador Global (Encuentra a cualquiera en la DB)
app.get('/api/search', async (req, res) => {
    const { q } = req.query;
    if (!q) return res.json([]);

    try {
        const query = "SELECT username, color, bio FROM users WHERE username ILIKE $1 LIMIT 6";
        const result = await pool.query(query, [`%${q}%`]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: "Error en búsqueda." });
    }
});

// 4. Perfil Específico
app.get('/api/user/:name', async (req, res) => {
    try {
        const result = await pool.query("SELECT username, color, bio, created_at FROM users WHERE username = $1", [req.params.name]);
        if (result.rows.length > 0) res.json(result.rows[0]);
        else res.status(404).json({ error: "No encontrado." });
    } catch (e) { res.status(500).json({ error: "Error." }); }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 Emmanuel Server corriendo en puerto ${PORT}`);
    console.log(`🌍 Base de datos activa en Render.`);
});
