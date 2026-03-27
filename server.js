/**
 * ECNHACA BACKEND CORE v4.0 - Emmanuel Store Oficial
 * ARCHIVO: server.js | LÍNEAS ESTIMADAS: 150
 * Descripción: Manejo de API REST, PostgreSQL y Seguridad de Sesiones.
 */

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet'); // Seguridad extra
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

// Configuración de Seguridad y Middlewares
app.use(cors());
app.use(express.json());
app.use(helmet({ contentSecurityPolicy: false })); // Permite cargar recursos externos como FontAwesome
app.use(express.static(path.join(__dirname, 'public')));

// Pool de Conexión a Render (Postgres)
const pool = new Pool({
    connectionString: 'postgres://base_datos_global_user:mEDJcu2NtduJqv662gaUvOIuPDh1HFi3@dpg-d6u5u3fkijhs73fhh1hg-a.oregon-postgres.render.com/base_datos_global',
    ssl: { rejectUnauthorized: false },
    max: 20, // Máximo de conexiones simultáneas
    idleTimeoutMillis: 30000
});

// Verificación de Conexión Inicial
pool.connect((err, client, release) => {
    if (err) return console.error('❌ Error de conexión a DB:', err.stack);
    console.log('✅ Conexión exitosa a la Base de Datos de Emmanuel');
    release();
});

// Esquema de Base de Datos - Auto-instalación
const initSchema = async () => {
    const query = `
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password TEXT NOT NULL,
            color VARCHAR(20) DEFAULT '#6366f1',
            bio TEXT DEFAULT 'Nuevo en Ecnhaca. ¡Hola a todos!',
            followers_count INTEGER DEFAULT 0,
            following_count INTEGER DEFAULT 0,
            is_verified BOOLEAN DEFAULT false,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS follows (
            id SERIAL PRIMARY KEY,
            follower_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            following_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(follower_id, following_id)
        );
    `;
    try {
        await pool.query(query);
        console.log("🚀 Tablas de Ecnhaca listas para operar.");
    } catch (e) { console.error("Error inicializando tablas:", e); }
};
initSchema();

// --- ENDPOINTS DE AUTENTICACIÓN ---

app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;
    if(!username || !email || !password) return res.status(400).json({ error: "Todos los campos son obligatorios." });

    try {
        const check = await pool.query("SELECT id FROM users WHERE username = $1 OR email = $2", [username.toLowerCase(), email.toLowerCase()]);
        if(check.rows.length > 0) return res.status(409).json({ error: "El usuario o email ya existe." });

        const colors = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4', '#2ecc71', '#34495e'];
        const userColor = colors[Math.floor(Math.random() * colors.length)];

        const result = await pool.query(
            "INSERT INTO users (username, email, password, color) VALUES ($1, $2, $3, $4) RETURNING *",
            [username.toLowerCase().trim(), email.toLowerCase().trim(), password, userColor]
        );
        res.status(201).json({ success: true, user: result.rows[0] });
    } catch (e) { res.status(500).json({ error: "Error interno en el servidor." }); }
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query("SELECT * FROM users WHERE username = $1", [username.toLowerCase().trim()]);
        if(result.rows.length === 0) return res.status(404).json({ error: "La cuenta de usuario no existe." });

        const user = result.rows[0];
        if(user.password !== password) return res.status(401).json({ error: "La contraseña es incorrecta." });

        res.json({ success: true, user: user });
    } catch (e) { res.status(500).json({ error: "Error al intentar iniciar sesión." }); }
});

// --- ENDPOINTS SOCIALES ---

app.get('/api/search', async (req, res) => {
    const { q, myId } = req.query;
    try {
        const queryStr = `%${q}%`;
        const result = await pool.query(`
            SELECT id, username, color, followers_count,
            (SELECT COUNT(*) FROM follows WHERE follower_id = $2 AND following_id = users.id) as is_following
            FROM users WHERE (username ILIKE $1 OR username ILIKE $3) AND id != $2 
            ORDER BY followers_count DESC LIMIT 30`, 
            [queryStr, myId, `${q.charAt(0)}%`]); // Busca similares por inicial si no hay coincidencia exacta
        res.json(result.rows);
    } catch (e) { res.status(500).send("Error de búsqueda"); }
});

app.post('/api/follow-toggle', async (req, res) => {
    const { myId, targetId } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN'); // Inicia Transacción
        const check = await client.query("SELECT id FROM follows WHERE follower_id = $1 AND following_id = $2", [myId, targetId]);
        
        if (check.rows.length > 0) {
            await client.query("DELETE FROM follows WHERE follower_id = $1 AND following_id = $2", [myId, targetId]);
            await client.query("UPDATE users SET followers_count = followers_count - 1 WHERE id = $1", [targetId]);
            await client.query("UPDATE users SET following_count = following_count - 1 WHERE id = $1", [myId]);
            await client.query('COMMIT');
            res.json({ action: 'unfollowed' });
        } else {
            await client.query("INSERT INTO follows (follower_id, following_id) VALUES ($1, $2)", [myId, targetId]);
            await client.query("UPDATE users SET followers_count = followers_count + 1 WHERE id = $1", [targetId]);
            await client.query("UPDATE users SET following_count = following_count + 1 WHERE id = $1", [myId]);
            await client.query('COMMIT');
            res.json({ action: 'followed' });
        }
    } catch (e) { 
        await client.query('ROLLBACK');
        res.status(500).send("Error en la transacción"); 
    } finally { client.release(); }
});

app.get('/api/user/:id', async (req, res) => {
    try {
        const resUser = await pool.query("SELECT id, username, color, bio, followers_count, following_count, created_at FROM users WHERE id = $1", [req.params.id]);
        res.json(resUser.rows[0]);
    } catch (e) { res.status(404).send("Usuario no encontrado"); }
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.listen(PORT, () => console.log(`🚀 Ecnhaca v4 corriendo en puerto ${PORT}`));
