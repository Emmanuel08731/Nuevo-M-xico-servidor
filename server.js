/**
 * DEVROOT CORE ENGINE v7.5.0
 * SISTEMA DE GESTIÓN DE IDENTIDAD DIGITAL
 * DESARROLLADO PARA: EMMANUEL
 */

const express = require('express');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de Seguridad para Render
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simulación de Base de Datos (Se recomienda PostgreSQL con la URL de Render para persistencia)
let userStore = []; 

app.use(express.static(path.join(__dirname, 'public')));

// --- RUTAS DE AUTENTICACIÓN ---

// 1. REGISTRO (CREAR CUENTA)
app.post('/api/auth/register', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, error: "Faltan datos." });

    const exists = userStore.find(u => u.email === email);
    if (exists) return res.status(400).json({ success: false, error: "El correo ya existe." });

    try {
        const hash = await bcrypt.hash(password, 10);
        userStore.push({ email, hash, id: Date.now() });
        console.log(`[SISTEMA] Nueva cuenta creada: ${email}`);
        return res.status(201).json({ success: true, message: "Cuenta creada correctamente." });
    } catch (e) {
        return res.status(500).json({ success: false, error: "Error de encriptación." });
    }
});

// 2. LOGIN (INICIAR SESIÓN)
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const user = userStore.find(u => u.email === email);

    if (!user) return res.status(401).json({ success: false, error: "Usuario no encontrado." });

    const valid = await bcrypt.compare(password, user.hash);
    if (!valid) return res.status(401).json({ success: false, error: "Contraseña incorrecta." });

    console.log(`[SISTEMA] Sesión iniciada: ${email}`);
    return res.json({ 
        success: true, 
        message: "Sesión iniciada correctamente.", 
        user: { email: user.email } 
    });
});

// 3. ELIMINAR CUENTA
app.post('/api/auth/delete', (req, res) => {
    const { email } = req.body;
    userStore = userStore.filter(u => u.email !== email);
    res.json({ success: true, message: "Cuenta eliminada del servidor." });
});

app.listen(PORT, () => {
    console.log(`\n==========================================`);
    console.log(`  DEVROOT SERVER ONLINE | PUERTO: ${PORT}`);
    console.log(`==========================================\n`);
});
