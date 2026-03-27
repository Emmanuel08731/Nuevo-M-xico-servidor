let me = JSON.parse(localStorage.getItem('ec_session')) || null;
let mode = 'login';
let currentProfileId = null;

// --- INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        document.getElementById('splash').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('splash').classList.add('hide');
            init();
        }, 500);
    }, 2000);
});

function init() {
    if (me) {
        document.getElementById('app').classList.remove('hide');
        document.getElementById('auth').classList.add('hide');
        renderMyData();
        goHome();
    } else {
        document.getElementById('auth').classList.remove('hide');
    }
}

// --- AUTH LOGIC ---
function toggleAuth(m) {
    mode = m;
    document.getElementById('eBox').classList.toggle('hide', m === 'login');
    document.getElementById('tabL').classList.toggle('active', m === 'login');
    document.getElementById('tabR').classList.toggle('active', m === 'reg');
    document.getElementById('btnA').innerText = m === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta';
}

async function handleAuth(e) {
    e.preventDefault();
    const username = document.getElementById('uIn').value;
    const password = document.getElementById('pIn').value;
    const email = document.getElementById('eIn').value;

    const path = mode === 'login' ? '/api/login' : '/api/register';
    const res = await fetch(path, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({username, password, email})
    });

    if (res.ok) {
        me = await res.json();
        localStorage.setItem('ec_session', JSON.stringify(me));
        location.reload();
    } else alert("Error en los datos.");
}

// --- NAVEGACIÓN SPA ---
function switchView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.add('hide'));
    document.getElementById(viewId).classList.remove('hide');
    document.getElementById('drop').classList.add('hide');
}

function goHome() {
    switchView('v-search');
    liveSearch("");
}

// --- SISTEMA DE BÚSQUEDA Y PERFIL ---
let timer;
async function liveSearch(q) {
    const list = document.getElementById('search-results');
    const empty = document.getElementById('empty-state');
    
    if (!q) { list.innerHTML = ''; empty.classList.remove('hide'); return; }
    empty.classList.add('hide');

    clearTimeout(timer);
    timer = setTimeout(async () => {
        const res = await fetch(`/api/search?q=${q}&myId=${me.id}`);
        const users = await res.json();
        list.innerHTML = '';
        users.forEach(u => {
            const div = document.createElement('div');
            div.className = 'user-card';
            div.onclick = () => openProfile(u.id);
            div.innerHTML = `
                <div class="av-small" style="background:${u.color}">${u.username[0].toUpperCase()}</div>
                <div class="u-info">
                    <b style="font-size:1.1rem">@${u.username}</b>
                    <p style="color:gray; font-size:0.8rem">${u.followers_count} seguidores</p>
                </div>
                <div style="margin-left:auto; color:var(--primary)"><i class="fa fa-chevron-right"></i></div>
            `;
            list.appendChild(div);
        });
    }, 300);
}

async function openProfile(id) {
    const res = await fetch(`/api/user/${id}`);
    const u = await res.json();
    currentProfileId = id;
    
    // Verificar si lo sigo
    const check = await fetch(`/api/search?q=${u.username}&myId=${me.id}`);
    const checkData = await check.json();
    const isFollowing = checkData[0]?.is_following > 0;

    // Renderizar
    document.getElementById('pColor').style.background = u.color;
    document.getElementById('pAv').innerText = u.username[0].toUpperCase();
    document.getElementById('pAv').style.background = u.color;
    document.getElementById('pUsername').innerText = "@" + u.username;
    document.getElementById('pBio').innerText = u.bio;
    document.getElementById('pFol').innerText = u.followers_count;
    document.getElementById('pIng').innerText = u.following_count;

    const btn = document.getElementById('btnFollow');
    btn.innerText = isFollowing ? 'Siguiendo' : 'Seguir';
    btn.className = isFollowing ? 'btn-follow-big active' : 'btn-follow-big';

    switchView('v-profile');
}

async function toggleFollowAction() {
    const res = await fetch('/api/follow-toggle', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({myId: me.id, targetId: currentProfileId})
    });
    const result = await res.json();
    
    // Recargar perfil para ver cambios en contadores
    openProfile(currentProfileId);
}

// --- UTILS ---
function renderMyData() {
    document.getElementById('myAvatar').innerText = me.username[0].toUpperCase();
    document.getElementById('myAvatar').style.background = me.color;
}

function toggleDrop() { document.getElementById('drop').classList.toggle('hide'); }
function logout() { localStorage.removeItem('ec_session'); location.reload(); }
function viewMyProfile() { openProfile(me.id); }
