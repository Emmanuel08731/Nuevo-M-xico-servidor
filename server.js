const express = require('express');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;

// Base de datos simulada en memoria
const usersDB = []; 

app.use(compression());
app.use(express.json());
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.static(path.join(__dirname, 'public')));

// API: Crear Cuenta (Guardado temporal)
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        usersDB.push({ username, email, password: hashedPassword });
        console.log(`[SISTEMA] Usuario registrado: ${username}`);
        res.json({ success: true, message: "Cuenta creada en el nodo" });
    } catch (err) {
        res.status(500).json({ success: false, error: "Error de cifrado" });
    }
});

// API: Iniciar Sesión
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const user = usersDB.find(u => u.email === email);

    if (user) {
        const valid = await bcrypt.compare(password, user.password);
        if (valid) {
            return res.json({ success: true, user: { name: user.username, role: "Director" } });
        }
    }
    res.status(401).json({ success: false, error: "Llave incorrecta o usuario no existe" });
});

app.listen(PORT, () => {
    console.log(`\n🚀 DevRoot v6.0 Online\nDirector: Emmanuel\nModo: Local Storage\nURL: http://localhost:${PORT}`);
});
