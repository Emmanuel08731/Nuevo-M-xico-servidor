/**
 * ECNHACA DATA ENGINE v4.0 - Emmanuel Store
 * LÍNEAS ESTIMADAS: 180
 */

let sessionUser = JSON.parse(localStorage.getItem('ec_session_v4')) || null;
let currentViewMode = 'login';
let targetProfileId = null;

function initApp() {
    if (sessionUser) {
        document.getElementById('app').classList.remove('hide');
        document.getElementById('auth').classList.add('hide');
        setupNavigation();
        navigateTo('home');
    } else {
        document.getElementById('auth').classList.remove('hide');
    }
}

// --- GESTIÓN DE AUTENTICACIÓN ---

function switchMode(mode) {
    currentViewMode = mode;
    document.getElementById('emailGroup').classList.toggle('hide', mode === 'login');
    document.getElementById('tabL').classList.toggle('active', mode === 'login');
    document.getElementById('tabR').classList.toggle('active', mode === 'reg');
    document.getElementById('btnSubmit').innerText = mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta Gratis';
}

async function processAuth(e) {
    e.preventDefault();
    const username = document.getElementById('userInput').value;
    const password = document.getElementById('passInput').value;
    const email = document.getElementById('emailInput').value;

    const endpoint = currentViewMode === 'login' ? '/api/login' : '/api/register';
    
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ username, password, email })
        });

        const data = await response.json();

        if (response.ok) {
            sessionUser = data.user;
            localStorage.setItem('ec_session_v4', JSON.stringify(sessionUser));
            pushNotify(currentViewMode === 'login' ? `¡Hola de nuevo, @${sessionUser.username}!` : "¡Cuenta registrada con éxito!");
            setTimeout(() => location.reload(), 1500);
        } else {
            pushNotify(data.error, 'error');
            vibrateElement(document.querySelector('.auth-container'));
        }
    } catch (err) {
        pushNotify("Error crítico: El servidor de Render no responde.", 'error');
    }
}

// --- BUSCADOR INTELIGENTE (BÚSQUEDA DE SIMILARES) ---

let searchDebounce;
async function handleSearch(query) {
    const list = document.getElementById('search-results-list');
    const placeholder = document.getElementById('empty-placeholder');

    if (!query || query.length < 1) {
        list.innerHTML = '';
        placeholder.classList.remove('hide');
        return;
    }

    placeholder.classList.add('hide');
    clearTimeout(searchDebounce);

    searchDebounce = setTimeout(async () => {
        const res = await fetch(`/api/search?q=${query}&myId=${sessionUser.id}`);
        const data = await res.json();

        list.innerHTML = '';
        if (data.length === 0) {
            list.innerHTML = `<p class="no-res-msg">No se encontró a "${query}", pero mira estos perfiles similares...</p>`;
            // Aquí el servidor ya envía similares si no hay coincidencia exacta
        }

        data.forEach(user => {
            const card = document.createElement('div');
            card.className = 'user-card-v4';
            card.onclick = () => loadProfile(user.id);
            card.innerHTML = `
                <div class="av-small" style="background:${user.color}">${user.username[0].toUpperCase()}</div>
                <div style="flex:1">
                    <h4 style="font-weight:800">@${user.username}</h4>
                    <p style="font-size:0.8rem; color:var(--text-muted)">${user.followers_count} seguidores</p>
                </div>
                <i class="fa fa-chevron-right" style="color:#cbd5e1"></i>
            `;
            list.appendChild(card);
        });
    }, 400);
}

// --- CARGA DE PERFIL Y ACCIONES ---

async function loadProfile(id) {
    targetProfileId = id;
    try {
        const res = await fetch(`/api/user/${id}`);
        const u = await res.json();

        // Verificar si yo ya sigo a este usuario
        const searchCheck = await fetch(`/api/search?q=${u.username}&myId=${sessionUser.id}`);
        const searchData = await searchCheck.json();
        const amIFollowing = searchData.find(x => x.id === id)?.is_following > 0;

        document.getElementById('pBanner').style.background = u.color;
        document.getElementById('pAvatarLg').innerText = u.username[0].toUpperCase();
        document.getElementById('pAvatarLg').style.background = u.color;
        document.getElementById('pUsername').innerText = "@" + u.username;
        document.getElementById('pBio').innerText = u.bio;
        document.getElementById('pFollowersCount').innerText = u.followers_count;
        document.getElementById('pFollowingCount').innerText = u.following_count;

        const btn = document.getElementById('btnFollow');
        if (id === sessionUser.id) {
            btn.classList.add('hide');
        } else {
            btn.classList.remove('hide');
            btn.innerText = amIFollowing ? "Dejar de seguir" : "Seguir";
            btn.className = amIFollowing ? "btn-action-main active" : "btn-action-main";
        }

        navigateTo('profile');
    } catch (e) { pushNotify("No pudimos cargar este perfil.", "error"); }
}

async function executeFollowToggle() {
    const btn = document.getElementById('btnFollow');
    tapEffect(btn);

    const res = await fetch('/api/follow-toggle', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ myId: sessionUser.id, targetId: targetProfileId })
    });

    if (res.ok) {
        const result = await res.json();
        pushNotify(result.action === 'followed' ? "¡Ahora sigues a este usuario!" : "Has dejado de seguir a este usuario.");
        loadProfile(targetProfileId); // Recargar datos
    }
}

// --- UTILIDADES ---

function setupNavigation() {
    const navAv = document.getElementById('navAvatar');
    navAv.innerText = sessionUser.username[0].toUpperCase();
    navAv.style.background = sessionUser.color;
}

function goHome() { 
    navigateTo('home'); 
    document.getElementById('mainSearch').value = '';
    handleSearch('');
}

function viewMyProfile() { loadProfile(sessionUser.id); }

function killSession() {
    if(confirm("¿Seguro que quieres cerrar tu sesión en Ecnhaca?")) {
        localStorage.removeItem('ec_session_v4');
        location.reload();
    }
}

function vibrateElement(el) {
    el.classList.add('shake');
    setTimeout(() => el.classList.remove('shake'), 500);
}
