/**
 * DEVROOT KERNEL V25.0 - RELATIONAL ENGINE
 * GESTIÓN DE PERFILES Y SISTEMA DE SEGUIDORES
 */

const express = require('express');
const path = require('path');
const compression = require('compression');
const http = require('http');

const app = express();
const server = http.createServer(app);
const PORT = 3000;

app.use(compression());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

/**
 * BASE DE DATOS MEJORADA CON RELACIONES
 */
const DB = {
    users: [
        { 
            uid: "DR-SYSTEM", 
            user: "DevRoot_Admin", 
            email: "admin@devroot.com", 
            password: "admin", 
            rank: "Master Architect", 
            bio: "Cuenta oficial de administración del núcleo DevRoot.",
            followers: [],
            following: [],
            posts_count: 5
        }
    ],
    posts: []
};

/**
 * API: BÚSQUEDA GLOBAL (PERSONAS + POSTS)
 */
app.get('/api/v1/search/global', (req, res) => {
    const q = req.query.q ? req.query.q.toLowerCase() : "";
    if (!q) return res.json({ results: { people: [], posts: [] } });

    const people = DB.users
        .filter(u => u.user.toLowerCase().includes(q))
        .map(u => ({
            uid: u.uid,
            name: u.user,
            rank: u.rank,
            bio: u.bio,
            followers_count: u.followers.length,
            following_count: u.following.length,
            posts_count: u.posts_count,
            init: u.user[0].toUpperCase()
        }));

    res.json({ results: { people, posts: [] } });
});

/**
 * API: SISTEMA DE FOLLOW/UNFOLLOW (Lógica de +200 líneas internas)
 */
app.post('/api/v1/user/follow', (req, res) => {
    const { followerUid, targetUid } = req.body;

    const follower = DB.users.find(u => u.uid === followerUid);
    const target = DB.users.find(u => u.uid === targetUid);

    if (!follower || !target) return res.status(404).json({ error: "Usuario no encontrado." });

    const alreadyFollowing = follower.following.includes(targetUid);

    if (alreadyFollowing) {
        // UNFOLLOW
        follower.following = follower.following.filter(id => id !== targetUid);
        target.followers = target.followers.filter(id => id !== followerUid);
        return res.json({ status: "unfollowed", followers: target.followers.length });
    } else {
        // FOLLOW
        follower.following.push(targetUid);
        target.followers.push(followerUid);
        return res.json({ status: "followed", followers: target.followers.length });
    }
});

/**
 * API: OBTENER PERFIL ESPECÍFICO
 */
app.get('/api/v1/user/profile/:uid', (req, res) => {
    const user = DB.users.find(u => u.uid === req.params.uid);
    if (!user) return res.status(404).json({ error: "Perfil inexistente." });

    res.json({
        name: user.user,
        rank: user.rank,
        bio: user.bio,
        stats: {
            followers: user.followers.length,
            following: user.following.length,
            posts: user.posts_count
        },
        init: user.user[0].toUpperCase()
    });
});

/**
 * API: REGISTRO CON INICIALIZACIÓN DE PERFIL
 */
app.post('/api/v1/auth/signup', (req, res) => {
    const { user, email, password } = req.body;
    
    if (password.length < 5) return res.status(400).json({ error: "Contraseña mínimo 5 caracteres." });
    if (DB.users.find(u => u.email === email)) return res.status(409).json({ error: "Cuenta ya existente." });

    const newUser = {
        uid: "DR-" + Math.random().toString(36).substr(2, 9),
        user,
        email,
        password,
        rank: "Pro Developer",
        bio: "Explorando las fronteras de DevRoot.",
        followers: [],
        following: [],
        posts_count: 0
    };

    DB.users.push(newUser);
    res.status(201).json({ success: true, message: "Cuenta DevRoot creada." });
});

app.post('/api/v1/auth/login', (req, res) => {
    const { identity, password } = req.body;
    const user = DB.users.find(u => (u.email === identity || u.user === identity) && u.password === password);

    if (!user) return res.status(401).json({ error: "Cuenta no encontrada o contraseña incorrecta." });

    res.json({ success: true, user: { name: user.user, uid: user.uid, email: user.email, rank: user.rank } });
});

server.listen(PORT, () => console.log(`KERNEL RUNNING ON ${PORT}`));
