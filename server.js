const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
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
    ssl: { rejectUnauthorized: false },
});

// --- REPARADOR DE TABLA (SOLUCIÓN AL ERROR) ---
const repararTabla = async () => {
    try {
        // 1. Intentamos crear la tabla si no existe
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL
            );
        `);

        // 2. FORZAMOS la columna email por si no existe
        await pool.query(`
            ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;
        `);
        
        // 3. FORZAMOS la columna color por si no existe
        await pool.query(`
            ALTER TABLE users ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#0066ff';
        `);

        console.log("✅ [SISTEMA] ¡Tabla reparada! Columna 'email' añadida con éxito.");
    } catch (err) {
        console.error("❌ [ERROR REPARANDO]:", err.message);
    }
};
repararTabla();

// --- RUTAS API ---

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
        res.status(500).json({ error: "Error de servidor: " + err.message });
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
            res.json({ message: "¡Iniciaste sesión!", user: result.rows[0] });
        } else {
            res.status(401).json({ error: "Usuario o clave incorrectos." });
        }
    } catch (err) {
        res.status(500).json({ error: "Error en login." });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Servidor de Emmanuel en puerto ${PORT}`));
