/**
 * ==========================================================
 * ECNHACA SCRIPT ENGINE v130
 * MASTER CONTROLLER: EMMANUEL
 * ==========================================================
 */

const ECNHACA = {
    state: {
        user: null,
        activeSec: 'dashboard',
        isLoading: true
    },
    
    elements: {
        loader: document.getElementById('boot-loader'),
        auth: document.getElementById('auth-view'),
        app: document.getElementById('app-view'),
        sections: document.querySelectorAll('.sec-content')
    }
};

// --- ARRANQUE DEL SISTEMA ---
window.addEventListener('DOMContentLoaded', async () => {
    console.log("%c [SYSTEM] ECNHACA OS v130 INICIANDO...", "color: #00f2ff; font-weight: bold;");
    await simulateBootProcess();
    initializeSession();
});

async function simulateBootProcess() {
    const statusText = document.getElementById('boot-status');
    const logs = ["Iniciando Núcleo...", "Conectando a Render PostgreSQL...", "CargandoEmmanuelStore.dll", "Verificando Vexo Bot..."];
    
    for (let log of logs) {
        if (statusText) statusText.innerText = log;
        await sleep(400);
    }
    
    if (ECNHACA.elements.loader) {
        ECNHACA.elements.loader.style.opacity = '0';
        setTimeout(() => ECNHACA.elements.loader.classList.add('hide'), 800);
    }
}

// --- GESTIÓN DE NAVEGACIÓN SPA ---
function navigate(target) {
    ECNHACA.state.activeSec = target;
    
    // Ocultar todas las secciones
    document.querySelectorAll('.sec').forEach(s => s.classList.add('hide'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    
    // Mostrar objetivo
    const targetEl = document.getElementById(`sec-${target}`);
    if (targetEl) targetEl.classList.remove('hide');
    
    // Activar link en sidebar
    const link = document.querySelector(`[onclick="navigate('${target}')"]`);
    if (link) link.classList.add('active');

    // Cargas de datos específicas
    if (target === 'admin') fetchAdminUsers();
    if (target === 'feed') fetchGlobalFeed();
}

// --- SISTEMA DE NOTIFICACIONES (TOAST) ---
function notify(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type} animate-slide-in`;
    
    const icon = type === 'success' ? 'check-circle' : 'exclamation-triangle';
    
    toast.innerHTML = `
        <i class="fa fa-${icon}"></i>
        <div class="toast-content">
            <small>${type.toUpperCase()}</small>
            <p>${message}</p>
        </div>
    `;
    
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.transform = 'translateX(120%)';
        setTimeout(() => toast.remove(), 500);
    }, 4000);
}

// --- UTILIDADES GLOBALES ---
function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

function formatID(id) { return `#${id.toString().padStart(4, '0')}`; }

function logout() {
    localStorage.removeItem('ec_session');
    notify("Sesión cerrada. Redireccionando...", "warning");
    setTimeout(() => location.reload(), 1000);
}

// [CONTINÚAN 350 LÍNEAS DE: VALIDACIÓN DE FORMULARIOS, MANEJO DE MODALES DE PAGO,
// ACTUALIZACIÓN DE PERFIL, FILTROS DE CATEGORÍA Y LOGS DE CONSOLA PERSONALIZADOS]
