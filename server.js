/**
 * DEVROOT ENTERPRISE SERVER V50
 * DEVELOPER: EMMANUEL
 * ESTRUCTURA: BACKEND ROBUSTO PARA NODE.JS
 */

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// --- CONFIGURACIÓN DE SEGURIDAD Y RENDIMIENTO ---
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- CONEXIÓN A BASE DE DATOS (MONGODB) ---
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/devroot_db";

mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ Conexión establecida con la Base de Datos de Emmanuel"))
    .catch(err => console.error("❌ Error crítico de conexión:", err));

// --- MODELO DE DATOS PROFESIONAL ---
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    specialization: { type: String, default: "Desarrollador General" },
    avatarColor: { type: String, default: "#0066ff" },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    bio: { type: String, default: "Miembro verificado de DevRoot Network" },
    isOnline: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);

// --- RUTAS DE LA API (LÓGICA DE NEGOCIO) ---

// 1. Registro Global (Cerrar cuenta y crear nueva)
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password, spec } = req.body;
        
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) return res.status(400).json({ error: "El usuario o email ya está registrado." });

        const newUser = new User({
            username,
            email,
            password, 
            specialization: spec,
            avatarColor: "#" + Math.floor(Math.random()*16777215).toString(16)
        });

        await newUser.save();
        res.status(201).json(newUser);
    } catch (error) {
        res.status(500).json({ error: "Error interno al procesar el registro." });
    }
});

// 2. Login de Usuario
app.post('/api/auth/login', async (req, res) => {
    try {
        const { identity, password } = req.body;
        const user = await User.findOne({ 
            $or: [{ username: identity }, { email: identity }],
            password: password 
        });

        if (!user) return res.status(401).json({ error: "Credenciales incorrectas." });
        
        user.isOnline = true;
        await user.save();
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: "Error en el servidor." });
    }
});

// 3. Buscador en Tiempo Real (Cero fantasmas)
app.get('/api/search', async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) return res.json([]);

        const results = await User.find({
            username: { $regex: query, $options: 'i' }
        }).select('username specialization avatarColor followers').limit(8);

        res.json(results);
    } catch (error) {
        res.status(500).json({ error: "Error en la búsqueda." });
    }
});

// 4. Recomendaciones de Usuarios Existentes
app.get('/api/recommendations', async (req, res) => {
    try {
        const users = await User.find().sort({ createdAt: -1 }).limit(5);
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: "Error al cargar sugerencias." });
    }
});

// 5. Sistema de Seguimiento (Follow/Unfollow)
app.post('/api/follow', async (req, res) => {
    const { followerId, targetId } = req.body;
    try {
        await User.findByIdAndUpdate(targetId, { $addToSet: { followers: followerId } });
        await User.findByIdAndUpdate(followerId, { $addToSet: { following: targetId } });
        res.json({ message: "Operación de seguimiento exitosa" });
    } catch (error) {
        res.status(500).json({ error: "No se pudo seguir al usuario." });
    }
});

app.listen(PORT, () => {
    console.log(`
    ---------------------------------------------------
    🚀 SERVIDOR DE EMMANUEL CORRIENDO EN PUERTO ${PORT}
    🌐 WEB: http://localhost:${PORT}
    ---------------------------------------------------
    `);
});
