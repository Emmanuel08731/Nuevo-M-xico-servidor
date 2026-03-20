/**
 * ==============================================================================
 * EMERALD HOSTING CLOUD SYSTEM - CORE ENGINE v6.0
 * AUTHOR: EMMANUEL (DIRECTOR)
 * YEAR: 2026
 * LICENSE: ENTERPRISE CLONE
 * ==============================================================================
 * * Este servidor implementa una arquitectura de panel Jexactyl de alto rendimiento.
 * Incluye:
 * - Protección Helmet contra ataques de cabecera.
 * - Compresión Gzip para carga ultra-rápida.
 * - Gestión de Pool de PostgreSQL con reconexión automática.
 * - Encriptación de grado militar (Bcrypt 12 rounds).
 */

const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');

// --- INICIALIZACIÓN DE LA APP ---
const app = express();
const PORT = process.env.PORT || 10000;

// --- CAPA DE SEGURIDAD Y RENDIMIENTO ---
app.use(helmet({
    contentSecurityPolicy: false, // Permite cargar recursos externos si es necesario
    crossOriginEmbedderPolicy: false
}));
app.use(compression()); // Reduce el tamaño de los datos enviados al navegador
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// --- CONFIGURACIÓN DE INFRAESTRUCTURA DE DATOS ---
// Usamos una configuración de Pool optimizada para Render
const pool = new Pool({
    connectionString: 'postgresql://base_datos_global_user:mEDJcu2NtduJqv662gaUvOIuPDh1HFi3@dpg-d6u5u3fkijhs73fhh1hg-a/base_datos_global',
    ssl: { rejectUnauthorized: false },
    max: 40,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

// Verificador de salud de la conexión
pool.on('error', (err) => {
    console.error('❌ [CRITICAL] Error inesperado en el pool de PostgreSQL:', err);
});

/**
 * PROTOCOLO DE ARRANQUE DEL ECOSISTEMA (BOOTSTRAP)
 * Este bloque se encarga de que la base de datos esté lista antes de recibir usuarios.
 */
async function bootstrap() {
    console.log("----------------------------------------------------------------");
    console.log("🟢 [SYSTEM] Iniciando Protocolo de Seguridad Emerald v2026...");
    
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Estructura de Usuarios (Master Table)
        await client.query(`
            CREATE TABLE IF NOT EXISTS usuarios_pro (
                id SERIAL PRIMARY KEY,
                username VARCHAR(100) NOT NULL,
                email VARCHAR(150) UNIQUE NOT NULL,
                password TEXT NOT NULL,
                plan VARCHAR(50) DEFAULT 'Ninguno',
                tokens DECIMAL(20,2) DEFAULT 0.00,
                is_admin BOOLEAN DEFAULT FALSE,
                max_servers INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 2. Estructura de Servidores Virtuales
        await client.query(`
            CREATE TABLE IF NOT EXISTS servidores_pro (
                id SERIAL PRIMARY KEY,
                owner_id INTEGER REFERENCES usuarios_pro(id) ON DELETE CASCADE,
                name VARCHAR(100) NOT NULL,
                ip_addr VARCHAR(50) DEFAULT '92.118.206.166',
                port INTEGER UNIQUE,
                status VARCHAR(20) DEFAULT 'OFFLINE',
                ram_limit INTEGER DEFAULT 512,
                cpu_limit INTEGER DEFAULT 100,
                disk_limit INTEGER DEFAULT 1024,
                last_start TIMESTAMP
            );
        `);

        // 3. Creación del Usuario Maestro Emmanuel
        const masterPass = await bcrypt.hash('emma06E', 12);
        await client.query(`
            INSERT INTO usuarios_pro (username, email, password, is_admin, plan, max_servers)
            VALUES ('Emmanuel Director', 'admin@emerald.host', $1, TRUE, 'OWNER', 9999)
            ON CONFLICT (email) DO UPDATE SET password = $1, is_admin = TRUE;
        `, [masterPass]);

        await client.query('COMMIT');
        console.log("✅ [DB] Estructura sincronizada y optimizada.");
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("🚨 [DB ERROR] Fallo crítico en sincronización:", err.message);
    } finally {
        client.release();
    }
    console.log("----------------------------------------------------------------");
}
bootstrap();

// --- API: SISTEMA DE AUTENTICACIÓN ---

// Registro de nuevos clientes
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        if (!username || !email || !password) return res.status(400).json({ msg: 'Faltan datos' });
        
        const hash = await bcrypt.hash(password, 12);
        const result = await pool.query(
            'INSERT INTO usuarios_pro (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email',
            [username, email, hash]
        );
        
        console.log(`👤 [NEW USER] ${username} se ha unido al hosting.`);
        res.json({ success: true, user: result.rows[0] });
    } catch (e) {
        res.status(400).json({ success: false, error: 'El email ya está registrado en el sistema.' });
    }
});

// Inicio de sesión profesional
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM usuarios_pro WHERE email = $1', [email]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, msg: 'Email no registrado.' });

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {
            const servers = await pool.query('SELECT * FROM servidores_pro WHERE owner_id = $1', [user.id]);
            res.json({
                success: true,
                user: { id: user.id, name: user.username, email: user.email, plan: user.plan, admin: user.is_admin },
                servers: servers.rows
            });
        } else {
            res.status(401).json({ success: false, msg: 'Contraseña incorrecta.' });
        }
    } catch (e) {
        res.status(500).json({ success: false });
    }
});

// --- API: GESTIÓN DE NODOS ---

app.post('/api/nodes/create', async (req, res) => {
    const { owner_id, server_name } = req.body;
    try {
        const port = Math.floor(Math.random() * (40000 - 30000) + 30000);
        const result = await pool.query(
            'INSERT INTO servidores_pro (owner_id, name, port) VALUES ($1, $2, $3) RETURNING *',
            [owner_id, server_name, port]
        );
        res.json({ success: true, server: result.rows[0] });
    } catch (e) {
        res.status(500).json({ success: false });
    }
});

// --- MANEJO DE RUTAS FRONTEND (SPA) ---
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Lanzamiento del Servicio
app.listen(PORT, () => {
    console.log(`🚀 [READY] Emerald Panel v6.0 activo en el puerto ${PORT}`);
});
