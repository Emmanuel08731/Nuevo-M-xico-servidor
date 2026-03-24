/**
 * ==============================================================================
 * GLOBAL CORE INFRASTRUCTURE - V20.0.1
 * ENTERPRISE ARCHITECTURE | ECNHACA.SITE
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

// CONFIGURACIÓN DE CLÚSTER DE BASE DE DATOS
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 50,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(express.json({ limit: '100mb' }));
app.use(express.static(path.join(__dirname, 'public')));

/**
 * SINCRONIZACIÓN DE ESQUEMAS DE ALTA DISPONIBILIDAD
 */
const initializeDatabaseSchema = async () => {
    const client = await pool.connect();
    try {
        console.log('\x1b[34m[SYSTEM]\x1b[0m Validando integridad de tablas...');
        
        // Tabla de Usuarios Maestro
        await client.query(`
            CREATE TABLE IF NOT EXISTS global_users (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(30) UNIQUE NOT NULL,
                handle VARCHAR(60) UNIQUE NOT NULL,
                email VARCHAR(120) UNIQUE NOT NULL,
                password_vault TEXT NOT NULL,
                badge_type VARCHAR(40) DEFAULT 'Member',
                hex_theme VARCHAR(20) DEFAULT '#2563eb',
                bio_content TEXT DEFAULT 'User of Global Core.',
                count_followers INTEGER DEFAULT 0,
                count_following INTEGER DEFAULT 0,
                is_verified_id BOOLEAN DEFAULT false,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Tabla de Publicaciones (Feed)
        await client.query(`
            CREATE TABLE IF NOT EXISTS global_posts (
                id SERIAL PRIMARY KEY,
                author_id VARCHAR(30) REFERENCES global_users(user_id),
                content_text TEXT NOT NULL,
                asset_url TEXT,
                likes_count INTEGER DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Tabla de Conexiones Sociales
        await client.query(`
            CREATE TABLE IF NOT EXISTS social_matrix (
                id SERIAL PRIMARY KEY,
                follower_uid VARCHAR(30) REFERENCES global_users(user_id),
                followed_uid VARCHAR(30) REFERENCES global_users(user_id),
                timestamp_link TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(follower_uid, followed_uid)
            );
        `);

        console.log('\x1b[32m[SUCCESS]\x1b[0m Infraestructura de datos vinculada.');
    } catch (err) {
        console.error('\x1b[31m[CRITICAL]\x1b[0m Error en Sincronización:', err.message);
    } finally {
        client.release();
    }
};
initializeDatabaseSchema();

/**
 * RUTAS DE SERVICIOS CORE
 */
app.post('/api/v1/identity/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const uid = "USR-" + Math.random().toString(36).substring(2, 15).toUpperCase();
        const colors = ['#2563eb', '#7c3aed', '#db2777', '#10b981', '#f59e0b'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        const query = `
            INSERT INTO global_users (user_id, handle, email, password_vault, hex_theme) 
            VALUES ($1, $2, $3, $4, $5) RETURNING user_id;
        `;
        const values = [uid, username.trim(), email.toLowerCase().trim(), password, randomColor];
        
        await pool.query(query, values);
        res.status(201).json({ success: true, message: "Identidad sincronizada." });
    } catch (err) {
        res.status(409).json({ error: "El identificador o correo ya están en uso." });
    }
});

app.post('/api/v1/identity/login', async (req, res) => {
    const { credential, secret } = req.body;
    try {
        const query = 'SELECT * FROM global_users WHERE email = $1 OR handle = $1';
        const result = await pool.query(query, [credential.toLowerCase().trim()]);

        if (result.rows.length === 0 || result.rows[0].password_vault !== secret) {
            return res.status(401).json({ error: "Fallo de validación de credenciales." });
        }

        const user = result.rows[0];
        res.json({
            success: true,
            data: {
                uid: user.user_id,
                name: user.handle,
                role: user.badge_type,
                color: user.hex_theme,
                bio: user.bio_content,
                verified: user.is_verified_id,
                stats: { followers: user.count_followers, following: user.count_following }
            }
        });
    } catch (err) {
        res.status(500).json({ error: "Error de servidor en el módulo de acceso." });
    }
});

app.get('/api/v1/directory/search', async (req, res) => {
    const term = req.query.q ? `%${req.query.q}%` : '';
    if (!term) return res.json({ items: [] });
    try {
        const query = `
            SELECT user_id, handle, badge_type, hex_theme, is_verified_id 
            FROM global_users 
            WHERE handle ILIKE $1 OR user_id ILIKE $1 
            LIMIT 12;
        `;
        const result = await pool.query(query, [term]);
        res.json({ items: result.rows });
    } catch (err) {
        res.status(500).json({ error: "Fallo en el motor de indexación." });
    }
});

server.listen(PORT, () => {
    console.log(`[CORE] Online - Port: ${PORT}`);
});
