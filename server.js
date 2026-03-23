const express = require('express');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;

// Base de datos volátil (Memoria)
let usersDB = []; 
let postsDB = []; 

app.use(compression());
app.use(express.json());
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.static(path.join(__dirname, 'public')));

// --- SISTEMA DE AUTENTICACIÓN ---
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body;
    if (usersDB.find(u => u.email === email)) return res.status(400).json({ error: "Email ya registrado" });
    const hashed = await bcrypt.hash(password, 10);
    usersDB.push({ id: Date.now(), username, email, password: hashed });
    res.json({ success: true });
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const user = usersDB.find(u => u.email === email);
    if (user && await bcrypt.compare(password, user.password)) {
        return res.json({ success: true, user: { name: user.username, email: user.email } });
    }
    res.status(401).json({ error: "Credenciales inválidas" });
});

app.post('/api/auth/delete', (req, res) => {
    const { email } = req.body;
    usersDB = usersDB.filter(u => u.email !== email);
    res.json({ success: true });
});

app.listen(PORT, () => console.log(`DevRoot Engine v6.0 running on port ${PORT}`));
