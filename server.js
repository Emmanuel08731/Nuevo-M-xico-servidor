const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();

// Configuración de la conexión con PostgreSQL (Render)
const pool = new Pool({
  connectionString: 'postgresql://minecraft_db_pojg_user:dM593YPdzsJ6NujnEY8ywpgQYE9mUqEL@dpg-d6sv3gnfte5s73fgdok0-a/minecraft_db_pojg',
  ssl: { rejectUnauthorized: false }
});

/**
 * INICIALIZACIÓN DE EMERGENCIA Y SEGURIDAD
 * Este bloque repara la base de datos si falta alguna columna
 */
async function bootUp() {
    try {
        console.log(">> Validando integridad de la base de datos...");
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

        // Verificación de columnas para evitar errores de Render
        await pool.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS es_admin BOOLEAN DEFAULT FALSE;`);
        await pool.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`);

        // Crear la cuenta Maestra de Emmanuel si no existe
        const masterPass = await bcrypt.hash('emma2013', 10);
        await pool.query(`
            INSERT INTO usuarios (usuario_mc, nombre_rp, fecha_nacimiento, nacionalidad, password, es_admin)
            VALUES ('emmanuel0606', 'Emmanuel Fundador', '2000-01-01', 'México', $1, TRUE)
            ON CONFLICT (usuario_mc) DO UPDATE SET es_admin = TRUE;
        `, [masterPass]);

        console.log("✅ Servidor Nuevo México: Base de datos vinculada con éxito.");
    } catch (err) {
        console.error("❌ Error Crítico:", err.message);
    }
}
bootUp();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// --- RUTAS DE LA API ---

// 1. Registro de Ciudadanos
app.post('/api/auth/register', async (req, res) => {
    const { u_mc, n_rp, bday, nation, pass } = req.body;
    try {
        const hash = await bcrypt.hash(pass, 10);
        await pool.query(
            'INSERT INTO usuarios (usuario_mc, nombre_rp, fecha_nacimiento, nacionalidad, password) VALUES ($1,$2,$3,$4,$5)',
            [u_mc, n_rp, bday, nation, hash]
        );
        res.json({ success: true, msg: "¡Bienvenido a la capital!" });
    } catch (e) {
        res.json({ success: false, msg: "El nombre de usuario ya está registrado." });
    }
});

// 2. Login con Discriminación de Rango
app.post('/api/auth/login', async (req, res) => {
    const { u_mc, pass } = req.body;
    try {
        const result = await pool.query('SELECT * FROM usuarios WHERE usuario_mc = $1', [u_mc]);
        if (result.rows.length === 0) return res.json({ success: false, msg: "Usuario inexistente." });

        const user = result.rows[0];
        const match = await bcrypt.compare(pass, user.password);

        if (match) {
            let dataAdmin = null;
            // Solo si es Emmanuel (admin), enviamos la lista de todos los usuarios
            if (user.es_admin) {
                const list = await pool.query('SELECT id, usuario_mc, nombre_rp, nacionalidad, es_admin FROM usuarios ORDER BY id DESC');
                dataAdmin = list.rows;
            }
            res.json({ success: true, userData: user, adminData: dataAdmin });
        } else {
            res.json({ success: false, msg: "Contraseña incorrecta." });
        }
    } catch (e) { res.status(500).send("Error"); }
});

// 3. Operaciones de Administrador
app.post('/api/admin/promote', async (req, res) => {
    await pool.query('UPDATE usuarios SET es_admin = TRUE WHERE id = $1', [req.body.id]);
    res.json({ success: true });
});

app.post('/api/admin/delete', async (req, res) => {
    if(req.body.id == 1) return res.json({ success: false }); // Anti-suicidio de cuenta maestra
    await pool.query('DELETE FROM usuarios WHERE id = $1', [req.body.id]);
    res.json({ success: true });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Web operando en puerto ${PORT}`));
