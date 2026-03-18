const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();

// Configuración de conexión con PostgreSQL en Render
const pool = new Pool({
  connectionString: 'postgresql://minecraft_db_pojg_user:dM593YPdzsJ6NujnEY8ywpgQYE9mUqEL@dpg-d6sv3gnfte5s73fgdok0-a/minecraft_db_pojg',
  ssl: { rejectUnauthorized: false }
});

/**
 * MOTOR DE INICIALIZACIÓN DE DATOS
 * Crea las tablas y asegura que Emmanuel sea el Owner Supremo
 */
async function bootstrap() {
    try {
        console.log(">> Iniciando protocolos de seguridad de Nuevo México...");
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

        // Parche de seguridad para columnas faltantes
        await pool.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS es_admin BOOLEAN DEFAULT FALSE;`);

        // CUENTA MAESTRA: Actualizada con la clave emma06E
        const masterHash = await bcrypt.hash('emma06E', 10);
        await pool.query(`
            INSERT INTO usuarios (usuario_mc, nombre_rp, fecha_nacimiento, nacionalidad, password, es_admin)
            VALUES ('emmanuel0606', 'Emmanuel Fundador', '2000-01-01', 'México', $1, TRUE)
            ON CONFLICT (usuario_mc) DO UPDATE SET password = $1, es_admin = TRUE;
        `, [masterHash]);

        console.log("✅ Sistema Emmanuel Protegido con clave: emma06E");
    } catch (err) {
        console.error("❌ Error de Sistema:", err.message);
    }
}
bootstrap();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// --- ENDPOINTS DE LA API ---

// Login Inteligente
app.post('/api/auth/login', async (req, res) => {
    const { user, pass } = req.body;
    try {
        const result = await pool.query('SELECT * FROM usuarios WHERE usuario_mc = $1', [user]);
        if (result.rows.length === 0) return res.json({ success: false, msg: "El ciudadano no existe." });

        const userData = result.rows[0];
        const isMatch = await bcrypt.compare(pass, userData.password);

        if (isMatch) {
            let adminData = null;
            if (userData.es_admin) {
                const all = await pool.query('SELECT id, usuario_mc, nombre_rp, nacionalidad, es_admin FROM usuarios ORDER BY id DESC');
                adminData = all.rows;
            }
            res.json({ success: true, user: userData, admin: adminData });
        } else {
            res.json({ success: false, msg: "Contraseña incorrecta." });
        }
    } catch (e) { res.status(500).json({ success: false }); }
});

// Registro de Ciudadanos
app.post('/api/auth/register', async (req, res) => {
    const { user, rpname, bday, nation, pass } = req.body;
    try {
        const hash = await bcrypt.hash(pass, 10);
        await pool.query(
            'INSERT INTO usuarios (usuario_mc, nombre_rp, fecha_nacimiento, nacionalidad, password) VALUES ($1,$2,$3,$4,$5)',
            [user, rpname, bday, nation, hash]
        );
        res.json({ success: true });
    } catch (e) {
        res.json({ success: false, msg: "Error: El usuario ya está en uso." });
    }
});

// Panel Admin: Acciones
app.post('/api/admin/action', async (req, res) => {
    const { targetId, action } = req.body;
    if (action === 'delete' && targetId != 1) {
        await pool.query('DELETE FROM usuarios WHERE id = $1', [targetId]);
    } else if (action === 'promote') {
        await pool.query('UPDATE usuarios SET es_admin = TRUE WHERE id = $1', [targetId]);
    }
    res.json({ success: true });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Portal Nuevo México Activo en ${PORT}`));
