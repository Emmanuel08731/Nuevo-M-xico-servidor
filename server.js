const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();

// Configuración de la Base de Datos (USANDO TU URL INTERNAL)
const pool = new Pool({
  connectionString: 'postgresql://minecraft_db_pojg_user:dM593YPdzsJ6NujnEY8ywpgQYE9mUqEL@dpg-d6sv3gnfte5s73fgdok0-a/minecraft_db_pojg',
  ssl: { rejectUnauthorized: false }
});

// Función para crear la tabla automáticamente al iniciar
async function prepararBaseDeDatos() {
    const query = `
        CREATE TABLE IF NOT EXISTS usuarios (
            id SERIAL PRIMARY KEY,
            usuario_mc VARCHAR(50) UNIQUE NOT NULL,
            nombre_rp VARCHAR(100) NOT NULL,
            fecha_nacimiento DATE NOT NULL,
            nacionalidad VARCHAR(50) NOT NULL,
            password TEXT NOT NULL
        );
    `;
    try {
        await pool.query(query);
        console.log("✅ Base de datos lista y tabla 'usuarios' verificada.");
    } catch (err) {
        console.error("❌ Error al preparar BD:", err.message);
    }
}
prepararBaseDeDatos();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// RUTA: REGISTRO
app.post('/registro', async (req, res) => {
    const { usuario_mc, nombre_rp, fecha_nacimiento, nacionalidad, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query(
            'INSERT INTO usuarios (usuario_mc, nombre_rp, fecha_nacimiento, nacionalidad, password) VALUES ($1, $2, $3, $4, $5)',
            [usuario_mc, nombre_rp, fecha_nacimiento, nacionalidad, hashedPassword]
        );
        res.send(`
            <body style="background:#1a1a1a;color:white;font-family:sans-serif;display:flex;flex-direction:column;justify-content:center;align-items:center;height:100vh;">
                <h1 style="color:#57ff57;">¡Registro Exitoso, ${usuario_mc}!</h1>
                <p>Tu personaje ${nombre_rp} ha sido creado.</p>
                <a href="/" style="color:white;background:#333;padding:10px 20px;text-decoration:none;border-radius:5px;">Volver al Inicio</a>
            </body>
        `);
    } catch (err) {
        res.status(500).send("Error al registrar (el usuario ya existe o faltan datos): " + err.message);
    }
});

// RUTA: LOGIN
app.post('/login', async (req, res) => {
    const { usuario_mc, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM usuarios WHERE usuario_mc = $1', [usuario_mc]);
        if (result.rows.length > 0) {
            const user = result.rows[0];
            const match = await bcrypt.compare(password, user.password);
            if (match) {
                res.send(`
                    <body style="background:#1a1a1a;color:white;font-family:sans-serif;padding:50px;">
                        <div style="max-width:600px;margin:auto;background:#2a2a2a;padding:30px;border-radius:15px;border:2px solid #57ff57;">
                            <h1 style="color:#57ff57;text-align:center;">Perfil del Jugador</h1>
                            <hr style="border:0.5px solid #444;">
                            <p><b>👤 Usuario MC:</b> ${user.usuario_mc}</p>
                            <p><b>🎭 Nombre RP:</b> ${user.nombre_rp}</p>
                            <p><b>📅 Nacimiento:</b> ${user.fecha_nacimiento.toDateString()}</p>
                            <p><b>🌎 Nacionalidad:</b> ${user.nacionalidad}</p>
                            <br>
                            <a href="/" style="display:block;text-align:center;color:#ff5757;">Cerrar Sesión</a>
                        </div>
                    </body>
                `);
            } else { res.send("Contraseña incorrecta. <a href='/'>Reintentar</a>"); }
        } else { res.send("Usuario no encontrado. <a href='/'>Reintentar</a>"); }
    } catch (err) { res.status(500).send("Error en el servidor."); }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Web activa en puerto ${PORT}`));
