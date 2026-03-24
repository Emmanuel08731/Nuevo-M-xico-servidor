const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// CONFIGURACIÓN DE CONEXIÓN FORZADA
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// FUNCIÓN PARA CREAR LA TABLA SI NO EXISTE
const prepararDB = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                color TEXT DEFAULT '#0066ff'
            );
        `);
        console.log("✅ [DB] Tabla 'users' verificada y lista.");
    } catch (err) {
        console.error("❌ [DB] Error al preparar tablas:", err.message);
    }
};
prepararDB();

// REGISTRO CON DETECCIÓN DE ERRORES REALES
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const color = "#" + Math.floor(Math.random()*16777215).toString(16);
        await pool.query(
            "INSERT INTO users (username, email, password, color) VALUES ($1, $2, $3, $4)",
            [username, email, password, color]
        );
        res.status(201).json({ message: "¡Cuenta creada con éxito, Emmanuel!" });
    } catch (err) {
        console.log("--- INFORME DE ERROR PARA EMMANUEL ---");
        console.log("Código de error:", err.code);
        console.log("Mensaje:", err.message);

        if (err.code === '23505') {
            return res.status(400).json({ error: "Ese usuario o Gmail ya existen." });
        }
        
        // Si el error es de conexión, avisamos específicamente
        res.status(500).json({ error: "Postgres rechazó la conexión. Verifica la URL EXTERNA en Render." });
    }
});

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
            res.status(401).json({ error: "Usuario o contraseña incorrectos." });
        }
    } catch (err) {
        res.status(500).json({ error: "Error de conexión con la cuenta." });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Emmanuel Store Online en puerto ${PORT}`));
