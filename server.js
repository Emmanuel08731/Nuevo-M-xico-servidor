/**
 * ==============================================================================
 * DEVROOT CORE ENGINE - V10.0.4
 * AUTHOR: EMMANUEL
 * DESCRIPTION: SISTEMA DE GESTIÓN DE IDENTIDAD Y NODOS DE DATOS
 * ==============================================================================
 */

const express = require('express');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3000;

/**
 * CONFIGURACIÓN DE SEGURIDAD Y RENDIMIENTO
 * Optimizado para despliegue en Render/Vercel
 */
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

/**
 * DATABASE EMULATOR (PERSISTENCIA VOLÁTIL)
 * Estructura de datos optimizada para búsqueda rápida
 */
const DATA_KERNEL = {
    users: [],
    logs: [],
    sessions: new Map(),
    stats: {
        total_requests: 0,
        failed_auths: 0,
        successful_registrations: 0
    }
};

/**
 * SERVIDOR DE ARCHIVOS ESTÁTICOS
 */
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1d',
    setHeaders: (res, path) => {
        res.set('X-Server-Source', 'DevRoot-Node-Core');
    }
}));

/**
 * MIDDLEWARE: AUDITORÍA DE ACCESO
 */
app.use((req, res, next) => {
    DATA_KERNEL.stats.total_requests++;
    const logEntry = {
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.path,
        ip: req.ip
    };
    DATA_KERNEL.logs.push(logEntry);
    if (DATA_KERNEL.logs.length > 100) DATA_KERNEL.logs.shift();
    next();
});

/**
 * ENDPOINT: REGISTRO DE USUARIO (POST /api/auth/signup)
 */
app.post('/api/auth/signup', (req, res) => {
    const { email, password, username } = req.body;

    // Validación de integridad de datos
    if (!email || !password) {
        return res.status(400).json({ 
            success: false, 
            message: "Error Crítico: El payload está incompleto." 
        });
    }

    // Verificación de duplicados
    const userExists = DATA_KERNEL.users.find(u => u.email === email);
    if (userExists) {
        return res.status(409).json({ 
            success: false, 
            message: "Conflicto: La identidad ya existe en el núcleo." 
        });
    }

    // Inserción en el núcleo
    const newUser = {
        uid: `DBX-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        email: email.toLowerCase(),
        password: password, // En producción usar bcrypt
        username: username || email.split('@')[0],
        createdAt: new Date().toISOString(),
        role: "DEVELOPER"
    };

    DATA_KERNEL.users.push(newUser);
    DATA_KERNEL.stats.successful_registrations++;

    console.log(`[AUTH] Registro exitoso: ${newUser.uid}`);

    return res.status(201).json({
        success: true,
        message: "Nodo de usuario creado correctamente.",
        redirect: "/login"
    });
});

/**
 * ENDPOINT: ACCESO AL SISTEMA (POST /api/auth/signin)
 */
app.post('/api/auth/signin', (req, res) => {
    const { email, password } = req.body;

    const user = DATA_KERNEL.users.find(u => 
        u.email === email.toLowerCase() && u.password === password
    );

    if (!user) {
        DATA_KERNEL.stats.failed_auths++;
        return res.status(401).json({ 
            success: false, 
            message: "Denegado: Credenciales no válidas." 
        });
    }

    // Generación de sesión ficticia
    const sessionToken = `SES-${Date.now()}-${user.uid}`;
    DATA_KERNEL.sessions.set(sessionToken, user.uid);

    return res.json({
        success: true,
        message: "Acceso autorizado.",
        user: {
            email: user.email,
            username: user.username,
            uid: user.uid,
            token: sessionToken
        }
    });
});

/**
 * ENDPOINT: ELIMINAR CUENTA (POST /api/auth/destroy)
 */
app.post('/api/auth/destroy', (req, res) => {
    const { email, token } = req.body;

    const initialCount = DATA_KERNEL.users.length;
    DATA_KERNEL.users = DATA_KERNEL.users.filter(u => u.email !== email);

    if (DATA_KERNEL.users.length < initialCount) {
        return res.json({ 
            success: true, 
            message: "Instancia de usuario destruida permanentemente." 
        });
    }

    return res.status(404).json({ 
        success: false, 
        message: "Error: No se encontró la instancia para destruir." 
    });
});

/**
 * MANEJADOR DE ERRORES 404
 */
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
});

/**
 * INICIALIZACIÓN DEL KERNEL
 */
app.listen(PORT, () => {
    console.log(`\n\x1b[34m------------------------------------------\x1b[0m`);
    console.log(`\x1b[1m DEVROOT SERVER v10.0.4 IS RUNNING\x1b[0m`);
    console.log(`\x1b[32m PORT: ${PORT}\x1b[0m`);
    console.log(`\x1b[32m DATE: ${new Date().toLocaleString()}\x1b[0m`);
    console.log(`\x1b[34m------------------------------------------\x1b[0m\n`);
});
