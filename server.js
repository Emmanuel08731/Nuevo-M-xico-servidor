/**
 * EMERALD HOSTING CORE v4.0.2 - ENTERPRISE EDITION
 * DEVELOPED BY EMMANUEL - 2026
 * --------------------------------------------------
 * Este servidor gestiona: 
 * - Conexión PostgreSQL Global
 * - Despliegue de Contenedores Virtuales (Simulado)
 * - Sistema de Autenticación con Bcrypt
 * - Panel de Administración Maestro
 */

const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 10000;

// --- CONFIGURACIÓN DE INFRAESTRUCTURA DB ---
const pool = new Pool({
  connectionString: 'postgresql://base_datos_global_user:mEDJcu2NtduJqv662gaUvOIuPDh1HFi3@dpg-d6u5u3fkijhs73fhh1hg-a/base_datos_global',
  ssl: { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// --- MIDDLEWARES DE ALTO RENDIMIENTO ---
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// --- SISTEMA DE LOGS DE SEGURIDAD ---
const logger = (msg, type = 'INFO') => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${type}] ${msg}`);
};

// --- INICIALIZACIÓN DE TABLAS (ESTRUCTURA COMPLETA) ---
async function bootstrap() {
    logger("Iniciando secuencia de arranque de base de datos...", "SYSTEM");
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // Tabla de Clientes
        await client.query(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id SERIAL PRIMARY KEY,
                email VARCHAR(150) UNIQUE NOT NULL,
                nombre_cliente VARCHAR(100) NOT NULL,
                password TEXT NOT NULL,
                plan VARCHAR(50) DEFAULT 'Ninguno',
                saldo DECIMAL(10,2) DEFAULT 0.00,
                cpu_limit INTEGER DEFAULT 0,
                ram_limit INTEGER DEFAULT 0,
                disk_limit INTEGER DEFAULT 0,
                es_admin BOOLEAN DEFAULT FALSE,
                status VARCHAR(20) DEFAULT 'ACTIVE',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Tabla de Servidores de Bots
        await client.query(`
            CREATE TABLE IF NOT EXISTS servidores (
                id SERIAL PRIMARY KEY,
                uid UUID DEFAULT gen_random_uuid(),
                owner_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
                nombre_server VARCHAR(100) NOT NULL,
                tipo VARCHAR(50) DEFAULT 'NodeJS',
                puerto INTEGER UNIQUE,
                estado VARCHAR(20) DEFAULT 'STOPPED',
                memoria_uso INTEGER DEFAULT 0,
                cpu_uso INTEGER DEFAULT 0,
                main_file VARCHAR(100) DEFAULT 'index.js'
            );
        `);

        // Crear Admin Maestro (Emmanuel)
        const rootPass = await bcrypt.hash('emma06E', 12);
        await client.query(`
            INSERT INTO usuarios (email, nombre_cliente, password, es_admin, plan)
            VALUES ('admin@emerald.host', 'Emmanuel Director', $1, TRUE, 'Enterprise')
            ON CONFLICT (email) DO UPDATE SET password = $1, es_admin = TRUE;
        `, [rootPass]);

        await client.query('COMMIT');
        logger("Infraestructura sincronizada con éxito.", "DB");
    } catch (e) {
        await client.query('ROLLBACK');
        logger(`Error crítico en bootstrap: ${e.message}`, "FATAL");
    } finally {
        client.release();
    }
}
bootstrap();

// --- ENDPOINTS DE LA API (EXTENSO) ---

// Login Profesional
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        if (result.rows.length === 0) return res.status(401).json({ success: false, msg: 'User not found' });

        const user = result.rows[0];
        const match = await bcrypt.compare(password, user.password);

        if (match) {
            // Limpiar password antes de enviar
            delete user.password;
            // Buscar sus servidores
            const servers = await pool.query('SELECT * FROM servidores WHERE owner_id = $1', [user.id]);
            res.json({ success: true, user, servers: servers.rows });
        } else {
            res.status(401).json({ success: false, msg: 'Invalid credentials' });
        }
    } catch (e) {
        res.status(500).json({ success: false });
    }
});

// Comprar/Activar Plan
app.post('/api/billing/activate', async (req, res) => {
    const { userId, planName } = req.body;
    const limits = {
        'Gratis': { cpu: 50, ram: 512, disk: 1024 },
        'Premium': { cpu: 100, ram: 2048, disk: 10240 },
        'Business': { cpu: 400, ram: 8192, disk: 51200 }
    };

    const sel = limits[planName] || limits['Gratis'];
    try {
        await pool.query(
            'UPDATE usuarios SET plan = $1, cpu_limit = $2, ram_limit = $3, disk_limit = $4 WHERE id = $5',
            [planName, sel.cpu, sel.ram, sel.disk, userId]
        );
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false }); }
});

// Crear Servidor (Despliegue)
app.post('/api/servers/create', async (req, res) => {
    const { ownerId, name, type } = req.body;
    try {
        const port = Math.floor(Math.random() * (40000 - 30000) + 30000);
        const result = await pool.query(
            'INSERT INTO servidores (owner_id, nombre_server, tipo, puerto) VALUES ($1, $2, $3, $4) RETURNING *',
            [ownerId, name, type, port]
        );
        res.json({ success: true, server: result.rows[0] });
    } catch (e) { res.status(500).json({ success: false }); }
});

// --- MANEJO DE RUTAS Y FRONTEND ---
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    logger(`Emerald Hosting corriendo en el puerto ${PORT}`, 'READY');
});
