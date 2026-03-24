/**
 * ==============================================================================
 * DEVROOT SOCIAL ENGINE - CORE SERVER V22.0
 * ARQUITECTURA: CLEAN & MINIMALIST
 * ==============================================================================
 */

const express = require('express');
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');
const http = require('http');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// MIDDLEWARES DE SEGURIDAD Y OPTIMIZACIÓN
app.use(helmet({
    contentSecurityPolicy: false, // Permitir cargar imágenes de Unsplash
}));
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

/**
 * BASE DE DATOS EN MEMORIA (SIMULADA)
 * Estructura optimizada para Emmanuel Store y proyectos relacionados
 */
const DATA_STORE = {
    users: [
        { uid: 'USR-1', name: 'Emmanuel', email: 'admin@devroot.com', pass: '123', avatar: '#0052ff' }
    ],
    posts: [
        {
            id: 101,
            author: "Emmanuel",
            avatar: "#0052ff",
            content: "Diseñando la nueva interfaz de DevRoot Social. ¿Qué les parece este estilo limpio?",
            image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1000",
            likes: 1240,
            comments: 89,
            date: "HACE 5 MIN"
        },
        {
            id: 102,
            author: "RobloxDev_Official",
            avatar: "#ff4757",
            content: "Nuevo sistema de economía integrado con Node.js. ¡Robux API lista!",
            image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1000",
            likes: 856,
            comments: 45,
            date: "HACE 1 HORA"
        }
    ],
    trending: [
        { tag: "#VibeBlox", count: "12.5k posts" },
        { tag: "#NodeJS", count: "8.2k posts" },
        { tag: "#MinimalDesign", count: "5.1k posts" }
    ]
};

/**
 * RUTAS DE AUTENTICACIÓN (GATEWAY)
 */
app.post('/api/auth/gate', (req, res) => {
    const { user, email, password, type } = req.body;
    
    // Simulación de delay de red para efectos de carga en el frontend
    setTimeout(() => {
        if (type === 'signup') {
            const exists = DATA_STORE.users.find(u => u.email === email);
            if (exists) return res.status(400).json({ error: "Este correo ya está registrado." });

            const newUser = {
                uid: 'USR-' + Math.floor(Math.random() * 10000),
                name: user || 'Nuevo Usuario',
                email: email,
                pass: password,
                avatar: '#' + Math.floor(Math.random()*16777215).toString(16)
            };
            DATA_STORE.users.push(newUser);
            return res.status(201).json({ success: true, user: newUser });
        }

        const account = DATA_STORE.users.find(u => u.email === email && u.pass === password);
        if (!account) return res.status(401).json({ error: "Credenciales no válidas. Inténtalo de nuevo." });

        res.json({ success: true, user: { name: account.name, avatar: account.avatar, uid: account.uid } });
    }, 800);
});

/**
 * MOTOR DE CONTENIDO (FEED & POSTS)
 */
app.get('/api/feed', (req, res) => {
    res.json(DATA_STORE.posts);
});

app.get('/api/trending', (req, res) => {
    res.json(DATA_STORE.trending);
});

app.post('/api/feed/post', (req, res) => {
    const { author, content, avatar } = req.body;
    
    if (!content) return res.status(400).json({ error: "El contenido es obligatorio." });

    const newPost = {
        id: Date.now(),
        author: author,
        avatar: avatar || '#000',
        content: content,
        image: null, // Podría expandirse a subida de archivos
        likes: 0,
        comments: 0,
        date: "AHORA MISMO"
    };

    DATA_STORE.posts.unshift(newPost);
    res.status(201).json({ success: true, post: newPost });
});

/**
 * MANEJO DE ERRORES GLOBAL
 */
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
});

server.listen(PORT, () => {
    console.clear();
    console.log('\x1b[32m%s\x1b[0m', '---------------------------------------------------');
    console.log('\x1b[32m%s\x1b[0m', '   DEVROOT SOCIAL NETWORK - ONLINE SUCCESSFULY     ');
    console.log('\x1b[32m%s\x1b[0m', `   LOCAL: http://localhost:${PORT}                `);
    console.log('\x1b[32m%s\x1b[0m', '---------------------------------------------------');
});
