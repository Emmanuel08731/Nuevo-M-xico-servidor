/**
 * ==============================================================================
 * DEVROOT CORE ENGINE v6.0.4 - ENTERPRISE EDITION
 * AUTHOR: EMMANUEL | DIGITAL PROJECTS
 * ==============================================================================
 */

const express = require('express');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const bcrypt = require('bcryptjs');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3000;

// --- BASE DE DATOS VOLÁTIL (ESTRUCTURA DE ALTA DISPONIBILIDAD) ---
let usersDB = []; 
let sessionRegistry = new Map();
let systemAuditLogs = [];

/**
 * CONFIGURACIÓN DE MIDDLEWARES
 * Optimizando para Render y despliegue rápido.
 */
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "https://cdnjs.cloudflare.com", "'unsafe-inline'"],
            styleSrc: ["'self'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com", "'unsafe-inline'"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https://images.rbxcdn.com"],
            connectSrc: ["'self'"]
        }
    }
}));

app.use(compression()); // Comprime respuestas para carga instantánea
app.use(express.json()); // Parseo de JSON
app.use(express.urlencoded({ extended: true })); // Parseo de formularios
app.use(morgan('dev')); // Logs de consola profesionales

// --- SERVICIO DE ACTIVOS ESTÁTICOS ---
const staticOptions = {
    dotfiles: 'ignore',
    etag: true,
    index: "index.html",
    maxAge: '1d',
    redirect: false,
    setHeaders: (res, path) => {
        res.set('x-timestamp', Date.now());
    }
};

app.use(express.static(path.join(__dirname, 'public'), staticOptions));

/**
 * PROTOCOLO DE AUTENTICACIÓN AVANZADA
 */

// REGISTRO DE NUEVOS NODOS
app.post('/api/auth/register', async (req, res) => {
    const { email, password } = req.body;

    // Validación de integridad
    if (!email || !password || password.length < 6) {
        return res.status(400).json({ 
            success: false, 
            error: "La contraseña debe tener al menos 6 caracteres." 
        });
    }

    const collision = usersDB.find(u => u.email === email);
    if (collision) {
        return res.status(409).json({ 
            success: false, 
            error: "Conflicto: El email ya está vinculado a un nodo activo." 
        });
    }

    try {
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const newUser = {
            id: `node_${Date.now()}`,
            email: email,
            password: hashedPassword,
            status: "active",
            createdAt: new Date().toISOString()
        };

        usersDB.push(newUser);
        systemAuditLogs.push(`[REG] Nuevo nodo creado: ${email} a las ${new Date().toISOString()}`);
        
        res.status(201).json({ success: true, message: "Nodo inicializado con éxito." });
    } catch (err) {
        res.status(500).json({ success: false, error: "Error interno en el módulo de cifrado." });
    }
});

// LOGIN Y ACCESO MAESTRO
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    const user = usersDB.find(u => u.email === email);
    if (!user) {
        return res.status(401).json({ success: false, error: "Credenciales de acceso no válidas." });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
        return res.status(401).json({ success: false, error: "Llave de acceso incorrecta." });
    }

    // Registro de sesión
    const token = `session_${Math.random().toString(36).substr(2, 9)}`;
    sessionRegistry.set(token, email);
    
    systemAuditLogs.push(`[LOG] Acceso concedido a: ${email}`);
    
    res.json({ 
        success: true, 
        user: { email: user.email, sessionToken: token } 
    });
});

// DESTRUCCIÓN DE REGISTROS (CONFIGURACIÓN)
app.post('/api/auth/delete', (req, res) => {
    const { email } = req.body;
    const initialCount = usersDB.length;
    usersDB = usersDB.filter(u => u.email !== email);

    if (usersDB.length < initialCount) {
        systemAuditLogs.push(`[DEL] Nodo destruido: ${email}`);
        return res.json({ success: true, message: "Registro eliminado permanentemente." });
    }
    res.status(404).json({ success: false, error: "No se encontró el nodo especificado." });
});

/**
 * LANZAMIENTO DEL SISTEMA
 */
app.listen(PORT, () => {
    console.log("-----------------------------------------");
    console.log(`| DEVROOT ENGINE v6.0.4 IS ONLINE       |`);
    console.log(`| PORT: ${PORT}                            |`);
    console.log(`| STATUS: SECURE & STABLE               |`);
    console.log("-----------------------------------------");
});
