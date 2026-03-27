/**
 * ==========================================================
 * ECNHACA SCRIPT MASTER v150
 * ARCHITECTURE: SINGLE PAGE APPLICATION (SPA)
 * DEVELOPER: EMMANUEL
 * ==========================================================
 */

const APP_STATE = {
    currentUser: null,
    activeView: 'dashboard',
    isLocked: false,
    logs: [],
    stats: { users: 0, bots: 12, sales: 0 }
};

// --- DOM CACHE ---
const DOM = {
    loader: document.getElementById('master-loader'),
    auth: document.getElementById('view-auth'),
    app: document.getElementById('view-app'),
    navItems: document.querySelectorAll('.nav-item'),
    sections: document.querySelectorAll('.content-sec'),
    terminalBody: document.getElementById('terminal-body'),
    toastContainer: document.getElementById('toast-box')
};

// --- INICIALIZACIÓN CRÍTICA ---
document.addEventListener('DOMContentLoaded', async () => {
    logSystem("Iniciando secuencia de arranque...");
    await simulateSystemLoad();
    checkAuthSession();
});

async function simulateSystemLoad() {
    return new Promise(resolve => {
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress >= 100) {
                clearInterval(interval);
                DOM.loader.style.opacity = '0';
                setTimeout(() => {
                    DOM.loader.classList.add('hide');
                    resolve();
                }, 500);
            }
        }, 100);
    });
}

// --- GESTOR DE SESIÓN ---
function checkAuthSession() {
    const saved = localStorage.getItem('ec_session');
    if (saved) {
        APP_STATE.currentUser = JSON.parse(saved);
        logSystem(`Sesión recuperada: ${APP_STATE.currentUser.username}`);
        launchInterface();
    } else {
        logSystem("No hay sesión activa. Mostrando Login.");
        DOM.auth.classList.remove('hide');
    }
}

function launchInterface() {
    DOM.auth.classList.add('hide');
    DOM.app.classList.remove('hide');
    
    // Configurar Perfil
    document.getElementById('display-name').innerText = APP_STATE.currentUser.username;
    if (APP_STATE.currentUser.role === 'admin') {
        document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('hide'));
    }
    
    switchView('dashboard');
    showNotification(`Bienvenido de nuevo, ${APP_STATE.currentUser.username}`);
}

// --- NAVEGACIÓN SPA ---
function switchView(viewId) {
    logSystem(`Cambiando vista a: ${viewId}`);
    
    // Actualizar UI de Navegación
    DOM.navItems.forEach(item => {
        item.classList.remove('active');
        if (item.dataset.target === viewId) item.classList.add('active');
    });

    // Cambiar Secciones
    DOM.sections.forEach(sec => {
        sec.classList.add('hide');
        if (sec.id === `sec-${viewId}`) sec.classList.remove('hide');
    });

    APP_STATE.activeView = viewId;
    
    // Cargas de datos dinámicas
    if (viewId === 'admin') syncDatabase();
    if (viewId === 'stats') calculateSchoolStats();
}

// --- SISTEMA DE NOTIFICACIONES ---
function showNotification(msg, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fa fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${msg}</span>
    `;
    
    DOM.toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(50px)';
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}

// --- LOGS DE SISTEMA (TERMINAL) ---
function logSystem(msg) {
    const time = new Date().toLocaleTimeString();
    const logEntry = `[${time}] ${msg}`;
    APP_STATE.logs.push(logEntry);
    
    if (DOM.terminalBody) {
        const line = document.createElement('div');
        line.innerHTML = `<span class="terminal-prompt">></span> ${logEntry}`;
        DOM.terminalBody.appendChild(line);
        DOM.terminalBody.scrollTop = DOM.terminalBody.scrollHeight;
    }
    console.log(`%c ECNHACA: ${msg}`, 'color: #00f2ff');
}

// --- SISTEMA DE TAREAS MATEMÁTICAS (MEDIA, MEDIANA, MODA) ---
function calculateSchoolStats() {
    logSystem("Calculando estadísticas de rendimiento escolar...");
    const scores = [85, 90, 78, 92, 88, 85, 95]; // Ejemplo de notas de Emmanuel
    
    // Media
    const sum = scores.reduce((a, b) => a + b, 0);
    const mean = (sum / scores.length).toFixed(2);
    
    // Mediana
    const sorted = [...scores].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

    document.getElementById('stat-mean').innerText = mean;
    document.getElementById('stat-median').innerText = median;
    logSystem(`Estadísticas listas: Media ${mean}, Mediana ${median}`);
}

// --- CIERRE DE SESIÓN ---
function performLogout() {
    logSystem("Cerrando sesión del usuario...");
    localStorage.removeItem('ec_session');
    location.reload();
}

// [MÁS FUNCIONES DE VALIDACIÓN DE FORMULARIOS Y MANEJO DE EVENTOS DE TECLADO]
