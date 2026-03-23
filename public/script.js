/**
 * DEVROOT INTERFACE LOGIC v6.0.4
 * GESTIÓN DINÁMICA DE NODOS
 */

// 1. MOTOR DE PARTÍCULAS (CANVAS PHYSICS)
const canvas = document.getElementById('particle-net');
const ctx = canvas.getContext('2d');
let dots = [];

function initCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    dots = [];
    for (let i = 0; i < 80; i++) {
        dots.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            size: Math.random() * 2 + 1
        });
    }
}

function drawParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#0066ff";
    ctx.globalAlpha = 0.2;

    dots.forEach(dot => {
        dot.x += dot.vx;
        dot.y += dot.vy;
        if (dot.x < 0 || dot.x > canvas.width) dot.vx *= -1;
        if (dot.y < 0 || dot.y > canvas.height) dot.vy *= -1;

        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.size, 0, Math.PI * 2);
        ctx.fill();
    });

    requestAnimationFrame(drawParticles);
}

window.addEventListener('resize', initCanvas);
initCanvas();
drawParticles();

// 2. SISTEMA DE NOTIFICACIONES (TOAST)
function notify(title, msg, type = "info") {
    const toast = document.getElementById('toast-notif');
    const tTitle = document.getElementById('toast-title');
    const tBody = document.getElementById('toast-body');
    
    tTitle.innerText = title;
    tBody.innerText = msg;
    
    toast.classList.remove('toast-hidden');
    
    setTimeout(() => {
        toast.classList.add('toast-hidden');
    }, 4000);
}

// 3. LÓGICA DE AUTENTICACIÓN
let isLoginMode = true;
let currentUser = null;

function switchAuthMode() {
    isLoginMode = !isLoginMode;
    const title = document.getElementById('auth-title-text');
    const btn = document.getElementById('btn-label');
    const link = document.getElementById('auth-link');
    const switchP = document.getElementById('auth-switch-p');

    if (isLoginMode) {
        title.innerText = "Bienvenido al Nodo";
        btn.innerText = "Iniciar Sesión";
        switchP.innerHTML = '¿Aún no tienes un nodo? <span onclick="switchAuthMode()" id="auth-link">Registrar Acceso</span>';
    } else {
        title.innerText = "Crear Nuevo Acceso";
        btn.innerText = "Inicializar Nodo";
        switchP.innerHTML = '¿Ya tienes un nodo activo? <span onclick="switchAuthMode()" id="auth-link">Volver al Login</span>';
    }
}

function togglePassword() {
    const passInput = document.getElementById('pass-in');
    const eyeIcon = document.getElementById('pass-eye');
    if (passInput.type === 'password') {
        passInput.type = 'text';
        eyeIcon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        passInput.type = 'password';
        eyeIcon.classList.replace('fa-eye-slash', 'fa-eye');
    }
}

async function processAuth() {
    const email = document.getElementById('email-in').value;
    const password = document.getElementById('pass-in').value;
    const url = isLoginMode ? '/api/auth/login' : '/api/auth/register';

    if (!email || !password) return notify("Error", "Completa todos los campos obligatorios.");

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            if (isLoginMode) {
                currentUser = data.user;
                notify("Sincronizado", "Acceso concedido al servidor.");
                launchDashboard();
            } else {
                notify("Éxito", "Nodo registrado. Ahora puedes iniciar sesión.");
                switchAuthMode();
            }
        } else {
            notify("Acceso Denegado", data.error);
        }
    } catch (err) {
        notify("Fallo de Red", "No se pudo conectar con el motor DevRoot.");
    }
}

// 4. TRANSICIÓN AL DASHBOARD
function launchDashboard() {
    document.getElementById('auth-gateway').classList.add('hidden');
    document.getElementById('main-dashboard').classList.remove('hidden');
    document.getElementById('user-name-display').innerText = currentUser.email;
    document.getElementById('avatar-char').innerText = currentUser.email[0].toUpperCase();
}

// 5. GESTIÓN DE UI DASHBOARD
function toggleUserDropdown() {
    document.getElementById('user-dropdown').classList.toggle('drop-hidden');
}

function showModal(id) {
    document.getElementById(id).classList.remove('hidden');
    toggleUserDropdown();
}

function hideModal(id) {
    document.getElementById(id).classList.add('hidden');
}

async function initiateAccountDestruction() {
    if (confirm("¿Estás absolutamente seguro de purgar este nodo?")) {
        const res = await fetch('/api/auth/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: currentUser.email })
        });
        
        if (res.ok) {
            notify("Purga Completa", "El nodo ha sido eliminado.");
            setTimeout(() => location.reload(), 2000);
        }
    }
}

function logoutProcedure() {
    notify("Desconexión", "Cerrando sesión segura...");
    setTimeout(() => location.reload(), 1500);
}

// Cerrar dropdown si se hace click fuera
window.onclick = function(event) {
    if (!event.target.closest('.user-profile-btn')) {
        document.getElementById('user-dropdown').classList.add('drop-hidden');
    }
}
