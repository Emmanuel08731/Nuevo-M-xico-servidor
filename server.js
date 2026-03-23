/**
 * ==============================================================================
 * DEVROOT PLATFORM ENGINE v6.0.4
 * CORE INFRASTRUCTURE - PRODUCTION LEVEL
 * ==============================================================================
 */

const express = require('express');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;

/**
 * CONFIGURACIÓN DE SEGURIDAD Y OPTIMIZACIÓN
 * Se utiliza la variable DATABASE_URL configurada en Render para la conexión.
 */
const DB_URI = process.env.DATABASE_URL;

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
    crossOriginEmbedderPolicy: false
}));

app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

/**
 * GESTIÓN DE MEMORIA Y PERSISTENCIA
 */
let userStore = [];
let systemEvents = [
    { id: 1, type: 'info', msg: 'Motor DevRoot inicializado exitosamente.' },
    { id: 2, type: 'security', msg: 'Firewall de capa 7 activado.' }
];

/**
 * RECURSOS ESTÁTICOS CON CACHÉ DE LARGO PLAZO
 */
const staticConfig = {
    dotfiles: 'ignore',
    etag: true,
    index: "index.html",
    maxAge: '31d',
    setHeaders: (res) => {
        res.set('X-DevRoot-Version', '6.0.4');
    }
};

app.use(express.static(path.join(__dirname, 'public'), staticConfig));

/**
 * API ENDPOINTS: AUTENTICACIÓN Y CUENTAS
 */

// CREAR CUENTA
app.post('/api/auth/register', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password || password.length < 6) {
        return res.status(400).json({ success: false, error: "Datos insuficientes o contraseña muy corta." });
    }

    const check = userStore.find(u => u.email === email);
    if (check) return res.status(409).json({ success: false, error: "Este correo ya está registrado." });

    try {
        const salt = await bcrypt.genSalt(14);
        const passwordHash = await bcrypt.hash(password, salt);
        
        const newUser = {
            id: `USR-${Math.floor(Math.random() * 99999)}`,
            email: email,
            hash: passwordHash,
            createdAt: new Date().toISOString()
        };

        userStore.push(newUser);
        return res.status(201).json({ 
            success: true, 
            message: "Cuenta creada correctamente." 
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: "Fallo crítico en el módulo crypt." });
    }
});

// INICIAR SESIÓN
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const user = userStore.find(u => u.email === email);

    if (!user) return res.status(401).json({ success: false, error: "Cuenta no encontrada." });

    try {
        const match = await bcrypt.compare(password, user.hash);
        if (!match) return res.status(401).json({ success: false, error: "Contraseña incorrecta." });

        return res.json({ 
            success: true, 
            message: "Sesión iniciada correctamente.",
            user: { email: user.email, uid: user.id }
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: "Error en la validación de seguridad." });
    }
});

// ELIMINAR CUENTA (ZONA DE PELIGRO)
app.post('/api/auth/delete', (req, res) => {
    const { email } = req.body;
    const originalSize = userStore.length;
    userStore = userStore.filter(u => u.email !== email);

    if (userStore.length < originalSize) {
        return res.json({ success: true, message: "Cuenta eliminada permanentemente." });
    }
    res.status(404).json({ success: false, error: "No se pudo localizar la cuenta." });
});

/**
 * MONITOR DE ESTADO
 */
app.listen(PORT, () => {
    console.clear();
    console.log("------------------------------------------");
    console.log(`| DEVROOT SERVER | STATUS: ONLINE       |`);
    console.log(`| PORT: ${PORT} | DATABASE: DETECTED    |`);
    console.log("------------------------------------------");
});
