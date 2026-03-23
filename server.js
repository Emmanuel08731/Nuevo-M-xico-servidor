/**
 * DEVROOT KERNEL V30.0 - RELATIONAL ARCHITECTURE
 * SISTEMA INTEGRADO DE SEGUIDORES Y PERFILES DINÁMICOS
 */

const express = require('express');
const path = require('path');
const compression = require('compression');
const http = require('http');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

/**
 * DATABASE CORE (SISTEMA DE MEMORIA VOLÁTIL PRO)
 */
const DB = {
    users: [
        { 
            uid: "DR-ADMIN", 
            user: "Emmanuel_Dev", 
            email: "emmanuel@devroot.com", 
            password: "123", 
            rank: "Lead Architect", 
            bio: "Creador de la infraestructura DevRoot.",
            followers: [], // Lista de UIDs que me siguen
            following: [], // Lista de UIDs a los que sigo
            posts: []
        },
        { 
            uid: "DR-BOT", 
            user: "System_Pro", 
            email: "bot@devroot.com", 
            password: "bot", 
            rank: "System Bot", 
            bio: "Cuenta de soporte automatizado.",
            followers: ["DR-ADMIN"], 
            following: [],
            posts: []
        }
    ]
};

// Inicialización de relación de prueba
DB.users[0].following.push("DR-BOT");

/**
 * MOTOR DE BÚSQUEDA GLOBAL (PERSONAS Y PUBLICACIONES)
 */
app.get('/api/v1/search/global', (req, res) => {
    const q = req.query.q ? req.query.q.toLowerCase() : "";
    if (!q) return res.json({ results: { people: [] } });

    const people = DB.users
        .filter(u => u.user.toLowerCase().includes(q))
        .map(u => ({
            uid: u.uid,
            name: u.user,
            rank: u.rank,
            init: u.user[0].toUpperCase(),
            followersCount: u.followers.length
        }));

    res.json({ results: { people } });
});

/**
 * OBTENER DATOS COMPLETOS DE UN PERFIL (INCLUYENDO LISTAS)
 */
app.get('/api/v1/user/profile/:uid', (req, res) => {
    const user = DB.users.find(u => u.uid === req.params.uid);
    if (!user) return res.status(404).json({ error: "Usuario no hallado." });

    // Mapear los nombres de los seguidores y seguidos para las listas
    const getNames = (uids) => {
        return DB.users
            .filter(u => uids.includes(u.uid))
            .map(u => ({ name: u.user, uid: u.uid, init: u.user[0].toUpperCase() }));
    };

    res.json({
        uid: user.uid,
        name: user.user,
        rank: user.rank,
        bio: user.bio,
        stats: {
            followers: user.followers.length,
            following: user.following.length,
            posts: user.posts.length
        },
        lists: {
            followers: getNames(user.followers),
            following: getNames(user.following)
        },
        init: user.user[0].toUpperCase()
    });
});

/**
 * SISTEMA DE FOLLOW/UNFOLLOW CON DOBLE ACTUALIZACIÓN
 */
app.post('/api/v1/user/action/follow', (req, res) => {
    const { myUid, targetUid } = req.body;

    const me = DB.users.find(u => u.uid === myUid);
    const target = DB.users.find(u => u.uid === targetUid);

    if (!me || !target) return res.status(404).json({ error: "Identidad no válida." });

    const isFollowing = me.following.includes(targetUid);

    if (isFollowing) {
        // Unfollow: Remover de mis seguidos y de sus seguidores
        me.following = me.following.filter(id => id !== targetUid);
        target.followers = target.followers.filter(id => id !== myUid);
        return res.json({ status: "unfollowed", count: target.followers.length });
    } else {
        // Follow: Agregar a mis seguidos y a sus seguidores
        me.following.push(targetUid);
        target.followers.push(myUid);
        return res.json({ status: "followed", count: target.followers.length });
    }
});

/**
 * AUTH SYSTEM
 */
app.post('/api/v1/auth/login', (req, res) => {
    const { identity, password } = req.body;
    const user = DB.users.find(u => (u.email === identity || u.user === identity) && u.password === password);
    if (!user) return res.status(401).json({ error: "Credenciales inválidas." });
    res.json({ success: true, user: { uid: user.uid, name: user.user, rank: user.rank } });
});

server.listen(PORT, () => console.log(`DevRoot Kernel V30 - Active on ${PORT}`));
