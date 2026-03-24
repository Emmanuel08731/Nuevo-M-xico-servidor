const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// CONEXIÓN DESGLOSADA (MÁS SEGURA PARA RENDER)
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false // Obligatorio para Render
  },
  connectionTimeoutMillis: 5000,
});

// PROBADOR DE CONEXIÓN DEFINITIVO
const iniciarSistema = async () => {
    try {
        const client = await pool.connect();
        console.log("------------------------------------------");
        console.log("🔥 [SISTEMA] ¡LOGRADO! CONECTADO A POSTGRES");
        console.log("👤 [USER] " + process.env.DB_USER);
        console.log("------------------------------------------");
        client.release();

        // CREAR TABLA
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                color TEXT DEFAULT '#0066ff'
            );
        `);
    } catch (err) {
        console.error("❌ [ERROR CRÍTICO]:", err.message);
        console.log("Emmanuel, revisa que DB_HOST termine en .com y no en -a");
    }
};
iniciarSistema();

// API REGISTRO
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const color = "#" + Math.floor(Math.random()*16777215).toString(16);
        await pool.query(
            "INSERT INTO users (username, email, password, color) VALUES ($1, $2, $3, $4)",
            [username, email, password, color]
        );
        res.status(201).json({ message: "¡Cuenta creada con éxito!" });
    } catch (err) {
        console.error("ERROR REGISTRO:", err.message);
        if (err.code === '23505') return res.status(400).json({ error: "Ya existe ese usuario." });
        res.status(500).json({ error: "Postgres sigue bloqueado. Mira los Logs de Render." });
    }
});

// API LOGIN
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query(
            "SELECT * FROM users WHERE username = $1 AND password = $2",
            [username, password]
        );
        if (result.rows.length > 0) {
            res.json({ message: "¡Bienvenido!", user: result.rows[0] });
        } else {
            res.status(401).json({ error: "Datos incorrectos." });
        }
    } catch (err) {
        res.status(500).json({ error: "Error de conexión." });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Emmanuel Server en puerto ${PORT}`));
