/**
 * ==============================================================================
 * DEVROOT NEXUS CONTROL v10.0.4
 * CLIENT-SIDE LOGIC ENGINE
 * DEVELOPER: EMMANUEL
 * ==============================================================================
 */

// 1. SISTEMA DE CARGA (SPLASH)
window.addEventListener('DOMContentLoaded', () => {
    const splash = document.getElementById('app-loader');
    
    // Simulación de carga de módulos del núcleo
    setTimeout(() => {
        splash.style.opacity = '0';
        setTimeout(() => splash.style.display = 'none', 800);
        console.log("Kernel DevRoot: Sincronizado.");
    }, 2500);
});

// 2. MOTOR GRÁFICO DEL FONDO (PARTÍCULAS)
const canvas = document.getElementById('main-canvas');
const ctx = canvas.getContext('2d');
let points = [];

function initPhysics() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    points = [];
    const count = window.innerWidth < 800 ? 40 : 95;
    
    for (let i = 0; i < count; i++) {
        points.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            r: Math.random() * 2 + 1
        });
    }
}

function drawPhysics() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0066ff33';
    ctx.strokeStyle = '#0066ff0a';

    points.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();

        for (let j = i + 1; j < points.length; j++) {
            const p2 = points[j];
            const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
            if (dist < 180) {
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            }
        }
    });
    requestAnimationFrame(drawPhysics);
}

initPhysics();
drawPhysics();
window.onresize = initPhysics;

// 3. SISTEMA DE NOTIFICACIONES (TOAST)
function showNotify(msg, type = "success") {
    const toast = document.getElementById('toast-notif');
    const content = document.getElementById('toast-message');
    const icon = document.getElementById('toast-icon');

    content.innerText = msg;
    icon.className = type === "success" ? "fa-solid fa-circle-check" : "fa-solid fa-triangle-exclamation";
    
    toast.classList.remove('toast-hidden');
    setTimeout(() => toast.classList.add('toast-hidden'), 4500);
}

// 4. GESTIÓN DE AUTENTICACIÓN
let isLoginMode = true;

function switchMode() {
    isLoginMode = !isLoginMode;
    const title = document.getElementById('ui-title');
    const desc = document.getElementById('ui-desc');
    const btn = document.getElementById('btn-label');
    const switchTxt = document.getElementById('toggle-text');
    const switchBtn = document.getElementById('toggle-btn');

    title.innerText = isLoginMode ? "Iniciar Sesión" : "Crear Cuenta";
    desc.innerText = isLoginMode ? "Panel de acceso para desarrolladores." : "Únete a la infraestructura de Emmanuel.";
    btn.innerText = isLoginMode ? "ACCEDER" : "REGISTRARSE";
    switchTxt.innerText = isLoginMode ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?";
    switchBtn.innerText = isLoginMode ? "Registrarse" : "Iniciar Sesión";
    
    console.log(`Modo cambiado a: ${isLoginMode ? 'LOGIN' : 'SIGNUP'}`);
}

function togglePass() {
    const input = document.getElementById('pass');
    const icon = document.getElementById('eye-icon');
    input.type = input.type === 'password' ? 'text' : 'password';
    icon.classList.toggle('fa-eye-slash');
}

/**
 * ACCIÓN PRINCIPAL DE ENVÍO
 */
async function handleAuthAction() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('pass').value;
    const btn = document.getElementById('btn-submit');
    const loader = btn.querySelector('.btn-loader');

    if (!email || !password) {
        return showNotify("Por favor, rellena todos los campos.", "error");
    }

    // Activamos UI de carga
    btn.disabled = true;
    loader.classList.remove('hidden');

    const endpoint = isLoginMode ? '/api/auth/signin' : '/api/auth/signup';

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            showNotify(data.message);
            if (isLoginMode) {
                initApp(data.user);
            } else {
                switchMode(); // Cambia a login tras registro exitoso
            }
        } else {
            showNotify(data.message, "error");
        }
    } catch (err) {
        showNotify("Error de comunicación con el núcleo.", "error");
    } finally {
        btn.disabled = false;
        loader.classList.add('hidden');
    }
}

// 5. INICIALIZACIÓN DEL DASHBOARD
function initApp(user) {
    document.getElementById('view-auth').classList.add('hidden');
    document.getElementById('view-app').classList.remove('hidden');
    
    // Actualizamos UI con datos del usuario
    document.getElementById('user-name').innerText = user.username || user.email;
    document.getElementById('user-initial').innerText = (user.username || user.email)[0].toUpperCase();
    
    // Guardamos sesión en LocalStorage
    localStorage.setItem('dr_session', JSON.stringify(user));
    console.log(`Sesión iniciada: ${user.uid}`);
}

// 6. MENÚS Y MODALES
function toggleUserMenu() {
    document.getElementById('user-menu').classList.toggle('menu-hidden');
}

function showModal(id) {
    document.getElementById(`modal-${id}`).classList.remove('hidden');
}

function closeModal(id) {
    document.getElementById(`modal-${id}`).classList.add('hidden');
}

/**
 * ACCIÓN DE DESTRUCCIÓN
 */
async function destroyAccount() {
    const session = JSON.parse(localStorage.getItem('dr_session'));
    if (!session) return;

    const confirmDestroy = confirm("¿Estás absolutamente seguro de destruir este nodo?");
    if (!confirmDestroy) return;

    try {
        const response = await fetch('/api/auth/destroy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: session.email })
        });

        if (response.ok) {
            localStorage.clear();
            location.reload();
        }
    } catch (e) {
        showNotify("Error al destruir la instancia.", "error");
    }
}

// Cierre automático de menús al clickear fuera
window.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-user')) {
        document.getElementById('user-menu').classList.add('menu-hidden');
    }
});
