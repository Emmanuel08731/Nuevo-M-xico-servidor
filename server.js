/**
 * ==============================================================================
 * DEEV ROOT - CORE INFRASTRUCTURE V24.0.1
 * ARCHITECTURE: WHITE-LABEL MINIMALISM
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

// CONFIGURACIÓN DE NODO DE DATOS (POSTGRESQL)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 50,
    idleTimeoutMillis: 30000
});

app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

/**
 * MOTOR DE PERSISTENCIA DEEV ROOT
 */
const syncDeevRootSchema = async () => {
    const client = await pool.connect();
    try {
        console.log('\x1b[36m[DEEV ROOT]\x1b[0m Sincronizando tablas de alta disponibilidad...');
        
        // Tabla de Identidades
        await client.query(`
            CREATE TABLE IF NOT EXISTS root_identities (
                id SERIAL PRIMARY KEY,
                uid VARCHAR(40) UNIQUE NOT NULL,
                username VARCHAR(80) UNIQUE NOT NULL,
                email VARCHAR(150) UNIQUE NOT NULL,
                secret_key TEXT NOT NULL,
                theme_accent VARCHAR(20) DEFAULT '#0f172a',
                rank_label VARCHAR(50) DEFAULT 'Root User',
                bio_data TEXT DEFAULT 'Connected to Deev Root.',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Tabla de Registros (Feed)
        await client.query(`
            CREATE TABLE IF NOT EXISTS root_logs (
                id SERIAL PRIMARY KEY,
                author_uid VARCHAR(40) REFERENCES root_identities(uid),
                content TEXT NOT NULL,
                log_type VARCHAR(20) DEFAULT 'standard',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log('\x1b[32m[READY]\x1b[0m Infraestructura Deev Root operativa.');
    } catch (err) {
        console.error('[CRITICAL_DB_ERROR]', err.message);
    } finally {
        client.release();
    }
};
syncDeevRootSchema();

/**
 * ENDPOINTS DE SERVICIO
 */
app.post('/api/auth/register', async (req, res) => {
    const { user, email, password } = req.body;
    try {
        const uid = "DR-" + Math.random().toString(36).substring(2, 12).toUpperCase();
        const query = `
            INSERT INTO root_identities (uid, username, email, secret_key) 
            VALUES ($1, $2, $3, $4) RETURNING uid;
        `;
        await pool.query(query, [uid, user.trim(), email.toLowerCase().trim(), password]);
        res.status(201).json({ success: true, message: "Identidad registrada en Deev Root." });
    } catch (err) {
        res.status(409).json({ error: "El usuario o email ya existe en la red." });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { identity, secret } = req.body;
    try {
        const query = 'SELECT * FROM root_identities WHERE email = $1 OR username = $1';
        const result = await pool.query(query, [identity.toLowerCase().trim()]);

        if (result.rows.length === 0 || result.rows[0].secret_key !== secret) {
            return res.status(401).json({ error: "Credenciales denegadas por el sistema." });
        }

        const u = result.rows[0];
        res.json({
            success: true,
            user: {
                uid: u.uid,
                name: u.username,
                role: u.rank_label,
                color: u.theme_accent,
                bio: u.bio_data
            }
        });
    } catch (err) {
        res.status(500).json({ error: "Error en el nodo de autenticación." });
    }
});

app.get('/api/logs/all', async (req, res) => {
    try {
        const query = `
            SELECT l.*, i.username, i.theme_accent 
            FROM root_logs l 
            JOIN root_identities i ON l.author_uid = i.uid 
            ORDER BY l.created_at DESC LIMIT 40;
        `;
        const result = await pool.query(query);
        res.json({ logs: result.rows });
    } catch (err) {
        res.status(500).json({ error: "No se pudo obtener el feed de logs." });
    }
});

app.post('/api/logs/create', async (req, res) => {
    const { uid, content } = req.body;
    try {
        await pool.query('INSERT INTO root_logs (author_uid, content) VALUES ($1, $2)', [uid, content]);
        res.status(201).json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Fallo al registrar log." });
    }
});

server.listen(PORT, () => console.log(`[DEEV ROOT] Listening on ${PORT}`));
