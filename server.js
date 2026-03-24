/**
 * ==============================================================================
 * GLOBAL CORE INFRASTRUCTURE - V22.0.5
 * ARCHITECTURE: REDUNDANT DATA CLUSTER
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

// 1. CONFIGURACIÓN DEL POOL DE ALTA DISPONIBILIDAD
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 40,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
});

app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

/**
 * 2. MOTOR DE SINCRONIZACIÓN DE TABLAS (RELACIONAL)
 */
const initializeGlobalSchema = async () => {
    const client = await pool.connect();
    try {
        console.log('\x1b[35m[CORE]\x1b[0m Iniciando mapeo de infraestructura...');
        
        // Tabla de Identidades Principales
        await client.query(`
            CREATE TABLE IF NOT EXISTS identities (
                id SERIAL PRIMARY KEY,
                uuid VARCHAR(40) UNIQUE NOT NULL,
                handle VARCHAR(80) UNIQUE NOT NULL,
                email VARCHAR(150) UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                design_hex VARCHAR(20) DEFAULT '#2563eb',
                status_tag VARCHAR(50) DEFAULT 'Standard Member',
                biography TEXT DEFAULT 'Core infrastructure user.',
                followers_total INTEGER DEFAULT 0,
                following_total INTEGER DEFAULT 0,
                is_verified BOOLEAN DEFAULT false,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Tabla de Publicaciones (Feed Global)
        await client.query(`
            CREATE TABLE IF NOT EXISTS core_feed (
                id SERIAL PRIMARY KEY,
                author_uuid VARCHAR(40) REFERENCES identities(uuid),
                content_text TEXT NOT NULL,
                media_link TEXT,
                reactions_count INTEGER DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Tabla de Conexiones Sociales (Matriz)
        await client.query(`
            CREATE TABLE IF NOT EXISTS identity_links (
                id SERIAL PRIMARY KEY,
                follower_id VARCHAR(40) REFERENCES identities(uuid),
                followed_id VARCHAR(40) REFERENCES identities(uuid),
                linked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(follower_id, followed_id)
            );
        `);

        console.log('\x1b[32m[SUCCESS]\x1b[0m Esquemas sincronizados en ECNHACA.SITE.');
    } catch (err) {
        console.error('\x1b[31m[ERROR]\x1b[0m Fallo en inicialización de DB:', err.message);
    } finally {
        client.release();
    }
};
initializeGlobalSchema();

/**
 * 3. CONTROLADORES DE IDENTIDAD
 */
app.post('/api/v1/auth/register', async (req, res) => {
    const { user, email, password } = req.body;
    try {
        const uuid = "CX-" + Math.random().toString(36).substring(2, 15).toUpperCase();
        const colors = ['#2563eb', '#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#10b981'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        const query = `
            INSERT INTO identities (uuid, handle, email, password_hash, design_hex) 
            VALUES ($1, $2, $3, $4, $5) RETURNING uuid;
        `;
        await pool.query(query, [uuid, user.trim(), email.toLowerCase().trim(), password, randomColor]);
        res.status(201).json({ success: true, message: "Registro completado en el Core." });
    } catch (err) {
        res.status(409).json({ error: "Conflicto: Identificador o email duplicado." });
    }
});

app.post('/api/v1/auth/verify', async (req, res) => {
    const { credential, secret } = req.body;
    try {
        const query = 'SELECT * FROM identities WHERE email = $1 OR handle = $1';
        const result = await pool.query(query, [credential.toLowerCase().trim()]);

        if (result.rows.length === 0 || result.rows[0].password_hash !== secret) {
            return res.status(401).json({ error: "Credenciales de acceso inválidas." });
        }

        const user = result.rows[0];
        res.json({
            success: true,
            user: {
                uuid: user.uuid,
                name: user.handle,
                role: user.status_tag,
                color: user.design_hex,
                bio: user.biography,
                stats: { followers: user.followers_total, following: user.following_total }
            }
        });
    } catch (err) {
        res.status(500).json({ error: "Fallo de comunicación con el nodo de datos." });
    }
});

/**
 * 4. MOTOR DE CONTENIDO (FEED)
 */
app.get('/api/v1/feed/global', async (req, res) => {
    try {
        const query = `
            SELECT f.*, i.handle, i.design_hex, i.status_tag 
            FROM core_feed f 
            JOIN identities i ON f.author_uuid = i.uuid 
            ORDER BY f.created_at DESC LIMIT 50;
        `;
        const result = await pool.query(query);
        res.json({ posts: result.rows });
    } catch (err) {
        res.status(500).json({ error: "No se pudo recuperar el flujo de datos." });
    }
});

app.post('/api/v1/feed/post', async (req, res) => {
    const { uuid, content } = req.body;
    if (!content || content.length < 1) return res.status(400).json({ error: "Contenido vacío." });

    try {
        const query = 'INSERT INTO core_feed (author_uuid, content_text) VALUES ($1, $2) RETURNING *';
        const result = await pool.query(query, [uuid, content]);
        res.status(201).json({ success: true, post: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: "Error al publicar en el Core." });
    }
});

/**
 * 5. BÚSQUEDA Y DIRECTORIO
 */
app.get('/api/v1/directory/search', async (req, res) => {
    const q = req.query.q ? `%${req.query.q}%` : '';
    try {
        const query = `
            SELECT uuid, handle, design_hex, status_tag 
            FROM identities 
            WHERE handle ILIKE $1 OR uuid ILIKE $1 
            LIMIT 15;
        `;
        const result = await pool.query(query, [q]);
        res.json({ results: result.rows });
    } catch (err) {
        res.status(500).json({ error: "Fallo en la indexación." });
    }
});

server.listen(PORT, () => console.log(`[SYSTEM] Global Core Online | Port ${PORT}`));
