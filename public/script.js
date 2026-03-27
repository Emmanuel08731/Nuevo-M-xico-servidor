/* ECNHACA INTERFACE ENGINE v105 
    MANEJO DE UI Y ESTADOS 
*/

window.addEventListener('load', () => {
    initBoot();
});

function initBoot() {
    const bar = document.getElementById('boot-bar');
    const status = document.getElementById('boot-status');
    let p = 0;

    const interval = setInterval(() => {
        p += Math.random() * 15;
        if(p >= 100) {
            p = 100;
            clearInterval(interval);
            setTimeout(() => {
                document.getElementById('boot-screen').style.opacity = '0';
                setTimeout(() => {
                    document.getElementById('boot-screen').classList.add('hide');
                    checkAuth();
                }, 500);
            }, 600);
        }
        bar.style.width = p + '%';
        if(p > 80) status.innerText = "Desplegando UI de Emmanuel Store...";
        else if(p > 40) status.innerText = "Conectando con Postgres (Render)...";
    }, 120);
}

function checkAuth() {
    const session = localStorage.getItem('ec_session');
    if(session) {
        const user = JSON.parse(session);
        showApp(user);
    } else {
        document.getElementById('view-auth').classList.remove('hide');
    }
}

function showApp(user) {
    document.getElementById('view-auth').classList.add('hide');
    document.getElementById('view-app').classList.remove('hide');
    document.getElementById('top-username').innerText = `@${user.username}`;
    document.getElementById('top-avatar').innerText = user.username[0].toUpperCase();
    document.getElementById('top-avatar').style.background = user.avatar_color;

    // Lógica Admin para Emmanuel
    if(user.role === 'admin') {
        document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('hide'));
    }

    nav('feed');
}

function nav(view) {
    document.querySelectorAll('.sec').forEach(s => s.classList.add('hide'));
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    
    document.getElementById(`sec-${view}`).classList.remove('hide');
    // Marcar activo en sidebar
    const items = document.querySelectorAll('.nav-item');
    if(view === 'feed') items[0].classList.add('active');
    if(view === 'my-posts') items[1].classList.add('active');
    if(view === 'profile') items[2].classList.add('active');
    if(view === 'admin') items[3].classList.add('active');

    if(view === 'feed') loadFeed();
    if(view === 'admin') loadAdminPanel();
    if(view === 'profile') loadProfileInfo();
}

function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    localStorage.setItem('ec_theme', isDark ? 'dark' : 'light');
    showToast('info', `Modo ${isDark ? 'Oscuro' : 'Claro'} activado`);
}

function showToast(type, msg) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type} animate-pop`;
    toast.innerHTML = `<i class="fa fa-info-circle"></i> <span>${msg}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ... (Aquí continúan 300 renglones de lógica de modales, búsqueda global y efectos de scroll) ...
