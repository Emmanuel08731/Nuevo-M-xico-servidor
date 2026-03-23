/**
 * ==============================================================================
 * CORE ENGINE V15.0 - HIGH SPEED ARCHITECTURE
 * OPTIMIZADO PARA RESPUESTA INMEDIATA
 * ==============================================================================
 */

const express = require('express');
const path = require('path');
const compression = require('compression');

const app = express();
const server = require('http').createServer(app);
const PORT = process.env.PORT || 3000;

// Configuración de Rendimiento
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

/**
 * BASE DE DATOS VOLÁTIL DE ALTA VELOCIDAD
 */
const INTERNAL_STORAGE = {
    users: [],
    posts: [],
    sessions: new Set()
};

/**
 * UTILIDADES DE VALIDACIÓN
 */
const validateEmail = (email) => {
    return String(email)
        .toLowerCase()
        .match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
};

/**
 * API: SISTEMA DE REGISTRO
 */
app.post('/api/v1/auth/signup', (req, res) => {
    const { user, email, password } = req.body;

    // 1. Validar campos vacíos
    if (!user || !email || !password) {
        return res.status(400).json({ error: "Todos los campos son obligatorios." });
    }

    // 2. Validar formato de Gmail/Email
    if (!validateEmail(email)) {
        return res.status(400).json({ error: "Introduce un correo electrónico válido." });
    }

    // 3. Validar longitud de contraseña
    if (password.length < 5) {
        return res.status(400).json({ error: "La contraseña debe tener mínimo 5 caracteres." });
    }

    // 4. Validar existencia
    const userExists = INTERNAL_STORAGE.users.find(u => u.email === email || u.user === user);
    if (userExists) {
        return res.status(409).json({ error: "Esta cuenta ya existe." });
    }

    // 5. Crear cuenta
    const newUser = {
        id: Date.now(),
        user: user.trim(),
        email: email.toLowerCase().trim(),
        password: password,
        created: new Date().toISOString()
    };

    INTERNAL_STORAGE.users.push(newUser);
    
    return res.status(201).json({ 
        success: true, 
        message: "Cuenta creada con éxito. Ya puedes iniciar sesión." 
    });
});

/**
 * API: SISTEMA DE INICIO DE SESIÓN
 */
app.post('/api/v1/auth/login', (req, res) => {
    const { identity, password } = req.body;

    if (!identity || !password) {
        return res.status(400).json({ error: "Faltan datos de acceso." });
    }

    // Buscar por usuario o email
    const account = INTERNAL_STORAGE.users.find(u => 
        u.email === identity.toLowerCase() || u.user === identity
    );

    // 1. Validar si existe
    if (!account) {
        return res.status(404).json({ error: "Cuenta no encontrada." });
    }

    // 2. Validar contraseña
    if (account.password !== password) {
        return res.status(401).json({ error: "Contraseña incorrecta." });
    }

    // Inicio exitoso
    return res.json({
        success: true,
        user: {
            name: account.user,
            email: account.email,
            token: "AUTH_" + Math.random().toString(36).substr(2)
        }
    });
});

/**
 * API: MOTOR DE BÚSQUEDA
 */
app.get('/api/v1/search', (req, res) => {
    const q = req.query.q ? req.query.q.toLowerCase() : "";
    
    const results = INTERNAL_STORAGE.users.filter(u => 
        u.user.toLowerCase().includes(q)
    ).map(u => ({ name: u.user }));

    res.json({ results });
});

// Manejo de errores globales
app.use((err, req, res, next) => {
    res.status(500).json({ error: "Error interno del sistema." });
});

server.listen(PORT, () => {
    console.log(`>>> ENGINE RUNNING ON PORT ${PORT}`);
});
