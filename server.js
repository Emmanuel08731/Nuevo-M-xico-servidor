/**
 * ==============================================================================
 * DEVROOT SERVER ENGINE v6.0.4 - PRODUCTION READY
 * AUTHOR: EMMANUEL (DIRECTOR OF DIGITAL PROJECTS)
 * ==============================================================================
 */

const express = require('express');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;

// BASE DE DATOS VOLÁTIL INTEGRADA
let usersDB = []; 
let systemLogs = [
    { id: 1, time: new Date().toLocaleTimeString(), event: "Núcleo DevRoot inicializado", status: "OK" },
    { id: 2, time: new Date().toLocaleTimeString(), event: "Sincronización con Emmanuel Store establecida", status: "ACTIVE" }
];

// MIDDLEWARES DE ALTO RENDIMIENTO
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

// SERVICIO DE ACTIVOS ESTÁTICOS DECORADOS
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1d',
    setHeaders: (res, path) => {
        if (path.endsWith('.css')) res.setHeader('Content-Type', 'text/css');
        if (path.endsWith('.js')) res.setHeader('Content-Type', 'application/javascript');
    }
}));

/**
 * SISTEMA DE API REST - AUTH & MANAGEMENT
 */

// REGISTRO DE NODOS (USUARIOS)
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const userExists = usersDB.find(u => u.email === email);
        if (userExists) return res.status(400).json({ success: false, error: "El nodo ya existe en la red" });
        
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const newUser = { id: Date.now(), username, email, password: hashedPassword, role: "Director" };
        usersDB.push(newUser);
        
        systemLogs.unshift({ id: Date.now(), time: new Date().toLocaleTimeString(), event: `Nuevo registro: ${username}`, status: "NEW" });
        res.status(201).json({ success: true, message: "Nodo creado con éxito" });
    } catch (err) {
        res.status(500).json({ success: false, error: "Fallo crítico en el cifrado" });
    }
});

// LOGIN Y ACCESO MAESTRO
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = usersDB.find(u => u.email === email);
        if (!user) return res.status(401).json({ success: false, error: "Identidad no reconocida" });
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ success: false, error: "Llave de acceso inválida" });
        
        systemLogs.unshift({ id: Date.now(), time: new Date().toLocaleTimeString(), event: `Login exitoso: ${user.username}`, status: "LOGIN" });
        res.json({ success: true, user: { name: user.username, email: user.email, role: user.role } });
    } catch (err) {
        res.status(500).json({ success: false, error: "Error interno del servidor" });
    }
});

// ELIMINACIÓN DE CUENTA
app.post('/api/auth/delete', (req, res) => {
    const { email } = req.body;
    const initialCount = usersDB.length;
    usersDB = usersDB.filter(u => u.email !== email);
    
    if (usersDB.length < initialCount) {
        systemLogs.unshift({ id: Date.now(), time: new Date().toLocaleTimeString(), event: `Cuenta eliminada: ${email}`, status: "DELETED" });
        return res.json({ success: true });
    }
    res.status(404).json({ success: false, error: "Nodo no encontrado" });
});

// MANEJO DE RUTAS 404
app.use((req, res) => {
    res.status(404).send('<h1>Error 404: Nodo no encontrado en DevRoot</h1>');
});

// INICIO DE SERVICIO
app.listen(PORT, () => {
    console.log(`
    [SYSTEM] DevRoot v6.0 iniciado correctamente.
    [INFO] Director: Emmanuel
    [URL] Accede en: http://localhost:${PORT}
    [LOG] Esperando conexiones de red...
    `);
});
