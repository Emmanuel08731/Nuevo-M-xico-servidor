const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();

// --- CONFIGURACIÓN DE LA BASE DE DATOS GLOBAL ---
const pool = new Pool({
  connectionString: 'postgresql://base_datos_global_user:mEDJcu2NtduJqv662gaUvOIuPDh1HFi3@dpg-d6u5u3fkijhs73fhh1hg-a/base_datos_global',
  ssl: { rejectUnauthorized: false }
});

/**
 * INICIALIZACIÓN DE EMERALD HOSTING
 * Crea las tablas y el usuario administrador inicial
 */
async function bootstrap() {
    try {
        console.log("--- [SISTEMA] Iniciando Emerald Hosting v2026 ---");
        
        // Tabla de Usuarios
        await pool.query(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id SERIAL PRIMARY KEY,
                email VARCHAR(100) UNIQUE NOT NULL,
                nombre_cliente VARCHAR(100) NOT NULL,
                password TEXT NOT NULL,
                plan VARCHAR(50) DEFAULT 'Gratis',
                es_admin BOOLEAN DEFAULT FALSE,
                fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Tabla de Servicios (Bots/Webs)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS servicios (
                id SERIAL PRIMARY KEY,
                owner_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
                nombre_proyecto VARCHAR(100) NOT NULL,
                tipo_servicio VARCHAR(50), 
                estado VARCHAR(20) DEFAULT 'ACTIVO',
                memoria_asignada VARCHAR(20) DEFAULT '512MB'
            );
        `);

        // Cuenta de Emmanuel (Admin)
        const passHash = await bcrypt.hash('emma06E', 10);
        await pool.query(`
            INSERT INTO usuarios (email, nombre_cliente, password, es_admin, plan)
            VALUES ('admin@emerald.host', 'Emmanuel Director', $1, TRUE, 'Enterprise')
            ON CONFLICT (email) DO UPDATE SET password = $1, es_admin = TRUE;
        `, [passHash]);

        console.log("✅ [DB] Conexión establecida con base_datos_global");
    } catch (err) {
        console.error("❌ [DB Error]:", err.message);
    }
}
bootstrap();

// Middlewares
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- API: AUTENTICACIÓN ---

app.post('/api/login', async (req, res) => {
    const { email, pass } = req.body;
    try {
        const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        
        if (result.rows.length === 0) {
            return res.json({ success: false, error: 'NOT_FOUND' });
        }

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(pass, user.password);

        if (isMatch) {
            let adminList = null;
            if (user.es_admin) {
                const all = await pool.query('SELECT id, email, nombre_cliente, plan FROM usuarios ORDER BY id DESC');
                adminList = all.rows;
            }

            const services = await pool.query('SELECT * FROM servicios WHERE owner_id = $1', [user.id]);

            res.json({ 
                success: true, 
                user: {
                    id: user.id,
                    email: user.email,
                    nombre: user.nombre_cliente,
                    plan: user.plan,
                    admin: user.es_admin
                },
                services: services.rows,
                adminData: adminList
            });
        } else {
            res.json({ success: false, error: 'WRONG_PASS' });
        }
    } catch (e) {
        res.status(500).json({ success: false });
    }
});

app.post('/api/register', async (req, res) => {
    const { email, nombre, pass } = req.body;
    try {
        const hash = await bcrypt.hash(pass, 10);
        await pool.query(
            'INSERT INTO usuarios (email, nombre_cliente, password) VALUES ($1, $2, $3)',
            [email, nombre, hash]
        );
        res.json({ success: true });
    } catch (e) {
        res.json({ success: false, error: 'ALREADY_EXISTS' });
    }
});

// --- API: ADMINISTRACIÓN (EMMANUEL) ---

app.post('/api/admin/delete-user', async (req, res) => {
    const { targetId } = req.body;
    try {
        // Protección para la cuenta de Emmanuel (ID 1)
        if (targetId == 1) return res.json({ success: false });

        await pool.query('DELETE FROM usuarios WHERE id = $1', [targetId]);
        res.json({ success: true });
    } catch (e) {
        res.json({ success: false });
    }
});

// --- MANEJO DE RUTAS (CORREGIDO PARA RENDER) ---

// Esta es la parte que daba error. Usamos '/*' para que Express lo acepte.
app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Inicio del servidor
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 [SERVER] Emerald Hosting activo en puerto ${PORT}`);
});
