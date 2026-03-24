/**
 * DEVROOT CORE SERVER V40 - EMMANUEL EDITION
 * SISTEMA DE PERSISTENCIA REAL CON MONGODB
 */
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 3000;

// --- CONEXIÓN A BASE DE DATOS ---
// Si no hay URI, usamos una local por defecto para que no explote
const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/devroot";

mongoose.connect(mongoURI)
    .then(() => console.log("✅ Conectado a MongoDB - Emmanuel Database"))
    .catch(err => console.error("❌ Error de conexión:", err));

// --- MODELO DE USUARIO (SCHEMA) ---
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    spec: String,
    followers: { type: Array, default: [] },
    following: { type: Array, default: [] },
    color: String,
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);

// --- MIDDLEWARES ---
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- RUTAS DE API (LÓGICA REAL) ---

// 1. Registro y Guardado Real
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password, spec } = req.body;
        
        // Verificar si existe
        const exists = await User.findOne({ $or: [{ username }, { email }] });
        if (exists) return res.status(400).json({ msg: "El usuario o email ya existe." });

        const newUser = new User({
            username,
            email,
            password, // En producción usa bcrypt, aquí lo dejamos simple para tu test
            spec,
            color: "#" + Math.floor(Math.random()*16777215).toString(16)
        });

        await newUser.save();
        res.status(201).json(newUser);
    } catch (err) {
        res.status(500).json({ msg: "Error al crear cuenta" });
    }
});

// 2. Login
app.post('/api/auth/login', async (req, res) => {
    const { identity, password } = req.body;
    const user = await User.findOne({ 
        $or: [{ username: identity }, { email: identity }],
        password: password
    });

    if (!user) return res.status(401).json({ msg: "Credenciales inválidas" });
    res.json(user);
});

// 3. Buscador Global (Sin cuentas fantasmas)
app.get('/api/users/search', async (req, res) => {
    const { q } = req.query;
    if (!q) return res.json([]);
    
    // Busca usuarios reales que coincidan con el nombre
    const users = await User.find({ 
        username: { $regex: q, $options: 'i' } 
    }).limit(10);
    
    res.json(users);
});

// 4. Recomendaciones (Usuarios reales registrados)
app.get('/api/users/recommendations', async (req, res) => {
    const users = await User.find().limit(5).sort({ createdAt: -1 });
    res.json(users);
});

// 5. Sistema de Seguidores (Persistente)
app.post('/api/users/follow', async (req, res) => {
    const { myId, targetId } = req.body;
    try {
        // Actualizar al que siguen
        await User.findByIdAndUpdate(targetId, { $addToSet: { followers: myId } });
        // Actualizar al que sigue
        await User.findByIdAndUpdate(myId, { $addToSet: { following: targetId } });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ msg: "Error al seguir" });
    }
});

app.listen(PORT, () => console.log(`🚀 Server en puerto ${PORT}`));
