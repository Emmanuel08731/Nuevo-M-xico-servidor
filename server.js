const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();

// Configuración de conexión con PostgreSQL (Render)
const pool = new Pool({
  connectionString: 'postgresql://minecraft_db_pojg_user:dM593YPdzsJ6NujnEY8ywpgQYE9mUqEL@dpg-d6sv3gnfte5s73fgdok0-a/minecraft_db_pojg',
  ssl: { rejectUnauthorized: false }
});

/**
 * PROTOCOLO DE INICIO SUPREMO
 * Este bloque asegura la integridad de los datos y el rango de Emmanuel
 */
async function initDatabase() {
    try {
        console.log(">> [SISTEMA] Iniciando protocolos de seguridad...");
        
        // Crear tabla principal si no existe
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

        // Parche de columnas dinámicas
        await pool.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS es_admin BOOLEAN DEFAULT FALSE;`);

        // CONFIGURACIÓN DE CUENTA DUEÑO (EMMANUEL)
        // Usuario: emmanuel0606 | Clave: emma06E
        const ownerHash = await bcrypt.hash('emma06E', 10);
        await pool.query(`
            INSERT INTO usuarios (usuario_mc, nombre_rp, fecha_nacimiento, nacionalidad, password, es_admin)
            VALUES ('emmanuel0606', 'Emmanuel Fundador', '2000-01-01', 'México', $1, TRUE)
            ON CONFLICT (usuario_mc) DO UPDATE SET password = $1, es_admin = TRUE;
        `, [ownerHash]);

        console.log("✅ [SISTEMA] Base de datos vinculada. Acceso Emmanuel: ACTIVO.");
    } catch (err) {
        console.error("❌ [ERROR CRÍTICO]", err.message);
    }
}
initDatabase();

app.use(express.json());
app.use(express.static('public'));

// --- RUTAS DE API (BACKEND) ---

// LOGIN: Detecta rango y envía datos correspondientes
app.post('/api/login', async (req, res) => {
    const { user, pass } = req.body;
    try {
        const result = await pool.query('SELECT * FROM usuarios WHERE usuario_mc = $1', [user]);
        if (result.rows.length === 0) return res.json({ success: false, msg: "Usuario no registrado." });

        const u = result.rows[0];
        const match = await bcrypt.compare(pass, u.password);

        if (match) {
            let listData = null;
            // Si es Emmanuel (Admin), enviamos la lista de todos los ciudadanos
            if (u.es_admin) {
                const all = await pool.query('SELECT id, usuario_mc, nombre_rp, nacionalidad, es_admin FROM usuarios ORDER BY id DESC');
                listData = all.rows;
            }
            res.json({ success: true, userData: u, adminData: listData });
        } else {
            res.json({ success: false, msg: "Contraseña incorrecta." });
        }
    } catch (e) { res.status(500).json({ success: false }); }
});

// REGISTRO: Crea nuevos ciudadanos
app.post('/api/register', async (req, res) => {
    const { user, rp, bday, nation, pass } = req.body;
    try {
        const hash = await bcrypt.hash(pass, 10);
        await pool.query(
            'INSERT INTO usuarios (usuario_mc, nombre_rp, fecha_nacimiento, nacionalidad, password) VALUES ($1,$2,$3,$4,$5)',
            [user, rp, bday, nation, hash]
        );
        res.json({ success: true });
    } catch (e) {
        res.json({ success: false, msg: "El nombre de usuario ya está ocupado." });
    }
});

// ACCIONES ADMIN: Borrar o Promover
app.post('/api/admin/action', async (req, res) => {
    const { targetId, actionType } = req.body;
    try {
        if (actionType === 'delete' && targetId != 1) {
            await pool.query('DELETE FROM usuarios WHERE id = $1', [targetId]);
        } else if (actionType === 'promote') {
            await pool.query('UPDATE usuarios SET es_admin = TRUE WHERE id = $1', [targetId]);
        }
        res.json({ success: true });
    } catch (e) { res.json({ success: false }); }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Web operando en puerto ${PORT}`));
