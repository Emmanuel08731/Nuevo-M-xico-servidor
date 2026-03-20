/**
 * EMERALD HOSTING CORE v6.0.0 - ULTRA EDITION
 * ---------------------------------------------------------
 * Arquitectura de Microservicios para Gestión de Bots
 * ---------------------------------------------------------
 */

const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const path = require('path');
const helmet = require('helmet'); // Seguridad extra
const compression = require('compression'); // Velocidad

const app = express();
const PORT = process.env.PORT || 10000;

// Configuración de Seguridad y Optimización
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// CONEXIÓN A LA BASE DE DATOS GLOBAL
const pool = new Pool({
    connectionString: 'postgresql://base_datos_global_user:mEDJcu2NtduJqv662gaUvOIuPDh1HFi3@dpg-d6u5u3fkijhs73fhh1hg-a/base_datos_global',
    ssl: { rejectUnauthorized: false },
    max: 30, 
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 5000,
});

/**
 * SISTEMA DE INICIALIZACIÓN AUTOMÁTICA
 * Crea el ecosistema completo de tablas si no existen
 */
async function initializeEmeraldEcosystem() {
    const client = await pool.connect();
    try {
        console.log("--- [EMERALD LOG] Iniciando Protocolo de Arranque ---");
        await client.query('BEGIN');

        // TABLA: USUARIOS (CLIENTES)
        await client.query(`
            CREATE TABLE IF NOT EXISTS users_emerald (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password TEXT NOT NULL,
                balance DECIMAL(15,2) DEFAULT 0.00,
                role VARCHAR(20) DEFAULT 'CLIENTE',
                node_limit INTEGER DEFAULT 1,
                joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // TABLA: SERVIDORES (INSTANCIAS)
        await client.query(`
            CREATE TABLE IF NOT EXISTS servers_emerald (
                id SERIAL PRIMARY KEY,
                owner_id INTEGER REFERENCES users_emerald(id) ON DELETE CASCADE,
                server_name VARCHAR(100) NOT NULL,
                allocation_ip VARCHAR(50) DEFAULT '92.118.206.166',
                allocation_port INTEGER UNIQUE,
                status VARCHAR(20) DEFAULT 'INSTALLING',
                cpu_limit INTEGER DEFAULT 50,
                ram_limit INTEGER DEFAULT 512,
                disk_limit INTEGER DEFAULT 1024,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // TABLA: LOGS DE ACTIVIDAD
        await client.query(`
            CREATE TABLE IF NOT EXISTS audit_logs (
                id SERIAL PRIMARY KEY,
                user_id INTEGER,
                action TEXT,
                ip_address VARCHAR(45),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // CUENTA MAESTRA DE EMMANUEL
        const masterHash = await bcrypt.hash('emma06E', 12);
        await client.query(`
            INSERT INTO users_emerald (username, email, password, role, node_limit)
            VALUES ('Emmanuel Director', 'admin@emerald.host', $1, 'ADMIN', 999)
            ON CONFLICT (email) DO UPDATE SET password = $1, role = 'ADMIN';
        `, [masterHash]);

        await client.query('COMMIT');
        console.log("--- [EMERALD LOG] Sistema Online y Sincronizado ---");
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("--- [CRITICAL ERROR] Fallo en la base de datos:", err);
    } finally {
        client.release();
    }
}
initializeEmeraldEcosystem();

// --- API: AUTENTICACIÓN AVANZADA ---

app.post('/api/auth/signup', async (req, res) => {
    const { user, email, pass } = req.body;
    try {
        if (pass.length < 6) return res.status(400).json({ error: 'Password demasiado corta' });
        
        const hash = await bcrypt.hash(pass, 12);
        const result = await pool.query(
            'INSERT INTO users_emerald (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email',
            [user, email, hash]
        );
        
        res.status(201).json({ success: true, user: result.rows[0] });
    } catch (e) {
        res.status(400).json({ success: false, error: 'Email ya registrado' });
    }
});

app.post('/api/auth/signin', async (req, res) => {
    const { email, pass } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users_emerald WHERE email = $1', [email]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Usuario no existe' });

        const userData = result.rows[0];
        const match = await bcrypt.compare(pass, userData.password);

        if (match) {
            const servers = await pool.query('SELECT * FROM servers_emerald WHERE owner_id = $1', [userData.id]);
            res.json({
                success: true,
                user: { id: userData.id, name: userData.username, role: userData.role, balance: userData.balance },
                servers: servers.rows
            });
        } else {
            res.status(401).json({ error: 'Credenciales inválidas' });
        }
    } catch (e) { res.status(500).json({ error: 'Error de servidor' }); }
});

// --- API: GESTIÓN DE SERVIDORES ---

app.post('/api/servers/deploy', async (req, res) => {
    const { owner_id, name } = req.body;
    try {
        const port = Math.floor(Math.random() * (40000 - 30000) + 30000);
        const newServer = await pool.query(
            'INSERT INTO servers_emerald (owner_id, server_name, allocation_port) VALUES ($1, $2, $3) RETURNING *',
            [owner_id, name, port]
        );
        res.json({ success: true, server: newServer.rows[0] });
    } catch (e) { res.status(500).json({ error: 'No se pudo crear el servidor' }); }
});

// --- RUTA DEFAULT (MANEJO DE SPA) ---
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 EMERALD HOSTING IS RUNNING ON PORT ${PORT}`);
});
