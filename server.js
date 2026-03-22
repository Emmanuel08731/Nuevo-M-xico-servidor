const express = require('express');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;

let usersDB = []; // Base de datos temporal en memoria

app.use(compression());
app.use(express.json());
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    usersDB.push({ username, email, password: hashed });
    res.json({ success: true });
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const user = usersDB.find(u => u.email === email);
    if (user && await bcrypt.compare(password, user.password)) {
        return res.json({ success: true, user: { name: user.username } });
    }
    res.status(401).json({ success: false });
});

// Ruta para eliminar cuenta
app.post('/api/auth/delete', (req, res) => {
    const { email } = req.body;
    usersDB = usersDB.filter(u => u.email !== email);
    res.json({ success: true });
});

app.listen(PORT, () => console.log(`DevRoot v6.0 en puerto ${PORT}`));
