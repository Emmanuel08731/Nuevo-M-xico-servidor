/**
 * DEVROOT INTERFACE LOGIC v6.0.4
 * DIRECTOR: EMMANUEL
 */

let isLoginMode = true;
let sessionUser = null;

// SISTEMA DE NOTIFICACIONES (TOAST)
function msg(text) {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-msg');
    
    toastMsg.innerText = text;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3500);
}

// CAMBIO DE MODO: LOGIN / REGISTRO
function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    const title = document.getElementById('auth-title');
    const btn = document.getElementById('btn-auth');
    const switchText = document.getElementById('switch-text');
    
    if (isLoginMode) {
        title.innerText = "Iniciar Sesión";
        btn.innerText = "Sincronizar Nodo";
        switchText.innerHTML = '¿No eres miembro aún? <span onclick="toggleAuthMode()">Crea una cuenta</span>';
    } else {
        title.innerText = "Crear Cuenta";
        btn.innerText = "Inicializar Nodo";
        switchText.innerHTML = '¿Ya tienes acceso? <span onclick="toggleAuthMode()">Inicia sesión</span>';
    }
}

// ACCIÓN DE AUTENTICACIÓN
async function handleAuthAction() {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('pass').value;
    const url = isLoginMode ? '/api/auth/login' : '/api/auth/register';

    if (!email || !pass) return msg("Identidad incompleta");

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                email, 
                password: pass, 
                username: email.split('@')[0] 
            })
        });

        const data = await response.json();

        if (response.ok) {
            if (isLoginMode) {
                sessionUser = data.user;
                msg(`Bienvenido, Director ${data.user.name}`);
                launchDashboard();
            } else {
                msg("Nodo registrado correctamente");
                toggleAuthMode();
            }
        } else {
            msg(data.error || "Falla en el protocolo");
        }
    } catch (err) {
        msg("Error crítico de conexión");
    }
}

// LANZAR EL DASHBOARD
function launchDashboard() {
    document.getElementById('auth-screen').classList.add('hidden');
    const dash = document.getElementById('dashboard');
    dash.classList.remove('hidden');
    
    document.getElementById('nav-user-name').innerText = sessionUser.name;
    document.getElementById('drop-user').innerText = sessionUser.name;
}

// GESTIÓN DE MENÚ DESPLEGABLE
function toggleDropdown() {
    document.getElementById('user-dropdown').classList.toggle('drop-hidden');
}

// GESTIÓN DE MODALES
function openModal(id) {
    document.getElementById(id).classList.remove('hidden');
    if (id === 'config-modal') toggleDropdown();
}

function closeModal(id) {
    document.getElementById(id).classList.add('hidden');
}

// ELIMINAR CUENTA
async function confirmDeleteAccount() {
    if (confirm("¿Estás seguro de eliminar permanentemente este nodo?")) {
        const response = await fetch('/api/auth/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: sessionUser.email })
        });
        
        if (response.ok) {
            msg("Nodo eliminado. Reiniciando...");
            setTimeout(() => logout(), 2000);
        }
    }
}

function logout() {
    location.reload();
}

// CERRAR DROPDOWN AL HACER CLICK AFUERA
window.onclick = function(event) {
    if (!event.target.closest('.user-control')) {
        document.getElementById('user-dropdown').classList.add('drop-hidden');
    }
}
