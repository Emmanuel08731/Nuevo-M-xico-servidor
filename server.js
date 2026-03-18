const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();

// Configuración de la Base de Datos
const pool = new Pool({
  connectionString: 'postgresql://minecraft_db_pojg_user:dM593YPdzsJ6NujnEY8ywpgQYE9mUqEL@dpg-d6sv3gnfte5s73fgdok0-a/minecraft_db_pojg',
  ssl: { rejectUnauthorized: false }
});

// Inicialización de la Base de Datos al arrancar
async function initDB() {
    try {
        // Crear tabla de usuarios con permisos
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

        // Crear cuenta del Dueño Emmanuel
        const hash = await bcrypt.hash('emma2013', 10);
        await pool.query(`
            INSERT INTO usuarios (usuario_mc, nombre_rp, fecha_nacimiento, nacionalidad, password, es_admin)
            VALUES ('emmanuel0606', 'Dueño Emmanuel', '2000-01-01', 'México', $1, TRUE)
            ON CONFLICT (usuario_mc) DO UPDATE SET es_admin = TRUE;
        `, [hash]);
        console.log("✅ Sistema de base de datos inicializado correctamente.");
    } catch (err) {
        console.error("❌ Error inicializando BD:", err.message);
    }
}
initDB();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// --- RUTAS DE LA API ---

// 1. Registro de usuarios
app.post('/api/registro', async (req, res) => {
    const { usuario_mc, nombre_rp, fecha_nacimiento, nacionalidad, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query(
            'INSERT INTO usuarios (usuario_mc, nombre_rp, fecha_nacimiento, nacionalidad, password) VALUES ($1, $2, $3, $4, $5)',
            [usuario_mc, nombre_rp, fecha_nacimiento, nacionalidad, hashedPassword]
        );
        res.send(`
            <div style="background:#0a0a0a; color:white; height:100vh; display:flex; flex-direction:column; justify-content:center; align-items:center; font-family:sans-serif;">
                <h1 style="color:#57ff57;">¡PERSONAJE CREADO!</h1>
                <p>Bienvenido al servidor, ${nombre_rp}. Ya puedes iniciar sesión.</p>
                <a href="/" style="padding:15px 30px; background:#57ff57; color:black; text-decoration:none; border-radius:5px; font-weight:bold; margin-top:20px;">VOLVER AL INICIO</a>
            </div>
        `);
    } catch (err) {
        res.status(500).send("El usuario ya existe o hay un error de conexión.");
    }
});

// 2. Login y Panel Dinámico
app.post('/api/login', async (req, res) => {
    const { usuario_mc, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM usuarios WHERE usuario_mc = $1', [usuario_mc]);
        if (result.rows.length === 0) return res.send("Usuario no encontrado.");

        const user = result.rows[0];
        const match = await bcrypt.compare(password, user.password);

        if (match) {
            if (user.es_admin) {
                // PANEL DE ADMINISTRADOR
                const todos = await pool.query('SELECT * FROM usuarios ORDER BY id ASC');
                let filas = todos.rows.map(u => `
                    <tr style="border-bottom: 1px solid #333;">
                        <td style="padding:15px;">${u.usuario_mc}</td>
                        <td style="padding:15px;">${u.nombre_rp}</td>
                        <td style="padding:15px;">${u.es_admin ? '<b style="color:#57ff57;">ADMIN</b>' : 'Jugador'}</td>
                        <td style="padding:15px;">
                            <a href="/admin/promover/${u.id}" style="color:#57ff57; text-decoration:none; margin-right:10px;">[Hacer Admin]</a>
                            <a href="/admin/eliminar/${u.id}" style="color:#ff4444; text-decoration:none;">[Eliminar]</a>
                        </td>
                    </tr>
                `).join('');

                res.send(`
                    <body style="background:#0a0a0a; color:white; font-family:sans-serif; padding:40px;">
                        <h1 style="border-left: 5px solid #57ff57; padding-left:20px;">PANEL DE CONTROL: <span style="color:#57ff57;">EMMANUEL</span></h1>
                        <p>Gestiona los ciudadanos de Nuevo México RP</p>
                        <table style="width:100%; border-collapse:collapse; background:#111; border-radius:10px; overflow:hidden;">
                            <thead style="background:#222; color:#57ff57;">
                                <tr><th>Usuario MC</th><th>Nombre RP</th><th>Rango</th><th>Acciones</th></tr>
                            </thead>
                            <tbody>${filas}</tbody>
                        </table>
                        <br><a href="/" style="color:white; opacity:0.6;">Cerrar Sesión de Admin</a>
                    </body>
                `);
            } else {
                // PANEL DE USUARIO NORMAL
                res.send(`
                    <body style="background:#0a0a0a; color:white; font-family:sans-serif; display:flex; justify-content:center; align-items:center; height:100vh;">
                        <div style="background:#111; padding:40px; border-radius:20px; border:1px solid #333; width:400px; text-align:center;">
                            <div style="font-size:50px;">👤</div>
                            <h2 style="color:#57ff57; margin-bottom:5px;">${user.nombre_rp}</h2>
                            <p style="color:#888; margin-bottom:20px;">@${user.usuario_mc}</p>
                            <div style="text-align:left; background:#1a1a1a; padding:15px; border-radius:10px; font-size:14px;">
                                <p><b>Nacionalidad:</b> ${user.nacionalidad}</p>
                                <p><b>Fecha Nac:</b> ${user.fecha_nacimiento.toLocaleDateString()}</p>
                                <p><b>Rango:</b> Ciudadano</p>
                            </div>
                            <br><a href="/" style="color:#ff4444; text-decoration:none; font-weight:bold;">DESCONECTARSE</a>
                        </div>
                    </body>
                `);
            }
        } else {
            res.send("Contraseña incorrecta.");
        }
    } catch (err) { res.status(500).send("Error de servidor."); }
});

// 3. Funciones de Admin (Promover y Eliminar)
app.get('/admin/promover/:id', async (req, res) => {
    await pool.query('UPDATE usuarios SET es_admin = TRUE WHERE id = $1', [req.params.id]);
    res.send("<script>alert('Rango actualizado'); window.history.back();</script>");
});

app.get('/admin/eliminar/:id', async (req, res) => {
    if (req.params.id == 1) return res.send("No puedes eliminar al dueño.");
    await pool.query('DELETE FROM usuarios WHERE id = $1', [req.params.id]);
    res.send("<script>alert('Usuario eliminado'); window.history.back();</script>");
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Servidor en línea en puerto ${PORT}`));
