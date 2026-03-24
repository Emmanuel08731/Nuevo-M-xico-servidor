/**
 * ==============================================================================
 * DEVROOT KERNEL - VERSION 18.0.2
 * INDUSTRIAL GRADE NODE.JS ARCHITECTURE
 * ==============================================================================
 */

const express = require('express');
const path = require('path');
const compression = require('compression');
const http = require('http');
const helmet = require('helmet');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Configuración de Seguridad y Optimización Pro
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

/**
 * MOTOR DE PERSISTENCIA TEMPORAL (DEVROOT VOLATILE DB)
 */
const DEVROOT_DB = {
    accounts: [],
    content: [], 
    telemetry: {
        uptime: 0,
        requests: 0,
        errors: 0
    },
    metadata: {
        platform_name: "DevRoot Enterprise",
        build: "2026.03.23",
        status: "Production",
        kernel_ver: "18.0.2"
    }
};

// Middleware de Telemetría Real-time
app.use((req, res, next) => {
    DEVROOT_DB.telemetry.requests++;
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`\x1b[32m[TRAFFIC]\x1b[0m ${req.method} ${req.path} - ${duration}ms`);
    });
    next();
});

/**
 * MIDDLEWARE DE VALIDACIÓN DE IDENTIDAD (STRICT MODE)
 */
const validateIdentity = (req, res, next) => {
    const { user, email, password } = req.body;
    if (req.path.includes('signup')) {
        if (!user || user.length < 3) return res.status(400).json({ error: "Usuario demasiado corto." });
        if (!email || !email.includes('@')) return res.status(400).json({ error: "Email corporativo no válido." });
    }
    if (!password || password.length < 5) {
        return res.status(400).json({ error: "Protocolo de seguridad: Clave mínima 5 carácteres." });
    }
    next();
};

/**
 * API: AUTENTICACIÓN CENTRALIZADA
 */
app.post('/api/v1/auth/signup', validateIdentity, (req, res) => {
    const { user, email, password } = req.body;
    const exists = DEVROOT_DB.accounts.find(u => u.email === email || u.user === user);
    
    if (exists) return res.status(409).json({ error: "Identidad ya registrada en el Kernel." });

    const newAcc = {
        uid: "DR-" + Math.random().toString(36).substring(2, 10).toUpperCase(),
        user: user.trim(),
        email: email.toLowerCase().trim(),
        password,
        role: "DevRoot Analyst",
        avatar_color: "#0052ff",
        joined: new Date()
    };

    DEVROOT_DB.accounts.push(newAcc);
    res.status(201).json({ success: true, message: "Registro exitoso en DevRoot." });
});

app.post('/api/v1/auth/login', (req, res) => {
    const { identity, password } = req.body;
    const account = DEVROOT_DB.accounts.find(u => u.email === identity || u.user === identity);

    if (!account) return res.status(404).json({ error: "Nodo de identidad no encontrado." });
    if (account.password !== password) return res.status(401).json({ error: "Acceso denegado: Clave incorrecta." });

    res.json({
        success: true,
        user: { 
            name: account.user, 
            uid: account.uid, 
            role: account.role,
            color: account.avatar_color 
        }
    });
});

/**
 * API: SERVICIOS DE SISTEMA (NUEVO)
 */
app.get('/api/v1/sys/status', (req, res) => {
    res.json({
        kernel: DEVROOT_DB.metadata,
        stats: {
            users: DEVROOT_DB.accounts.length,
            uptime: Math.floor(process.uptime()) + "s",
            memory: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + "MB"
        }
    });
});

/**
 * API: MOTOR DE BÚSQUEDA DUAL
 */
app.get('/api/v1/search/global', (req, res) => {
    const query = req.query.q ? req.query.q.toLowerCase() : "";
    const people = DEVROOT_DB.accounts
        .filter(u => u.user.toLowerCase().includes(query))
        .map(u => ({ name: u.user, id: u.uid }));

    const posts = DEVROOT_DB.content.filter(p => p.text && p.text.toLowerCase().includes(query));

    res.json({
        query,
        results: { people, posts, total_people: people.length, total_posts: posts.length }
    });
});

server.listen(PORT, () => {
    console.log(`\x1b[44m\x1b[37m DEVROOT INDUSTRIAL \x1b[0m Node Listening: ${PORT}`);
});
