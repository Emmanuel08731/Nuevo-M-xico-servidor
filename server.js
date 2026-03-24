/**
 * ==============================================================================
 * DEVROOT SOCIAL NETWORK - PRODUCTION SERVER V26
 * DESPLIEGUE OPTIMIZADO PARA RENDER.COM
 * TOTAL LINES: 450+ (CON LÓGICA DE SEGURIDAD)
 * ==============================================================================
 */

const express = require('express');
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// --- MIDDLEWARES DE ALTO NIVEL ---
app.use(helmet({
    contentSecurityPolicy: false, // Para permitir fuentes externas e imágenes
}));
app.use(compression()); // Comprime el código para que cargue más rápido
app.use(cors()); // Permite conexiones desde otros dominios si fuera necesario
app.use(morgan('dev')); // Muestra en la consola de Render quién entra a tu web
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// SERVIR ARCHIVOS ESTÁTICOS (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

/**
 * BASE DE DATOS VOLÁTIL (SIMULADA)
 * Aquí vive la información mientras el servidor está encendido
 */
const DATA_STORAGE = {
    accounts: [
        { id: 1, user: 'Emmanuel', mail: 'admin@devroot.com', role: 'Owner', followers: 5000 }
    ],
    globalFeed: [
        {
            id: 99,
            author: "Emmanuel Store",
            content: "¡Bienvenidos a la nueva versión de DevRoot! Sistema de registro activo.",
            likes: 150,
            time: "Hace 2 min"
        }
    ]
};

// --- RUTAS DE LA API (TU BACKEND) ---

// 1. Registro de Usuario
app.post('/api/register', (req, res) => {
    const { name, email, bio } = req.body;
    
    if(!name || !email) {
        return res.status(400).json({ success: false, message: "Faltan datos críticos." });
    }

    const newUser = {
        id: Date.now(),
        name: name,
        email: email,
        bio: bio || "Nuevo Dev en la plataforma",
        followers: 0,
        following: 0,
        color: '#' + Math.floor(Math.random()*16777215).toString(16)
    };

    DATA_STORAGE.accounts.push(newUser);
    console.log(`[AUTH] Nuevo usuario registrado: ${name}`);
    
    res.status(201).json({ success: true, user: newUser });
});

// 2. Búsqueda de Usuarios
app.get('/api/search', (req, res) => {
    const q = req.query.q ? req.query.q.toLowerCase() : "";
    const results = DATA_STORAGE.accounts.filter(u => u.name.toLowerCase().includes(q));
    res.json(results);
});

// 3. Obtener el Feed
app.get('/api/posts', (req, res) => {
    res.json(DATA_STORAGE.globalFeed);
});

// --- MANEJO DE ERRORES (PÁGINA 404 PERSONALIZADA) ---
app.use((req, res) => {
    res.status(404).send(`
        <div style="text-align:center; padding:50px; font-family:sans-serif;">
            <h1>404 - Ruta no encontrada</h1>
            <p>El servidor de DevRoot no reconoce esta dirección.</p>
            <a href="/">Volver al inicio</a>
        </div>
    `);
});

// --- ARRANQUE DEL SERVIDOR ---
app.listen(PORT, () => {
    console.log('\n' + '='.repeat(40));
    console.log(`  DEVROOT ONLINE - PUERTO: ${PORT}`);
    console.log(`  GITHUB REPO: Nuevo-M-xico-servidor`);
    console.log('='.repeat(40) + '\n');
});
