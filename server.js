const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

const pool = new Pool({
    connectionString: 'postgres://base_datos_global_user:mEDJcu2NtduJqv662gaUvOIuPDh1HFi3@dpg-d6u5u3fkijhs73fhh1hg-a.oregon-postgres.render.com/base_datos_global',
    ssl: { rejectUnauthorized: false },
});

// INICIALIZACIÓN DE TABLAS Y ADMIN EMMANUEL
const initDB = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role VARCHAR(20) DEFAULT 'user',
                avatar_color TEXT DEFAULT '#007aff',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS posts (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                category TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        // Inyectar Admin si no existe
        await pool.query(`
            INSERT INTO users (username, email, password_hash, role, avatar_color)
            VALUES ('Dev_Emmanuel', 'emma2013rq@gmail.com', 'emma06E', 'admin', '#FF3B30')
            ON CONFLICT (username) DO NOTHING;
        `);
        console.log(">>> [DB] Sistema Emmanuel Online");
    } catch (e) { console.error(e); }
};
initDB();

// AUTH: REGISTRO CON VALIDACIÓN DE DUPLICADOS
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const dup = await pool.query("SELECT * FROM users WHERE username = $1 OR email = $2", [username, email]);
        if(dup.rows.length > 0) return res.status(409).json({ error: "El usuario o email ya existe." });
        
        const colors = ['#007aff', '#af52de', '#34c759', '#ff9500'];
        const resUser = await pool.query(
            "INSERT INTO users (username, email, password_hash, avatar_color) VALUES ($1,$2,$3,$4) RETURNING *",
            [username, email, password, colors[Math.floor(Math.random()*colors.length)]]
        );
        res.json({ success: true, user: resUser.rows[0] });
    } catch (e) { res.status(500).json({ error: "Error de servidor" }); }
});

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await pool.query("SELECT * FROM users WHERE (username=$1 OR email=$1) AND password_hash=$2", [username, password]);
    if(user.rows.length > 0) res.json({ success: true, user: user.rows[0] });
    else res.status(401).json({ error: "Credenciales incorrectas" });
});

// ADMIN: GESTIÓN DE USUARIOS
app.get('/api/admin/users', async (req, res) => {
    const users = await pool.query("SELECT id, username, email, role FROM users ORDER BY id DESC");
    res.json(users.rows);
});

app.delete('/api/admin/users/:id', async (req, res) => {
    await pool.query("DELETE FROM users WHERE id = $1 AND role != 'admin'", [req.params.id]);
    res.json({ success: true });
});

// POSTS
app.get('/api/posts', async (req, res) => {
    const data = await pool.query("SELECT p.*, u.username, u.avatar_color FROM posts p JOIN users u ON p.user_id = u.id ORDER BY p.id DESC");
    res.json(data.rows);
});

app.post('/api/posts', async (req, res) => {
    const { user_id, title, content, category } = req.body;
    await pool.query("INSERT INTO posts (user_id, title, content, category) VALUES ($1,$2,$3,$4)", [user_id, title, content, category]);
    res.json({ success: true });
});

app.listen(10000, () => console.log("Puerto 10000"));
