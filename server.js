/**
 * ==============================================================================
 * DEVROOT KERNEL - VERSION 18.0.2 (POSTGRESQL INDUSTRIAL)
 * CORE ARCHITECTURE BY EMMANUEL | DOMAIN: ecnhaca.site
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

// 1. CONFIGURACIÓN DEL POOL DE CONEXIÓN (POSTGRESQL)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 20, // Máximo de conexiones simultáneas
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// 2. MIDDLEWARES DE CAPA EMPRESARIAL
app.use(helmet({ contentSecurityPolicy: false })); // Seguridad de headers
app.use(compression()); // Compresión Gzip para velocidad
app.use(express.json({ limit: '50mb' })); // Soporte para archivos grandes
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

/**
 * 3. MOTOR DE SINCRONIZACIÓN DE ESQUEMAS (SQL)
 * Este bloque asegura que las tablas existan con los tipos de datos correctos.
 */
const syncDatabaseNode = async () => {
    const client = await pool.connect();
    try {
        console.log('\x1b[33m[SYSTEM]\x1b[0m Iniciando secuencia de sincronización...');
        
        // Tabla de Usuarios Maestro
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                uid VARCHAR(20) UNIQUE NOT NULL,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password TEXT NOT NULL,
                rank VARCHAR(30) DEFAULT 'Developer',
                bio TEXT DEFAULT 'Miembro de la red DevRoot Onyx.',
                avatar_color VARCHAR(10) DEFAULT '#0052ff',
                followers_count INTEGER DEFAULT 0,
                following_count INTEGER DEFAULT 0,
                is_verified BOOLEAN DEFAULT false,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Tabla de Relaciones (Seguidores)
        await client.query(`
            CREATE TABLE IF NOT EXISTS social_graph (
                id SERIAL PRIMARY KEY,
                follower_id VARCHAR(20) REFERENCES users(uid),
                following_id VARCHAR(20) REFERENCES users(uid),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(follower_id, following_id)
            );
        `);

        console.log('\x1b[32m[SUCCESS]\x1b[0m Nodo PostgreSQL ecnhaca.site vinculado con éxito.');
    } catch (err) {
        console.error('\x1b[31m[CRITICAL]\x1b[0m Error en Sincronización:', err.message);
    } finally {
        client.release();
    }
};
syncDatabaseNode();

/**
 * 4. CONTROLADORES DE AUTENTICACIÓN (AUTH CONTROLLERS)
 */
app.post('/api/v1/auth/signup', async (req, res) => {
    const { user, email, password } = req.body;
    
    // Validaciones de seguridad de servidor
    if (!user || user.length < 3) return res.status(400).json({ error: "Nombre de usuario inválido (min 3 chars)." });
    if (!email.includes('@')) return res.status(400).json({ error: "Formato de correo electrónico no soportado." });
    if (password.length < 6) return res.status(400).json({ error: "La clave debe ser de alta seguridad (min 6)." });

    try {
        const uid = "DR-" + Math.random().toString(36).substring(2, 10).toUpperCase();
        const colors = ['#0052ff', '#7c3aed', '#db2777', '#2563eb', '#059669'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        const query = `
            INSERT INTO users (uid, username, email, password, avatar_color) 
            VALUES ($1, $2, $3, $4, $5) RETURNING uid, username;
        `;
        const values = [uid, user.trim(), email.toLowerCase().trim(), password, randomColor];
        
        const result = await pool.query(query, values);
        res.status(201).json({ 
            success: true, 
            message: "Identidad creada en el clúster Onyx.",
            data: result.rows[0] 
        });
    } catch (err) {
        if (err.code === '23505') {
            res.status(409).json({ error: "Conflicto: El usuario o email ya está registrado." });
        } else {
            res.status(500).json({ error: "Fallo crítico en el motor de persistencia." });
        }
    }
});

app.post('/api/v1/auth/login', async (req, res) => {
    const { identity, password } = req.body;
    if (!identity || !password) return res.status(400).json({ error: "Credenciales incompletas." });

    try {
        const query = 'SELECT * FROM users WHERE email = $1 OR username = $1';
        const result = await pool.query(query, [identity.toLowerCase().trim()]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Nodo de identidad no hallado." });
        }

        const user = result.rows[0];
        if (user.password !== password) {
            return res.status(401).json({ error: "Fallo de autenticación: Clave incorrecta." });
        }

        res.json({
            success: true,
            user: {
                uid: user.uid,
                name: user.username,
                rank: user.rank,
                color: user.avatar_color,
                bio: user.bio,
                stats: {
                    followers: user.followers_count,
                    following: user.following_count
                }
            }
        });
    } catch (err) {
        res.status(500).json({ error: "Error de comunicación con el nodo SQL." });
    }
});

/**
 * 5. MOTOR DE BÚSQUEDA AVANZADA (FULL-TEXT SEARCH)
 */
app.get('/api/v1/search/global', async (req, res) => {
    const searchVal = req.query.q ? `%${req.query.q}%` : '';
    if (!searchVal) return res.json({ results: { people: [] } });

    try {
        const query = `
            SELECT uid, username, rank, avatar_color, is_verified 
            FROM users 
            WHERE username ILIKE $1 OR uid ILIKE $1 
            ORDER BY is_verified DESC, username ASC 
            LIMIT 8;
        `;
        const result = await pool.query(query, [searchVal]);
        
        const people = result.rows.map(r => ({
            id: r.uid,
            name: r.username,
            rank: r.rank,
            color: r.avatar_color,
            verified: r.is_verified
        }));

        res.json({ results: { people, posts: [] } });
    } catch (err) {
        res.status(500).json({ error: "El motor de búsqueda está temporalmente fuera de línea." });
    }
});

// 6. INICIO DE SERVIDOR
server.listen(PORT, () => {
    console.log(`
    \x1b[34m╔════════════════════════════════════════════════════════╗
    \x1b[34m║\x1b[0m  DEVROOT ONYX KERNEL ONLINE - PORT: ${PORT}          \x1b[34m║
    \x1b[34m║\x1b[0m  DOMINIO: ecnhaca.site                              \x1b[34m║
    \x1b[34m║\x1b[0m  DB: PostgreSQL Cloud Managed                       \x1b[34m║
    \x1b[34m╚════════════════════════════════════════════════════════╝\x1b[0m
    `);
});
