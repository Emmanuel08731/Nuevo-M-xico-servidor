const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();
const pool = new Pool({
  connectionString: 'postgresql://minecraft_db_pojg_user:dM593YPdzsJ6NujnEY8ywpgQYE9mUqEL@dpg-d6sv3gnfte5s73fgdok0-a/minecraft_db_pojg',
  ssl: { rejectUnauthorized: false }
});

/**
 * PROTOCOLO EMERALD HOSTING - EMMANUEL 2026
 * Configuración de Infraestructura
 */
async function initHostingDB() {
    try {
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

        // Tabla de Servicios (Webs/Bots)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS servicios (
                id SERIAL PRIMARY KEY,
                owner_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
                nombre_proyecto VARCHAR(100) NOT NULL,
                tipo_servicio VARCHAR(50), -- 'WEB' o 'BOT'
                estado VARCHAR(20) DEFAULT 'Activo'
            );
        `);

        // CREAR CUENTA MAESTRA (EMMANUEL)
        const rootPass = await bcrypt.hash('emma06E', 10);
        await pool.query(`
            INSERT INTO usuarios (email, nombre_cliente, password, es_admin, plan)
            VALUES ('emmanuel@emerald.host', 'Emmanuel Director', $1, TRUE, 'Enterprise')
            ON CONFLICT (email) DO UPDATE SET password = $1, es_admin = TRUE;
        `, [rootPass]);

        console.log("✅ [INFRAESTRUCTURA] Base de datos de Hosting lista.");
    } catch (err) { console.error("❌ Error:", err.message); }
}
initHostingDB();

app.use(express.json());
app.use(express.static('public'));

// --- API ENDPOINTS ---

// LOGIN CON DATOS DE PLAN
app.post('/api/login', async (req, res) => {
    const { email, pass } = req.body;
    const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    
    if (result.rows.length === 0) return res.json({ success: false, error: 'NOT_FOUND' });

    const user = result.rows[0];
    if (await bcrypt.compare(pass, user.password)) {
        // Si es Emmanuel, obtener todos los clientes para el panel
        let clients = null;
        if (user.es_admin) {
            const all = await pool.query('SELECT id, email, nombre_cliente, plan FROM usuarios ORDER BY id DESC');
            clients = all.rows;
        }
        res.json({ success: true, user, clients });
    } else {
        res.json({ success: false, error: 'WRONG_PASS' });
    }
});

// BORRADO REAL DE CLIENTES (ADMIN ONLY)
app.post('/api/admin/delete-client', async (req, res) => {
    const { targetId } = req.body;
    try {
        if (targetId == 1) return res.json({ success: false }); // No borrar al jefe
        await pool.query('DELETE FROM usuarios WHERE id = $1', [targetId]);
        res.json({ success: true });
    } catch (e) { res.json({ success: false }); }
});

app.listen(process.env.PORT || 10000);
