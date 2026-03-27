/**
 * ECNHACA SCRIPT ENGINE
 */
window.addEventListener('load', () => {
    let bar = document.getElementById('load-bar');
    let msg = document.getElementById('splash-msg');
    let p = 0;
    let timer = setInterval(() => {
        p += Math.random() * 20;
        if (p >= 100) {
            p = 100; clearInterval(timer);
            setTimeout(() => {
                document.getElementById('splash').style.opacity = '0';
                setTimeout(() => {
                    document.getElementById('splash').classList.add('hide');
                    checkSession();
                }, 600);
            }, 500);
        }
        bar.style.width = p + '%';
        if (p > 70) msg.innerText = "Sincronizando perfiles...";
        else if (p > 30) msg.innerText = "Validando infraestructura...";
    }, 150);
});

function checkSession() {
    const session = localStorage.getItem('ec_session');
    if (session) {
        document.getElementById('main-screen').classList.remove('hide');
        const user = JSON.parse(session);
        renderNav(user);
        initFeed();
    } else {
        document.getElementById('auth-screen').classList.remove('hide');
    }
}

function renderNav(u) {
    const av = document.getElementById('nav-avatar');
    av.style.background = u.color;
    av.innerText = u.username[0].toUpperCase();
    document.getElementById('menu-user-name').innerText = `@${u.username}`;
}

function toggleAuth(mode) {
    const isLogin = mode === 'login';
    document.getElementById('reg-box').classList.toggle('hide', isLogin);
    document.getElementById('tab-login').classList.toggle('active', isLogin);
    document.getElementById('tab-reg').classList.toggle('active', !isLogin);
    document.getElementById('auth-action').innerText = isLogin ? 'Iniciar Sesión Ahora' : 'Crear Mi Cuenta Gratis';
    document.getElementById('auth-desc').innerText = isLogin ? 'Acceso restringido. Por favor identifícate.' : 'Únete a la red elite de Ecnhaca.';
}

function openUserMenu() {
    document.getElementById('user-menu').classList.toggle('hide');
}

function showModalPost() {
    document.getElementById('modal-post').classList.remove('hide');
}

function hideModalPost() {
    document.getElementById('modal-post').classList.add('hide');
}

function toast(msg, type = 'success') {
    const box = document.getElementById('toast-box');
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `<i class="fa ${type==='success'?'fa-circle-check':'fa-triangle-exclamation'}"></i> <span>${msg}</span>`;
    box.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 500); }, 3500);
}

// CERRAR CON ESCAPE
window.onkeydown = (e) => {
    if (e.key === 'Escape') {
        hideModalPost();
        document.getElementById('user-menu').classList.add('hide');
        document.getElementById('search-results').classList.add('hide');
    }
};

// [RELLENO PARA 400 RENGLONES DE LÓGICA UX]
