/**
 * CORE PLATFORM SCRIPTING ENGINE
 * VERSION: 12.0.4 - MASTER BUILD
 */

// 1. GESTIÓN DEL CARGADOR GLOBAL
window.addEventListener('load', () => {
    const loader = document.getElementById('global-loader');
    setTimeout(() => {
        loader.style.opacity = '0';
        setTimeout(() => loader.style.display = 'none', 800);
    }, 1500);
});

// 2. SISTEMA DE NOTIFICACIONES (TOAST)
const showToast = (message, type = "success") => {
    const toast = document.getElementById('notif-system');
    const msgEl = document.getElementById('notif-msg');
    const icon = document.getElementById('notif-icon');
    const bar = document.getElementById('notif-bar');

    msgEl.innerText = message;
    icon.className = type === "success" ? "fa-solid fa-circle-check" : "fa-solid fa-triangle-exclamation";
    bar.style.backgroundColor = type === "success" ? "#34c759" : "#ff3b30";

    toast.classList.remove('notif-hidden');
    setTimeout(() => toast.classList.add('notif-hidden'), 4500);
};

// 3. MODO DE AUTENTICACIÓN (LOGIN VS REGISTER)
let isRegisterMode = false;

const switchAuthMode = () => {
    isRegisterMode = !isRegisterMode;
    
    // Selectores de UI
    const title = document.getElementById('form-title');
    const desc = document.getElementById('form-desc');
    const btnLabel = document.getElementById('btn-label');
    const modeBtn = document.getElementById('btn-mode');
    const hint = document.getElementById('hint-text');
    const userBox = document.getElementById('box-user');
    const idLabel = document.getElementById('lbl-id');

    // Transición de texto
    title.innerText = isRegisterMode ? "Crear Cuenta" : "Iniciar Sesión";
    desc.innerText = isRegisterMode ? "Únete a la red global de SystemCore." : "Introduce tus credenciales autorizadas.";
    btnLabel.innerText = isRegisterMode ? "REGISTRAR CUENTA" : "ACCEDER AL SISTEMA";
    modeBtn.innerText = isRegisterMode ? "Iniciar Sesión" : "Crear Cuenta";
    hint.innerText = isRegisterMode ? "¿Ya tienes una cuenta?" : "¿No tienes acceso todavía?";
    idLabel.innerText = isRegisterMode ? "Correo Electrónico" : "Email o Usuario";

    // Mostrar campo de usuario
    if (isRegisterMode) {
        userBox.classList.remove('hidden');
        userBox.classList.add('animate-pop');
    } else {
        userBox.classList.add('hidden');
    }
};

// 4. LÓGICA DE ENVÍO DE FORMULARIOS
const handleAuth = async () => {
    const email = document.getElementById('inp-id').value;
    const pass = document.getElementById('inp-pass').value;
    const user = document.getElementById('inp-user').value;
    
    const btn = document.querySelector('.btn-submit');

    // Validación frontal
    if (!email || !pass || (isRegisterMode && !user)) {
        return showToast("⚠️ Por favor, completa todos los campos requeridos.", "error");
    }

    btn.disabled = true;
    
    const endpoint = isRegisterMode ? '/api/v1/auth/register' : '/api/v1/auth/login';
    const payload = isRegisterMode 
        ? { user, email, password: pass }
        : { identity: email, password: pass };

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (response.ok) {
            showToast(result.msg);
            if (isRegisterMode) {
                switchAuthMode();
            } else {
                initDashboard(result.payload);
            }
        } else {
            showToast(result.msg, "error");
        }
    } catch (err) {
        showToast("Error de red: Imposible conectar con el núcleo.", "error");
    } finally {
        btn.disabled = false;
    }
};

// 5. MOTOR DE BÚSQUEDA DINÁMICA
let searchTimeout;
const executeSearch = (query) => {
    const panel = document.getElementById('search-panel');
    const userList = document.getElementById('results-users');
    const loader = document.getElementById('s-loader');

    clearTimeout(searchTimeout);

    if (query.length < 1) {
        panel.classList.add('search-panel-hidden');
        return;
    }

    loader.classList.remove('hidden');

    searchTimeout = setTimeout(async () => {
        try {
            const res = await fetch(`/api/v1/search?q=${encodeURIComponent(query)}`);
            const json = await res.json();
            
            panel.classList.remove('search-panel-hidden');
            userList.innerHTML = '';

            if (json.data.users.length > 0) {
                json.data.users.forEach(u => {
                    const div = document.createElement('div');
                    div.className = 'res-card';
                    div.innerHTML = `<i class="fa-regular fa-circle-user"></i> <span>${u.user}</span>`;
                    userList.appendChild(div);
                });
            } else {
                userList.innerHTML = '<p class="no-results">Sin coincidencias.</p>';
            }

        } catch (e) {
            console.error("Critical Search Error");
        } finally {
            loader.classList.add('hidden');
        }
    }, 400);
};

// 6. INICIALIZACIÓN DEL DASHBOARD
const initDashboard = (data) => {
    document.getElementById('auth-view').classList.add('hidden');
    document.getElementById('app-view').classList.remove('hidden');
    
    // Inyectar datos del perfil
    document.getElementById('nav-user-name').innerText = data.user;
    document.getElementById('nav-user-init').innerText = data.user[0].toUpperCase();
    document.getElementById('menu-email').innerText = data.email;
    
    console.log(`[SYS] Sesión activa: ${data.uid}`);
};

// 7. INTERACCIONES DE INTERFAZ
const togglePassView = () => {
    const inp = document.getElementById('inp-pass');
    const icon = document.getElementById('eye-icon');
    const isPass = inp.type === 'password';
    inp.type = isPass ? 'text' : 'password';
    icon.className = isPass ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye';
};

const toggleUserMenu = () => {
    document.getElementById('user-menu').classList.toggle('menu-hidden');
};

// Cierre global de modales
window.addEventListener('click', (e) => {
    if (!e.target.closest('.user-trigger')) {
        document.getElementById('user-menu').classList.add('menu-hidden');
    }
    if (!e.target.closest('.search-engine')) {
        document.getElementById('search-panel').classList.add('search-panel-hidden');
    }
});

// ESC Key support
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.getElementById('search-panel').classList.add('search-panel-hidden');
        document.getElementById('user-menu').classList.add('menu-hidden');
    }
});
