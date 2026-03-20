/**
 * EMERALD HOSTING CLOUD - SISTEMA DE GESTIÓN GLOBAL
 * OWNER: EMMANUEL | YEAR: 2026
 * ---------------------------------------------------------
 * Este archivo contiene la lógica de servidor para:
 * 1. Registro de Usuarios con validación de duplicados.
 * 2. Login Seguro con comparación de Hash Bcrypt.
 * 3. Gestión de Base de Datos PostgreSQL en Render.
 * 4. Control de Instancias de Bots y Webs.
 */

const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 10000;

// CONFIGURACIÓN AVANZADA DE POOL DE CONEXIONES
const pool = new Pool({
    connectionString: 'postgresql://base_datos_global_user:mEDJcu2NtduJqv662gaUvOIuPDh1HFi3@dpg-d6u5u3fkijhs73fhh1hg-a/base_datos_global',
    ssl: { rejectUnauthorized: false },
    max: 50, // Soporta hasta 50 conexiones simultáneas
    idleTimeoutMillis: 10000
});

// MIDDLEWARES INDUSTRIALES
app.use(express.json({ limit: '100mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// --- INICIALIZACIÓN DE LA ESTRUCTURA DE DATOS ---
async function setupCloud() {
    const client = await pool.connect();
    try {
        console.log("--- [DB] Iniciando Sincronización de Tablas de Hosting ---");
        
        // Tabla de Clientes con Sistema de Membresía
        await client.query(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id SERIAL PRIMARY KEY,
                uuid UUID DEFAULT gen_random_uuid(),
                email VARCHAR(255) UNIQUE NOT NULL,
                nombre_usuario VARCHAR(100) NOT NULL,
                password TEXT NOT NULL,
                plan_activo VARCHAR(50) DEFAULT 'Ninguno',
                creditos DECIMAL(10,2) DEFAULT 0.00,
                is_admin BOOLEAN DEFAULT FALSE,
                fecha_union TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Tabla de Servidores de los Clientes
        await client.query(`
            CREATE TABLE IF NOT EXISTS servidores (
                id SERIAL PRIMARY KEY,
                owner_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
                nombre_bot VARCHAR(100),
                tipo_engine VARCHAR(50) DEFAULT 'NodeJS',
                ram_mb INTEGER DEFAULT 512,
                cpu_percent INTEGER DEFAULT 50,
                status VARCHAR(20) DEFAULT 'OFFLINE'
            );
        `);

        console.log("--- [DB] Infraestructura Lista para Usuarios ---");
    } catch (err) {
        console.error("--- [DB ERROR] Fallo en el arranque:", err);
    } finally {
        client.release();
    }
}
setupCloud();

// --- SISTEMA DE REGISTRO (SIGN UP) ---
app.post('/api/auth/register', async (req, res) => {
    const { email, username, password } = req.body;
    try {
        // Verificar si el usuario ya existe
        const check = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email]);
        if (check.rows.length > 0) {
            return res.status(400).json({ success: false, msg: 'EL_EMAIL_YA_EXISTE' });
        }

        // Encriptar contraseña (12 rondas de seguridad)
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insertar nuevo cliente
        const newUser = await pool.query(
            'INSERT INTO usuarios (email, nombre_usuario, password) VALUES ($1, $2, $3) RETURNING id, email, nombre_usuario',
            [email, username, hashedPassword]
        );

        res.json({ success: true, user: newUser.rows[0] });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// --- SISTEMA DE LOGIN (SIGN IN) ---
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, msg: 'USUARIO_NO_ENCONTRADO' });
        }

        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.status(401).json({ success: false, msg: 'CONTRASEÑA_INCORRECTA' });
        }

        // Obtener sus servidores
        const servers = await pool.query('SELECT * FROM servidores WHERE owner_id = $1', [user.id]);

        res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                username: user.nombre_usuario,
                plan: user.plan_activo,
                admin: user.is_admin
            },
            servers: servers.rows
        });
    } catch (e) {
        res.status(500).json({ success: false });
    }
});

// --- RUTA UNIVERSAL ---
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => console.log(`🚀 SERVIDOR HOSTING EN PUERTO ${PORT}`));
