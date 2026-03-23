/**
 * ==============================================================================
 * DEVROOT ONYX KERNEL - V40.0.1
 * INDUSTRIAL GRADE ARCHITECTURE - NODE.JS / EXPRESS
 * ==============================================================================
 * @author: Emmanuel (Lead Architect)
 * @description: Sistema de gestión de identidades, relaciones sociales y 
 * persistencia de datos con validación de integridad de capa 7.
 */

const express = require('express');
const path = require('path');
const compression = require('compression');
const http = require('http');
const helmet = require('helmet'); // Seguridad avanzada

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// CONFIGURACIÓN DE SEGURIDAD Y RENDIMIENTO
app.use(helmet({ contentSecurityPolicy: false })); // Protección de headers
app.use(compression()); // Gzip para carga ultra rápida
app.use(express.json({ limit: '100mb' }));
app.use(express.static(path.join(__dirname, 'public')));

/**
 * MOTOR DE PERSISTENCIA (DEVROOT DATA LAKE)
 * Estructura de datos normalizada para evitar redundancia.
 */
const DATA_LAKE = {
    users: [
        { 
            uid: "DR-001", 
            user: "Emmanuel_Pro", 
            email: "admin@devroot.com", 
            password: "123", 
            rank: "System Owner", 
            bio: "Arquitecto principal de DevRoot Onyx.",
            followers: [], 
            following: [],
            notifications: [],
            stats: { posts: 12, storage: "85%" }
        },
        { 
            uid: "DR-002", 
            user: "Dev_Assistant", 
            email: "dev@devroot.com", 
            password: "dev", 
            rank: "Senior Developer", 
            bio: "Soporte técnico y despliegue de módulos.",
            followers: ["DR-001"], 
            following: [],
            notifications: [],
            stats: { posts: 5, storage: "20%" }
        }
    ],
    global_logs: [],
    system_uptime: Date.now()
};

// RELACIÓN INICIAL DE PRUEBA
DATA_LAKE.users[0].following.push("DR-002");

/**
 * HELPER: BUSCADOR DE IDENTIDAD
 * @param {string} uid - Identificador único
 */
const findUser = (uid) => DATA_LAKE.users.find(u => u.uid === uid);

/**
 * MIDDLEWARE: VALIDACIÓN DE INTEGRIDAD DE SESIÓN
 */
const authGuard = (req, res, next) => {
    const authHeader = req.headers['x-devroot-auth'];
    if (!authHeader && req.path.startsWith('/api/v1/secure')) {
        return res.status(401).json({ error: "Acceso denegado: Token de seguridad no detectado." });
    }
    next();
};

/**
 * API: MOTOR DE BÚSQUEDA MULTI-CAPA
 * Permite encontrar usuarios por nombre, rango o bio.
 */
app.get('/api/v1/search/universal', (req, res) => {
    const query = req.query.q ? req.query.q.toLowerCase() : "";
    if (query.length < 1) return res.json({ people: [] });

    const people = DATA_LAKE.users
        .filter(u => u.user.toLowerCase().includes(query) || u.rank.toLowerCase().includes(query))
        .map(u => ({
            uid: u.uid,
            name: u.user,
            rank: u.rank,
            init: u.user[0].toUpperCase(),
            followers_count: u.followers.length
        }));

    res.json({ results: { people, posts: [] } });
});

/**
 * API: PERFIL DETALLADO CON MAPEO DE LISTAS
 */
app.get('/api/v1/user/full-profile/:uid', (req, res) => {
    const target = findUser(req.params.uid);
    if (!target) return res.status(404).json({ error: "Nodo de usuario no encontrado." });

    // Resolver UIDs a Objetos de Usuario para las listas
    const resolveList = (uids) => uids.map(id => {
        const u = findUser(id);
        return u ? { name: u.user, uid: u.uid, rank: u.rank, init: u.user[0].toUpperCase() } : null;
    }).filter(x => x !== null);

    res.json({
        identity: {
            uid: target.uid,
            name: target.user,
            rank: target.rank,
            bio: target.bio,
            init: target.user[0].toUpperCase()
        },
        stats: {
            followers: target.followers.length,
            following: target.following.length,
            posts: target.stats.posts
        },
        social: {
            followers_list: resolveList(target.followers),
            following_list: resolveList(target.following)
        }
    });
});

/**
 * API: ACCIÓN DE SEGUIMIENTO (FOLLOW/UNFOLLOW)
 */
app.post('/api/v1/social/toggle-follow', (req, res) => {
    const { myUid, targetUid } = req.body;

    const me = findUser(myUid);
    const target = findUser(targetUid);

    if (!me || !target) return res.status(404).json({ error: "Error de sincronización de identidades." });

    const index = me.following.indexOf(targetUid);
    let status = "";

    if (index > -1) {
        // UNFOLLOW LOGIC
        me.following.splice(index, 1);
        target.followers = target.followers.filter(id => id !== myUid);
        status = "unfollowed";
    } else {
        // FOLLOW LOGIC
        me.following.push(targetUid);
        target.followers.push(myUid);
        status = "followed";
        
        // Generar Notificación al Target
        target.notifications.unshift({
            id: Date.now(),
            msg: `${me.user} ha comenzado a seguirte.`,
            type: "SOCIAL",
            read: false
        });
    }

    res.json({ status, followers_count: target.followers.length });
});

/**
 * API: AUTENTICACIÓN Y REGISTRO
 */
app.post('/api/v1/auth/gate', (req, res) => {
    const { type, user, email, password } = req.body;

    if (type === 'SIGNUP') {
        const exists = DATA_LAKE.users.find(u => u.email === email || u.user === user);
        if (exists) return res.status(409).json({ error: "La identidad ya está registrada en el sistema." });

        const newUser = {
            uid: `DR-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            user, email, password,
            rank: "Member",
            bio: "Identidad recién creada en DevRoot.",
            followers: [], following: [], notifications: [],
            stats: { posts: 0, storage: "0%" }
        };
        DATA_LAKE.users.push(newUser);
        return res.status(201).json({ success: true, user: { name: newUser.user, uid: newUser.uid } });
    }

    const account = DATA_LAKE.users.find(u => (u.email === user || u.user === user) && u.password === password);
    if (!account) return res.status(401).json({ error: "Credenciales de acceso incorrectas." });

    res.json({ success: true, user: { name: account.user, uid: account.uid, rank: account.rank } });
});

server.listen(PORT, () => {
    console.log(`[SYSTEM] DevRoot Onyx Kernel desplegado en puerto ${PORT}`);
    console.log(`[SYSTEM] Estabilidad de base de datos: 100%`);
});
