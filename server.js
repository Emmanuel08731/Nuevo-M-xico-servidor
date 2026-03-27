/**
 * ==============================================================================
 * ECNHACA TITAN SERVER - V100.0 (ADMIN OVERRIDE)
 * DESARROLLADO POR: EMMANUEL | STATUS: MASTER ACCESS
 * ==============================================================================
 */

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

// CONFIGURACIÓN DE SEGURIDAD Y RENDIMIENTO
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// CONEXIÓN A POSTGRESQL
const pool = new Pool({
    connectionString: 'postgres://base_datos_global_user:mEDJcu2NtduJqv662gaUvOIuPDh1HFi3@dpg-d6u5u3fkijhs73fhh1hg-a.oregon-postgres.render.com/base_datos_global',
    ssl: { rejectUnauthorized: false },
});

/**
 * PROTOCOLO DE RECONSTRUCCIÓN CON CUENTA ADMIN PREDEFINIDA
 */
const initSystem = async () => {
    const client = await pool.connect();
    try {
        console.log(">>> [ADMIN SYSTEM] INICIANDO DESPLIEGUE V100.0...");
        await client.query('BEGIN');
        
        // Limpieza profunda
        await client.query('DROP TABLE IF EXISTS posts CASCADE');
        await client.query('DROP TABLE IF EXISTS users CASCADE');
        
        // Tabla de Usuarios
        await client.query(`
            CREATE TABLE users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                avatar_color VARCHAR(20) DEFAULT '#007aff',
                role VARCHAR(20) DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Tabla de Posts
        await client.query(`
            CREATE TABLE posts (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                category VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // INYECCIÓN DE CUENTA ADMIN (EMMANUEL)
        await client.query(`
            INSERT INTO users (username, email, password_hash, avatar_color, role) 
            VALUES ($1, $2, $3, $4, $5)
        `, ['Dev_Emmanuel', 'emma2013rq@gmail.com', 'emma06E', '#FF3B30', 'admin']);

        await client.query('COMMIT');
        console.log(">>> [ADMIN SYSTEM] CUENTA MAESTRA ACTIVADA.");
    } catch (e) {
        await client.query('ROLLBACK');
        console.error("Error crítico de inicio:", e);
    } finally { client.release(); }
};
initSystem();

/** * AUTENTICACIÓN CON VALIDACIÓN DE DUPLICADOS
 */
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const u = username.toLowerCase().trim();
        const e = email.toLowerCase().trim();

        // 1. Verificar si ya existe el nombre o email
        const check = await pool.query("SELECT * FROM users WHERE username = $1 OR email = $2", [u, e]);
        if (check.rows.length > 0) {
            return res.status(409).json({ 
                success: false, 
                error: "El nombre de usuario o el correo ya están registrados en el sistema." 
            });
        }

        const colors = ['#007aff', '#ff2d55', '#af52de', '#ff9500', '#34c759'];
        const c = colors[Math.floor(Math.random() * colors.length)];
        
        const result = await pool.query(
            "INSERT INTO users (username, email, password_hash, avatar_color) VALUES ($1, $2, $3, $4) RETURNING id, username, role, avatar_color",
            [u, e, password, c]
        );
        res.json({ success: true, user: result.rows[0] });
    } catch (e) {
        res.status(500).json({ success: false, error: "Error en la base de datos." });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const u = username.toLowerCase().trim();
        const user = await pool.query("SELECT * FROM users WHERE username = $1 OR email = $1", [u]);
        
        if (user.rows.length > 0 && user.rows[0].password_hash === password) {
            res.json({ 
                success: true, 
                user: { 
                    id: user.rows[0].id, 
                    username: user.rows[0].username, 
                    role: user.rows[0].role, 
                    color: user.rows[0].avatar_color 
                } 
            });
        } else {
            res.status(401).json({ success: false, error: "Credenciales incorrectas." });
        }
    } catch (e) { res.status(500).json({ success: false }); }
});

/**
 * PANEL ADMIN - GESTIÓN DE USUARIOS
 */
app.get('/api/admin/users', async (req, res) => {
    // En producción aquí validaríamos un Token JWT de admin
    const users = await pool.query("SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC");
    res.json(users.rows);
});

app.delete('/api/admin/users/:id', async (req, res) => {
    const { id } = req.params;
    await pool.query("DELETE FROM users WHERE id = $1 AND role != 'admin'", [id]);
    res.json({ success: true });
});

// RUTAS DE POSTS (FEED Y MIS POSTS)
app.get('/api/posts/feed', async (req, res) => {
    const data = await pool.query("SELECT p.*, u.username, u.avatar_color FROM posts p JOIN users u ON p.user_id = u.id ORDER BY p.created_at DESC");
    res.json(data.rows);
});

app.get('/api/my-posts/:userId', async (req, res) => {
    const data = await pool.query("SELECT * FROM posts WHERE user_id = $1 ORDER BY created_at DESC", [req.params.userId]);
    res.json(data.rows);
});

app.post('/api/posts/create', async (req, res) => {
    const { user_id, title, content, category } = req.body;
    await pool.query("INSERT INTO posts (user_id, title, content, category) VALUES ($1, $2, $3, $4)", [user_id, title, content, category]);
    res.json({ success: true });
});

app.delete('/api/posts/:id', async (req, res) => {
    await pool.query("DELETE FROM posts WHERE id = $1", [req.params.id]);
    res.json({ success: true });
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, () => console.log(`>>> ECNHACA ELITE v100 CORRIENDO EN PUERTO ${PORT}`));
