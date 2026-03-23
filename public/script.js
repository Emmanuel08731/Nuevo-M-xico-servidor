/**
 * DEVROOT KERNEL v8.0.2
 * MANEJADOR DE INTERFAZ Y COMUNICACIONES
 * EMMANUEL EXCLUSIVE
 */

// 1. GESTOR DE CARGA (SPLASH SCREEN)
window.addEventListener('load', () => {
    let progress = 0;
    const bar = document.getElementById('progress-bar');
    const text = document.getElementById('loading-text');
    const splash = document.getElementById('splash-screen');

    const interval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress > 100) progress = 100;
        bar.style.width = `${progress}%`;

        if (progress < 40) text.innerText = "CARGANDO MODULOS...";
        else if (progress < 80) text.innerText = "ESTABLECIENDO CONEXIÓN...";
        else text.innerText = "SISTEMA LISTO.";

        if (progress === 100) {
            clearInterval(interval);
            setTimeout(() => {
                splash.style.opacity = '0';
                setTimeout(() => splash.style.display = 'none', 800);
            }, 500);
        }
    }, 150);
});

// 2. FONDO NEURONAL (CANVAS)
const canvas = document.getElementById('neural-bg');
const ctx = canvas.getContext('2d');
let nodes = [];

function initCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    nodes = [];
    for (let i = 0; i < 90; i++) {
        nodes.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.45,
            vy: (Math.random() - 0.5) * 0.45,
            r: Math.random() * 2 + 1
        });
    }
}

function updateCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0066ff33';
    ctx.strokeStyle = '#0066ff0a';

    nodes.forEach((n, i) => {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;

        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();

        for (let j = i + 1; j < nodes.length; j++) {
            let n2 = nodes[j];
            let dist = Math.hypot(n.x - n2.x, n.y - n2.y);
            if (dist < 180) {
                ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(n2.x, n2.y); ctx.stroke();
            }
        }
    });
    requestAnimationFrame(updateCanvas);
}

initCanvas(); updateCanvas();
window.onresize = initCanvas;

// 3. NOTIFICACIONES (TOAST)
function showToast(msg) {
    const toast = document.getElementById('toast-notif');
    document.getElementById('toast-content').innerText = msg;
    toast.classList.remove('toast-hidden');
    setTimeout(() => toast.classList.add('toast-hidden'), 4500);
}

// 4. LÓGICA DE REGISTRO / LOGIN
let isRegistering = false;

function switchAuthMode() {
    isRegistering = !isRegistering;
    document.getElementById('auth-title').innerText = isRegistering ? "Crear Cuenta" : "Iniciar Sesión";
    document.getElementById('auth-subtitle').innerText = isRegistering ? "Únete a la infraestructura de Emmanuel." : "Accede a tu cuenta de desarrollador.";
    document.getElementById('action-label').innerText = isRegistering ? "Registrarme Ahora" : "Entrar al Sistema";
    document.getElementById('footer-text').innerText = isRegistering ? "¿Ya eres miembro?" : "¿No tienes una cuenta aún?";
    document.getElementById('footer-btn').innerText = isRegistering ? "Iniciar Sesión" : "Crear Cuenta";
}

function togglePassView() {
    const p = document.getElementById('pass-field');
    const i = document.getElementById('eye-icon');
    p.type = p.type === 'password' ? 'text' : 'password';
    i.classList.toggle('fa-eye-slash');
}

async function processAuth() {
    const email = document.getElementById('email-field').value;
    const password = document.getElementById('pass-field').value;
    const url = isRegistering ? '/api/v1/auth/create' : '/api/v1/auth/access';

    if (!email || !password) return showToast("Error: Campos vacíos.");

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();

        if (response.ok) {
            showToast(data.message);
            if (isRegistering) {
                switchAuthMode(); // Cambia a login tras registrar
            } else {
                launchDashboard(data.profile);
            }
        } else {
            showToast(data.error);
        }
    } catch (e) {
        showToast("Fallo crítico de conexión.");
    }
}

// 5. MANEJO DEL DASHBOARD
function launchDashboard(profile) {
    document.getElementById('view-auth').classList.add('hidden');
    document.getElementById('view-dashboard').classList.remove('hidden');
    document.getElementById('user-display').innerText = profile.email;
    document.getElementById('avatar-init').innerText = profile.email[0].toUpperCase();
}

function toggleUserDrop() { document.getElementById('drop-box').classList.toggle('drop-closed'); }
function openConfig() { document.getElementById('modal-config').classList.remove('hidden'); toggleUserDrop(); }
function closeConfig() { document.getElementById('modal-config').classList.add('hidden'); }

async function confirmAccountDeletion() {
    if (confirm("¿Confirmas la eliminación total?")) {
        const email = document.getElementById('user-display').innerText;
        await fetch('/api/v1/auth/terminate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        location.reload();
    }
}

function triggerScan() {
    showToast("Sincronizando con el servidor central...");
    setTimeout(() => showToast("Base de datos actualizada."), 2000);
}

// Cerrar clics externos
window.onclick = (e) => {
    if (!e.target.closest('.profile-trigger')) {
        document.getElementById('drop-box').classList.add('drop-closed');
    }
};
