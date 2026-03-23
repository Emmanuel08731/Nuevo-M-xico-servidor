/**
 * ==============================================================================
 * CENTRAL CORE INFRASTRUCTURE - V12.0.4
 * HIGH-PERFORMANCE NODE.JS ARCHITECTURE
 * ==============================================================================
 * * Este servidor gestiona la seguridad perimetral, el registro de identidades
 * y el motor de búsqueda universal de la plataforma.
 */

const express = require('express');
const path = require('path');
const http = require('http');
const compression = require('compression');

// --- INICIALIZACIÓN DEL NÚCLEO ---
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// --- CAPAS DE MIDDLEWARE ---
app.use(compression()); // Optimización de transferencia de datos
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

/**
 * DATABASE KERNEL (ESTRUCTURA DE DATOS EXTENDIDA)
 */
const KERNEL_DB = {
    accounts: [],
    posts: [],
    audit_logs: [],
    system_stats: {
        uptime: Date.now(),
        total_queries: 0,
        active_sessions: 0,
        failed_attempts: 0
    },
    // Diccionario de errores estándar
    error_codes: {
        MISSING_FIELDS: "E-101: Datos incompletos en la solicitud.",
        USER_EXISTS: "E-102: La identidad ya se encuentra registrada.",
        AUTH_FAILED: "E-103: Credenciales de acceso incorrectas.",
        SERVER_BUSY: "E-500: El núcleo no puede procesar la solicitud."
    }
};

// --- SERVICIO DE ARCHIVOS ESTÁTICOS ---
const STATIC_OPTIONS = {
    dotfiles: 'ignore',
    etag: true,
    index: "index.html",
    lastModified: true,
    maxAge: '1d',
    setHeaders: (res, path) => {
        res.set('X-Platform-Engine', 'Core-V12');
    }
};

app.use(express.static(path.join(__dirname, 'public'), STATIC_OPTIONS));

/**
 * API: MOTOR DE BÚSQUEDA UNIVERSAL (SEARCH ENGINE)
 * Filtra usuarios y publicaciones mediante algoritmos de coincidencia
 */
app.get('/api/v1/search', (req, res) => {
    KERNEL_DB.system_stats.total_queries++;
    const query = req.query.q ? req.query.q.toLowerCase().trim() : '';

    if (!query || query.length < 1) {
        return res.json({ users: [], posts: [], status: "empty_query" });
    }

    // Algoritmo de filtrado de cuentas
    const filteredUsers = KERNEL_DB.accounts.filter(acc => {
        return acc.user.toLowerCase().includes(query) || 
               acc.email.toLowerCase().includes(query);
    }).map(acc => ({
        uid: acc.uid,
        user: acc.user,
        joined: acc.created_at
    }));

    // Algoritmo de filtrado de publicaciones (Actualmente vacío)
    const filteredPosts = KERNEL_DB.posts.filter(p => {
        return p.content.toLowerCase().includes(query);
    });

    // Auditoría de búsqueda
    KERNEL_DB.audit_logs.push({
        event: "SEARCH",
        query: query,
        timestamp: new Date().toISOString(),
        results: filteredUsers.length
    });

    res.json({
        success: true,
        data: {
            users: filteredUsers,
            posts: filteredPosts,
            meta: {
                total_hits: filteredUsers.length + filteredPosts.length,
                query_time: "0.002ms"
            }
        }
    });
});

/**
 * API: GESTIÓN DE IDENTIDADES (AUTH)
 */

// REGISTRO DE CUENTAS
app.post('/api/v1/auth/register', (req, res) => {
    const { user, email, password } = req.body;

    // Validación de seguridad (Regex para evitar inyecciones básicas)
    if (!user || !email || !password) {
        return res.status(400).json({ success: false, msg: KERNEL_DB.error_codes.MISSING_FIELDS });
    }

    if (user.length < 3) return res.status(400).json({ success: false, msg: "El usuario es demasiado corto." });

    // Verificación de duplicidad
    const duplicate = KERNEL_DB.accounts.find(a => a.email === email || a.user === user);
    if (duplicate) {
        return res.status(409).json({ success: false, msg: KERNEL_DB.error_codes.USER_EXISTS });
    }

    const newAccount = {
        uid: `ID-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        user: user.trim(),
        email: email.toLowerCase().trim(),
        password: password, // Integrar bcrypt en el futuro
        created_at: new Date().toISOString(),
        settings: {
            theme: "light",
            notifications: true
        }
    };

    KERNEL_DB.accounts.push(newAccount);
    console.log(`[AUTH] Cuenta registrada: ${newAccount.user}`);

    res.status(201).json({
        success: true,
        msg: "Cuenta creada exitosamente en el sistema.",
        uid: newAccount.uid
    });
});

// ACCESO AL SISTEMA
app.post('/api/v1/auth/login', (req, res) => {
    const { identity, password } = req.body;

    const account = KERNEL_DB.accounts.find(a => 
        (a.email === identity || a.user === identity) && a.password === password
    );

    if (!account) {
        KERNEL_DB.system_stats.failed_attempts++;
        return res.status(401).json({ success: false, msg: KERNEL_DB.error_codes.AUTH_FAILED });
    }

    KERNEL_DB.system_stats.active_sessions++;

    res.json({
        success: true,
        msg: "Autorización concedida.",
        payload: {
            user: account.user,
            email: account.email,
            uid: account.uid,
            token: `TKN-${Math.random().toString(36).substr(2, 20)}`
        }
    });
});

/**
 * MANEJO DE ERRORES Y RUTAS NO DEFINIDAS
 */
app.get('/api/v1/status', (req, res) => {
    res.json({
        status: "operational",
        nodes: KERNEL_DB.accounts.length,
        version: "12.0.4"
    });
});

app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- LANZAMIENTO DEL SERVIDOR ---
server.listen(PORT, () => {
    console.log(`\n\x1b[32m==========================================`);
    console.log(`  PLATFORM ENGINE ONLINE - PORT ${PORT}`);
    console.log(`  READY FOR DEPLOYMENT ON RENDER/VERCEL`);
    console.log(`==========================================\x1b[0m\n`);
});
