const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();

// Configuración de la Base de Datos con SSL para Render
const pool = new Pool({
  connectionString: 'postgresql://minecraft_db_pojg_user:dM593YPdzsJ6NujnEY8ywpgQYE9mUqEL@dpg-d6sv3gnfte5s73fgdok0-a/minecraft_db_pojg',
  ssl: { rejectUnauthorized: false }
});

// Función de inicialización: Crea tablas y repara columnas faltantes
async function inicializarSistema() {
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
        // Reparación de columna si el usuario ya tenía la tabla vieja
        await pool.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS es_admin BOOLEAN DEFAULT FALSE;`);
        await pool.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`);

        // Cuenta del Administrador Principal
        const passHash = await bcrypt.hash('emma2013', 10);
        await pool.query(`
            INSERT INTO usuarios (usuario_mc, nombre_rp, fecha_nacimiento, nacionalidad, password, es_admin)
            VALUES ('emmanuel0606', 'Emmanuel Dueño', '2000-01-01', 'México', $1, TRUE)
            ON CONFLICT (usuario_mc) DO UPDATE SET es_admin = TRUE;
        `, [passHash]);
        
        console.log("✅ Servidor: Base de datos vinculada y actualizada.");
    } catch (err) {
        console.error("❌ Error Crítico BD:", err.message);
    }
}
inicializarSistema();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// --- RUTAS DE LA API ---

// Obtener los últimos 5 registrados para la web blanca
app.get('/api/recientes', async (req, res) => {
    try {
        const result = await pool.query('SELECT usuario_mc, fecha_registro FROM usuarios ORDER BY fecha_registro DESC LIMIT 5');
        res.json(result.rows);
    } catch (e) { res.status(500).json([]); }
});

// Registro de nuevos personajes
app.post('/api/registrar', async (req, res) => {
    const { usuario_mc, nombre_rp, fecha_nacimiento, nacionalidad, password } = req.body;
    try {
        const hash = await bcrypt.hash(password, 10);
        await pool.query(
            'INSERT INTO usuarios (usuario_mc, nombre_rp, fecha_nacimiento, nacionalidad, password) VALUES ($1,$2,$3,$4,$5)',
            [usuario_mc, nombre_rp, fecha_nacimiento, nacionalidad, hash]
        );
        res.send(`<script>alert('¡Personaje ${nombre_rp} registrado!'); window.location='/';</script>`);
    } catch (err) {
        res.send(`<h2>Error: El nombre de usuario '${usuario_mc}' ya está en uso.</h2><a href="/">Volver</a>`);
    }
});

// Login y Control de Paneles (Admin/User)
app.post('/api/auth', async (req, res) => {
    const { usuario_mc, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM usuarios WHERE usuario_mc = $1', [usuario_mc]);
        if (result.rows.length === 0) return res.send("Usuario no existe.");

        const user = result.rows[0];
        const valido = await bcrypt.compare(password, user.password);

        if (valido) {
            if (user.es_admin) {
                const lista = await pool.query('SELECT * FROM usuarios ORDER BY id DESC');
                let rows = lista.rows.map(u => `
                    <div style="background:#fff; margin:10px 0; padding:15px; border-radius:10px; display:flex; justify-content:space-between; align-items:center; border:1px solid #eee;">
                        <span><b>${u.usuario_mc}</b> | ${u.nombre_rp} [${u.es_admin ? 'ADMIN' : 'USER'}]</span>
                        <div>
                            <a href="/op/admin/${u.id}" style="color:#27ae60; text-decoration:none; margin-right:15px; font-weight:bold;">[Promover]</a>
                            <a href="/op/borrar/${u.id}" style="color:#e74c3c; text-decoration:none; font-weight:bold;">[Eliminar]</a>
                        </div>
                    </div>
                `).join('');
                res.send(`
                    <body style="font-family:sans-serif; background:#f0f2f5; padding:40px;">
                        <h1 style="color:#2c3e50;">Panel Maestro: Emmanuel</h1>
                        <hr><div style="max-width:800px;">${rows}</div>
                        <br><a href="/" style="background:#2c3e50; color:white; padding:10px 20px; border-radius:5px; text-decoration:none;">Cerrar Sesión</a>
                    </body>
                `);
            } else {
                res.send(`
                    <body style="font-family:sans-serif; background:#fff; display:flex; justify-content:center; align-items:center; height:100vh; text-align:center;">
                        <div style="border:2px solid #2ecc71; padding:50px; border-radius:30px;">
                            <h1 style="color:#2ecc71;">¡Bienvenido al Rol!</h1>
                            <h2>${user.nombre_rp}</h2>
                            <p><b>Origen:</b> ${user.nacionalidad} | <b>ID:</b> #${user.id}</p>
                            <p style="color:#7f8c8d;">Recuerda seguir las normas del servidor.</p>
                            <a href="/" style="color:#2ecc71; font-weight:bold; text-decoration:none;">SALIR</a>
                        </div>
                    </body>
                `);
            }
        } else { res.send("Contraseña incorrecta."); }
    } catch (e) { res.send("Error interno."); }
});

// Operaciones de Admin
app.get('/op/admin/:id', async (req, res) => {
    await pool.query('UPDATE usuarios SET es_admin = TRUE WHERE id = $1', [req.params.id]);
    res.redirect('/');
});

app.get('/op/borrar/:id', async (req, res) => {
    if(req.params.id == 1) return res.send("No puedes borrar la cuenta raíz.");
    await pool.query('DELETE FROM usuarios WHERE id = $1', [req.params.id]);
    res.redirect('/');
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Puerto: ${PORT}`));
