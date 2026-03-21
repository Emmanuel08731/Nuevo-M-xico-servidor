/**
 * ==============================================================================
 * DEVROOT CORE ENGINE v6.0 - PREMIUM EDITION
 * AUTHOR: EMMANUEL (DIRECTOR)
 * YEAR: 2026
 * LICENSE: ENTERPRISE
 * ==============================================================================
 */

const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 10000;

// --- CONFIGURACIÓN DE SEGURIDAD Y RENDIMIENTO ---
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// --- CONEXIÓN A POSTGRESQL (RENDER) ---
const pool = new Pool({
    connectionString: 'postgresql://base_datos_global_user:mEDJcu2NtduJqv662gaUvOIuPDh1HFi3@dpg-d6u5u3fkijhs73fhh1hg-a/base_datos_global',
    ssl: { rejectUnauthorized: false },
    max: 30,
    idleTimeoutMillis: 30000,
});

/**
 * PROTOCOLO DE LIMPIEZA Y ESTRUCTURA (BOOTSTRAP)
 * Usamos "devroot_v1" para asegurar que la base de datos esté VACÍA al iniciar.
 */
async function bootstrap() {
    console.log("----------------------------------------------------------------");
    console.log("🚀 [SYSTEM] Inicializando Ecosistema DevRoot v6.0...");
    
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Tabla de Usuarios (Nueva y Vacía)
        await client.query(`
            CREATE TABLE IF NOT EXISTS devroot_users_v1 (
                id SERIAL PRIMARY KEY,
                username VARCHAR(100) NOT NULL,
                email VARCHAR(150) UNIQUE NOT NULL,
                password TEXT NOT NULL,
                bio TEXT DEFAULT 'Hola, soy un nuevo desarrollador en DevRoot.',
                avatar_color TEXT DEFAULT '#0066ff',
                followers_count INTEGER DEFAULT 0,
                is_verified BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 2. Tabla de Publicaciones (Feed)
        await client.query(`
            CREATE TABLE IF NOT EXISTS devroot_posts_v1 (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES devroot_users_v1(id) ON DELETE CASCADE,
                content TEXT NOT NULL,
                likes INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await client.query('COMMIT');
        console.log("✨ [DB] Tablas sincronizadas. El sistema está 100% LIMPIO.");
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("🚨 [CRITICAL ERROR] Fallo en el despliegue de tablas:", err.message);
    } finally {
        client.release();
    }
    console.log("----------------------------------------------------------------");
}
bootstrap();

// --- API: SISTEMA DE AUTENTICACIÓN ---

// Registro de usuarios
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        if (!username || !email || !password) {
            return res.status(400).json({ success: false, error: 'Faltan datos obligatorios.' });
        }

        const hash = await bcrypt.hash(password, 12);
        const result = await pool.query(
            'INSERT INTO devroot_users_v1 (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email',
            [username, email, hash]
        );

        console.log(`👤 [NEW NODE] Usuario creado: ${username}`);
        res.json({ success: true, user: result.rows[0] });
    } catch (e) {
        console.error("Error en registro:", e.message);
        res.status(400).json({ success: false, error: 'El email ya está registrado o hay un error de red.' });
    }
});

// Login Profesional
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM devroot_users_v1 WHERE email = $1', [email]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, msg: 'Usuario no encontrado.' });
        }

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {
            res.json({
                success: true,
                user: {
                    id: user.id,
                    name: user.username,
                    email: user.email,
                    verified: user.is_verified,
                    followers: user.followers_count
                }
            });
        } else {
            res.status(401).json({ success: false, msg: 'Contraseña incorrecta.' });
        }
    } catch (e) {
        res.status(500).json({ success: false, msg: 'Error interno del servidor.' });
    }
});

// --- API: SISTEMA DE FEED ---

// Crear una publicación
app.post('/api/posts/create', async (req, res) => {
    const { user_id, content } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO devroot_posts_v1 (user_id, content) VALUES ($1, $2) RETURNING *',
            [user_id, content]
        );
        res.json({ success: true, post: result.rows[0] });
    } catch (e) {
        res.status(500).json({ success: false });
    }
});

// Obtener todas las publicaciones
app.get('/api/posts/all', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT p.*, u.username, u.is_verified 
            FROM devroot_posts_v1 p 
            JOIN devroot_users_v1 u ON p.user_id = u.id 
            ORDER BY p.created_at DESC
        `);
        res.json({ success: true, posts: result.rows });
    } catch (e) {
        res.status(500).json({ success: false });
    }
});

// --- MANEJO DE RUTAS FRONTEND ---
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`✅ [DEVROOT ONLINE] Sistema activo en el puerto ${PORT}`);
});
