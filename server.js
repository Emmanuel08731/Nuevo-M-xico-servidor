const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();
const pool = new Pool({
  connectionString: 'postgresql://minecraft_db_pojg_user:dM593YPdzsJ6NujnEY8ywpgQYE9mUqEL@dpg-d6sv3gnfte5s73fgdok0-a/minecraft_db_pojg',
  ssl: { rejectUnauthorized: false }
});

// Auto-creación de tabla con columna 'es_admin'
async function prepararBD() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS usuarios (
            id SERIAL PRIMARY KEY,
            usuario_mc VARCHAR(50) UNIQUE NOT NULL,
            nombre_rp VARCHAR(100) NOT NULL,
            fecha_nacimiento DATE NOT NULL,
            nacionalidad VARCHAR(50) NOT NULL,
            password TEXT NOT NULL,
            es_admin BOOLEAN DEFAULT FALSE
        );
    `);
    // Crear cuenta de dueño si no existe
    const hash = await bcrypt.hash('emma2013', 10);
    await pool.query(`
        INSERT INTO usuarios (usuario_mc, nombre_rp, fecha_nacimiento, nacionalidad, password, es_admin)
        VALUES ('emmanuel0606', 'Dueño Emmanuel', '2000-01-01', 'México', $1, TRUE)
        ON CONFLICT (usuario_mc) DO UPDATE SET es_admin = TRUE;
    `, [hash]);
    console.log("✅ BD y Admin configurados.");
}
prepararBD();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// RUTA: REGISTRO
app.post('/registro', async (req, res) => {
    const { usuario_mc, nombre_rp, fecha_nacimiento, nacionalidad, password } = req.body;
    try {
        const hash = await bcrypt.hash(password, 10);
        await pool.query('INSERT INTO usuarios (usuario_mc, nombre_rp, fecha_nacimiento, nacionalidad, password) VALUES ($1,$2,$3,$4,$5)', 
        [usuario_mc, nombre_rp, fecha_nacimiento, nacionalidad, hash]);
        res.send("<h1>Registro exitoso. <a href='/'>Volver</a></h1>");
    } catch (e) { res.status(500).send("Error: " + e.message); }
});

// RUTA: LOGIN + PANEL ADMIN
app.post('/login', async (req, res) => {
    const { usuario_mc, password } = req.body;
    const result = await pool.query('SELECT * FROM usuarios WHERE usuario_mc = $1', [usuario_mc]);
    if (result.rows.length > 0) {
        const user = result.rows[0];
        if (await bcrypt.compare(password, user.password)) {
            if (user.es_admin) {
                const todos = await pool.query('SELECT id, usuario_mc, nombre_rp, es_admin FROM usuarios');
                let tabla = todos.rows.map(u => `
                    <tr>
                        <td>${u.usuario_mc}</td>
                        <td>${u.nombre_rp}</td>
                        <td>${u.es_admin ? '⭐ Admin' : 'Jugador'}</td>
                        <td><a href="/hacer-admin/${u.id}">Dar Admin</a></td>
                    </tr>`).join('');
                return res.send(`<h1>Panel Admin</h1><table border="1">${tabla}</table><br><a href="/">Salir</a>`);
            }
            return res.send(`<h1>Bienvenido ${user.nombre_rp}</h1><p>Nacionalidad: ${user.nacionalidad}</p><a href="/">Salir</a>`);
        }
    }
    res.send("Datos incorrectos.");
});

// RUTA: ASIGNAR ADMIN
app.get('/hacer-admin/:id', async (req, res) => {
    await pool.query('UPDATE usuarios SET es_admin = TRUE WHERE id = $1', [req.params.id]);
    res.send("Rango actualizado. <a href='/'>Regresar</a>");
});

app.listen(process.env.PORT || 10000);
