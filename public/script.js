/**
 * DEVROOT MASTER CONTROLLER
 * V22.0.1 - INDUSTRIAL LOGIC
 */

// 1. CARGA DEL ENTORNO
window.addEventListener('load', () => {
    const bar = document.querySelector('.loader-bar span');
    bar.style.width = '100%';
    
    setTimeout(() => {
        document.getElementById('loading-screen').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('loading-screen').style.display = 'none';
        }, 800);
    }, 1200);
});

// 2. SISTEMA DE TOASTS
function notify(msg, type = "success") {
    const wrapper = document.getElementById('toast-wrapper');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fa-solid ${type === 'success' ? 'fa-check-circle' : 'fa-circle-exclamation'}"></i>
        <span>${msg}</span>
    `;
    wrapper.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}

// 3. CONTROL DE AUTENTICACIÓN
let isLoginMode = true;

function switchAuth() {
    isLoginMode = !isLoginMode;
    const ui = {
        title: document.getElementById('auth-title'),
        sub: document.getElementById('auth-subtitle'),
        label: document.getElementById('btn-label'),
        hint: document.getElementById('footer-hint'),
        btn: document.getElementById('footer-btn'),
        userWrap: document.getElementById('wrap-user'),
        idLabel: document.getElementById('lbl-id')
    };

    if (isLoginMode) {
        ui.title.innerText = "Iniciar Sesión";
        ui.sub.innerText = "Accede a tu panel de control maestro.";
        ui.label.innerText = "ACCEDER AL ENTORNO";
        ui.hint.innerText = "¿No tienes acceso todavía?";
        ui.btn.innerText = "Crear Cuenta";
        ui.userWrap.classList.add('hidden');
        ui.idLabel.innerText = "Email o Usuario";
    } else {
        ui.title.innerText = "Registro DevRoot";
        ui.sub.innerText = "Únete a la infraestructura global.";
        ui.label.innerText = "CREAR IDENTIDAD";
        ui.hint.innerText = "¿Ya eres miembro?";
        ui.btn.innerText = "Iniciar Sesión";
        ui.userWrap.classList.remove('hidden');
        ui.idLabel.innerText = "Correo Electrónico";
    }
}

async function handleAuth() {
    const user = document.getElementById('in-user').value;
    const identity = document.getElementById('in-id').value;
    const pass = document.getElementById('in-pass').value;
    const btn = document.querySelector('.btn-main');
    const spinner = document.querySelector('.btn-spinner');

    if (!identity || !pass || (!isLoginMode && !user)) {
        return notify("Por favor, completa todos los campos requeridos.", "error");
    }

    if (!isLoginMode && pass.length < 5) {
        return notify("Seguridad insuficiente: Mínimo 5 caracteres.", "error");
    }

    // Bloqueo de UI
    btn.disabled = true;
    spinner.classList.remove('hidden');

    const endpoint = isLoginMode ? '/api/v1/auth/login' : '/api/v1/auth/signup';
    const payload = isLoginMode ? { identity, password: pass } : { user, email: identity, password: pass };

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
            if (isLoginMode) {
                notify("Credenciales aceptadas.");
                startApp(data.user);
            } else {
                notify(data.message);
                switchAuth();
            }
        } else {
            notify(data.error || "Error de comunicación.", "error");
        }
    } catch (e) {
        notify("Error de conexión con el núcleo DevRoot.", "error");
    } finally {
        btn.disabled = false;
        spinner.classList.add('hidden');
    }
}

// 4. MOTOR DE BÚSQUEDA DUAL
async function searchGlobal(val) {
    const panel = document.getElementById('search-results-panel');
    const pList = document.getElementById('res-people-list');
    
    if (val.length < 1) {
        panel.classList.add('results-hidden');
        return;
    }

    try {
        const res = await fetch(`/api/v1/search/global?q=${encodeURIComponent(val)}`);
        const { results } = await res.json();

        panel.classList.remove('results-hidden');
        pList.innerHTML = "";

        if (results.people.length > 0) {
            results.people.forEach(p => {
                const item = document.createElement('div');
                item.className = 'res-person';
                item.onclick = () => openProfile(p);
                item.innerHTML = `
                    <div class="r-avatar">${p.init}</div>
                    <div class="r-info">
                        <strong>${p.name}</strong>
                        <small style="display:block; font-size:10px; color:#999">${p.rank}</small>
                    </div>
                `;
                pList.appendChild(item);
            });
        } else {
            pList.innerHTML = '<div class="empty-res">Sin personas encontradas</div>';
        }
    } catch (e) { console.error("Search Fail"); }
}

// 5. GESTIÓN DE PERFILES
function openProfile(data) {
    const modal = document.getElementById('profile-modal');
    document.getElementById('p-modal-name').innerText = data.name;
    document.getElementById('p-modal-init').innerText = data.init;
    document.getElementById('p-modal-rank').innerText = data.rank;
    modal.classList.remove('modal-hidden');
}

function closeProfile() {
    document.getElementById('profile-modal').classList.add('modal-hidden');
}

// 6. INICIALIZAR DASHBOARD
function startApp(user) {
    document.getElementById('view-auth').classList.add('hidden');
    document.getElementById('view-app').classList.remove('hidden');
    
    document.getElementById('nav-username').innerText = user.name;
    document.getElementById('nav-avatar').innerText = user.name[0].toUpperCase();
    document.getElementById('nav-rank').innerText = user.rank;
    document.getElementById('drop-email').innerText = user.email;
    
    // Simular carga de posts
    setTimeout(() => {
        const feed = document.getElementById('main-feed');
        feed.innerHTML = `
            <div class="skeleton-post animate-pop" style="border-left: 5px solid var(--primary)">
                <h3>Actualización del Sistema</h3>
                <p>Bienvenido de nuevo, ${user.name}. Tu entorno de desarrollo está listo para trabajar.</p>
                <small>Publicado por DevRoot Engine</small>
            </div>
        `;
    }, 2000);
}

// 7. INTERACCIONES UI GENERALES
function togglePassView() {
    const p = document.getElementById('in-pass');
    const i = document.getElementById('eye-icon');
    p.type = p.type === 'password' ? 'text' : 'password';
    i.className = p.type === 'password' ? 'fa-regular fa-eye' : 'fa-regular fa-eye-slash';
}

function toggleUserMenu() {
    document.getElementById('user-dropdown').classList.toggle('drop-hidden');
}

window.onclick = (e) => {
    if (!e.target.closest('.user-trigger')) document.getElementById('user-dropdown').classList.add('drop-hidden');
    if (!e.target.closest('.search-engine')) document.getElementById('search-results-panel').classList.add('results-hidden');
};

window.onkeydown = (e) => {
    if (e.key === 'Escape') {
        closeProfile();
        document.getElementById('search-results-panel').classList.add('results-hidden');
    }
};
