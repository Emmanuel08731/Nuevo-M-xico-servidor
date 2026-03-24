const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// CONEXIÓN A POSTGRESQL (Usando tu enlace)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Requerido para Render
});

// Crear tabla de usuarios si no existe
const initDB = async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            color TEXT DEFAULT '#0066ff'
        )
    `);
    console.log("✅ Tabla de usuarios lista en PostgreSQL");
};
initDB();

// RUTAS API
app.post('/api/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const color = "#" + Math.floor(Math.random()*16777215).toString(16);
        
        const newUser = await pool.query(
            "INSERT INTO users (username, password, color) VALUES ($1, $2, $3) RETURNING *",
            [username, password, color]
        );
        res.status(201).json(newUser.rows[0]);
    } catch (e) {
        res.status(400).json({ error: "El usuario ya existe o hubo un error." });
    }
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await pool.query(
        "SELECT * FROM users WHERE username = $1 AND password = $2",
        [username, password]
    );
    
    if (user.rows.length > 0) {
        res.json(user.rows[0]);
    } else {
        res.status(401).json({ error: "Credenciales incorrectas" });
    }
});

app.get('/api/search', async (req, res) => {
    const { q } = req.query;
    const results = await pool.query(
        "SELECT username, color FROM users WHERE username ILIKE $1 LIMIT 5",
        [`%${q}%`]
    );
    res.json(results.rows);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Servidor Emmanuel Store en puerto ${PORT}`));
