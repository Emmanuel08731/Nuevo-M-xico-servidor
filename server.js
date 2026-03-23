/**
 * ==============================================================================
 * DEVROOT CORE ENGINE v6.0.4 - INFRAESTRUCTURA DE ALTO NIVEL
 * ESTADO: PRODUCCIÓN | DIRECTOR DE PROYECTO: EMMANUEL
 * ==============================================================================
 * Este motor gestiona la autenticación de nodos y la integridad de datos.
 */

const express = require('express');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const bcrypt = require('bcryptjs');

// INICIALIZACIÓN DE LA APLICACIÓN
const app = express();
const PORT = process.env.PORT || 3000;

/**
 * GESTIÓN DE BASE DE DATOS VOLÁTIL
 * Estructura optimizada para persistencia en sesión actual.
 */
let usersDB = []; 
let nodeSessions = new Map();
let globalSystemLogs = [];

/**
 * CONFIGURACIÓN DE SEGURIDAD AVANZADA (HELMET)
 * Se configura específicamente para permitir recursos externos de fuentes seguras.
 */
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "https://cdnjs.cloudflare.com", "'unsafe-inline'"],
            styleSrc: ["'self'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com", "'unsafe-inline'"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "blob:"],
            connectSrc: ["'self'"]
        }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// OPTIMIZACIÓN DE CARGA
app.use(compression()); 
app.use(express.json({ limit: '10mb' })); 
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * SERVICIO DE ARCHIVOS ESTÁTICOS
 * Configuración de caché para optimizar el rendimiento en Render.
 */
const staticConfig = {
    dotfiles: 'ignore',
    etag: true,
    extensions: ['html', 'js', 'css'],
    index: "index.html",
    maxAge: '1d',
    setHeaders: (res, path) => {
        res.set('X-Powered-By', 'DevRoot Engine v6.0.4');
    }
};

app.use(express.static(path.join(__dirname, 'public'), staticConfig));

/**
 * API REST - PROTOCOLO DE SEGURIDAD
 */

// REGISTRO DE NUEVO ACCESO
app.post('/api/auth/register', async (req, res) => {
    const { email, password } = req.body;

    // Validación de entrada estricta
    if (!email || !password) {
        return res.status(400).json({ success: false, error: "Campos de entrada requeridos faltantes." });
    }

    if (password.length < 8) {
        return res.status(400).json({ success: false, error: "La seguridad requiere al menos 8 caracteres." });
    }

    const duplicate = usersDB.find(u => u.email === email);
    if (duplicate) {
        return res.status(409).json({ success: false, error: "Identidad ya vinculada a un nodo existente." });
    }

    try {
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const nodeIdentity = {
            id: `UID-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            email: email,
            password: hashedPassword,
            status: "online",
            joined: new Date().toISOString()
        };

        usersDB.push(nodeIdentity);
        globalSystemLogs.push(`[SISTEMA] Registro exitoso: ${email}`);
        
        return res.status(201).json({ success: true, message: "Nodo creado satisfactoriamente." });
    } catch (err) {
        return res.status(500).json({ success: false, error: "Fallo crítico en el proceso de encriptación." });
    }
});

// LOGIN Y SINCRONIZACIÓN
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    const user = usersDB.find(u => u.email === email);
    if (!user) {
        return res.status(401).json({ success: false, error: "Las credenciales no coinciden con ningún nodo." });
    }

    try {
        const isAuthorized = await bcrypt.compare(password, user.password);
        if (!isAuthorized) {
            return res.status(401).json({ success: false, error: "Llave de seguridad incorrecta." });
        }

        const sessionID = `SESS-${Math.random().toString(36).substring(2, 15)}`;
        nodeSessions.set(sessionID, email);
        
        globalSystemLogs.push(`[ACCESO] Sincronización completa: ${email}`);
        
        return res.json({ 
            success: true, 
            user: { email: user.email, sessionToken: sessionID } 
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: "Error de servidor durante el login." });
    }
});

// PROTOCOLO DE ELIMINACIÓN PERMANENTE
app.post('/api/auth/delete', (req, res) => {
    const { email } = req.body;
    const initialSize = usersDB.length;
    
    usersDB = usersDB.filter(u => u.email !== email);

    if (usersDB.length < initialSize) {
        globalSystemLogs.push(`[SISTEMA] Nodo purgado: ${email}`);
        return res.json({ success: true, message: "Datos eliminados permanentemente." });
    }
    
    return res.status(404).json({ success: false, error: "No se encontró el nodo solicitado." });
});

/**
 * MANEJO DE RUTAS NO ENCONTRADAS (404)
 */
app.use((req, res) => {
    res.status(404).send(`
        <div style="text-align:center; padding: 50px; font-family: sans-serif;">
            <h1>Error 404</h1>
            <p>El nodo solicitado no existe en la infraestructura DevRoot.</p>
        </div>
    `);
});

// INICIO DEL SERVIDOR
app.listen(PORT, () => {
    console.log("--------------------------------------------------");
    console.log(`| DEVROOT ENGINE v6.0.4 IS NOW DEPLOYED        |`);
    console.log(`| LISTENING ON PORT: ${PORT}                      |`);
    console.log(`| READY FOR INCOMING CONNECTIONS               |`);
    console.log("--------------------------------------------------");
});
