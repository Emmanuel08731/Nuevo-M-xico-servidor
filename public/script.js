/**
 * ECNHACA SCRIPT ENGINE V200
 * FRONTEND MASTER: EMMANUEL
 */

const UI = {
    preloader: document.getElementById('preloader'),
    authView: document.getElementById('auth-view'),
    appView: document.getElementById('app-view'),
    toastContainer: document.getElementById('toast-container'),
    navLinks: document.querySelectorAll('.nav-link'),
    sections: document.querySelectorAll('.tab-sec')
};

const STATE = {
    user: null,
    activeTab: 'dashboard',
    lastSync: null,
    logs: []
};

// --- INICIALIZACIÓN ---
window.addEventListener('DOMContentLoaded', () => {
    initApp();
    updateDateTime();
});

async function initApp() {
    console.log("%c [SYSTEM] Iniciando Interfaz White...", "color: #000; font-weight: bold;");
    
    // Simular carga profesional
    setTimeout(() => {
        UI.preloader.style.opacity = '0';
        setTimeout(() => UI.preloader.classList.add('hide'), 500);
        checkSession();
    }, 1500);
}

function checkSession() {
    const saved = localStorage.getItem('ec_session');
    if (saved) {
        STATE.user = JSON.parse(saved);
        launchApp();
    } else {
        UI.authView.classList.remove('hide');
    }
}

function launchApp() {
    UI.authView.classList.add('hide');
    UI.appView.classList.remove('hide');
    
    document.getElementById('u-display-name').innerText = STATE.user.username;
    document.getElementById('u-display-role').innerText = STATE.user.role === 'admin' ? 'Master Developer' : 'Usuario';
    document.getElementById('welcome-name').innerText = STATE.user.username;

    if (STATE.user.role === 'admin') {
        document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('hide'));
    }
    
    showTab('dashboard');
    notify("Bienvenido a Emmanuel Store", "success");
}

// --- NAVEGACIÓN ---
function showTab(tabId) {
    UI.sections.forEach(sec => sec.classList.add('hide'));
    UI.navLinks.forEach(link => link.classList.remove('active'));

    const target = document.getElementById(`tab-${tabId}`);
    if (target) {
        target.classList.remove('hide');
        STATE.activeTab = tabId;
        logEvent(`Navegación a: ${tabId}`);
    }

    const activeBtn = document.querySelector(`[onclick="showTab('${tabId}')"]`);
    if (activeBtn) activeBtn.classList.add('active');

    if (tabId === 'admin') syncUsers();
}

// --- UTILIDADES ---
function notify(msg, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${msg}</span>`;
    UI.toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 500);
    }, 4000);
}

function logEvent(msg) {
    const log = `[${new Date().toLocaleTimeString()}] ${msg}`;
    STATE.logs.push(log);
    // Si la terminal está activa, inyectar allí
}

function updateDateTime() {
    const el = document.getElementById('current-date');
    if (el) el.innerText = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function logout() {
    localStorage.removeItem('ec_session');
    location.reload();
}

// [MÁS LÓGICA DE CONTROL DE MODALES Y ANIMACIONES DE INTERFAZ]
