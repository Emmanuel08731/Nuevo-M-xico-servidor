const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// CONFIGURACIÓN ULTRA-COMPATIBLE
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Esto permite que Render acepte el certificado
  }
});

// PROBADOR DE CONEXIÓN CON REINTENTO
const conectarConPostgres = async () => {
    try {
        const client = await pool.connect();
        console.log("------------------------------------------");
        console.log("✅ [DATABASE] ¡SISTEMA CONECTADO CON ÉXITO!");
        console.log("------------------------------------------");
        client.release();
        
        // Crear tabla si no existe
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
        console.error("❌ [DATABASE] ERROR DE CONEXIÓN REAL:", err.message);
        console.log("Emmanuel, si ves esto, el problema es que Render no reconoce la IP o la URL.");
    }
};
conectarConPostgres();

// REGISTRO
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
        console.error("DETALLE:", err.message);
        if (err.code === '23505') return res.status(400).json({ error: "Usuario o Gmail ya existen." });
        res.status(500).json({ error: "Postgres sigue rechazando. Prueba añadiendo ?sslmode=require al final de tu URL en Render." });
    }
});

// LOGIN
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query(
            "SELECT * FROM users WHERE username = $1 AND password = $2",
            [username, password]
        );
        if (result.rows.length > 0) {
            res.json({ message: "¡Iniciaste sesión con éxito!", user: result.rows[0] });
        } else {
            res.status(401).json({ error: "Datos incorrectos." });
        }
    } catch (err) {
        res.status(500).json({ error: "Error de conexión." });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Emmanuel Store en puerto ${PORT}`));
