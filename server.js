const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// CONEXIÓN SEGURA A POSTGRESQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // <--- Verifica que en Render se llame así
  ssl: { rejectUnauthorized: false }
});

// Probar conexión inmediata
pool.connect((err, client, release) => {
  if (err) {
    return console.error('❌ ERROR CRÍTICO DE CONEXIÓN:', err.stack);
  }
  console.log('✅ Conexión exitosa a la base de datos de Emmanuel');
  release();
});

const initDB = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                color TEXT DEFAULT '#0066ff'
            )
        `);
    } catch (err) { console.error("❌ Error creando tabla:", err); }
};
initDB();

// REGISTRO MEJORADO
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;
    
    try {
        // Verificar duplicados
        const check = await pool.query("SELECT id FROM users WHERE username = $1 OR email = $2", [username, email]);
        
        if (check.rows.length > 0) {
            return res.status(400).json({ error: "El usuario o Gmail ya existen." });
        }

        const color = "#" + Math.floor(Math.random()*16777215).toString(16);
        await pool.query(
            "INSERT INTO users (username, email, password, color) VALUES ($1, $2, $3, $4)",
            [username, email, password, color]
        );
        
        res.status(201).json({ message: "¡Cuenta creada con éxito!" });
    } catch (e) {
        console.error("DETALLE DEL ERROR:", e); // Esto saldrá en los logs de Render
        res.status(500).json({ error: "Error de base de datos. Revisa la URL en Render." });
    }
});

// LOGIN MEJORADO
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
    } catch (e) {
        res.status(500).json({ error: "Error al conectar con la cuenta." });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Servidor listo en puerto ${PORT}`));
