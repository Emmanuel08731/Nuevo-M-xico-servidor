const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();

// Configuración de la Base de Datos (PostgreSQL Render)
const pool = new Pool({
  connectionString: 'postgresql://minecraft_db_pojg_user:dM593YPdzsJ6NujnEY8ywpgQYE9mUqEL@dpg-d6sv3gnfte5s73fgdok0-a/minecraft_db_pojg',
  ssl: { rejectUnauthorized: false }
});

/**
 * PROTOCOLO DE INICIO SUPREMO - EMMANUEL 2026
 * Crea las tablas y asegura que el Fundador siempre tenga acceso.
 */
async function bootstrapping() {
    try {
        console.log(">> [SISTEMA] Verificando tablas en PostgreSQL...");
        
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

        // Cuenta Maestra: Emmanuel0606 (Clave: emma06E)
        const rootPass = await bcrypt.hash('emma06E', 10);
        await pool.query(`
            INSERT INTO usuarios (usuario_mc, nombre_rp, fecha_nacimiento, nacionalidad, password, es_admin)
            VALUES ('emmanuel0606', 'Emmanuel Fundador', '2000-01-01', 'México', $1, TRUE)
            ON CONFLICT (usuario_mc) DO UPDATE SET password = $1, es_admin = TRUE;
        `, [rootPass]);

        console.log("✅ [ÉXITO] Base de datos conectada y Emmanuel verificado.");
    } catch (err) {
        console.error("❌ [ERROR CRÍTICO] No se pudo conectar a la DB:", err.message);
    }
}
bootstrapping();

app.use(express.json());
app.use(express.static('public'));

// --- RUTAS DE API ---

// LOGIN: Entrega token de sesión simulado y datos de rango
app.post('/api/auth/login', async (req, res) => {
    const { user, pass } = req.body;
    try {
        const result = await pool.query('SELECT * FROM usuarios WHERE usuario_mc = $1', [user]);
        
        if (result.rows.length === 0) {
            return res.json({ success: false, error: 'NOT_FOUND', msg: 'Ciudadano no registrado.' });
        }

        const dbUser = result.rows[0];
        const match = await bcrypt.compare(pass, dbUser.password);

        if (match) {
            let userList = null;
            // Si es Admin, enviamos la lista de todos para el Panel
            if (dbUser.es_admin) {
                const all = await pool.query('SELECT id, usuario_mc, nombre_rp, es_admin FROM usuarios ORDER BY id DESC');
                userList = all.rows;
            }
            res.json({ 
                success: true, 
                userData: {
                    id: dbUser.id,
                    u_mc: dbUser.usuario_mc,
                    n_rp: dbUser.nombre_rp,
                    nac: dbUser.nacionalidad,
                    adm: dbUser.es_admin
                },
                fullList: userList
            });
        } else {
            res.json({ success: false, error: 'AUTH_FAILED', msg: 'Credenciales inválidas.' });
        }
    } catch (e) {
        res.status(500).json({ success: false, msg: 'Error de conexión.' });
    }
});

// REGISTRO DE CIUDADANOS
app.post('/api/auth/register', async (req, res) => {
    const { u, n, d, na, p } = req.body;
    try {
        const hash = await bcrypt.hash(p, 10);
        await pool.query(
            'INSERT INTO usuarios (usuario_mc, nombre_rp, fecha_nacimiento, nacionalidad, password) VALUES ($1,$2,$3,$4,$5)',
            [u, n, d, na, hash]
        );
        res.json({ success: true });
    } catch (e) {
        res.json({ success: false, msg: 'El nombre de usuario ya existe.' });
    }
});

// ELIMINACIÓN DE USUARIOS (ELIMINA DE LA BASE DE DATOS REAL)
app.post('/api/admin/delete', async (req, res) => {
    const { targetId } = req.body;
    try {
        // Protección: No permitir que Emmanuel se borre a sí mismo
        if (targetId == 1) return res.json({ success: false, msg: 'No puedes borrar al Fundador.' });

        await pool.query('DELETE FROM usuarios WHERE id = $1', [targetId]);
        res.json({ success: true, msg: 'Usuario eliminado permanentemente.' });
    } catch (e) {
        res.json({ success: false, msg: 'Error al procesar el borrado.' });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Sistema activo en puerto ${PORT}`));
