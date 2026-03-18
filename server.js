const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')); // Para servir tu HTML/CSS

// Configuración de la Base de Datos (PostgreSQL)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Requerido para Render
});

// Ruta para registrar usuario (Minecraft RP)
app.post('/registro', async (req, res) => {
    const { usuario_mc, nombre_rp, fecha_nacimiento, nacionalidad, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    try {
        await pool.query(
            'INSERT INTO usuarios (usuario_mc, nombre_rp, fecha_nacimiento, nacionalidad, password) VALUES ($1, $2, $3, $4, $5)',
            [usuario_mc, nombre_rp, fecha_nacimiento, nacionalidad, hashedPassword]
        );
        res.send("¡Cuenta creada con éxito!");
    } catch (err) {
        res.status(500).send("Error al registrar: " + err.message);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));