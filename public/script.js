/**
 * DEVROOT NEXUS ENGINE v7.0
 * LÓGICA DE INTERFAZ Y COMUNICACIÓN CON EL SERVIDOR
 */

// 1. MOTOR DE PARTÍCULAS DEL FONDO
const canvas = document.getElementById('canvas-bg');
const ctx = canvas.getContext('2d');
let dots = [];

function setup() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    dots = [];
    for (let i = 0; i < 90; i++) {
        dots.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            size: Math.random() * 2 + 1
        });
    }
}

function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0066ff';
    ctx.strokeStyle = '#0066ff0a';

    dots.forEach((d, i) => {
        d.x += d.vx; d.y += d.vy;
        if (d.x < 0 || d.x > canvas.width) d.vx *= -1;
        if (d.y < 0 || d.y > canvas.height) d.vy *= -1;

        ctx.beginPath();
        ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
        ctx.fill();

        for (let j = i + 1; j < dots.length; j++) {
            let d2 = dots[j];
            let dist = Math.hypot(d.x - d2.x, d.y - d2.y);
            if (dist < 170) {
                ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(d2.x, d2.y); ctx.stroke();
            }
        }
    });
    requestAnimationFrame(loop);
}

setup(); loop();
window.addEventListener('resize', setup);

// 2. SISTEMA DE NOTIFICACIONES (TOAST)
function sendAlert(msg, type = "success") {
    const toast = document.getElementById('alert-toast');
    const text = document.getElementById('alert-text');
    const icon = document.getElementById('alert-icon');

    text.innerText = msg;
    icon.className = type === "success" ? "fa-solid fa-circle-check" : "fa-solid fa-circle-exclamation";
    
    toast.classList.remove('alert-hidden');
    setTimeout(() => toast.classList.add('alert-hidden'), 4000);
}

// 3. LÓGICA DE INTERCAMBIO DE MODO (CREAR CUENTA / ENTRAR)
let isLoginMode = true;

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    const title = document.getElementById('main-title');
    const desc = document.getElementById('main-desc');
    const btn = document.getElementById('btn-text-action');
    const info = document.getElementById('switcher-info');
    const link = document.getElementById('switcher-link');

    title.innerText = isLoginMode ? "Iniciar Sesión" : "Crear Cuenta";
    desc.innerText = isLoginMode ? "Ingresa tus datos para acceder a tu panel de control." : "Únete a la red DevRoot y empieza a construir hoy.";
    btn.innerText = isLoginMode ? "Entrar al Sistema" : "Registrar mi Cuenta";
    info.innerText = isLoginMode ? "¿Aún no tienes cuenta?" : "¿Ya eres miembro?";
    link.innerText = isLoginMode ? "Crear Cuenta" : "Iniciar Sesión";
}

function viewPassword() {
    const input = document.getElementById('user-pass');
    const icon = document.getElementById('eye-icon');
    input.type = input.type === 'password' ? 'text' : 'password';
    icon.classList.toggle('fa-eye-slash');
}

// 4. LÓGICA DE ENVÍO DE FORMULARIO (CORREGIDA)
async function submitAuth() {
    const email = document.getElementById('user-email').value;
    const password = document.getElementById('user-pass').value;
    
    // Ruta dinámica según el modo
    const targetPath = isLoginMode ? '/api/auth/login' : '/api/auth/register';

    if (!email || !password) {
        return sendAlert("Por favor, completa todos los campos.", "error");
    }

    try {
        const response = await fetch(targetPath, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            sendAlert(data.message);
            if (isLoginMode) {
                // Entrar al Dashboard
                loadDashboard(data.userData);
            } else {
                // Si registró, lo llevamos al login automáticamente
                toggleAuthMode();
            }
        } else {
            sendAlert(data.error, "error");
        }
    } catch (e) {
        sendAlert("Error de conexión con el núcleo central.", "error");
    }
}

// 5. MANEJO DEL DASHBOARD
function loadDashboard(user) {
    document.getElementById('auth-layout').classList.add('hidden');
    document.getElementById('app-dashboard').classList.remove('hidden');
    document.getElementById('profile-name').innerText = user.email;
    document.getElementById('avatar-circle').innerText = user.email[0].toUpperCase();
}

function openProfileMenu() { document.getElementById('drop-menu').classList.toggle('menu-closed'); }
function showModal(id) { document.getElementById(id).classList.remove('hidden'); openProfileMenu(); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

async function deleteUserAccount() {
    if (confirm("¿Confirmas la eliminación total de tu perfil? Esto no se puede deshacer.")) {
        const email = document.getElementById('profile-name').innerText;
        const res = await fetch('/api/auth/delete-account', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        if (res.ok) location.reload();
    }
}

// Cerrar menús al clickear fuera
window.onclick = (e) => {
    if (!e.target.closest('.h-profile')) {
        document.getElementById('drop-menu').classList.add('menu-closed');
    }
};
