/**
 * ECNHACA CORE APP - Emmanuel Store
 * Maneja Búsqueda similar, Follow inteligente y Sesiones
 */

let me = JSON.parse(localStorage.getItem('ec_session')) || null;
let currentTab = 'login';
let viewingId = null;

function startEcnhaca() {
    if (me) {
        document.getElementById('app').classList.remove('hide');
        document.getElementById('auth').classList.add('hide');
        updateNav();
        irA('search');
    } else {
        document.getElementById('auth').classList.remove('hide');
    }
}

function switchAuth(mode) {
    currentTab = mode;
    document.getElementById('eGroup').classList.toggle('hide', mode === 'login');
    document.getElementById('tL').classList.toggle('active', mode === 'login');
    document.getElementById('tR').classList.toggle('active', mode === 'reg');
    document.getElementById('btnMain').innerText = mode === 'login' ? 'Iniciar Sesión' : 'Unirse a Ecnhaca';
}

async function handleAuth(e) {
    e.preventDefault();
    const u = document.getElementById('uIn').value;
    const p = document.getElementById('pIn').value;
    const email = document.getElementById('eIn').value;

    const path = currentTab === 'login' ? '/api/login' : '/api/register';
    
    try {
        const res = await fetch(path, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({username: u, password: p, email})
        });

        const data = await res.json();
        if (res.ok) {
            me = data.user;
            localStorage.setItem('ec_session', JSON.stringify(me));
            notify(currentTab === 'login' ? `¡Iniciaste sesión como @${me.username}!` : "¡Cuenta creada exitosamente!");
            setTimeout(() => location.reload(), 1500);
        } else {
            notify(data.error, 'err'); // Muestra mensaje de "La cuenta no existe" o "Contraseña mal"
        }
    } catch (err) {
        notify("Servidor de Render fuera de línea.", 'err');
    }
}

let timer;
async function doSearch(q) {
    const list = document.getElementById('results');
    const empty = document.getElementById('empty');
    if (!q) { list.innerHTML = ''; empty.classList.remove('hide'); return; }
    empty.classList.add('hide');

    clearTimeout(timer);
    timer = setTimeout(async () => {
        const res = await fetch(`/api/search?q=${q}&myId=${me.id}`);
        const users = await res.json();
        list.innerHTML = '';

        if (users.length === 0) {
            list.innerHTML = `<div class="not-found">No hay perfiles similares a "${q}"...</div>`;
            return;
        }

        users.forEach(u => {
            const card = document.createElement('div');
            card.className = 'user-card';
            card.onclick = () => openUser(u.id);
            card.innerHTML = `
                <div class="av-small" style="background:${u.color}">${u.username[0].toUpperCase()}</div>
                <div style="flex:1"><b>@${u.username}</b><p>${u.followers_count} seguidores</p></div>
                <i class="fa fa-chevron-right"></i>
            `;
            list.appendChild(card);
        });
    }, 300);
}

async function openUser(id) {
    const res = await fetch(`/api/user/${id}`);
    const u = await res.json();
    viewingId = id;

    // Verificar seguimiento
    const searchRes = await fetch(`/api/search?q=${u.username}&myId=${me.id}`);
    const searchData = await searchRes.json();
    const isFollowing = searchData.find(x => x.id === id)?.is_following > 0;

    document.getElementById('pCol').style.background = u.color;
    document.getElementById('pAv').innerText = u.username[0].toUpperCase();
    document.getElementById('pAv').style.background = u.color;
    document.getElementById('pUser').innerText = "@" + u.username;
    document.getElementById('pBio').innerText = u.bio;
    document.getElementById('pFol').innerText = u.followers_count;
    document.getElementById('pIng').innerText = u.following_count;

    const btn = document.getElementById('btnFol');
    if (id === me.id) { btn.classList.add('hide'); } 
    else {
        btn.classList.remove('hide');
        btn.innerText = isFollowing ? "Dejar de seguir" : "Seguir";
        btn.className = isFollowing ? "btn-fol active" : "btn-fol";
    }
    irA('profile');
}

async function doFollow() {
    const res = await fetch('/api/follow-toggle', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({myId: me.id, targetId: viewingId})
    });
    if (res.ok) {
        notify("Seguidores actualizados.");
        openUser(viewingId);
    }
}

function updateNav() {
    const navAv = document.getElementById('navAv');
    navAv.innerText = me.username[0].toUpperCase();
    navAv.style.background = me.color;
}

function logout() { localStorage.removeItem('ec_session'); location.reload(); }
function openMe() { openUser(me.id); }
