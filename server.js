const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();
const pool = new Pool({
  connectionString: 'postgresql://minecraft_db_pojg_user:dM593YPdzsJ6NujnEY8ywpgQYE9mUqEL@dpg-d6sv3gnfte5s73fgdok0-a/minecraft_db_pojg',
  ssl: { rejectUnauthorized: false }
});

// Inicialización Profunda
async function setupServer() {
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
        // Asegurar que la columna admin existe
        await pool.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS es_admin BOOLEAN DEFAULT FALSE;`);
        
        // Crear/Actualizar al Dueño
        const hash = await bcrypt.hash('emma2013', 10);
        await pool.query(`
            INSERT INTO usuarios (usuario_mc, nombre_rp, fecha_nacimiento, nacionalidad, password, es_admin)
            VALUES ('emmanuel0606', 'Emmanuel Fundador', '2000-01-01', 'México', $1, TRUE)
            ON CONFLICT (usuario_mc) DO UPDATE SET es_admin = TRUE;
        `, [hash]);
        console.log("⭐ Sistema de Rangos Activo");
    } catch (e) { console.log(e); }
}
setupServer();

app.use(express.json());
app.use(express.static('public'));

// API: Registro
app.post('/api/register', async (req, res) => {
    const { user, rpname, bday, nation, pass } = req.body;
    try {
        const hash = await bcrypt.hash(pass, 10);
        await pool.query('INSERT INTO usuarios (usuario_mc, nombre_rp, fecha_nacimiento, nacionalidad, password) VALUES ($1,$2,$3,$4,$5)', 
        [user, rpname, bday, nation, hash]);
        res.json({ success: true });
    } catch (e) { res.json({ success: false }); }
});

// API: Login con distinción de rango
app.post('/api/login', async (req, res) => {
    const { user, pass } = req.body;
    const result = await pool.query('SELECT * FROM usuarios WHERE usuario_mc = $1', [user]);
    
    if (result.rows.length > 0) {
        const u = result.rows[0];
        if (await bcrypt.compare(pass, u.password)) {
            // Si es admin, mandamos la lista de usuarios. Si no, solo sus datos.
            let adminData = null;
            if (u.es_admin) {
                const all = await pool.query('SELECT id, usuario_mc, nombre_rp, es_admin FROM usuarios ORDER BY id DESC');
                adminData = all.rows;
            }
            return res.json({ success: true, userData: u, adminData: adminData });
        }
    }
    res.json({ success: false });
});

// API: Admin Ops
app.post('/api/promote', async (req, res) => {
    await pool.query('UPDATE usuarios SET es_admin = TRUE WHERE id = $1', [req.body.id]);
    res.json({ success: true });
});

app.post('/api/delete', async (req, res) => {
    if(req.body.id == 1) return res.json({ success: false });
    await pool.query('DELETE FROM usuarios WHERE id = $1', [req.body.id]);
    res.json({ success: true });
});

app.listen(process.env.PORT || 10000);
