const express = require('express');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(compression());
app.use(express.json());
app.use(helmet({ contentSecurityPolicy: false }));

// CONFIGURACIÓN CLAVE: Sirve los archivos de la carpeta public
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (email === 'dev@emmanuel.store' && password === '12345678') {
        res.json({ success: true, user: { name: "Emmanuel", role: "Director" } });
    } else {
        res.status(401).json({ success: false, error: "Llave incorrecta" });
    }
});

app.listen(PORT, () => {
    console.log(`\n🚀 DevRoot v6.0 Online\nDirector: Emmanuel\nURL: http://localhost:${PORT}`);
});
