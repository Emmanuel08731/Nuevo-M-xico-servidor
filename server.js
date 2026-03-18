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
 * CONFIGURACIÓN DE SEGURIDAD EMMANUEL
 * Clave Maestra: emma06E
 */
async function setupSystem() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id SERIAL PRIMARY KEY,
                usuario_mc VARCHAR(50) UNIQUE NOT NULL,
                nombre_rp VARCHAR(100) NOT NULL,
                fecha_nacimiento DATE NOT NULL,
                nacionalidad VARCHAR(50) NOT NULL,
                password TEXT NOT NULL,
                es_admin BOOLEAN DEFAULT FALSE,
                fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        // Sincronización de Emmanuel0606
        const hash = await bcrypt.hash('emma06E', 10);
        await pool.query(`
            INSERT INTO usuarios (usuario_mc, nombre_rp, fecha_nacimiento, nacionalidad, password, es_admin)
            VALUES ('emmanuel0606', 'Emmanuel Fundador', '2000-01-01', 'México', $1, TRUE)
            ON CONFLICT (usuario_mc) DO UPDATE SET password = $1, es_admin = TRUE;
        `, [hash]);
        console.log("🟢 [LOG] Emmanuel0606 verificado. Sistema listo.");
    } catch (e) { console.error("❌ Error DB:", e); }
}
setupSystem();

app.use(express.json());
app.use(express.static('public'));

// API LOGIN
app.post('/api/auth/login', async (req, res) => {
    const { user, pass } = req.body;
    try {
        const result = await pool.query('SELECT * FROM usuarios WHERE usuario_mc = $1', [user]);
        if (result.rows.length === 0) {
            return res.json({ success: false, errorType: 'NOT_FOUND' });
        }
        const u = result.rows[0];
        if (await bcrypt.compare(pass, u.password)) {
            let adminList = u.es_admin ? (await pool.query('SELECT * FROM usuarios ORDER BY id DESC')).rows : null;
            res.json({ success: true, user: u, adminList });
        } else {
            res.json({ success: false, errorType: 'WRONG_PASS' });
        }
    } catch (e) { res.status(500).send(); }
});

// API REGISTRO
app.post('/api/auth/register', async (req, res) => {
    const { u, n, d, na, p } = req.body;
    try {
        const h = await bcrypt.hash(p, 10);
        await pool.query('INSERT INTO usuarios (usuario_mc, nombre_rp, fecha_nacimiento, nacionalidad, password) VALUES ($1,$2,$3,$4,$5)', [u,n,d,na,h]);
        res.json({ success: true });
    } catch (e) { res.json({ success: false }); }
});

// API ADMIN ACTION
app.post('/api/admin/action', async (req, res) => {
    const { id, action } = req.body;
    try {
        if (action === 'del' && id != 1) {
            await pool.query('DELETE FROM usuarios WHERE id = $1', [id]);
            return res.json({ success: true, deleted: true });
        }
        if (action === 'op') {
            await pool.query('UPDATE usuarios SET es_admin = TRUE WHERE id = $1', [id]);
            return res.json({ success: true });
        }
        res.json({ success: false });
    } catch (e) { res.json({ success: false }); }
});

app.listen(process.env.PORT || 10000);
