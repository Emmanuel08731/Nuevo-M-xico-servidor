/**
 * ECNHACA UI ORCHESTRATOR
 * GESTIÓN DE INTERFAZ Y TRANSICIONES
 */

window.addEventListener('load', () => {
    const bar = document.getElementById('fill-bar');
    const status = document.getElementById('boot-status');
    let p = 0;

    const bootInterval = setInterval(() => {
        p += Math.random() * 20;
        if (p >= 100) {
            p = 100;
            clearInterval(bootInterval);
            setTimeout(() => {
                document.getElementById('boot-loader').style.opacity = '0';
                setTimeout(() => {
                    document.getElementById('boot-loader').classList.add('hide');
                    initSessionManager();
                }, 800);
            }, 600);
        }
        bar.style.width = p + '%';
        if (p > 80) status.innerText = "Sincronizando perfiles...";
        else if (p > 40) status.innerText = "Conectando al servidor Render...";
        else if (p > 10) status.innerText = "Cargando módulos de seguridad...";
    }, 150);
});

function initSessionManager() {
    const session = localStorage.getItem('ec_session');
    if (session) {
        document.getElementById('app-view').classList.remove('hide');
        const user = JSON.parse(session);
        updateUserUI(user);
        loadFeed();
    } else {
        document.getElementById('auth-view').classList.remove('hide');
    }
}

function updateUserUI(user) {
    const navAv = document.getElementById('nav-user-av');
    navAv.style.background = user.color || '#007aff';
    navAv.innerText = user.username[0].toUpperCase();
    document.getElementById('drop-username').innerText = `@${user.username}`;
    
    // Si estamos en perfil, actualizar banner
    const welcome = document.querySelector('.view-header h2');
    if (welcome) welcome.innerHTML = `Hola, ${user.username} <span style="opacity:0.4">👋</span>`;
}

function switchAuthMode(mode) {
    const isLogin = mode === 'login';
    document.getElementById('reg-fields').classList.toggle('hide', isLogin);
    document.getElementById('btn-tab-login').classList.toggle('active', isLogin);
    document.getElementById('btn-tab-reg').classList.toggle('active', !isLogin);
    
    const submitBtn = document.getElementById('auth-submit-btn');
    const tagline = document.getElementById('auth-tagline');
    
    if (isLogin) {
        submitBtn.innerText = "Entrar al Sistema";
        tagline.innerText = "Inicia sesión para acceder a la red profesional.";
    } else {
        submitBtn.innerText = "Crear Cuenta Ahora";
        tagline.innerText = "Únete a la comunidad de desarrolladores de Ecnhaca.";
    }
}

function toggleDropdown(id) {
    const el = document.getElementById(id);
    el.classList.toggle('hide');
}

function changeView(view) {
    document.getElementById('view-feed').classList.add('hide');
    document.getElementById('view-profile').classList.add('hide');
    document.getElementById('user-dropdown').classList.add('hide');

    if (view === 'feed') {
        document.getElementById('view-feed').classList.remove('hide');
        loadFeed();
    } else if (view === 'profile') {
        document.getElementById('view-profile').classList.remove('hide');
        const me = JSON.parse(localStorage.getItem('ec_session'));
        loadUserProfile(me.id);
    }
}

function openCreateModal() {
    document.getElementById('modal-create').classList.remove('hide');
}

function closeCreateModal() {
    document.getElementById('modal-create').classList.add('hide');
}

function showSuccessAnim(title, desc) {
    const overlay = document.getElementById('success-overlay');
    document.getElementById('success-title').innerText = title;
    document.getElementById('success-desc').innerText = desc;
    
    overlay.classList.remove('hide');
    setTimeout(() => {
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.classList.add('hide');
            overlay.style.opacity = '1';
        }, 500);
    }, 2500);
}

// CERRAR VENTANAS CON ESCAPE
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeCreateModal();
        document.getElementById('user-dropdown').classList.add('hide');
        document.getElementById('search-results-drop').classList.add('hide');
    }
});

// CLIC FUERA PARA CERRAR
window.addEventListener('click', (e) => {
    if (!e.target.closest('.profile-trigger') && !e.target.closest('.dropdown-box')) {
        document.getElementById('user-dropdown').classList.add('hide');
    }
    if (!e.target.closest('.search-box')) {
        document.getElementById('search-results-drop').classList.add('hide');
    }
});
