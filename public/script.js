/**
 * DEVROOT NEXUS CONTROL v6.0.4
 * INTERFACE LOGIC & DATA STREAMING
 */

// 1. ENGINE VISUAL (NETWORK PARTICLES)
const canvas = document.getElementById('ui-canvas');
const ctx = canvas.getContext('2d');
let particles = [];

function setupCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    particles = [];
    for (let i = 0; i < 95; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.45,
            vy: (Math.random() - 0.5) * 0.45,
            size: Math.random() * 2 + 1
        });
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0066ff';
    ctx.strokeStyle = '#0066ff0a';

    particles.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
            let p2 = particles[j];
            let dist = Math.hypot(p.x - p2.x, p.y - p2.y);
            if (dist < 160) {
                ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
            }
        }
    });
    requestAnimationFrame(draw);
}

setupCanvas(); draw();
window.onresize = setupCanvas;

// 2. SISTEMA DE MENSAJES (TOAST)
function pushNotify(msg) {
    const toast = document.getElementById('toast');
    document.getElementById('toast-text').innerText = msg;
    toast.classList.remove('toast-hidden');
    setTimeout(() => toast.classList.add('toast-hidden'), 4000);
}

// 3. CONTROL DE AUTENTICACIÓN
let isRegistering = false;
function toggleAuthMode() {
    isRegistering = !isRegistering;
    document.getElementById('auth-title').innerText = isRegistering ? "Crear Cuenta" : "Iniciar Sesión";
    document.getElementById('auth-desc').innerText = isRegistering ? "Únete a la infraestructura DevRoot." : "Ingresa tus credenciales para continuar.";
    document.getElementById('btn-label').innerText = isRegistering ? "Crear Cuenta Ahora" : "Iniciar Sesión";
    document.getElementById('mode-info').innerText = isRegistering ? "¿Ya tienes una cuenta?" : "¿No tienes una cuenta?";
    document.getElementById('mode-btn').innerText = isRegistering ? "Iniciar Sesión" : "Crear Cuenta";
}

function viewPass() {
    const p = document.getElementById('password');
    const i = document.getElementById('eye-icon');
    p.type = p.type === 'password' ? 'text' : 'password';
    i.classList.toggle('fa-eye-slash');
}

async function executeAuth() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';

    if (!email || !password) return pushNotify("Error: Complete los campos.");

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();

        if (response.ok) {
            pushNotify(data.message);
            if (!isRegistering) {
                initDashboard(data.user);
            } else {
                toggleAuthMode();
            }
        } else {
            pushNotify(data.error);
        }
    } catch (e) { pushNotify("Fallo de comunicación con el servidor."); }
}

// 4. FLUJO DEL DASHBOARD
function initDashboard(user) {
    document.getElementById('auth-view').classList.add('hidden');
    document.getElementById('app-dashboard').classList.remove('hidden');
    document.getElementById('display-email').innerText = user.email;
    document.getElementById('avatar-char').innerText = user.email[0].toUpperCase();
}

function toggleDrop() { document.getElementById('user-menu').classList.toggle('drop-hidden'); }
function openSettings() { document.getElementById('modal-settings').classList.remove('hidden'); toggleDrop(); }
function closeSettings() { document.getElementById('modal-settings').classList.add('hidden'); }

async function requestDeletion() {
    if (confirm("¿Confirmas la eliminación total de tu cuenta?")) {
        const email = document.getElementById('display-email').innerText;
        await fetch('/api/auth/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        location.reload();
    }
}

// Gestión de clics globales
window.addEventListener('click', (e) => {
    if (!e.target.closest('.profile-trigger')) {
        document.getElementById('user-menu').classList.add('drop-hidden');
    }
});
