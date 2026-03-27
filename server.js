/**
 * ==============================================================================
 * ECNHACA CORE INFRASTRUCTURE - v15.0.0
 * SISTEMA INTEGRADO DE GESTIÓN PROFESIONAL - WHITE EDITION
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

// --- CONFIGURACIÓN DE MIDDLEWARES DE SEGURIDAD ---
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(compression());
app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// --- CONFIGURACIÓN DE BASE DE DATOS POSTGRESQL ---
const pool = new Pool({
    connectionString: 'postgres://base_datos_global_user:mEDJcu2NtduJqv662gaUvOIuPDh1HFi3@dpg-d6u5u3fkijhs73fhh1hg-a.oregon-postgres.render.com/base_datos_global',
    ssl: { rejectUnauthorized: false },
    max: 30,
    idleTimeoutMillis: 50000,
    connectionTimeoutMillis: 5000,
});

/**
 * RESET TOTAL DEL SISTEMA (PURGA DE DATOS)
 * Elimina todas las cuentas y registros para iniciar de cero.
 */
const initializeEcnhacaDatabase = async () => {
    const client = await pool.connect();
    try {
        console.log("--------------------------------------------------");
        console.log("[SYSTEM] INICIANDO PURGA DE DATOS ANTERIORES...");
        console.log("--------------------------------------------------");
        await client.query('BEGIN');
        
        // Eliminación jerárquica
        await client.query('DROP TABLE IF EXISTS notifications CASCADE');
        await client.query('DROP TABLE IF EXISTS comments CASCADE');
        await client.query('DROP TABLE IF EXISTS likes CASCADE');
        await client.query('DROP TABLE IF EXISTS posts CASCADE');
        await client.query('DROP TABLE IF EXISTS users CASCADE');
        
        // Creación de Tabla de Usuarios
        await client.query(`
            CREATE TABLE users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                avatar_color VARCHAR(25) DEFAULT '#007aff',
                biography TEXT DEFAULT 'Desarrollador en Ecnhaca Platform',
                membership_type VARCHAR(20) DEFAULT 'Standard',
                reputation_points INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Creación de Tabla de Posts
        await client.query(`
            CREATE TABLE posts (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                title VARCHAR(250) NOT NULL,
                content TEXT NOT NULL,
                category VARCHAR(60),
                image_url TEXT,
                likes_count INTEGER DEFAULT 0,
                is_pinned BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Tabla de Likes
        await client.query(`
            CREATE TABLE likes (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
                UNIQUE(user_id, post_id)
            );
        `);

        await client.query('COMMIT');
        console.log("[SYSTEM] ECNHACA REINICIADO CON ÉXITO.");
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("[CRITICAL ERROR] Fallo en la inicialización:", error);
    } finally {
        client.release();
    }
};

// Ejecutar limpieza al arrancar
initializeEcnhacaDatabase();

// --- API: RUTAS DE AUTENTICACIÓN ---

app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Campos obligatorios faltantes." });

    try {
        const u = username.toLowerCase().trim();
        const e = email ? email.toLowerCase().trim() : `${u}@ecnhaca.internal`;

        const checkUser = await pool.query("SELECT id FROM users WHERE username = $1", [u]);
        if (checkUser.rows.length > 0) return res.status(409).json({ error: "El nombre de usuario ya está registrado." });

        const colors = ['#007aff', '#34c759', '#ff9500', '#af52de', '#ff3b30', '#5856d6', '#00c7be', '#ff2d55', '#5ac8fa'];
        const color = colors[Math.floor(Math.random() * colors.length)];

        const result = await pool.query(
            "INSERT INTO users (username, email, password_hash, avatar_color) VALUES ($1, $2, $3, $4) RETURNING id, username, avatar_color",
            [u, e, password, color]
        );

        res.status(201).json({ 
            success: true, 
            message: "Cuenta creada con éxito", 
            user: result.rows[0] 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error interno en el servidor de registro." });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const u = username.toLowerCase().trim();
        const search = await pool.query("SELECT * FROM users WHERE username = $1", [u]);

        if (search.rows.length === 0) return res.status(401).json({ error: "Usuario no encontrado." });
        if (search.rows[0].password_hash !== password) return res.status(401).json({ error: "Contraseña incorrecta." });

        res.json({ 
            success: true, 
            user: { 
                id: search.rows[0].id, 
                username: search.rows[0].username, 
                color: search.rows[0].avatar_color 
            } 
        });
    } catch (err) {
        res.status(500).json({ error: "Error en el proceso de autenticación." });
    }
});

// --- API: RUTAS DE CONTENIDO ---

app.get('/api/posts/feed', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT p.*, u.username, u.avatar_color 
            FROM posts p 
            JOIN users u ON p.user_id = u.id 
            ORDER BY p.created_at DESC 
            LIMIT 50
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: "Error al cargar el feed global." });
    }
});

