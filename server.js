/**
 * ==============================================================================
 * DEVROOT KERNEL - VERSION 18.0.2 (POSTGRESQL EDITION)
 * DOMAIN: ecnhaca.site
 * ==============================================================================
 */

const express = require('express');
const path = require('path');
const compression = require('compression');
const http = require('http');
const { Pool } = require('pg'); // Conector PostgreSQL

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Configuración de la Base de Datos Real
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Middleware de Optimización
app.use(compression());
app.use(express.json({ limit: '20mb' }));
app.use(express.static(path.join(__dirname, 'public')));

/**
 * INICIALIZACIÓN DE TABLAS (Ejecutar una vez)
 */
const initDB = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                uid TEXT PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                joined TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('\x1b[32m[DB-READY]\x1b[0m Tablas sincronizadas en ecnhaca.site');
    } catch (err) {
        console.error('[DB-ERROR] No se pudo inicializar:', err);
    }
};
initDB();

/**
 * API: AUTENTICACIÓN PERSISTENTE
 */
app.post('/api/v1/auth/signup', async (req, res) => {
    const { user, email, password } = req.body;
    try {
        const uid = "DR-" + Math.random().toString(36).substring(2, 9);
        const query = 'INSERT INTO users (uid, username, email, password) VALUES ($1, $2, $3, $4)';
        await pool.query(query, [uid, user.trim(), email.toLowerCase().trim(), password]);
        
        res.status(201).json({ success: true, message: "Registro exitoso en el Nodo Onyx." });
    } catch (err) {
        res.status(409).json({ error: "El usuario o email ya existe en la red." });
    }
});

app.post('/api/v1/auth/login', async (req, res) => {
    const { identity, password } = req.body;
    try {
        const query = 'SELECT * FROM users WHERE email = $1 OR username = $1';
        const result = await pool.query(query, [identity.toLowerCase().trim()]);
        
        if (result.rows.length === 0) return res.status(404).json({ error: "Identidad no encontrada." });
        
        const account = result.rows[0];
        if (account.password !== password) return res.status(401).json({ error: "Clave de acceso incorrecta." });

        res.json({
            success: true,
            user: { name: account.username, uid: account.uid }
        });
    } catch (err) {
        res.status(500).json({ error: "Error interno del kernel." });
    }
});

/**
 * API: BÚSQUEDA GLOBAL SQL
 */
app.get('/api/v1/search/global', async (req, res) => {
    const q = req.query.q ? `%${req.query.q.toLowerCase()}%` : "";
    try {
        const query = 'SELECT username, uid FROM users WHERE username ILIKE $1 LIMIT 5';
        const result = await pool.query(query, [q]);
        
        const people = result.rows.map(u => ({ name: u.username, id: u.uid }));
        res.json({ results: { people, posts: [] } });
    } catch (err) {
        res.status(500).json({ error: "Fallo en el motor de búsqueda." });
    }
});

server.listen(PORT, () => {
    console.log(`\x1b[36m[DEVROOT ONLINE]\x1b[0m Nodo activo en puerto: ${PORT}`);
});
