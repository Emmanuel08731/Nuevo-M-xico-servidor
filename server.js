/**
 * ==============================================================================
 * ECNHACA CORE SYSTEM - ARQUITECTURA ELITE v50.0
 * DESARROLLADO POR: EMMANUEL
 * ==============================================================================
 */

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

// MIDDLEWARES DE ALTO RENDIMIENTO
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// CONEXIÓN A POSTGRESQL (RENDER)
const pool = new Pool({
    connectionString: 'postgres://base_datos_global_user:mEDJcu2NtduJqv662gaUvOIuPDh1HFi3@dpg-d6u5u3fkijhs73fhh1hg-a.oregon-postgres.render.com/base_datos_global',
    ssl: { rejectUnauthorized: false },
    max: 100,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

/**
 * PROTOCOLO DE PURGA Y RECONSTRUCCIÓN DE BASE DE DATOS
 * SE EJECUTA AL INICIAR EL SERVIDOR PARA LIMPIAR TODAS LAS CUENTAS
 */
const initializeDatabase = async () => {
    const client = await pool.connect();
    try {
        console.log("--------------------------------------------------");
        console.log("[SISTEMA] INICIANDO PURGA TOTAL DE ECNHACA...");
        await client.query('BEGIN');
        
        // ELIMINACIÓN DE TABLAS EXISTENTES
        await client.query('DROP TABLE IF EXISTS comments CASCADE');
        await client.query('DROP TABLE IF EXISTS followers CASCADE');
        await client.query('DROP TABLE IF EXISTS likes CASCADE');
        await client.query('DROP TABLE IF EXISTS posts CASCADE');
        await client.query('DROP TABLE IF EXISTS users CASCADE');
        
        // CREACIÓN DE TABLA DE USUARIOS
        await client.query(`
            CREATE TABLE users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                avatar_color VARCHAR(20) DEFAULT '#007aff',
                bio TEXT DEFAULT 'Developer en Ecnhaca Platform',
                reputation INTEGER DEFAULT 0,
                followers_count INTEGER DEFAULT 0,
                following_count INTEGER DEFAULT 0,
                membership VARCHAR(20) DEFAULT 'Standard',
                is_admin BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // CREACIÓN DE TABLA DE PUBLICACIONES
        await client.query(`
            CREATE TABLE posts (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                category VARCHAR(50) NOT NULL,
                media_url TEXT,
                likes_count INTEGER DEFAULT 0,
                comments_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // CREACIÓN DE TABLA DE SEGUIDORES
        await client.query(`
            CREATE TABLE followers (
                follower_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                following_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (follower_id, following_id)
            );
        `);

        await client.query('COMMIT');
        console.log("[SISTEMA] TABLAS CREADAS Y DATOS PURGADOS.");
        console.log("--------------------------------------------------");
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("[ERROR CRÍTICO] Fallo en la base de datos:", err);
    } finally {
        client.release();
    }
};

// EJECUTAR PURGA AL ARRANCAR
initializeDatabase();

/**
 * RUTAS DE AUTENTICACIÓN
 */

app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({ success: false, error: "Todos los campos son obligatorios." });
    }

    try {
        const userLower = username.toLowerCase().trim();
        const emailLower = email.toLowerCase().trim();

        // Verificar duplicados
        const check = await pool.query("SELECT id FROM users WHERE username = $1 OR email = $2", [userLower, emailLower]);
        if (check.rows.length > 0) {
            return res.status(409).json({ success: false, error: "El usuario o el email ya están registrados." });
        }

        const colors = ['#FF3B30', '#34C759', '#007AFF', '#AF52DE', '#FF9500', '#5856D6', '#00C7BE', '#FF2D55'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        const result = await pool.query(
            "INSERT INTO users (username, email, password_hash, avatar_color) VALUES ($1, $2, $3, $4) RETURNING id, username, avatar_color",
            [userLower, emailLower, password, randomColor]
        );

        res.status(201).json({ success: true, user: result.rows[0] });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, error: "Error interno en el servidor de registro." });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ success: false, error: "Faltan credenciales." });
    }

    try {
        const identifier = username.toLowerCase().trim();
        const result = await pool.query(
            "SELECT * FROM users WHERE username = $1 OR email = $1", 
            [identifier]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: "El usuario no existe." });
        }

        const user = result.rows[0];
        if (user.password_hash !== password) {
            return res.status(401).json({ success: false, error: "Contraseña incorrecta." });
        }

        res.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                color: user.avatar_color,
                membership: user.membership
            }
        });
    } catch (e) {
        res.status(500).json({ success: false, error: "Error en el sistema de acceso." });
    }
});

