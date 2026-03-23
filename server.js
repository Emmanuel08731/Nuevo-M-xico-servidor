/**
 * ==============================================================================
 * DEVROOT CORE ENGINE v6.0.4 - SISTEMA DE GESTIÓN DE NODOS
 * ARQUITECTURA: BACK-END DE ALTA DISPONIBILIDAD
 * ==============================================================================
 */

const express = require('express');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;

// BASE DE DATOS EN MEMORIA (ESTRUCTURA VOLÁTIL)
let usersDB = []; 
let activeSessions = new Set();
let securityAuditTrail = [];

/**
 * MIDDLEWARES DE SEGURIDAD Y OPTIMIZACIÓN
 */
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "https://cdnjs.cloudflare.com", "'unsafe-inline'"],
            styleSrc: ["'self'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com", "'unsafe-inline'"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "blob:"],
            connectSrc: ["'self'"]
        }
    }
}));

app.use(compression()); 
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

/**
 * CONFIGURACIÓN DE SERVIDOR ESTÁTICO
 */
const staticOptions = {
    dotfiles: 'ignore',
    etag: true,
    index: "index.html",
    maxAge: '7d',
    setHeaders: (res, path) => {
        res.set('X-Server-Source', 'DevRoot-Nexus');
    }
};

app.use(express.static(path.join(__dirname, 'public'), staticOptions));

/**
 * RUTAS DE LA API DE AUTENTICACIÓN
 */

// REGISTRO DE NUEVA UNIDAD DE ACCESO
app.post('/api/auth/register', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, error: "Datos de entrada incompletos." });
    }

    if (password.length < 8) {
        return res.status(400).json({ success: false, error: "La política de seguridad requiere 8+ caracteres." });
    }

    const collision = usersDB.find(u => u.email === email);
    if (collision) {
        return res.status(409).json({ success: false, error: "El identificador ya está en uso." });
    }

    try {
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const newNode = {
            id: `NODE-${Date.now()}`,
            email: email,
            password: hashedPassword,
            status: "standby",
            created: new Date().toISOString()
        };

        usersDB.push(newNode);
        securityAuditTrail.push(`[SISTEMA] Registro exitoso: ${email}`);
        
        return res.status(201).json({ success: true, message: "Registro completado." });
    } catch (err) {
        return res.status(500).json({ success: false, error: "Error en el módulo de encriptación." });
    }
});

// LOGIN Y ACCESO AL DASHBOARD
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    const user = usersDB.find(u => u.email === email);
    if (!user) {
        return res.status(401).json({ success: false, error: "Credenciales de acceso inválidas." });
    }

    try {
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return res.status(401).json({ success: false, error: "La llave de seguridad no coincide." });
        }

        const sessionToken = `TOKEN-${Math.random().toString(36).substr(2, 10)}`;
        activeSessions.add(sessionToken);
        
        return res.json({ 
            success: true, 
            user: { email: user.email, token: sessionToken } 
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: "Error interno del servidor." });
    }
});

// ELIMINACIÓN DE REGISTROS (PURGA)
app.post('/api/auth/delete', (req, res) => {
    const { email } = req.body;
    const prevLen = usersDB.length;
    usersDB = usersDB.filter(u => u.email !== email);

    if (usersDB.length < prevLen) {
        securityAuditTrail.push(`[PURGA] Nodo eliminado: ${email}`);
        return res.json({ success: true });
    }
    
    return res.status(404).json({ success: false, error: "Nodo no localizado." });
});

// INICIO DEL SERVICIO
app.listen(PORT, () => {
    console.log("==========================================");
    console.log(`| DEVROOT ENGINE v6.0.4 ONLINE          |`);
    console.log(`| PUERTO ACTIVO: ${PORT}                  |`);
    console.log("==========================================");
});
