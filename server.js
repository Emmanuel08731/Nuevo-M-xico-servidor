const express = require('express');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://usuario:password@localhost:5432/devroot'
});

app.use(compression());
app.use(express.json());
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.static(path.join(__dirname, 'public')));

// API: Crear Cuenta
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query(
            'INSERT INTO users (username, email, password) VALUES ($1, $2, $3)',
            [username, email, hashedPassword]
        );
        res.json({ success: true, message: "Cuenta creada con éxito" });
    } catch (err) {
        res.status(500).json({ success: false, error: "Error al crear la cuenta" });
    }
});

// API: Iniciar Sesión
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length > 0) {
            const user = result.rows[0];
            const valid = await bcrypt.compare(password, user.password);
            if (valid) {
                return res.json({ success: true, user: { name: user.username, role: "Director" } });
            }
        }
        res.status(401).json({ success: false, error: "Llave incorrecta" });
    } catch (err) {
        res.status(500).json({ success: false, error: "Error de servidor" });
    }
});

app.listen(PORT, () => {
    console.log(`\n🚀 DevRoot v6.0 Online\nDirector: Emmanuel\nURL: http://localhost:${PORT}`);
});
