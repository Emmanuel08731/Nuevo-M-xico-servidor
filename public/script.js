/**
 * DEVROOT INTERFACE CONTROL v6.0.4
 */

// 1. MOTOR DE RED (Fondo de Partículas)
const canvas = document.getElementById('particle-net');
const ctx = canvas.getContext('2d');
let particles = [];

function initCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    particles = [];
    for (let i = 0; i < 80; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            size: Math.random() * 2 + 0.5
        });
    }
}

function drawNet() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0066ff';
    ctx.strokeStyle = '#0066ff0a';

    particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Dibujar líneas entre partículas cercanas
        for (let j = i + 1; j < particles.length; j++) {
            const p2 = particles[j];
            const dx = p.x - p2.x;
            const dy = p.y - p2.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 150) {
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            }
        }
    });
    requestAnimationFrame(drawNet);
}

window.addEventListener('resize', initCanvas);
initCanvas();
drawNet();

// 2. SISTEMA DE NOTIFICACIONES
function showToast(msg) {
    const toast = document.getElementById('toast');
    document.getElementById('toast-msg').innerText = msg;
    toast.classList.remove('toast-hidden');
    setTimeout(() => toast.classList.add('toast-hidden'), 4000);
}

// 3. GESTIÓN DE AUTENTICACIÓN
let isLogin = true;
let currentUser = null;

function switchMode() {
    isLogin = !isLogin;
    document.querySelector('.auth-header h2').innerText = isLogin ? "Acceso al Nodo" : "Crear Nodo";
    document.getElementById('btn-text').innerText = isLogin ? "Conectar" : "Inicializar";
    document.getElementById('mode-text').innerHTML = isLogin ? 
        '¿No tienes cuenta? <span onclick="switchMode()" id="switch-link">Registrar ahora</span>' : 
        '¿Ya tienes acceso? <span onclick="switchMode()" id="switch-link">Volver al login</span>';
}

function togglePassView() {
    const input = document.getElementById('password');
    const icon = document.getElementById('eye-icon');
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
}

async function handleAuth() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';

    if (!email || !password) return showToast("Faltan credenciales.");

    try {
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();
        if (res.ok) {
            if (isLogin) {
                currentUser = data.user;
                showToast("Conexión segura establecida.");
                launchDashboard();
            } else {
                showToast("Nodo registrado. Inicia sesión.");
                switchMode();
            }
        } else {
            showToast(data.error);
        }
    } catch (err) {
        showToast("Fallo de conexión.");
    }
}

function launchDashboard() {
    document.getElementById('login-screen').classList.replace('screen-active', 'hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    document.getElementById('display-user').innerText = currentUser.email;
    document.getElementById('user-initial').innerText = currentUser.email[0].toUpperCase();
}

// 4. CONTROL DE DASHBOARD
function toggleUserMenu() { document.getElementById('user-menu').classList.toggle('menu-hidden'); }
function showModal(id) { document.getElementById(id).classList.remove('hidden'); toggleUserMenu(); }
function hideModal(id) { document.getElementById(id).classList.add('hidden'); }

async function deleteAccount() {
    if (confirm("¿Estás seguro de purgar permanentemente este nodo?")) {
        await fetch('/api/auth/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: currentUser.email })
        });
        location.reload();
    }
}

// Cerrar dropdown si se clickea fuera
window.onclick = (e) => {
    if (!e.target.closest('.nav-user')) {
        document.getElementById('user-menu').classList.add('menu-hidden');
    }
}
