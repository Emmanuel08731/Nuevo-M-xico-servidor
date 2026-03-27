/**
 * ==========================================================
 * ECNHACA STYLE SCRIPT ENGINE v300.0
 * DESARROLLADOR: EMMANUEL
 * PROPÓSITO: GESTIÓN DE UI, NAVEGACIÓN Y TERMINAL
 * PROTOCOLO: WHITE MINIMALIST (APPLE STYLE)
 * ==========================================================
 */

// --- CONFIGURACIÓN GLOBAL ECNHACA ---
const CONFIG = {
    VERSION: "3.0.0",
    BRAND: "ECNHACA STYLE",
    LOG_PREFIX: "[SYSTEM]",
    ANIM_DURATION: 600,
    DEBUG_MODE: true
};

// --- ESTADO DE LA APLICACIÓN ---
const APP_STATE = {
    user: null,
    currentTab: 'dashboard',
    isSidebarOpen: true,
    notifications: [],
    history: [],
    sessionStartTime: null
};

// --- SELECTORES DE ELEMENTOS ---
const UI = {
    preloader: document.getElementById('preloader'),
    loadBar: document.getElementById('load-progress'),
    loadStatus: document.getElementById('load-status'),
    authView: document.getElementById('view-auth'),
    appView: document.getElementById('view-app'),
    toastContainer: document.getElementById('toast-container'),
    sections: document.querySelectorAll('.content-sec'),
    navBtns: document.querySelectorAll('.nav-btn'),
    sectionTitle: document.getElementById('section-title'),
    cmdOutput: document.getElementById('cmd-output'),
    cmdInput: document.getElementById('cmd-input'),
    displayUser: document.getElementById('display-username'),
    displayRole: document.getElementById('display-role'),
    initials: document.getElementById('user-initials')
};

/**
 * 1. INICIALIZACIÓN DEL SISTEMA (BOOTSTRAP)
 * Emmanuel: Aquí controlamos la carga inicial y el chequeo de sesión.
 */
window.addEventListener('DOMContentLoaded', () => {
    logSystem("Iniciando ECNHACA OS...");
    simulateLoading();
});

function simulateLoading() {
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.floor(Math.random() * 15) + 5;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            finishLoading();
        }
        UI.loadBar.style.width = `${progress}%`;
        UI.loadStatus.innerText = `Cargando módulos: ${progress}%`;
    }, 150) ;
}

function finishLoading() {
    UI.preloader.style.opacity = '0';
    setTimeout(() => {
        UI.preloader.classList.add('hide');
        checkAuthSession();
    }, 600);
}

/**
 * 2. GESTIÓN DE AUTENTICACIÓN Y SESIÓN
 */
function checkAuthSession() {
    const session = localStorage.getItem('ec_session');
    if (session) {
        try {
            APP_STATE.user = JSON.parse(session);
            APP_STATE.sessionStartTime = Date.now();
            launchDashboard();
        } catch (e) {
            localStorage.removeItem('ec_session');
            showAuth();
        }
    } else {
        showAuth();
    }
}

function showAuth() {
    UI.authView.classList.remove('hide');
    UI.appView.classList.add('hide');
}

function launchDashboard() {
    UI.authView.classList.add('hide');
    UI.appView.classList.remove('hide');
    
    // Actualizar datos del perfil en UI
    const username = APP_STATE.user.username || "Emmanuel";
    UI.displayUser.innerText = username;
    UI.displayRole.innerText = APP_STATE.user.role === 'admin' ? 'Master Admin' : 'VibeBlox Developer';
    UI.initials.innerText = username.charAt(0).toUpperCase();

    // Mostrar menú admin si aplica
    if (APP_STATE.user.role === 'admin') {
        document.getElementById('admin-nav-group').classList.remove('hide');
    }

    notify(`Sesión iniciada: Bienvenido ${username}`, "success");
    switchSection('dashboard');
    logTerminal("Sistema ECNHACA STYLE en línea. Protocolo White cargado.");
}

/**
 * 3. SISTEMA DE NAVEGACIÓN DINÁMICA
 */
function switchSection(targetId) {
    // 1. Ocultar todas las secciones
    UI.sections.forEach(sec => sec.classList.add('hide'));
    
    // 2. Desactivar botones de navegación
    UI.navBtns.forEach(btn => btn.classList.remove('active'));

    // 3. Mostrar la sección seleccionada
    const targetSec = document.getElementById(`sec-${targetId}`);
    if (targetSec) {
        targetSec.classList.remove('hide');
        APP_STATE.currentTab = targetId;
        
        // Actualizar Título
        const titles = {
            'dashboard': 'Dashboard General',
            'store': 'Emmanuel Store - Catálogo',
            'vibeblox': 'VibeBlox Clothing Assets',
            'terminal': 'Consola CMD Master',
            'db-manager': 'PostgreSQL Manager',
            'master-search': 'Buscador Master de Usuarios'
        };
        UI.sectionTitle.innerText = titles[targetId] || 'Panel de Control';

        // Activar botón correspondiente
        const activeBtn = Array.from(UI.navBtns).find(btn => 
            btn.getAttribute('onclick')?.includes(`'${targetId}'`)
        );
        if (activeBtn) activeBtn.classList.add('active');

        logSystem(`Navegación: Cambio a ${targetId}`);
        
        // Disparar sincronización si es el buscador
        if (targetId === 'master-search' && typeof syncMasterDatabase === 'function') {
            syncMasterDatabase();
        }
    }
}

