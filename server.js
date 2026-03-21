/**
 * ==============================================================================
 * DEVROOT SERVER ENGINE v6.0
 * AUTHOR: EMMANUEL (DIRECTOR)
 * ESTRUCTURA: EXPRESS + POSTGRESQL
 * ==============================================================================
 */

const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// --- MIDDLEWARE CRÍTICO ---
// Esto es lo que falta: le dice a Express que use la carpeta 'public'
// para servir el style.css y el script.js automáticamente.
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

/**
 * ==============================================================================
 * 1. RUTAS DE NAVEGACIÓN
 * ==============================================================================
 */

// Ruta principal para cargar el index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/**
 * ==============================================================================
 * 2. API ENDPOINTS (SIMULACIÓN PARA POSTGRESQL)
 * ==============================================================================
 */

// Endpoint de Registro
app.post('/api/auth/register', (req, res) => {
    const { username, email, password } = req.body;
    console.log(`[Registro] Nuevo nodo intentando conectar: ${username}`);
    
    // Aquí iría tu lógica de INSERT INTO usuarios...
    if(username && email && password) {
        res.status(200).json({ success: true, message: "Usuario creado en la DB" });
    } else {
        res.status(400).json({ success: false, error: "Datos incompletos" });
    }
});

// Endpoint de Login
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    
    // Simulación de validación (Emmanuel Director)
    if(email === 'dev@emmanuel.store' && password === '12345678') {
        res.status(200).json({ 
            success: true, 
            user: { id: 1, name: "Emmanuel", email: email } 
        });
    } else {
        res.status(401).json({ success: false, error: "Credenciales no autorizadas" });
    }
});

// Endpoint de Posts
app.get('/api/posts/all', (req, res) => {
    // Simulación de datos de PostgreSQL
    const mockPosts = [
        { 
            id: 1, 
            username: "Emmanuel", 
            content: "Desplegando la v6.0 en Render con éxito. 🚀", 
            created_at: new Date(),
            is_verified: true 
        },
        { 
            id: 2, 
            username: "Angel Bot", 
            content: "Vexo Bot sincronizado con el nuevo nodo.", 
            created_at: new Date(),
            is_verified: false 
        }
    ];
    res.json({ success: true, posts: mockPosts });
});

/**
 * ==============================================================================
 * 3. INICIO DEL SERVIDOR
 * ==============================================================================
 */

app.listen(PORT, () => {
    console.log(`
    =========================================
       DevRoot v6.0 - ONLINE
       Director: Emmanuel
       Puerto: ${PORT}
       URL: http://localhost:${PORT}
    =========================================
    `);
});
