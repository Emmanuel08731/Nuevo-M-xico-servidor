/**
 * ==============================================================================
 * CORE ARCHITECTURE - VERSION 18.0.2
 * INDUSTRIAL GRADE PERSISTENCE LAYER
 * ==============================================================================
 */

const express = require('express');
const path = require('path');
const compression = require('compression');
const http = require('http');
const helmet = require('helmet');
const { Pool } = require('pg');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// CONFIGURACIÓN DE BASE DE DATOS PROFESIONAL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 30,
    idleTimeoutMillis: 10000
});

app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(express.json({ limit: '20mb' }));
app.use(express.static(path.join(__dirname, 'public')));

/**
 * INICIALIZACIÓN DE ESQUEMAS RELACIONALES
 */
const syncCoreDB = async () => {
    const client = await pool.connect();
    try {
        // Tabla de Identidades
        await client.query(`
            CREATE TABLE IF NOT EXISTS identities (
                id SERIAL PRIMARY KEY,
                uuid VARCHAR(25) UNIQUE NOT NULL,
                handle VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                secret_hash TEXT NOT NULL,
                status_label VARCHAR(30) DEFAULT 'Standard',
                profile_color VARCHAR(15) DEFAULT '#0052ff',
                metrics_followers INTEGER DEFAULT 0,
                metrics_following INTEGER DEFAULT 0,
                is_active BOOLEAN DEFAULT true,
                timestamp_created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Tabla de Relaciones Dinámicas
        await client.query(`
            CREATE TABLE IF NOT EXISTS relationships (
                id SERIAL PRIMARY KEY,
                source_uuid VARCHAR(25) REFERENCES identities(uuid),
                target_uuid VARCHAR(25) REFERENCES identities(uuid),
                timestamp_link TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(source_uuid, target_uuid)
            );
        `);
        console.log('\x1b[36m[CORE]\x1b[0m Base de datos sincronizada correctamente.');
    } catch (err) {
        console.error('[DATABASE_CRITICAL]', err);
    } finally {
        client.release();
    }
};
syncCoreDB();

/**
 * ENDPOINTS DE AUTENTICACIÓN
 */
app.post('/api/auth/register', async (req, res) => {
    const { user, email, password } = req.body;
    try {
        const uuid = "ID-" + Math.random().toString(36).substring(2, 12).toUpperCase();
        const query = `
            INSERT INTO identities (uuid, handle, email, secret_hash) 
            VALUES ($1, $2, $3, $4) RETURNING uuid;
        `;
        await pool.query(query, [uuid, user.trim(), email.toLowerCase().trim(), password]);
        res.status(201).json({ success: true, message: "Identidad registrada en el sistema." });
    } catch (err) {
        res.status(409).json({ error: "La identidad ya existe en los registros." });
    }
});

app.post('/api/auth/verify', async (req, res) => {
    const { identity, password } = req.body;
    try {
        const query = 'SELECT * FROM identities WHERE email = $1 OR handle = $1';
        const result = await pool.query(query, [identity.toLowerCase().trim()]);

        if (result.rows.length === 0 || result.rows[0].secret_hash !== password) {
            return res.status(401).json({ error: "Credenciales de acceso no válidas." });
        }

        const data = result.rows[0];
        res.json({
            success: true,
            user: {
                uuid: data.uuid,
                name: data.handle,
                color: data.profile_color,
                status: data.status_label,
                stats: { followers: data.metrics_followers, following: data.metrics_following }
            }
        });
    } catch (err) {
        res.status(500).json({ error: "Fallo en el servidor de verificación." });
    }
});

/**
 * MOTOR DE BÚSQUEDA GLOBAL
 */
app.get('/api/search', async (req, res) => {
    const q = req.query.q ? `%${req.query.q}%` : '';
    try {
        const query = `
            SELECT uuid, handle, status_label, profile_color 
            FROM identities 
            WHERE handle ILIKE $1 OR uuid ILIKE $1 
            LIMIT 10;
        `;
        const result = await pool.query(query, [q]);
        res.json({ results: result.rows });
    } catch (err) {
        res.status(500).json({ error: "Error en el motor de indexación." });
    }
});

server.listen(PORT, () => console.log(`[SYSTEM] Core Online on Port ${PORT}`));
