/**
 * GLOBAL CORE INTERFACE ENGINE
 * V20.0.1 - INDUSTRIAL GRADE
 */

"use strict";

const STATE = {
    user: null,
    authMode: 'login',
    searchTimer: null,
    activeProfile: null
};

// 1. BOOT SEQUENCE
window.addEventListener('DOMContentLoaded', () => {
    console.log("[CORE] System Boot Sequence Started...");
    
    const fill = document.getElementById('track-fill');
    const status = document.getElementById('track-status');
    const steps = [
        { p: 15, t: "Initializing SSL Handshake..." },
        { p: 40, t: "Mapping Database Relays..." },
        { p: 75, t: "Syncing User Matrix..." },
        { p: 100, t: "Ready for Input." }
    ];

    steps.forEach((step, idx) => {
        setTimeout(() => {
            fill.style.width = `${step.p}%`;
            status.innerText = step.t;
            if(step.p === 100) endBoot();
        }, (idx + 1) * 450);
    });
});

function endBoot() {
    const overlay = document.getElementById('boot-sequencer');
    overlay.style.opacity = '0';
    setTimeout(() => overlay.remove(), 600);
}

// 2. AUTHENTICATION LOGIC
function swapAuthMode() {
    STATE.authMode = STATE.authMode === 'login' ? 'signup' : 'login';
    
    const ui = {
        header: document.getElementById('auth-header'),
        sub: document.querySelector('.auth-sub'),
        btn: document.getElementById('auth-trigger'),
        footText: document.getElementById('foot-text'),
        footBtn: document.getElementById('foot-btn'),
        userWrap: document.getElementById('wrap-user'),
        lblMain: document.getElementById('lbl-main')
    };

    if(STATE.authMode === 'signup') {
        ui.header.innerText = "Crear Cuenta";
        ui.sub.innerText = "Únete a la infraestructura global de Global Core.";
        ui.btn.innerHTML = "<span>REGISTRARSE</span>";
        ui.footText.innerText = "¿Ya eres miembro?";
        ui.footBtn.innerText = "Inicia sesión";
        ui.userWrap.classList.remove('hidden');
        ui.lblMain.innerText = "Correo Electrónico";
    } else {
        ui.header.innerText = "Iniciar Sesión";
        ui.sub.innerText = "Ingresa tus datos para acceder al panel central.";
        ui.btn.innerHTML = "<span>ACCEDER AL CORE</span>";
        ui.footText.innerText = "¿No tienes cuenta?";
        ui.footBtn.innerText = "Crear una ahora";
        ui.userWrap.classList.add('hidden');
        ui.lblMain.innerText = "Correo o Usuario";
    }
}

async function runAuth() {
    const credential = document.getElementById('auth-credential').value.trim();
    const secret = document.getElementById('auth-secret').value;
    const username = document.getElementById('reg-username').value.trim();
    const btn = document.getElementById('auth-trigger');

    if(!credential || !secret || (STATE.authMode === 'signup' && !username)) {
        return pushAlert("Por favor, rellena todos los campos de identidad.");
    }

    btn.disabled = true;
    
    const endpoint = STATE.authMode === 'login' ? '/api/v1/identity/login' : '/api/v1/identity/register';
    const payload = STATE.authMode === 'login' 
        ? { credential, secret } 
        : { username, email: credential, password: secret };

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if(!response.ok) throw new Error(result.error);

        if(STATE.authMode === 'signup') {
            pushAlert("Cuenta creada con éxito. Ya puedes entrar.");
            swapAuthMode();
        } else {
            STATE.user = result.data;
            enterDashboard();
        }

    } catch(err) {
        pushAlert(err.message);
    } finally {
        btn.disabled = false;
    }
}

// 3. DASHBOARD OPERATIONS
function enterDashboard() {
    document.getElementById('auth-layer').classList.add('hidden');
    document.getElementById('core-dashboard').classList.remove('dashboard-hidden');
    
    // UI Update
    document.getElementById('top-name').innerText = STATE.user.name;
    document.getElementById('top-role').innerText = STATE.user.role;
    const av = document.getElementById('top-avatar');
    av.innerText = STATE.user.name[0].toUpperCase();
    av.style.background = STATE.user.color;
}

async function processGlobalSearch(q) {
    const dropdown = document.getElementById('results-dropdown');
    const list = document.getElementById('results-list');

    if(q.length < 2) {
        dropdown.classList.add('drop-hidden');
        return;
    }

    clearTimeout(STATE.searchTimer);
    STATE.searchTimer = setTimeout(async () => {
        try {
            const res = await fetch(`/api/v1/directory/search?q=${encodeURIComponent(q)}`);
            const data = await res.json();

            list.innerHTML = "";
            dropdown.classList.remove('drop-hidden');

            if(data.items.length === 0) {
                list.innerHTML = '<div class="no-results">No se hallaron coincidencias.</div>';
                return;
            }

            data.items.forEach(user => {
                const item = document.createElement('div');
                item.className = 'result-item';
                item.innerHTML = `
                    <div class="r-av" style="background:${user.hex_theme}">${user.handle[0].toUpperCase()}</div>
                    <div class="r-info">
                        <strong>${user.handle}</strong>
                        <small>${user.badge_type}</small>
                    </div>
                `;
                item.onclick = () => openProfile(user);
                list.appendChild(item);
            });
        } catch(e) { console.error("Search Error"); }
    }, 400);
}

// 4. PROFILE MODAL CONTROLS
function openProfile(u) {
    const modal = document.getElementById('modal-profile');
    modal.classList.remove('modal-hidden');

    document.getElementById('p-name').innerText = u.handle || u.name;
    document.getElementById('p-role').innerText = u.badge_type || u.role;
    document.getElementById('p-bio').innerText = u.bio_content || u.bio || "Sin descripción.";
    
    const av = document.getElementById('p-avatar');
    av.innerText = (u.handle || u.name)[0].toUpperCase();
    av.style.background = u.hex_theme || u.color;

    document.getElementById('m-followers').innerText = u.stats?.followers || 0;
    document.getElementById('m-following').innerText = u.stats?.following || 0;

    STATE.activeProfile = u;
}

function closeProfile() {
    document.getElementById('modal-profile').classList.add('modal-hidden');
}

// 5. UTILITIES
function pushAlert(msg) {
    const bridge = document.getElementById('alert-bridge');
    const toast = document.createElement('div');
    toast.className = 'core-toast';
    toast.innerText = msg;
    bridge.appendChild(toast);
    
    setTimeout(() => toast.classList.add('toast-show'), 100);
    setTimeout(() => {
        toast.classList.remove('toast-show');
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}

function togglePass() {
    const input = document.getElementById('auth-secret');
    const icon = document.getElementById('eye-icon');
    if(input.type === 'password') {
        input.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
}

function toggleUserDropdown() {
    document.getElementById('user-menu').classList.toggle('menu-hidden');
}

// Global click closer
window.onclick = (e) => {
    if(!e.target.closest('.user-pill')) {
        document.getElementById('user-menu').classList.add('menu-hidden');
    }
    if(!e.target.closest('.search-box')) {
        document.getElementById('results-dropdown').classList.add('drop-hidden');
    }
};
