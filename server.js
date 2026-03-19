const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();

// CONFIGURACIÓN DE LA NUEVA BASE DE DATOS GLOBAL
const pool = new Pool({
  connectionString: 'postgresql://base_datos_global_user:mEDJcu2NtduJqv662gaUvOIuPDh1HFi3@dpg-d6u5u3fkijhs73fhh1hg-a/base_datos_global',
  ssl: { rejectUnauthorized: false }
});

/**
 * SISTEMA DE INICIALIZACIÓN DE HOSTING
 * Crea las tablas necesarias para Clientes y sus Servicios (Bots/Webs)
 */
async function inicializarHosting() {
    try {
        console.log("--- INICIANDO EMERALD HOSTING SYSTEM ---");
        
        // Tabla de Usuarios/Clientes
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

        // Tabla de Servicios (Para alojar Bots y Sitios Web)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS servicios (
                id SERIAL PRIMARY KEY,
                owner_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
                nombre_proyecto VARCHAR(100) NOT NULL,
                tipo_servicio VARCHAR(50), -- 'BOT_DISCORD', 'BOT_WA', 'WEB_NODE', 'WEB_HTML'
                estado VARCHAR(20) DEFAULT 'ACTIVO',
                memoria_asignada VARCHAR(20) DEFAULT '512MB'
            );
        `);

        // CREAR CUENTA MAESTRA DE EMMANUEL
        // Clave: emma06E
        const hash = await bcrypt.hash('emma06E', 10);
        await pool.query(`
            INSERT INTO usuarios (email, nombre_cliente, password, es_admin, plan)
            VALUES ('admin@emerald.host', 'Emmanuel Director', $1, TRUE, 'Enterprise')
            ON CONFLICT (email) DO UPDATE SET password = $1, es_admin = TRUE;
        `, [hash]);

        console.log("✅ Conexión exitosa a: base_datos_global");
        console.log("⭐ Cuenta de administrador verificada.");
    } catch (err) {
        console.error("❌ ERROR CRÍTICO EN DB:", err.message);
    }
}
inicializarHosting();

app.use(express.json());
app.use(express.static('public'));

// --- RUTAS DE AUTENTICACIÓN ---

app.post('/api/login', async (req, res) => {
    const { email, pass } = req.body;
    try {
        const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        
        if (result.rows.length === 0) {
            return res.json({ success: false, error: 'NOT_FOUND' });
        }

        const user = result.rows[0];
        const match = await bcrypt.compare(pass, user.password);

        if (match) {
            // Si es Emmanuel (Admin), enviamos la lista global de clientes
            let globalClients = null;
            if (user.es_admin) {
                const clientsRes = await pool.query('SELECT id, email, nombre_cliente, plan FROM usuarios ORDER BY id DESC');
                globalClients = clientsRes.rows;
            }

            // Obtener servicios del usuario
            const servicesRes = await pool.query('SELECT * FROM servicios WHERE owner_id = $1', [user.id]);

            res.json({ 
                success: true, 
                user: {
                    id: user.id,
                    email: user.email,
                    nombre: user.nombre_cliente,
                    plan: user.plan,
                    admin: user.es_admin
                },
                services: servicesRes.rows,
                adminData: globalClients
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

// --- RUTAS ADMINISTRATIVAS (SOLO PARA EMMANUEL) ---

// ELIMINACIÓN FÍSICA DE LA BASE DE DATOS
app.post('/api/admin/delete-user', async (req, res) => {
    const { targetId } = req.body;
    try {
        // Impedir que el ID 1 (Emmanuel) sea borrado
        if (targetId == 1) return res.json({ success: false, msg: 'Protección de Fundador activa.' });

        await pool.query('DELETE FROM usuarios WHERE id = $1', [targetId]);
        res.json({ success: true });
    } catch (e) {
        res.json({ success: false });
    }
});

// CREAR SERVICIO (WEB/BOT)
app.post('/api/services/create', async (req, res) => {
    const { ownerId, nombre, tipo } = req.body;
    try {
        await pool.query(
            'INSERT INTO servicios (owner_id, nombre_proyecto, tipo_servicio) VALUES ($1, $2, $3)',
            [ownerId, nombre, tipo]
        );
        res.json({ success: true });
    } catch (e) {
        res.json({ success: false });
    }
});

// --- MANEJO DE ERRORES Y PUERTO ---
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor de Hosting corriendo en puerto ${PORT}`);
});
