const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// CONFIGURACIÓN ELITE PARA RENDER
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // <--- ESTO ES VITAL PARA RENDER
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// PROBADOR DE CONEXIÓN INICIAL
pool.connect((err, client, release) => {
  if (err) {
    return console.error('❌ ERROR CRÍTICO DE CONEXIÓN:', err.stack);
  }
  console.log('✅ [POSTGRES] EMMANUEL, LA BASE DE DATOS ESTÁ LISTA');
  release();
});

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
    console.error("LOG DE ERROR:", err.message);
    if (err.code === '23505') {
        return res.status(400).json({ error: "Este usuario o Gmail ya están registrados." });
    }
    res.status(500).json({ error: "Error de base de datos. Revisa la URL externa en Render." });
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
      res.status(401).json({ error: "Usuario o contraseña incorrectos." });
    }
  } catch (err) {
    res.status(500).json({ error: "Error al conectar con la base de datos." });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Emmanuel Store en puerto ${PORT}`));
