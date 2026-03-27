/**
 * ==============================================================================
 * ECNHACA TITANIUM SERVER - V125.0 (ADMIN PROTOCOL)
 * DESARROLLADOR: EMMANUEL | STATUS: MASTER OVERRIDE
 * ==============================================================================
 */

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 10000;

// --- CONFIGURACIÓN DE MIDDLEWARES DE ALTO NIVEL ---
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(morgan('combined')); // Logs detallados tipo Apache
app.use(express.static(path.join(__dirname, 'public')));

// --- CONEXIÓN A POSTGRESQL (RENDER) ---
const pool = new Pool({
    connectionString: 'postgres://base_datos_global_user:mEDJcu2NtduJqv662gaUvOIuPDh1HFi3@dpg-d6u5u3fkijhs73fhh1hg-a.oregon-postgres.render.com/base_datos_global',
    ssl: { rejectUnauthorized: false },
});

// --- SISTEMA DE INICIALIZACIÓN Y MANTENIMIENTO DE DB ---
const initDatabase = async () => {
    const client = await pool.connect();
    try {
        console.log(">>> [LOG] Iniciando secuencia de tablas...");
        await client.query('BEGIN');
        
        // Tabla de Usuarios
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role VARCHAR(20) DEFAULT 'user',
                avatar_color VARCHAR(10) DEFAULT '#00f2ff',
                status VARCHAR(20) DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Tabla de Posts (Publicaciones de Emmanuel Store)
        await client.query(`
            CREATE TABLE IF NOT EXISTS posts (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                category VARCHAR(50) DEFAULT 'Bot',
                price DECIMAL(10,2) DEFAULT 0.00,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // INYECCIÓN DE CUENTA ADMINISTRADOR MAESTRA
        await client.query(`
            INSERT INTO users (username, email, password_hash, role, avatar_color) 
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (username) DO UPDATE SET role = 'admin';
        `, ['Dev_Emmanuel', 'emma2013rq@gmail.com', 'emma06E', 'admin', '#ff0055']);

        await client.query('COMMIT');
        console.log(">>> [SYSTEM] Tablas sincronizadas con Render.");
    } catch (e) {
        await client.query('ROLLBACK');
        console.error(">>> [ERROR DB]", e);
    } finally {
        client.release();
    }
};
initDatabase();

/**
 * --- RUTAS DE AUTENTICACIÓN (LOGIN/REGISTRO) ---
 */

app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const u = username.toLowerCase().trim();
        const e = email.toLowerCase().trim();

        // Verificación de duplicados (Evita errores 500)
        const check = await pool.query("SELECT * FROM users WHERE username = $1 OR email = $2", [u, e]);
        if (check.rows.length > 0) {
            return res.status(409).json({ error: "El usuario o correo ya está en uso." });
        }

        const result = await pool.query(
            "INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING *",
            [u, e, password]
        );
        res.status(201).json({ success: true, user: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: "Error interno en registro." });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const u = username.toLowerCase().trim();
        const user = await pool.query("SELECT * FROM users WHERE (username = $1 OR email = $1) AND password_hash = $2", [u, password]);
        
        if (user.rows.length > 0) {
            res.json({ success: true, user: user.rows[0] });
        } else {
            res.status(401).json({ error: "Acceso denegado: Credenciales incorrectas." });
        }
    } catch (e) { res.status(500).json({ error: "Error en login." }); }
});

/**
 * --- PANEL ADMINISTRATIVO (BLOQUE MAESTRO) ---
 */

app.get('/api/admin/users', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM users ORDER BY id ASC");
        res.json(result.rows);
    } catch (e) { res.status(500).json({ error: "Error al obtener usuarios." }); }
});

app.delete('/api/admin/users/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Protección contra auto-borrado
        const user = await pool.query("SELECT role FROM users WHERE id = $1", [id]);
        if (user.rows[0].role === 'admin') return res.status(403).send("No puedes borrar al Admin.");
        
        await pool.query("DELETE FROM users WHERE id = $1", [id]);
        res.json({ success: true });
    } catch (e) { res.status(500).send("Error al borrar."); }
});

// [AQUÍ SIGUEN 350 LÍNEAS DE RUTAS DE COMENTARIOS, SISTEMA DE TICKETS, 
// ACTUALIZACIÓN DE PERFIL, LOGS DE ACCIONES Y MANEJO DE IMÁGENES]

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.listen(PORT, () => console.log(`>>> Emmanuel Server Online: Port ${PORT}`));
