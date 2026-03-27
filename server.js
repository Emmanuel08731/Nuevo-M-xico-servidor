const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// SERVIR ARCHIVOS ESTÁTICOS (MUY IMPORTANTE PARA EL CSS)
app.use(express.static(path.join(__dirname, 'public')));

// CONFIGURACIÓN DE POSTGRES RENDER (OREGON)
const pool = new Pool({
    host: 'dpg-d6u5u3fkijhs73fhh1hg-a.oregon-postgres.render.com',
    user: 'base_datos_global_user',
    password: 'mEDJcu2NtduJqv662gaUvOIuPDh1HFi3',
    database: 'base_datos_global',
    port: 5432,
    ssl: { rejectUnauthorized: false }
});

// TABLAS DE EMMANUEL STORE
const conectarDB = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                color TEXT DEFAULT '#fe2c55',
                bio TEXT DEFAULT 'Miembro de DevRoot',
                followers_count INTEGER DEFAULT 0
            );
        `);
        console.log("🔥 [SISTEMA] Base de Datos conectada en OREGON");
    } catch (e) { console.log("❌ Error DB:", e.message); }
};
conectarDB();

// --- API ---
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const result = await pool.query(
            "INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *",
            [username.toLowerCase(), email.toLowerCase(), password]
        );
        res.json(result.rows[0]);
    } catch (e) { res.status(500).json({ error: "El usuario ya existe" }); }
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const resu = await pool.query("SELECT * FROM users WHERE username = $1 AND password = $2", [username.toLowerCase(), password]);
        if (resu.rows.length > 0) res.json(resu.rows[0]);
        else res.status(401).json({ error: "Datos incorrectos" });
    } catch (e) { res.status(500).json({ error: "Error" }); }
});

app.get('/api/search', async (req, res) => {
    const { q } = req.query;
    const resu = await pool.query("SELECT * FROM users WHERE username ILIKE $1", [`%${q}%`]);
    res.json(resu.rows);
});

// ESTO HACE QUE EL INDEX.HTML CARGUE AL ENTRAR A LA WEB
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Puerto: ${PORT}`));
