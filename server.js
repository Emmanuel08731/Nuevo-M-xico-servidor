/**
 * ==============================================================================
 * CENTRAL CORE PLATFORM - V11.0.0
 * SISTEMA DE GESTIÓN DE CONTENIDO Y USUARIOS
 * ==============================================================================
 */

const express = require('express');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de Seguridad Básica (Sin dependencias externas pesadas)
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(compression());

/**
 * ALMACENAMIENTO DINÁMICO
 */
const DATABASE = {
    accounts: [], // Estructura: { user, email, pass, id }
    posts: [],    // Estructura: { id, author, content, date }
    analytics: {
        searches: 0,
        access_logs: []
    }
};

app.use(express.static(path.join(__dirname, 'public')));

/**
 * ENDPOINTS DE BÚSQUEDA (SEARCH ENGINE)
 */
app.get('/api/search', (req, res) => {
    const query = req.query.q ? req.query.q.toLowerCase() : '';
    DATABASE.analytics.searches++;

    // Búsqueda en Usuarios
    const filteredUsers = DATABASE.accounts.filter(u => 
        u.user.toLowerCase().includes(query)
    ).map(u => ({ user: u.user, id: u.id }));

    // Búsqueda en Publicaciones (Actualmente vacías)
    const filteredPosts = DATABASE.posts.filter(p => 
        p.content.toLowerCase().includes(query)
    );

    res.json({
        users: filteredUsers,
        posts: filteredPosts,
        count: filteredUsers.length + filteredPosts.length
    });
});

/**
 * SISTEMA DE REGISTRO (SIGNUP)
 */
app.post('/api/auth/register', (req, res) => {
    const { user, email, password } = req.body;

    if (!user || !email || !password) {
        return res.status(400).json({ success: false, msg: "Todos los campos son obligatorios." });
    }

    const exists = DATABASE.accounts.find(a => a.email === email || a.user === user);
    if (exists) {
        return res.status(409).json({ success: false, msg: "El usuario o email ya están en uso." });
    }

    const newAccount = {
        id: Date.now(),
        user: user.trim(),
        email: email.toLowerCase().trim(),
        password: password, // En producción usar hashing
        joined: new Date().toISOString()
    };

    DATABASE.accounts.push(newAccount);
    console.log(`[SYSTEM] Nueva cuenta: ${newAccount.user}`);

    res.status(201).json({ success: true, msg: "Registro completado con éxito." });
});

/**
 * SISTEMA DE ACCESO (LOGIN)
 */
app.post('/api/auth/login', (req, res) => {
    const { identity, password } = req.body; // identity puede ser user o email

    const account = DATABASE.accounts.find(a => 
        (a.email === identity || a.user === identity) && a.password === password
    );

    if (!account) {
        return res.status(401).json({ success: false, msg: "Credenciales inválidas." });
    }

    res.json({
        success: true,
        user: {
            username: account.user,
            email: account.email,
            id: account.id
        }
    });
});

app.listen(PORT, () => {
    console.log(`\nCORE ENGINE ONLINE ON PORT ${PORT}\n`);
});
