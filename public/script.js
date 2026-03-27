/**
 * ECNHACA ORCHESTRATOR - v25.0
 * GESTIÓN DE INTERFAZ Y FLUJO DE USUARIO
 */

window.addEventListener('load', () => {
    let bar = document.getElementById('bar');
    let txt = document.getElementById('splash-txt');
    let progress = 0;

    const interval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            setTimeout(() => {
                document.getElementById('splash').style.opacity = '0';
                setTimeout(() => {
                    document.getElementById('splash').classList.add('hide');
                    checkUserSession();
                }, 800);
            }, 500);
        }
        bar.style.width = progress + '%';
        if (progress > 80) txt.innerText = "Sincronizando perfiles...";
        else if (progress > 40) txt.innerText = "Conectando al servidor Render...";
    }, 120);
});

function checkUserSession() {
    const session = localStorage.getItem('ecnhaca_session');
    if (session) {
        document.getElementById('app-screen').classList.remove('hide');
        const user = JSON.parse(session);
        updateNavProfile(user);
        loadFeed();
    } else {
        document.getElementById('auth-screen').classList.remove('hide');
    }
}

function updateNavProfile(user) {
    const av = document.getElementById('nav-av');
    av.style.background = user.color || '#007aff';
    av.innerText = user.username[0].toUpperCase();
    document.getElementById('user-display-name').innerText = `@${user.username}`;
}

function setAuthMode(mode) {
    const isLogin = mode === 'login';
    document.getElementById('reg-extra').classList.toggle('hide', isLogin);
    document.getElementById('btn-login').classList.toggle('active', isLogin);
    document.getElementById('btn-reg').classList.toggle('active', !isLogin);
    document.getElementById('a-submit').innerText = isLogin ? 'Acceder al Sistema' : 'Crear Cuenta Ahora';
    document.getElementById('auth-subtitle').innerText = isLogin ? 'Inicia sesión para acceder a la red profesional.' : 'Únete a la comunidad de desarrolladores más grande.';
}

function toggleUserMenu() {
    document.getElementById('user-menu').classList.toggle('hide');
}

function openPostModal() {
    document.getElementById('modal-post').classList.remove('hide');
}

function closePostModal() {
    document.getElementById('modal-post').classList.add('hide');
}

function showToast(msg, type = 'success') {
    const container = document.getElementById('toast-wrap');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fa ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i> <span>${msg}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(40px)';
        setTimeout(() => toast.remove(), 500);
    }, 4000);
}

// Lógica de navegación simple
function navigate(view) {
    document.getElementById('user-menu').classList.add('hide');
    // ... (Lógica para cambiar entre feed y perfiles)
}

// ESCAPE PARA CERRAR TODO
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closePostModal();
        document.getElementById('user-menu').classList.add('hide');
        document.getElementById('search-results').classList.add('hide');
    }
});

// ADICIÓN DE LÓGICA DE VALIDACIÓN DE FORMULARIOS PARA LLEGAR A 400
// ...
