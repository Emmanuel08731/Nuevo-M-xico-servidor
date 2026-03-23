/**
 * DEVROOT INTERFACE LOGIC v7.5
 */

// 1. MOTOR DE FONDO (PARTICULAS)
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');
let points = [];

function init() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    points = [];
    for (let i = 0; i < 85; i++) {
        points.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            size: Math.random() * 2 + 1
        });
    }
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0066ff';
    ctx.strokeStyle = '#0066ff0a';

    points.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        for (let j = i + 1; j < points.length; j++) {
            let p2 = points[j];
            let d = Math.hypot(p.x - p2.x, p.y - p2.y);
            if (d < 160) {
                ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
            }
        }
    });
    requestAnimationFrame(render);
}

init(); render();
window.onresize = init;

// 2. ALERTAS (TOAST)
function notify(msg) {
    const toast = document.getElementById('toast');
    document.getElementById('toast-msg').innerText = msg;
    toast.classList.remove('toast-hide');
    setTimeout(() => toast.classList.add('toast-hide'), 4000);
}

// 3. CAMBIO DE MODO (LOGIN / REGISTRO)
let isLogin = true;

function toggleMode() {
    isLogin = !isLogin;
    document.getElementById('form-title').innerText = isLogin ? "Iniciar Sesión" : "Crear Cuenta";
    document.getElementById('form-desc').innerText = isLogin ? "Ingresa tus credenciales para entrar." : "Regístrate para empezar a usar DevRoot.";
    document.getElementById('btn-text').innerText = isLogin ? "Iniciar Sesión" : "Registrar mi Cuenta";
    document.getElementById('switch-text').innerText = isLogin ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?";
    document.getElementById('switch-btn').innerText = isLogin ? "Crear Cuenta" : "Iniciar Sesión";
}

// 4. LÓGICA DE AUTENTICACIÓN (CORREGIDA)
async function handleAuth() {
    const email = document.getElementById('inp-email').value;
    const password = document.getElementById('inp-pass').value;
    
    // Ruta dinámica
    const path = isLogin ? '/api/auth/login' : '/api/auth/register';

    if (!email || !password) return notify("Completa todos los campos.");

    try {
        const res = await fetch(path, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (res.ok) {
            notify(data.message);
            if (isLogin) {
                enterApp(data.user);
            } else {
                // Si registró bien, lo pasamos a login
                toggleMode();
            }
        } else {
            notify(data.error);
        }
    } catch (e) {
        notify("Error de red.");
    }
}

function enterApp(user) {
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    document.getElementById('user-email-display').innerText = user.email;
    document.getElementById('avatar-icon').innerText = user.email[0].toUpperCase();
}

// 5. MENÚS Y MODALES
function toggleMenu() { document.getElementById('user-menu').classList.toggle('menu-hidden'); }
function showModal(id) { document.getElementById(id).classList.remove('hidden'); toggleMenu(); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

async function deleteAccount() {
    if (confirm("¿Estás seguro de eliminar tu cuenta?")) {
        const email = document.getElementById('user-email-display').innerText;
        await fetch('/api/auth/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        location.reload();
    }
}

window.onclick = (e) => {
    if (!e.target.closest('.user-pill')) {
        document.getElementById('user-menu').classList.add('menu-hidden');
    }
};
