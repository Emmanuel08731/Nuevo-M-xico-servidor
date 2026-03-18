const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();

// Configuración de conexión a PostgreSQL
const pool = new Pool({
  connectionString: 'postgresql://minecraft_db_pojg_user:dM593YPdzsJ6NujnEY8ywpgQYE9mUqEL@dpg-d6sv3gnfte5s73fgdok0-a/minecraft_db_pojg',
  ssl: { rejectUnauthorized: false }
});

// Función de inicialización: Crea la estructura necesaria si no existe
async function bootSystem() {
    try {
        console.log("--- Iniciando Validación de Base de Datos ---");
        // Crear tabla de ciudadanos
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

        // Reparar tabla en caso de que falten columnas (Anti-Errores)
        await pool.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS es_admin BOOLEAN DEFAULT FALSE;`);
        await pool.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`);

        // Crear cuenta maestra de Emmanuel
        const adminPass = await bcrypt.hash('emma2013', 10);
        await pool.query(`
            INSERT INTO usuarios (usuario_mc, nombre_rp, fecha_nacimiento, nacionalidad, password, es_admin)
            VALUES ('emmanuel0606', 'Emmanuel Fundador', '2000-01-01', 'México', $1, TRUE)
            ON CONFLICT (usuario_mc) DO UPDATE SET es_admin = TRUE;
        `, [adminPass]);

        console.log("✅ Sistema: Base de datos sincronizada correctamente.");
    } catch (err) {
        console.error("❌ Error de inicio:", err.message);
    }
}
bootSystem();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// --- ENDPOINTS DE LA API ---

// Registro de nuevos usuarios
app.post('/api/register', async (req, res) => {
    const { user_mc, name_rp, birth, nation, pass } = req.body;
    try {
        const hashed = await bcrypt.hash(pass, 10);
        await pool.query(
            'INSERT INTO usuarios (usuario_mc, nombre_rp, fecha_nacimiento, nacionalidad, password) VALUES ($1,$2,$3,$4,$5)',
            [user_mc, name_rp, birth, nation, hashed]
        );
        res.json({ success: true, message: "¡Ciudadano registrado!" });
    } catch (e) {
        res.json({ success: false, message: "El usuario de MC ya existe en nuestra base de datos." });
    }
});

// Login y obtención de datos de perfil
app.post('/api/login', async (req, res) => {
    const { user_mc, pass } = req.body;
    try {
        const result = await pool.query('SELECT * FROM usuarios WHERE usuario_mc = $1', [user_mc]);
        if (result.rows.length === 0) return res.json({ success: false, msg: "Usuario no encontrado" });

        const user = result.rows[0];
        const match = await bcrypt.compare(pass, user.password);

        if (match) {
            // Si es admin, devolvemos también la lista de usuarios para el dashboard
            let userList = [];
            if (user.es_admin) {
                const all = await pool.query('SELECT id, usuario_mc, nombre_rp, es_admin FROM usuarios ORDER BY id DESC');
                userList = all.rows;
            }
            res.json({ success: true, user: user, adminData: userList });
        } else {
            res.json({ success: false, msg: "Contraseña incorrecta" });
        }
    } catch (e) { res.status(500).send("Error de servidor"); }
});

// Cambiar rango a Admin
app.post('/api/promote', async (req, res) => {
    const { targetId } = req.body;
    await pool.query('UPDATE usuarios SET es_admin = TRUE WHERE id = $1', [targetId]);
    res.json({ success: true });
});

// Eliminar usuario
app.post('/api/delete-user', async (req, res) => {
    const { targetId } = req.body;
    if(targetId == 1) return res.json({ success: false });
    await pool.query('DELETE FROM usuarios WHERE id = $1', [targetId]);
    res.json({ success: true });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Web Server Nuevo México RP activo en puerto ${PORT}`));