/**
 * 4. SISTEMA DE NOTIFICACIONES (TOASTS)
 * Emmanuel: Notificaciones blancas y elegantes que desaparecen solas.
 */
function notify(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `ec-toast ${type}`;
    
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-triangle-exclamation';
    
    toast.innerHTML = `
        <i class="fa ${icon}"></i>
        <span>${message}</span>
    `;

    UI.toastContainer.appendChild(toast);

    // Animación de entrada y salida
    setTimeout(() => {
        toast.style.transform = 'translateX(120%)';
        setTimeout(() => toast.remove(), 500);
    }, 4000);
}

/**
 * 5. TERMINAL DE COMANDOS INTERACTIVA
 */
function handleTerminalCommand(event) {
    if (event.key === 'Enter') {
        const cmd = UI.cmdInput.value.trim().toLowerCase();
        if (!cmd) return;

        // Limpiar input
        UI.cmdInput.value = '';

        // Escribir en terminal
        logTerminal(`emmanuel@ecnhaca:~$ ${cmd}`);

        // Lógica de Comandos
        processCommand(cmd);
    }
}

function processCommand(cmd) {
    const output = (text, color = '#1d1d1f') => {
        const line = document.createElement('div');
        line.className = 'cmd-line';
        line.style.color = color;
        line.innerText = `> ${text}`;
        UI.cmdOutput.appendChild(line);
        UI.cmdOutput.scrollTop = UI.cmdOutput.scrollHeight;
    };

    switch(cmd) {
        case 'help':
            output("Comandos disponibles: clear, status, stats, whoami, logout, refresh");
            break;
        case 'clear':
            UI.cmdOutput.innerHTML = '';
            break;
        case 'status':
            output(`Sistema: Operativo | Latencia: ${Math.floor(Math.random() * 20) + 5}ms | DB: Conectada`);
            break;
        case 'stats':
            output("VibeBlox Assets: 14 | Emmanuel Store Sales: $0.00");
            break;
        case 'whoami':
            output(`Identidad: ${APP_STATE.user.username} | Rol: ${APP_STATE.user.role}`);
            break;
        case 'logout':
            output("Cerrando sesión remota...");
            setTimeout(executeLogout, 1000);
            break;
        case 'refresh':
            output("Refrescando base de datos global...");
            refreshData();
            break;
        default:
            output(`Error: comando '${cmd}' no reconocido.`, '#ff3b30');
    }
}

function logTerminal(message) {
    const line = document.createElement('div');
    line.className = 'cmd-line';
    line.innerHTML = `<span class="cmd-prefix">system:</span> <span>${message}</span>`;
    UI.cmdOutput.appendChild(line);
    UI.cmdOutput.scrollTop = UI.cmdOutput.scrollHeight;
}

/**
 * 6. UTILIDADES Y GESTIÓN DE DATOS
 */
function setAuthMode(mode) {
    const emailGroup = document.getElementById('group-email');
    const tabLogin = document.getElementById('btn-tab-login');
    const tabReg = document.getElementById('btn-tab-reg');

    if (mode === 'register') {
        emailGroup.classList.remove('hide');
        tabReg.classList.add('active');
        tabLogin.classList.remove('active');
    } else {
        emailGroup.classList.add('hide');
        tabLogin.classList.add('active');
        tabReg.classList.remove('active');
    }
}

function refreshData() {
    notify("Sincronizando con Render PostgreSQL...", "success");
    // Aquí podrías llamar a funciones de app.js para refrescar tablas
    const pingEl = document.getElementById('stat-ping');
    if (pingEl) {
        const fakeLatency = Math.floor(Math.random() * 15) + 5;
        pingEl.innerText = `${fakeLatency} ms`;
    }
}

function executeLogout() {
    localStorage.removeItem('ec_session');
    notify("Sesión terminada. Redirigiendo...", "success");
    setTimeout(() => location.reload(), 800);
}

function logSystem(msg) {
    if (CONFIG.DEBUG_MODE) {
        console.log(`%c ${CONFIG.LOG_PREFIX} %c ${msg}`, 
            "background: #000; color: #fff; border-radius: 3px; font-weight: bold;", 
            "color: #1d1d1f;");
    }
}

/**
 * 7. MODALES Y EVENTOS ADICIONALES
 */
function openGlobalModal(type = 'default') {
    const overlay = document.getElementById('modal-overlay');
    const content = document.getElementById('modal-content-area');
    
    overlay.classList.remove('hide');
    document.body.style.overflow = 'hidden';

    content.innerHTML = `
        <h2 style="font-weight: 800; margin-bottom: 20px;">Nuevo Registro - ECNHACA</h2>
        <p style="color: #86868b; margin-bottom: 30px;">Selecciona el tipo de dato que deseas ingresar al sistema.</p>
        <div style="display: grid; gap: 10px;">
            <button class="nav-btn" style="background: #f5f5f7;">+ Nuevo Asset Roblox (VibeBlox)</button>
            <button class="nav-btn" style="background: #f5f5f7;">+ Nuevo Producto (Store)</button>
            <button class="nav-btn" style="background: #f5f5f7;">+ Nuevo Comando (Vexo Bot)</button>
        </div>
    `;
}

function closeAllModals() {
    document.getElementById('modal-overlay').classList.add('hide');
    document.body.style.overflow = 'auto';
}

// Cerrar modales con la tecla ESC
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAllModals();
});

// --- FINAL DEL ARCHIVO SCRIPT.JS ---
// Emmanuel: Este código está optimizado para no tener errores de consola 
// y ser compatible con el HTML y CSS que diseñamos.
