const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// CONEXIÓN A TU BASE DE DATOS GLOBAL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Inicializar Tabla de Usuarios
const initDB = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                color TEXT DEFAULT '#0066ff',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("✅ Emmanuel, la tabla de usuarios está lista en PostgreSQL");
    } catch (err) {
        console.error("❌ Error al crear la tabla:", err);
    }
};
initDB();

// --- RUTAS DE AUTENTICACIÓN ---

// Registro: Guarda en la DB Global
app.post('/api/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const color = "#" + Math.floor(Math.random()*16777215).toString(16);
        
        const result = await pool.query(
            "INSERT INTO users (username, password, color) VALUES ($1, $2, $3) RETURNING id, username, color",
            [username, password, color]
        );
        res.status(201).json(result.rows[0]);
    } catch (e) {
        res.status(400).json({ error: "Ese nombre de usuario ya existe." });
    }
});

// Login: Busca en la DB Global
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const result = await pool.query(
            "SELECT id, username, color FROM users WHERE username = $1 AND password = $2",
            [username, password]
        );
        
        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(401).json({ error: "Usuario o contraseña incorrectos." });
        }
    } catch (e) {
        res.status(500).json({ error: "Error en el servidor." });
    }
});

// Buscador: Encuentra usuarios en cualquier dispositivo
app.get('/api/search', async (req, res) => {
    try {
        const { q } = req.query;
        const result = await pool.query(
            "SELECT username, color FROM users WHERE username ILIKE $1 LIMIT 5",
            [`%${q}%`]
        );
        res.json(result.rows);
    } catch (e) {
        res.status(500).json({ error: "Error en la búsqueda." });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Emmanuel Store Online en puerto ${PORT}`));
