/**
 * DEVROOT DATABASE ENGINE V70 - EMMANUEL OFFICIAL
 * CONEXIÓN REAL A MONGODB PARA RENDER
 */
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// --- SEGURIDAD Y MIDDLEWARES ---
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- CONEXIÓN A MONGODB ATLAS ---
// Asegúrate de poner tu MONGO_URI en el Dashboard de Render
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ Emmanuel, la base de datos está ONLINE"))
    .catch(err => console.error("❌ Error de conexión a la DB:", err));

// --- MODELO DE USUARIO REAL ---
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    specialization: { type: String, default: "Developer" },
    avatarColor: { type: String, default: "#0061ff" },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    date: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);

// --- RUTAS DE LA API ---

// Registro Real
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password, spec } = req.body;
        
        // Validar si ya existe
        const check = await User.findOne({ $or: [{ username }, { email }] });
        if (check) return res.status(400).json({ error: "Este usuario o correo ya existe en la red." });

        const newUser = new User({
            username,
            email,
            password,
            specialization: spec,
            avatarColor: "#" + Math.floor(Math.random()*16777215).toString(16)
        });

        await newUser.save();
        res.status(201).json(newUser);
    } catch (err) {
        res.status(500).json({ error: "Error al registrar en la base de datos." });
    }
});

// Login Real
app.post('/api/login', async (req, res) => {
    try {
        const { identity, password } = req.body;
        const user = await User.findOne({ 
            $or: [{ username: identity }, { email: identity }],
            password: password 
        });

        if (!user) return res.status(401).json({ error: "Usuario o clave incorrecta." });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: "Error de servidor." });
    }
});

// Buscador Global (Sin cuentas fantasmas)
app.get('/api/search', async (req, res) => {
    const { q } = req.query;
    if (!q) return res.json([]);
    
    try {
        const results = await User.find({ 
            username: { $regex: q, $options: 'i' } 
        }).limit(10);
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: "Error en búsqueda." });
    }
});

// Sistema de Seguidores Persistente
app.post('/api/follow', async (req, res) => {
    const { myId, targetId } = req.body;
    try {
        await User.findByIdAndUpdate(targetId, { $addToSet: { followers: myId } });
        await User.findByIdAndUpdate(myId, { $addToSet: { following: targetId } });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "No se pudo seguir." });
    }
});

// Recomendaciones Reales
app.get('/api/recommendations', async (req, res) => {
    const users = await User.find().sort({ date: -1 }).limit(5);
    res.json(users);
});

app.listen(PORT, () => console.log(`🚀 Servidor Emmanuel Store activo en puerto ${PORT}`));
