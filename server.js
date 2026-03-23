/**
 * ==========================================================
 * DEVROOT CORE ENGINE - v6.0.4
 * INFRAESTRUCTURA DE ALTO RENDIMIENTO
 * ==========================================================
 */
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;

// BASE DE DATOS EN MEMORIA VOLÁTIL
let usersDB = []; 
let accessLogs = [];

// MIDDLEWARES DE OPTIMIZACIÓN
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// SEGURIDAD DE CABECERAS
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "https://cdnjs.cloudflare.com"],
            styleSrc: ["'self'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com", "'unsafe-inline'"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:"],
        },
    },
}));

// SERVIDOR DE ARCHIVOS ESTÁTICOS
app.use(express.static(path.join(__dirname, 'public')));

/**
 * ENDPOINTS DE AUTENTICACIÓN
 */

// REGISTRO DE NUEVOS NODOS
app.post('/api/auth/register', async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ error: "Credenciales incompletas" });
    }

    const userExists = usersDB.find(u => u.email === email);
    if (userExists) {
        return res.status(409).json({ error: "El nodo ya existe en la red" });
    }

    try {
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        usersDB.push({
            id: Date.now(),
            email: email,
            password: hashedPassword,
            createdAt: new Date()
        });

        res.status(201).json({ success: true, message: "Nodo inicializado" });
    } catch (err) {
        res.status(500).json({ error: "Fallo en el protocolo de cifrado" });
    }
});

// ACCESO AL DASHBOARD
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    const user = usersDB.find(u => u.email === email);
    if (!user) {
        return res.status(401).json({ error: "Identidad no encontrada" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(401).json({ error: "Llave de acceso incorrecta" });
    }

    accessLogs.push({ user: email, time: new Date() });
    res.json({ success: true, user: { email: user.email } });
});

// ELIMINACIÓN PERMANENTE
app.post('/api/auth/delete', (req, res) => {
    const { email } = req.body;
    const initialSize = usersDB.length;
    usersDB = usersDB.filter(u => u.email !== email);

    if (usersDB.length < initialSize) {
        return res.json({ success: true });
    }
    res.status(404).json({ error: "No se pudo localizar el nodo para destrucción" });
});

// MANEJO DE ERRORES GLOBALES
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Error interno en el núcleo DevRoot');
});

app.listen(PORT, () => {
    console.log(`[DEVROOT] Sistema operando en puerto: ${PORT}`);
});
