/**
 * SYSTEM PRO - FRONTEND CONTROLLER
 * SPEED: ULTRA FAST
 */

// 1. CARGADOR INICIAL
window.addEventListener('DOMContentLoaded', () => {
    const bar = document.querySelector('.progress-bar span');
    bar.style.width = '100%';
    
    setTimeout(() => {
        document.getElementById('screen-loader').style.opacity = '0';
        setTimeout(() => document.getElementById('screen-loader').style.display = 'none', 600);
    }, 800);
});

// 2. SISTEMA DE ALERTAS (TOASTS)
function notify(msg, type = "success") {
    const container = document.getElementById('alert-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fa-solid ${type === 'success' ? 'fa-check-circle' : 'fa-circle-exclamation'}"></i>
        <span>${msg}</span>
    `;
    
    container.appendChild(toast);
    
    // Eliminar automáticamente
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
        setTimeout(() => toast.remove(), 400);
    }, 3500);
}

// 3. CAMBIO DE MODO (LOGIN / REGISTRO)
let isLogin = true;

function toggleMode() {
    isLogin = !isLogin;
    
    const ui = {
        title: document.getElementById('ui-title'),
        sub: document.getElementById('ui-subtitle'),
        btn: document.getElementById('btn-text'),
        hint: document.getElementById('foot-hint'),
        switch: document.getElementById('btn-switch'),
        userField: document.getElementById('field-user'),
        lblId: document.getElementById('lbl-id')
    };

    if (!isLogin) {
        ui.title.innerText = "Crear Cuenta";
        ui.sub.innerText = "Únete a la plataforma profesional.";
        ui.btn.innerText = "REGISTRAR CUENTA";
        ui.hint.innerText = "¿Ya tienes cuenta?";
        ui.switch.innerText = "Iniciar Sesión";
        ui.userField.classList.remove('hidden');
        ui.lblId.innerText = "Correo Electrónico";
    } else {
        ui.title.innerText = "Bienvenido";
        ui.sub.innerText = "Introduce tus datos para continuar.";
        ui.btn.innerText = "INICIAR SESIÓN";
        ui.hint.innerText = "¿No tienes cuenta?";
        ui.switch.innerText = "Crear Cuenta";
        ui.userField.classList.add('hidden');
        ui.lblId.innerText = "Email o Usuario";
    }
}

// 4. ENVÍO DE DATOS AL NÚCLEO
async function submitAuth() {
    const user = document.getElementById('in-user').value;
    const identity = document.getElementById('in-id').value;
    const pass = document.getElementById('in-pass').value;
    const btn = document.querySelector('.btn-action');
    const spinner = btn.querySelector('.spinner');

    // Validación frontal rápida
    if (!identity || !pass || (!isLogin && !user)) {
        return notify("Completa todos los campos.", "error");
    }

    if (!isLogin && pass.length < 5) {
        return notify("Contraseña mínima: 5 caracteres.", "error");
    }

    // Bloqueo de UI
    btn.disabled = true;
    spinner.classList.remove('hidden');

    const path = isLogin ? '/api/v1/auth/login' : '/api/v1/auth/signup';
    const payload = isLogin ? { identity, password: pass } : { user, email: identity, password: pass };

    try {
        const res = await fetch(path, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (res.ok) {
            if (isLogin) {
                notify("¡Acceso autorizado!");
                startDashboard(data.user);
            } else {
                notify(data.message);
                toggleMode();
            }
        } else {
            // El servidor ahora envía errores específicos como "Cuenta no encontrada"
            notify(data.error || "Error en la solicitud.", "error");
        }
    } catch (e) {
        notify("No hay conexión con el servidor.", "error");
    } finally {
        btn.disabled = false;
        spinner.classList.add('hidden');
    }
}

// 5. MOTOR DE BÚSQUEDA INSTANTÁNEO
async function doSearch(val) {
    const drop = document.getElementById('search-drop');
    if (val.length < 2) {
        drop.classList.add('drop-hidden');
        return;
    }

    try {
        const res = await fetch(`/api/v1/search?q=${val}`);
        const { results } = await res.json();

        drop.innerHTML = "";
        if (results.length > 0) {
            drop.classList.remove('drop-hidden');
            results.forEach(r => {
                const item = document.createElement('div');
                item.className = 'search-res';
                item.innerHTML = `<i class="fa-regular fa-user"></i> ${r.name}`;
                drop.appendChild(item);
            });
        } else {
            drop.classList.add('drop-hidden');
        }
    } catch (e) { console.error("Search failed"); }
}

// 6. DASHBOARD
function startDashboard(user) {
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('app-section').classList.remove('hidden');
    document.getElementById('u-name').innerText = user.name;
    document.getElementById('u-init').innerText = user.name[0].toUpperCase();
}

function togglePass() {
    const inp = document.getElementById('in-pass');
    inp.type = inp.type === 'password' ? 'text' : 'password';
}

function toggleMenu() {
    document.getElementById('drop-menu').classList.toggle('drop-hidden');
}

// Cierre de clics externos
window.onclick = (e) => {
    if (!e.target.closest('.user-control')) document.getElementById('drop-menu').classList.add('drop-hidden');
};