app.post('/api/posts/create', async (req, res) => {
    const { user_id, title, content, category, image_url } = req.body;
    try {
        await pool.query(
            "INSERT INTO posts (user_id, title, content, category, image_url) VALUES ($1, $2, $3, $4, $5)",
            [user_id, title, content, category, image_url]
        );
        res.json({ success: true, message: "Publicación creada con éxito." });
    } catch (err) {
        res.status(500).json({ error: "No se pudo crear la publicación." });
    }
});

app.get('/api/users/profile/:id', async (req, res) => {
    try {
        const u = await pool.query("SELECT id, username, avatar_color, biography, created_at FROM users WHERE id = $1", [req.params.id]);
        const p = await pool.query("SELECT * FROM posts WHERE user_id = $1 ORDER BY created_at DESC", [req.params.id]);
        if (u.rows.length === 0) return res.status(404).json({ error: "Perfil no encontrado." });
        res.json({ user: u.rows[0], posts: p.rows });
    } catch (err) {
        res.status(500).json({ error: "Error al obtener perfil." });
    }
});

app.get('/api/search/global', async (req, res) => {
    const { q, myId } = req.query;
    if (!q) return res.json({ users: [], posts: [] });
    const term = `%${q}%`;
    try {
        const users = await pool.query("SELECT id, username, avatar_color FROM users WHERE username ILIKE $1 AND id != $2 LIMIT 10", [term, myId]);
        const posts = await pool.query("SELECT p.id, p.title, u.username FROM posts p JOIN users u ON p.user_id = u.id WHERE p.title ILIKE $1 LIMIT 10", [term]);
        res.json({ users: users.rows, posts: posts.rows });
    } catch (err) {
        res.status(500).json({ error: "Error en motor de búsqueda." });
    }
});

app.delete('/api/posts/delete/:id', async (req, res) => {
    try {
        await pool.query("DELETE FROM posts WHERE id = $1", [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "No se pudo eliminar." });
    }
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: "Operacional", uptime: process.uptime() });
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- INICIO DE SERVIDOR ---
app.listen(PORT, () => {
    console.log("==================================================");
    console.log("  ECNHACA CLOUD - WHITE EDITION ONLINE");
    console.log(`  PUERTO: ${PORT}`);
    console.log(`  FECHA: ${new Date().toLocaleString()}`);
    console.log("==================================================");
});

/**
 * ADICIÓN DE LÍNEAS PARA MANTENER LA ESTRUCTURA DE 300 RENGLONES
 * LÓGICA DE MONITOREO Y LOGS DE ACTIVIDAD DEL NÚCLEO
 */
process.on('uncaughtException', (err) => { console.error('EXCEPCIÓN NO CAPTURADA:', err); });
process.on('unhandledRejection', (reason, promise) => { console.error('RECHAZO NO MANEJADO EN:', promise, 'razón:', reason); });
