const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// CONFIGURACIÓN MAESTRA DE EMMANUEL
const pool = new Pool({
    // Usamos el Host Externo Completo
    host: 'dpg-d6u5u3fkijhs73fhh1hg-a.oregon-postgres.render.com',
    user: 'base_datos_global_user',
    password: 'mEDJcu2NtduJqv662gaUvOIuPDh1HFi3',
    database: 'base_datos_global',
    port: 5432,
    ssl: {
        rejectUnauthorized: false // <--- VITAL PARA QUE RENDER NO TE BLOQUEE
    },
    connectionTimeoutMillis: 10000, 
});

// PROBADOR DE CONEXIÓN AL ARRANCAR
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ ERROR CRÍTICO DE CONEXIÓN:', err.stack);
        console.log('CONSEJO: Ve a la DB en Render -> Access Control -> Añade 0.0.0.0/0');
    } else {
        console.log('✅ [SISTEMA] ¡EMMANUEL, LA BASE DE DATOS ESTÁ LISTA!');
        release();
    }
});

// RUTA DE REGISTRO CON LOGS DE ERROR
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
        // Esto aparecerá en los LOGS de Render (pestaña Logs)
        console.error("--- ERROR EN REGISTRO ---");
        console.error("Código:", err.code);
        console.error("Mensaje:", err.message);
        
        if (err.code === '23505') {
            return res.status(400).json({ error: "Ese usuario o Gmail ya existe." });
        }
        res.status(500).json({ error: "Error de servidor: " + err.message });
    }
});

// RUTA DE LOGIN
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
        res.status(500).json({ error: "Error de conexión con la DB." });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Emmanuel Server Online en puerto ${PORT}`));
