/**
 * ==============================================================================
 * DEVROOT CORE SYSTEM v7.0.0
 * ARCHITECTURE: NODE.JS + EXPRESS + BCRYPT
 * DEVELOPER: EMMANUEL
 * ==============================================================================
 */

const express = require('express');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de la Variable de Entorno de Render
const DATABASE_URL = process.env.DATABASE_URL;

/**
 * MIDDLEWARES DE ALTO RENDIMIENTO
 */
app.use(helmet({
    contentSecurityPolicy: false, // Permitir fuentes externas de Google
    crossOriginEmbedderPolicy: false
}));

app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

/**
 * SISTEMA DE PERSISTENCIA TEMPORAL (DATABASE EMULATOR)
 * En producción, aquí se usaría la variable DATABASE_URL con un pool de Postgres.
 */
let userDatabase = []; 
let serverLogs = [
    { timestamp: new Date(), event: "SISTEMA INICIALIZADO", status: "OK" }
];

/**
 * SERVIDOR DE ARCHIVOS ESTÁTICOS CON CABECERAS DE SEGURIDAD
 */
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '31d',
    setHeaders: (res) => {
        res.set('X-Powered-By', 'DevRoot-Engine-v7');
        res.set('X-Content-Type-Options', 'nosniff');
    }
}));

/**
 * CONTROLADOR DE AUTENTICACIÓN: REGISTRO
 */
app.post('/api/auth/register', async (req, res) => {
    const { email, password } = req.body;

    try {
        if (!email || !password) {
            return res.status(400).json({ success: false, error: "Todos los campos son obligatorios." });
        }

        const userExists = userDatabase.find(u => u.email === email);
        if (userExists) {
            return res.status(409).json({ success: false, error: "El correo ya está en uso." });
        }

        // Encriptación de alto nivel (12 rounds)
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = {
            id: `UID-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            email: email,
            password: hashedPassword,
            joined: new Date().toISOString()
        };

        userDatabase.push(newUser);
        serverLogs.push({ timestamp: new Date(), event: `REGISTRO: ${email}`, status: "SUCCESS" });

        return res.status(201).json({ 
            success: true, 
            message: "Cuenta creada correctamente." 
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, error: "Fallo interno en el núcleo de seguridad." });
    }
});

/**
 * CONTROLADOR DE AUTENTICACIÓN: LOGIN
 */
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = userDatabase.find(u => u.email === email);
        if (!user) {
            return res.status(401).json({ success: false, error: "Usuario no encontrado." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, error: "Contraseña incorrecta." });
        }

        serverLogs.push({ timestamp: new Date(), event: `LOGIN: ${email}`, status: "SUCCESS" });

        return res.json({ 
            success: true, 
            message: "Sesión iniciada correctamente.",
            userData: { email: user.email, id: user.id }
        });

    } catch (err) {
        return res.status(500).json({ success: false, error: "Error en el proceso de autenticación." });
    }
});

/**
 * CONTROLADOR: ELIMINAR CUENTA
 */
app.post('/api/auth/delete-account', (req, res) => {
    const { email } = req.body;
    const initialCount = userDatabase.length;
    userDatabase = userDatabase.filter(u => u.email !== email);

    if (userDatabase.length < initialCount) {
        serverLogs.push({ timestamp: new Date(), event: `CUENTA ELIMINADA: ${email}`, status: "WARNING" });
        return res.json({ success: true, message: "Cuenta eliminada del sistema." });
    }
    
    return res.status(404).json({ success: false, error: "No se encontró el perfil." });
});

/**
 * INICIO DEL SERVIDOR
 */
app.listen(PORT, () => {
    console.log("------------------------------------------");
    console.log(`| DEVROOT v7.0 | ONLINE EN PUERTO: ${PORT} |`);
    console.log("------------------------------------------");
});
