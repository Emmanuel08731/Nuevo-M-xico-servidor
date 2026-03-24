const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// CONFIGURACIÓN PARA EVITAR EL "ERROR INTERNO"
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000, // 10 segundos de espera
});

// Verificación de salud de la DB
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ ERROR DE CONEXIÓN CRÍTICO:', err.message);
  } else {
    console.log('✅ POSTGRES CONECTADO Y LISTO');
  }
});

// REGISTRO SEGURO
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const color = "#" + Math.floor(Math.random()*16777215).toString(16);
    
    // Intento de inserción
    await pool.query(
      "INSERT INTO users (username, email, password, color) VALUES ($1, $2, $3, $4)",
      [username, email, password, color]
    );
    
    res.status(201).json({ message: "¡Cuenta creada con éxito!" });
  } catch (err) {
    console.error("DETALLE DEL ERROR EN POSTGRES:", err.code, err.message);
    
    // Si el error es por duplicado (código 23505 en Postgres)
    if (err.code === '23505') {
      return res.status(400).json({ error: "Ese usuario o Gmail ya existe." });
    }
    
    res.status(500).json({ error: "Error de base de datos. Revisa los logs de Render." });
  }
});

// LOGIN SEGURO
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
app.listen(PORT, () => console.log(`🚀 Emmanuel Store corriendo en puerto ${PORT}`));
