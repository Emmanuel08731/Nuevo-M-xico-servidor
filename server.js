/**
 * ==============================================================================
 * DEVROOT PLATFORM ENGINE v8.0.2
 * ARCHITECTURE: NODE.JS + EXPRESS + BCRYPT + SESSION EMULATOR
 * AUTHOR: EMMANUEL
 * ==============================================================================
 */

const express = require('express');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de Seguridad y Optimización para Render
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

/**
 * BASE DE DATOS VOLÁTIL (ESTRUCTURA DE ALTA DISPONIBILIDAD)
 * Para persistencia real, conectar DATABASE_URL de Render.
 */
let core_users = [];
let core_system_logs = [
    { id: 101, event: "KERNEL_INIT", status: "STABLE", time: new Date().toISOString() }
];

app.use(express.static(path.join(__dirname, 'public')));

/**
 * MIDDLEWARE DE AUDITORÍA
 */
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] INBOUND: ${req.method} ${req.url}`);
    next();
});

// --- ENDPOINTS DE AUTENTICACIÓN ---

// REGISTRO DE CUENTA
app.post('/api/v1/auth/create', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password || password.length < 6) {
        return res.status(400).json({ 
            success: false, 
            error: "Datos inválidos. La contraseña debe tener +6 caracteres." 
        });
    }

    const checkUser = core_users.find(u => u.user_email === email);
    if (checkUser) {
        return res.status(409).json({ 
            success: false, 
            error: "Este correo ya está registrado en nuestra red." 
        });
    }

    try {
        const salt = await bcrypt.genSalt(12);
        const hash = await bcrypt.hash(password, salt);

        const newUser = {
            user_id: `DR-${Math.floor(Math.random() * 90000) + 10000}`,
            user_email: email,
            user_hash: hash,
            created_at: new Date().toISOString(),
            status: "ACTIVE"
        };

        core_users.push(newUser);
        core_system_logs.push({ event: "USER_REGISTRATION", user: email, status: "SUCCESS" });

        return res.status(201).json({ 
            success: true, 
            message: "Cuenta creada correctamente. Ya puedes iniciar sesión." 
        });

    } catch (err) {
        return res.status(500).json({ success: false, error: "Fallo crítico en el módulo crypt." });
    }
});

// INICIO DE SESIÓN
app.post('/api/v1/auth/access', async (req, res) => {
    const { email, password } = req.body;
    const user = core_users.find(u => u.user_email === email);

    if (!user) {
        return res.status(401).json({ success: false, error: "Cuenta no localizada." });
    }

    try {
        const isMatch = await bcrypt.compare(password, user.user_hash);
        if (!isMatch) {
            return res.status(401).json({ success: false, error: "La contraseña es incorrecta." });
        }

        core_system_logs.push({ event: "USER_ACCESS", user: email, status: "GRANTED" });

        return res.json({ 
            success: true, 
            message: "Sesión iniciada correctamente.", 
            profile: { email: user.user_email, uid: user.user_id, joined: user.created_at } 
        });

    } catch (err) {
        return res.status(500).json({ success: false, error: "Error de validación interna." });
    }
});

// ELIMINACIÓN DE CUENTA
app.post('/api/v1/auth/terminate', (req, res) => {
    const { email } = req.body;
    const initialSize = core_users.length;
    core_users = core_users.filter(u => u.user_email !== email);

    if (core_users.length < initialSize) {
        return res.json({ success: true, message: "Cuenta eliminada permanentemente del núcleo." });
    }
    res.status(404).json({ success: false, error: "No se pudo procesar la baja." });
});

// MONITOR DE SISTEMA
app.get('/api/v1/sys/status', (req, res) => {
    res.json({ online: true, users_cached: core_users.length, version: "8.0.2" });
});

app.listen(PORT, () => {
    console.clear();
    console.log(`\n\x1b[36m%s\x1b[0m`, `>>> DEVROOT ENGINE v8.0.2 IS LIVE`);
    console.log(`\x1b[32m%s\x1b[0m`, `>>> PORT: ${PORT} | MODE: PRODUCTION`);
    console.log(`\x1b[33m%s\x1b[0m`, `>>> DATABASE: MEMORY_POOL_ACTIVE\n`);
});
