/**
 * ECNHACA DATA CORE
 * Manejo de Sesiones, Registro, Login y Publicaciones Reales
 */

let userSession = JSON.parse(localStorage.getItem('ecnhaca_session')) || null;
let currentAuthMode = 'login';
let viewingUserId = null;

window.onload = () => {
    if (userSession) {
        initApp();
    } else {
        document.getElementById('auth-screen').classList.remove('hide');
    }
};

// --- GESTIÓN DE SESIÓN Y AUTH ---

function setAuthMode(m) {
    currentAuthMode = m;
    document.getElementById('emailBox').classList.toggle('hide', m === 'login');
    document.getElementById('loginTab').classList.toggle('active', m === 'login');
    document.getElementById('regTab').classList.toggle('active', m === 'reg');
    document.getElementById('authBtn').innerText = m === 'login' ? 'Acceder a Ecnhaca' : 'Registrar Cuenta';
}

async function handleAuth(e) {
    e.preventDefault();
    const username = document.getElementById('authUser').value;
    const password = document.getElementById('authPass').value;
    const email = document.getElementById('authEmail').value;

    const path = currentAuthMode === 'login' ? '/api/auth/login' : '/api/auth/register';
    
    try {
        const res = await fetch(path, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ username, password, email })
        });
        const data = await res.json();

        if (res.ok) {
            userSession = data.user;
            localStorage.setItem('ecnhaca_session', JSON.stringify(userSession));
            showToast(`¡Bienvenido, ${userSession.username}!`);
            setTimeout(() => location.reload(), 1000);
        } else {
            showToast(data.error, 'error');
        }
    } catch (err) { showToast("Error de conexión con el servidor", "error"); }
}

function logout() {
    localStorage.removeItem('ecnhaca_session');
    location.reload();
}

// --- LOGICA DE LA APP ---

function initApp() {
    document.getElementById('app-screen').classList.remove('hide');
    document.getElementById('auth-screen').classList.add('hide');
    document.getElementById('main-fab').classList.remove('hide');
    
    // Configurar Navbar
    const navAv = document.getElementById('navAv');
    navAv.innerText = userSession.username[0].toUpperCase();
    navAv.style.background = userSession.color;

    loadFeed();
}

async function loadFeed() {
    const res = await fetch('/api/posts/all');
    const posts = await res.json();
    const container = document.getElementById('posts-container');
    container.innerHTML = '';

    posts.forEach(p => {
        const card = document.createElement('div');
        card.className = 'post-card animate-pop';
        card.innerHTML = `
            ${p.image_url ? `<img src="${p.image_url}" class="post-banner">` : ''}
            <div class="post-info">
                <span class="tag">${p.category}</span>
                <h3 style="margin:10px 0">${p.title}</h3>
                <p style="color:var(--muted); font-size:0.9rem">${p.description}</p>
                <div class="post-user" onclick="openProfile(${p.user_id})" style="display:flex; align-items:center; gap:10px; margin-top:20px; cursor:pointer">
                    <div class="avatar-sm" style="background:${p.color}">${p.username[0].toUpperCase()}</div>
                    <b style="color:var(--p)">@${p.username}</b>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

async function submitPost(e) {
    e.preventDefault();
    const postData = {
        user_id: userSession.id,
        title: document.getElementById('postTitle').value,
        description: document.getElementById('postDesc').value,
        image_url: document.getElementById('postImg').value,
        category: document.getElementById('postCat').value
    };

    const res = await fetch('/api/posts/create', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(postData)
    });

    if (res.ok) {
        showToast("¡Proyecto publicado con éxito!");
        togglePostModal(false);
        loadFeed();
        e.target.reset();
    }
}

async function liveSearch(q) {
    if (!q) return changeView('feed');
    changeView('search');
    const res = await fetch(`/api/social/search?q=${q}&myId=${userSession.id}`);
    const users = await res.json();
    const container = document.getElementById('search-results');
    container.innerHTML = '';

    users.forEach(u => {
        const div = document.createElement('div');
        div.className = 'user-card-search animate-pop';
        div.onclick = () => openProfile(u.id);
        div.innerHTML = `
            <div class="avatar-sm" style="background:${u.color}">${u.username[0].toUpperCase()}</div>
            <b>@${u.username}</b>
            <span>${u.followers_count} seguidores</span>
        `;
        container.appendChild(div);
    });
}

async function openProfile(id) {
    viewingUserId = id;
    const res = await fetch(`/api/user/${id}`);
    const u = await res.json();

    document.getElementById('profileBanner').style.background = u.color;
    document.getElementById('profileAv').innerText = u.username[0].toUpperCase();
    document.getElementById('profileAv').style.background = u.color;
    document.getElementById('profileName').innerText = "@" + u.username;
    document.getElementById('profileBio').innerText = u.bio;
    document.getElementById('statFol').innerText = u.followers_count;
    document.getElementById('statIng').innerText = u.following_count;

    document.getElementById('followBtn').classList.toggle('hide', id === userSession.id);
    changeView('profile');
}

function viewMyProfile() { openProfile(userSession.id); }
