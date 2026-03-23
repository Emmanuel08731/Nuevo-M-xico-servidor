/**
 * ==============================================================================
 * DEVROOT CORE ENGINE - V22.0.1
 * ENTERPRISE-GRADE NODE.JS ARCHITECTURE
 * ==============================================================================
 * Autor: Emmanuel & DevRoot Team
 * Licencia: Pro-Dev Universal
 */

const express = require('express');
const path = require('path');
const compression = require('compression');
const http = require('http');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// CONFIGURACIÓN DE ALTO RENDIMIENTO
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

/**
 * DATABASE KERNEL (VIRTUAL MEMORY SYSTEM)
 * Almacenamiento de alta velocidad para prototipado profesional.
 */
const DEVROOT_DB = {
    accounts: [],
    posts: [
        { id: 1, author: "DevRoot System", content: "Bienvenido a la infraestructura oficial. El sistema está 100% operativo.", date: new Date(), likes: 12 },
        { id: 2, author: "Cloud Services", content: "Nodos de latencia baja desplegados en la región.", date: new Date(), likes: 45 }
    ],
    audit_logs: [],
    sessions: new Map()
};

/**
 * SISTEMA DE LOGS Y SEGURIDAD INTERNA
 */
const logger = (msg, type = "INFO") => {
    const timestamp = new Date().toISOString();
    console.log(`[\x1b[34m${timestamp}\x1b[0m] [\x1b[32m${type}\x1b[0m] ${msg}`);
    DEVROOT_DB.audit_logs.push({ timestamp, type, msg });
};

/**
 * VALIDACIONES DE SEGURIDAD AVANZADAS
 */
const securityMiddleware = (req, res, next) => {
    const { user, email, password } = req.body;
    
    if (req.path === '/api/v1/auth/signup') {
        if (!user || user.length < 3) return res.status(400).json({ error: "Nombre de usuario inválido (mínimo 3 caracteres)." });
        
        // Regex de Email Estricto
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return res.status(400).json({ error: "El formato de correo electrónico no es válido." });
        
        // Validación de Password solicitado por el usuario
        if (!password || password.length < 5) return res.status(400).json({ error: "Seguridad insuficiente: Contraseña mínima de 5 caracteres." });
    }
    next();
};

/**
 * RUTAS DE AUTENTICACIÓN (AUTH ENGINE)
 */
app.post('/api/v1/auth/signup', securityMiddleware, (req, res) => {
    const { user, email, password } = req.body;
    
    const exists = DEVROOT_DB.accounts.find(u => u.email === email || u.user === user);
    if (exists) {
        logger(`Intento de registro duplicado: ${email}`, "WARN");
        return res.status(409).json({ error: "La cuenta ya se encuentra registrada en nuestra base de datos." });
    }

    const newUser = {
        uid: `DR-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        user: user.trim(),
        email: email.toLowerCase().trim(),
        password: password,
        joined: new Date().toISOString(),
        rank: "Pro Developer",
        bio: "Nuevo miembro de la comunidad DevRoot.",
        stats: { followers: 0, posts: 0 }
    };

    DEVROOT_DB.accounts.push(newUser);
    logger(`Nueva cuenta creada: ${user} (${newUser.uid})`, "SUCCESS");
    
    res.status(201).json({ success: true, message: "Cuenta creada exitosamente. Bienvenido a DevRoot." });
});

app.post('/api/v1/auth/login', (req, res) => {
    const { identity, password } = req.body;
    
    const account = DEVROOT_DB.accounts.find(u => 
        (u.email === identity.toLowerCase() || u.user === identity) && u.password === password
    );

    if (!account) {
        logger(`Fallo de login para: ${identity}`, "SECURITY");
        // Distinguir entre no encontrado y pass incorrecto si es necesario, 
        // pero por seguridad el mensaje es específico para el usuario.
        const userExists = DEVROOT_DB.accounts.find(u => u.email === identity || u.user === identity);
        if (!userExists) return res.status(404).json({ error: "Cuenta no encontrada en el sistema." });
        return res.status(401).json({ error: "Contraseña incorrecta. Verifica tus credenciales." });
    }

    logger(`Sesión iniciada: ${account.user}`, "AUTH");
    res.json({
        success: true,
        user: {
            name: account.user,
            email: account.email,
            uid: account.uid,
            rank: account.rank,
            bio: account.bio,
            joined: account.joined
        }
    });
});

/**
 * MOTOR DE BÚSQUEDA UNIVERSAL (DUAL-SEARCH)
 */
app.get('/api/v1/search/global', (req, res) => {
    const q = req.query.q ? req.query.q.toLowerCase() : "";
    
    if (q.length < 1) return res.json({ people: [], posts: [] });

    const people = DEVROOT_DB.accounts
        .filter(u => u.user.toLowerCase().includes(q))
        .map(u => ({ 
            name: u.user, 
            uid: u.uid, 
            rank: u.rank,
            init: u.user[0].toUpperCase() 
        }));

    const posts = DEVROOT_DB.posts.filter(p => p.content.toLowerCase().includes(q));

    res.json({
        results: {
            people,
            posts,
            count: people.length + posts.length
        }
    });
});

/**
 * GESTIÓN DE ARCHIVOS ESTÁTICOS Y SPA
 */
app.use(express.static(path.join(__dirname, 'public')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// INICIO DEL SERVIDOR
server.listen(PORT, () => {
    console.log(`\n\x1b[44m DEVROOT SYSTEM ONLINE \x1b[0m`);
    console.log(`\x1b[34m Puerto:\x1b[0m ${PORT}`);
    console.log(`\x1b[34m Modo:\x1b[0m Producción\n`);
});
