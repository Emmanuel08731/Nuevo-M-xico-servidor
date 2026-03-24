const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// CONFIGURACIÓN DE CONEXIÓN DINÁMICA
const poolConfig = {
    host: 'dpg-d6u5u3fkijhs73fhh1hg-a.oregon-postgres.render.com',
    user: 'base_datos_global_user',
    password: 'mEDJcu2NtduJqv662gaUvOIuPDh1HFi3',
    database: 'base_datos_global',
    port: 5432,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
};

let pool = new Pool(poolConfig);

// SISTEMA DE REINTENTO AUTOMÁTICO
const conectarConFuerza = async () => {
    let conectado = false;
    while (!conectado) {
        try {
            const client = await pool.connect();
            console.log("------------------------------------------");
            console.log("🔥 [SISTEMA] ¡EMMANUEL, LO LOGRAMOS!");
            console.log("📡 [DB] CONEXIÓN ESTABLECIDA CON OREGON");
            console.log("------------------------------------------");
            client.release();
            conectado = true;
            
            // Crear tabla de emergencia
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
            console.error("❌ [REINTENTO] Postgres sigue bloqueado. Error:", err.message);
            console.log("🔄 Reintentando en 3 segundos...");
            await new Promise(res => setTimeout(res, 3000));
        }
    }
};

conectarConFuerza();

// --- RUTAS DE ALTA DISPONIBILIDAD ---

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
        console.error("LOG DE ERROR:", err.message);
        if (err.code === '23505') return res.status(400).json({ error: "Ya existe ese usuario." });
        res.status(500).json({ error: "Error crítico. Mira los Logs de Render." });
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
