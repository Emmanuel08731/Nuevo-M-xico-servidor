/**
 * ECNHACA UI ORCHESTRATOR
 * GESTIÓN DE PÁGINAS, TEMAS Y CARGA
 */

window.addEventListener('load', () => {
    // Restaurar Tema
    const savedTheme = localStorage.getItem('ec_theme');
    if (savedTheme === 'dark') {
        document.body.classList.replace('light-theme', 'dark-theme');
    }

    // Simulador de carga profunda
    const bar = document.getElementById('progress-bar');
    const text = document.getElementById('loader-text');
    let progress = 0;

    const interval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            setTimeout(() => {
                document.getElementById('loader-screen').style.opacity = '0';
                setTimeout(() => {
                    document.getElementById('loader-screen').classList.add('hide');
                    checkSession();
                }, 500);
            }, 600);
        }
        bar.style.width = progress + '%';
        if (progress > 80) text.innerText = "Sincronizando perfiles...";
        else if (progress > 40) text.innerText = "Conectando a base de datos...";
        else if (progress > 10) text.innerText = "Verificando módulos...";
    }, 120);
});

function checkSession() {
    const session = localStorage.getItem('ec_user');
    if (session) {
        const user = JSON.parse(session);
        document.getElementById('app-screen').classList.remove('hide');
        document.getElementById('nav-avatar').innerText = user.username[0].toUpperCase();
        document.getElementById('nav-avatar').style.background = user.color;
        document.getElementById('menu-user').innerText = `@${user.username}`;
        navigate('feed');
    } else {
        document.getElementById('auth-screen').classList.remove('hide');
    }
}

function switchTheme() {
    const body = document.body;
    if (body.classList.contains('light-theme')) {
        body.classList.replace('light-theme', 'dark-theme');
        localStorage.setItem('ec_theme', 'dark');
    } else {
        body.classList.replace('dark-theme', 'light-theme');
        localStorage.setItem('ec_theme', 'light');
    }
    toggleMenu(); // Cerrar menú al cambiar
}

function navigate(view) {
    const views = ['view-feed', 'view-search', 'view-settings', 'view-profile'];
    views.forEach(v => document.getElementById(v).classList.add('hide'));
    document.getElementById(`view-${view}`).classList.remove('hide');
    document.getElementById('nav-menu').classList.add('hide');
    
    if (view === 'feed') loadFeed();
}

function toggleMenu() {
    document.getElementById('nav-menu').classList.toggle('hide');
}

function toggleModal(show) {
    document.getElementById('modal-post').classList.toggle('hide', !show);
}

function toggleAuth(mode) {
    const isLogin = mode === 'login';
    document.getElementById('tab-login').classList.toggle('active', isLogin);
    document.getElementById('tab-reg').classList.toggle('active', !isLogin);
    document.getElementById('reg-extra').classList.toggle('hide', isLogin);
    document.getElementById('auth-btn').innerText = isLogin ? 'Entrar al Sistema' : 'Crear Mi Cuenta';
    document.getElementById('auth-tagline').innerText = isLogin ? 'Bienvenido de nuevo, Developer.' : 'Únete a la red elite de programación.';
}

function showStatus(type, title, desc) {
    const overlay = document.getElementById('status-overlay');
    const box = document.getElementById('status-icon-box');
    const icon = document.getElementById('status-icon');
    
    document.getElementById('status-title').innerText = title;
    document.getElementById('status-desc').innerText = desc;
    
    box.className = 'icon-circle ' + (type === 'success' ? 'icon-success' : 'icon-error');
    icon.className = 'fa ' + (type === 'success' ? 'fa-check' : 'fa-times');
    
    overlay.classList.remove('hide');
    setTimeout(() => {
        overlay.classList.add('hide');
    }, 2500);
}

function handleSearchKey(e) {
    if (e.key === 'Enter') runSearch();
}

// Cerrar dropdowns al hacer clic fuera
window.onclick = (e) => {
    if (!e.target.closest('.profile-pill')) {
        document.getElementById('nav-menu').classList.add('hide');
    }
}
