const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();
const pool = new Pool({
  connectionString: 'postgresql://minecraft_db_pojg_user:dM593YPdzsJ6NujnEY8ywpgQYE9mUqEL@dpg-d6sv3gnfte5s73fgdok0-a/minecraft_db_pojg',
  ssl: { rejectUnauthorized: false }
});

// Inicialización de Seguridad Suprema
async function coreInit() {
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
        // Asegurar cuenta de Emmanuel (Clave: emma06E)
        const pass = await bcrypt.hash('emma06E', 10);
        await pool.query(`
            INSERT INTO usuarios (usuario_mc, nombre_rp, fecha_nacimiento, nacionalidad, password, es_admin)
            VALUES ('emmanuel0606', 'Emmanuel Fundador', '2000-01-01', 'México', $1, TRUE)
            ON CONFLICT (usuario_mc) DO UPDATE SET password = $1, es_admin = TRUE;
        `, [pass]);
        console.log("⭐ Sistema Nuevo México RP: Emmanuel Online");
    } catch (e) { console.error(e); }
}
coreInit();

app.use(express.json());
app.use(express.static('public'));

// API: Login Detallado
app.post('/api/login', async (req, res) => {
    const { user, pass } = req.body;
    const result = await pool.query('SELECT * FROM usuarios WHERE usuario_mc = $1', [user]);
    
    if (result.rows.length > 0) {
        const u = result.rows[0];
        if (await bcrypt.compare(pass, u.password)) {
            let todos = u.es_admin ? (await pool.query('SELECT id, usuario_mc, nombre_rp, es_admin FROM usuarios ORDER BY id DESC')).rows : null;
            return res.json({ success: true, userData: u, allUsers: todos });
        }
    }
    res.json({ success: false });
});

// API: Registro
app.post('/api/register', async (req, res) => {
    try {
        const { u, n, d, na, p } = req.body;
        const h = await bcrypt.hash(p, 10);
        await pool.query('INSERT INTO usuarios (usuario_mc, nombre_rp, fecha_nacimiento, nacionalidad, password) VALUES ($1,$2,$3,$4,$5)', [u,n,d,na,h]);
        res.json({ success: true });
    } catch (e) { res.json({ success: false }); }
});

// API: Acciones de Admin
app.post('/api/admin-task', async (req, res) => {
    const { id, task } = req.body;
    if (task === 'delete' && id != 1) await pool.query('DELETE FROM usuarios WHERE id = $1', [id]);
    if (task === 'make-admin') await pool.query('UPDATE usuarios SET es_admin = TRUE WHERE id = $1', [id]);
    res.json({ success: true });
});

app.listen(process.env.PORT || 10000);
