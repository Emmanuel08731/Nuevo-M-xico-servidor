/**
 * DEVROOT INTERFACE CONTROL v6.0.4
 */

// --- 1. MOTOR DE PARTÍCULAS VECTORIAL ---
const canvas = document.getElementById('canvas-particles');
const ctx = canvas.getContext('2d');
let particlesArray = [];

class Particle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = Math.random() * 0.5 - 0.25;
        this.speedY = Math.random() * 0.5 - 0.25;
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.x > canvas.width) this.x = 0;
        if (this.x < 0) this.x = canvas.width;
        if (this.y > canvas.height) this.y = 0;
        if (this.y < 0) this.y = canvas.height;
    }
    draw() {
        ctx.fillStyle = '#0066ff33';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function handleParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
        particlesArray[i].draw();
    }
    requestAnimationFrame(handleParticles);
}

function initCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    particlesArray = [];
    for (let i = 0; i < 60; i++) particlesArray.push(new Particle());
}

window.addEventListener('resize', initCanvas);
initCanvas();
handleParticles();

// --- 2. SISTEMA DE NOTIFICACIONES (TOAST) ---
function showToast(msg, type = "info") {
    const toast = document.getElementById('toast-element');
    const label = document.getElementById('toast-message');
    label.innerText = msg;
    toast.classList.remove('toast-hidden');
    setTimeout(() => toast.classList.add('toast-hidden'), 4000);
}

// --- 3. GESTIÓN DE AUTENTICACIÓN ---
let isLoggingIn = true;
let activeNodeUser = null;

function toggleAuthMode() {
    isLoggingIn = !isLoggingIn;
    const title = document.getElementById('auth-title');
    const btn = document.getElementById('auth-btn');
    const link = document.getElementById('mode-trigger');

    title.innerText = isLoggingIn ? "Iniciar Sesión" : "Registrar Nodo";
    btn.innerHTML = isLoggingIn ? "<span>Conectar al Sistema</span>" : "<span>Inicializar Acceso</span>";
    link.innerText = isLoggingIn ? "Registrar Nuevo Acceso" : "Volver al Login";
}

async function runAuthentication() {
    const email = document.getElementById('user-email').value;
    const pass = document.getElementById('user-pass').value;
    const url = isLoggingIn ? '/api/auth/login' : '/api/auth/register';

    if (!email || !pass) return showToast("Por favor, rellene todos los campos.");

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: pass })
        });

        const data = await response.json();

        if (response.ok) {
            if (isLoggingIn) {
                activeNodeUser = data.user;
                transitionToDashboard();
            } else {
                showToast("Nodo registrado correctamente. Inicie sesión.");
                toggleAuthMode();
            }
        } else {
            showToast(data.error);
        }
    } catch (err) {
        showToast("Error crítico en la red de DevRoot.");
    }
}

function transitionToDashboard() {
    document.getElementById('auth-container').classList.add('hidden-view');
    document.getElementById('dashboard-app').classList.remove('hidden-view');
    document.getElementById('display-email').innerText = activeNodeUser.email;
    document.getElementById('user-initial').innerText = activeNodeUser.email[0].toUpperCase();
    showToast("Conexión segura establecida.");
}

// --- 4. CONTROL DE INTERFAZ DASHBOARD ---
function toggleDropdown() { document.getElementById('dropdown-menu').classList.toggle('dropdown-hidden'); }
function openConfigModal() { document.getElementById('modal-settings').classList.remove('hidden-view'); toggleDropdown(); }
function closeConfigModal() { document.getElementById('modal-settings').classList.add('hidden-view'); }

async function initiateNodeDestruction() {
    if (confirm("¿Confirmar destrucción permanente del nodo de acceso?")) {
        await fetch('/api/auth/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: activeNodeUser.email })
        });
        location.reload();
    }
}

// Cerrar dropdown al clickear fuera
window.onclick = (e) => {
    if (!e.target.closest('.user-control-pill')) {
        document.getElementById('dropdown-menu').classList.add('dropdown-hidden');
    }
}
