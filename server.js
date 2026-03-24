const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// CONEXIÓN A POSTGRESQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Inicializar DB con columna EMAIL
const initDB = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                color TEXT DEFAULT '#0066ff',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("✅ [DB] PostgreSQL conectada: Tabla de Emmanuel lista.");
    } catch (err) { console.error("❌ [DB] Error:", err.message); }
};
initDB();

// RUTAS
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const color = "#" + Math.floor(Math.random()*16777215).toString(16);
        await pool.query(
            "INSERT INTO users (username, email, password, color) VALUES ($1, $2, $3, $4)",
            [username, email, password, color]
        );
        res.status(201).json({ message: "¡Cuenta creada con éxito, Emmanuel!" });
    } catch (e) { res.status(400).json({ error: "El usuario o Gmail ya existen." }); }
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query(
            "SELECT id, username, color FROM users WHERE username = $1 AND password = $2",
            [username, password]
        );
        if (result.rows.length > 0) {
            res.json({ message: "Iniciaste sesión con éxito", user: result.rows[0] });
        } else { res.status(401).json({ error: "Datos incorrectos." }); }
    } catch (e) { res.status(500).json({ error: "Error de servidor." }); }
});

app.get('/api/search', async (req, res) => {
    const { q } = req.query;
    const result = await pool.query("SELECT username, color FROM users WHERE username ILIKE $1 LIMIT 5", [`%${q}%`]);
    res.json(result.rows);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Emmanuel Store en puerto ${PORT}`));