/**
 * MOTOR DE BÚSQUEDA SEGMENTADA
 */
app.get('/api/search/engine', async (req, res) => {
    const { q, type, myId } = req.query;
    if (!q || q.length < 1) return res.json([]);

    const searchTerm = `%${q}%`;

    try {
        if (type === 'users') {
            const users = await pool.query(
                "SELECT id, username, avatar_color, bio, followers_count FROM users WHERE username ILIKE $1 AND id != $2 LIMIT 15",
                [searchTerm, myId]
            );
            return res.json(users.rows);
        } else {
            const posts = await pool.query(
                `SELECT p.*, u.username, u.avatar_color FROM posts p 
                 JOIN users u ON p.user_id = u.id 
                 WHERE p.title ILIKE $1 OR p.category ILIKE $1 LIMIT 15`,
                [searchTerm]
            );
            return res.json(posts.rows);
        }
    } catch (e) {
        res.status(500).send("Error en la búsqueda.");
    }
});

/**
 * SISTEMA SOCIAL: SEGUIR Y REPUTACIÓN
 */
app.post('/api/social/follow', async (req, res) => {
    const { followerId, followingId } = req.body;
    if (followerId === followingId) return res.status(400).send();

    try {
        await pool.query("BEGIN");
        const check = await pool.query("SELECT * FROM followers WHERE follower_id = $1 AND following_id = $2", [followerId, followingId]);
        
        if (check.rows.length > 0) {
            // Unfollow
            await pool.query("DELETE FROM followers WHERE follower_id = $1 AND following_id = $2", [followerId, followingId]);
            await pool.query("UPDATE users SET followers_count = followers_count - 1 WHERE id = $1", [followingId]);
            await pool.query("UPDATE users SET following_count = following_count - 1 WHERE id = $1", [followerId]);
            await pool.query("COMMIT");
            return res.json({ followed: false });
        } else {
            // Follow
            await pool.query("INSERT INTO followers (follower_id, following_id) VALUES ($1, $2)", [followerId, followingId]);
            await pool.query("UPDATE users SET followers_count = followers_count + 1 WHERE id = $1", [followingId]);
            await pool.query("UPDATE users SET following_count = following_count + 1 WHERE id = $1", [followerId]);
            await pool.query("COMMIT");
            return res.json({ followed: true });
        }
    } catch (e) {
        await pool.query("ROLLBACK");
        res.status(500).send();
    }
});

/**
 * GESTIÓN DE PUBLICACIONES Y MULTIMEDIA
 */
app.post('/api/posts/create', async (req, res) => {
    const { user_id, title, content, category, media } = req.body;
    try {
        await pool.query(
            "INSERT INTO posts (user_id, title, content, category, media_url) VALUES ($1, $2, $3, $4, $5)",
            [user_id, title, content, category, media]
        );
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: "No se pudo publicar." });
    }
});

app.get('/api/posts/feed', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT p.*, u.username, u.avatar_color, u.membership 
            FROM posts p 
            JOIN users u ON p.user_id = u.id 
            ORDER BY p.created_at DESC 
            LIMIT 50
        `);
        res.json(result.rows);
    } catch (e) {
        res.status(500).send();
    }
});

app.get('/api/users/profile/:id', async (req, res) => {
    try {
        const userRes = await pool.query("SELECT id, username, avatar_color, bio, followers_count, following_count, membership FROM users WHERE id = $1", [req.params.id]);
        const postRes = await pool.query("SELECT * FROM posts WHERE user_id = $1 ORDER BY created_at DESC", [req.params.id]);
        
        if (userRes.rows.length === 0) return res.status(404).json({ error: "Usuario no encontrado" });
        
        res.json({
            user: userRes.rows[0],
            posts: postRes.rows
        });
    } catch (e) {
        res.status(500).send();
    }
});

// LOGS DE ACTIVIDAD DEL SERVIDOR
app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.url} - ${new Date().toISOString()}`);
    next();
});

// GESTIÓN DE ERRORES GLOBALES
app.use((err, req, res, next) => {
    console.error("[CRASH DETECTADO]", err.stack);
    res.status(500).send('Algo salió mal en la infraestructura de Ecnhaca.');
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log("==================================================");
    console.log(` ECNHACA PLATFORM ACTIVA EN PUERTO: ${PORT}`);
    console.log(` ESTADO: OPERATIVO | SEGURIDAD: NIVEL 5`);
    console.log("==================================================");
});
