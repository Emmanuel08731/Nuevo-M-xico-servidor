const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// CONFIGURACIÓN DE CONEXIÓN CON REINTENTOS
const poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000, // Máximo 5 segundos para conectar
    idleTimeoutMillis: 30000,
    max: 20 // Máximo de conexiones simultáneas
};

let pool = new Pool(poolConfig);

// PROBADOR DE CONEXIÓN EN TIEMPO REAL
const testConn = async () => {
    try {
        const client = await pool.connect();
        console.log("------------------------------------------");
        console.log("✅ [DATABASE] ¡CONEXIÓN EXITOSA!");
        console.log("🌍 [DB] Host detectado: Oregon-Postgres");
        console.log("------------------------------------------");
        client.release();
    } catch (err) {
        console.error("------------------------------------------");
        console.error("❌ [DATABASE] ERROR DE CONEXIÓN:");
        console.error("DETALLE:", err.message);
        console.error("CONSEJO: Verifica que DATABASE_URL en Render sea la EXTERNAL y no la internal.");
        console.log("------------------------------------------");
    }
};
testConn();

// Inicialización de Tablas
const initDatabase = async () => {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            color TEXT DEFAULT '#0066ff',
            bio TEXT DEFAULT 'Usuario de Emmanuel Store',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;
    try {
        await pool.query(createTableQuery);
        console.log("📊 [DB] Estructura de tablas verificada.");
    } catch (e) {
        console.error("❌ [DB] Error al crear tablas:", e.message);
    }
};
initDatabase();

// --- RUTAS API ---

app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
        return res.status(400).json({ error: "Faltan datos obligatorios." });
    }

    try {
        // Validación de duplicados manual para evitar errores 500
        const check = await pool.query("SELECT id FROM users WHERE username = $1 OR email = $2", [username, email]);
        if (check.rows.length > 0) {
            return res.status(400).json({ error: "Ese nombre o Gmail ya está registrado." });
        }

        const color = "#" + Math.floor(Math.random()*16777215).toString(16);
        await pool.query(
            "INSERT INTO users (username, email, password, color) VALUES ($1, $2, $3, $4)",
            [username, email, password, color]
        );
        
        res.status(201).json({ message: "¡Cuenta creada con éxito!" });
    } catch (err) {
        console.error("❌ Error en Registro:", err);
        res.status(500).json({ error: "Error interno al guardar en Postgres." });
    }
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query(
            "SELECT id, username, email, color, bio FROM users WHERE username = $1 AND password = $2",
            [username, password]
        );
        
        if (result.rows.length > 0) {
            res.json({ message: "¡Iniciaste sesión con éxito!", user: result.rows[0] });
        } else {
            res.status(401).json({ error: "Usuario o contraseña no encontrados." });
        }
    } catch (err) {
        res.status(500).json({ error: "No pudimos conectar con tu cuenta." });
    }
});

// Buscador de usuarios
app.get('/api/search', async (req, res) => {
    const { q } = req.query;
    try {
        const result = await pool.query(
            "SELECT username, color, bio FROM users WHERE username ILIKE $1 LIMIT 5",
            [`%${q}%`]
        );
        res.json(result.rows);
    } catch (e) { res.json([]); }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 Emmanuel Server Online en puerto ${PORT}`);
});
