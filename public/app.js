let me = JSON.parse(localStorage.getItem('ecnhaca_user')) || null;
let authMode = 'login';

// INICIO
window.onload = () => {
    if (me) {
        document.getElementById('authBox').classList.add('hide');
        document.getElementById('app').classList.remove('hide');
        document.getElementById('myAv').innerText = me.username[0].toUpperCase();
        document.getElementById('myAv').style.background = me.color;
        updateProfileView();
    }
};

// AUTH
function setMode(m) {
    authMode = m;
    document.getElementById('e').classList.toggle('hide', m === 'login');
    document.getElementById('tL').classList.toggle('active', m === 'login');
    document.getElementById('tR').classList.toggle('active', m === 'reg');
    document.getElementById('btnA').innerText = m === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta';
}

async function doAuth(ev) {
    ev.preventDefault();
    const username = document.getElementById('u').value;
    const password = document.getElementById('p').value;
    const email = document.getElementById('e').value;

    const path = authMode === 'login' ? '/api/login' : '/api/register';
    const body = authMode === 'login' ? {username, password} : {username, email, password};

    const res = await fetch(path, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body)
    });

    if (res.ok) {
        me = await res.json();
        localStorage.setItem('ecnhaca_user', JSON.stringify(me));
        location.reload();
    } else alert("Error de datos");
}

// MENU DESPLEGABLE
function toggleMenu() {
    document.getElementById('dropdown').classList.toggle('hide');
}

// CAMBIO DE VISTAS
function showView(viewName) {
    document.querySelectorAll('.view').forEach(v => v.classList.add('hide'));
    document.getElementById('view-' + viewName).classList.remove('hide');
    document.getElementById('dropdown').classList.add('hide');
    if(viewName === 'profile') updateProfileView();
}

// BUSCADOR
async function search(q) {
    const results = document.getElementById('results');
    const msg = document.getElementById('empty-msg');
    
    if(!q) { results.innerHTML = ''; msg.classList.remove('hide'); return; }
    msg.classList.add('hide');

    const res = await fetch(`/api/search?q=${q}&myId=${me.id}`);
    const users = await res.json();
    
    results.innerHTML = '';
    users.forEach(u => {
        results.innerHTML += `
            <div class="user-card">
                <div class="mini-av" style="background:${u.color}">${u.username[0].toUpperCase()}</div>
                <div class="u-info">
                    <b>@${u.username}</b>
                    <p style="font-size:0.8rem; color:#64748b">${u.followers} seguidores</p>
                </div>
                <button class="btn-follow ${u.am_following > 0 ? 'following' : ''}" 
                        onclick="follow(${u.id}, this)">
                    ${u.am_following > 0 ? 'Siguiendo' : 'Seguir'}
                </button>
            </div>
        `;
    });
}

// SEGUIR
async function follow(id, btn) {
    if(btn.classList.contains('following')) return;
    const res = await fetch('/api/follow', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ myId: me.id, targetId: id })
    });
    if(res.ok) {
        btn.innerText = "Siguiendo";
        btn.classList.add('following');
    }
}

// ACTUALIZAR PERFIL MIO
async function updateProfileView() {
    const res = await fetch(`/api/profile-stats/${me.id}`);
    const stats = await res.json();
    document.getElementById('pAv').innerText = me.username[0].toUpperCase();
    document.getElementById('pAv').style.background = me.color;
    document.getElementById('pName').innerText = "@" + me.username;
    document.getElementById('pBio').innerText = me.bio;
    document.getElementById('s-followers').innerText = stats.followers;
    document.getElementById('s-following').innerText = stats.following;
}

function logout() {
    localStorage.removeItem('ecnhaca_user');
    location.reload();
}
