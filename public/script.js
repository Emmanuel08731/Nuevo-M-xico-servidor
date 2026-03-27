let currentUser = JSON.parse(localStorage.getItem('emmanuel_session')) || null;
let mode = 'login';

// 1. CONTROL DE ACCESO
function checkSession() {
    if (currentUser) {
        document.getElementById('authWall').classList.add('hidden');
        renderHeader();
        loadFeed("");
    }
}

function switchAuth(m) {
    mode = m;
    const emailInput = document.getElementById('auth_email');
    const tabs = document.querySelectorAll('#authTabs button');
    
    if (mode === 'register') {
        emailInput.classList.remove('hidden');
        tabs[1].classList.add('active');
        tabs[0].classList.remove('active');
        document.getElementById('authBtn').innerText = "Crear Cuenta";
    } else {
        emailInput.classList.add('hidden');
        tabs[0].classList.add('active');
        tabs[1].classList.remove('active');
        document.getElementById('authBtn').innerText = "Entrar";
    }
}

// 2. REGISTRO Y LOGIN
async function handleAuth(e) {
    e.preventDefault();
    const user = document.getElementById('auth_user').value;
    const pass = document.getElementById('auth_pass').value;
    const email = document.getElementById('auth_email').value;

    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const body = mode === 'login' ? { username: user, password: pass } : { username: user, email, password: pass };

    try {
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await res.json();

        if (res.ok) {
            currentUser = data;
            localStorage.setItem('emmanuel_session', JSON.stringify(data));
            location.reload();
        } else {
            alert(data.error);
        }
    } catch (err) { alert("Error al conectar con el servidor."); }
}

// 3. BUSCADOR EN VIVO
let timer;
function liveSearch() {
    clearTimeout(timer);
    const q = document.getElementById('searchInput').value;
    timer = setTimeout(() => loadFeed(q), 300);
}

async function loadFeed(q) {
    const res = await fetch(`/api/social/search?q=${q}`);
    const users = await res.json();
    const feed = document.getElementById('feedList');
    feed.innerHTML = '';

    users.forEach(u => {
        feed.innerHTML += `
            <div class="profile-card">
                <div class="avatar-big" style="background: ${u.color}">${u.username[0].toUpperCase()}</div>
                <div class="info-profile">
                    <h4>@${u.username} ${u.is_verified ? '✅' : ''}</h4>
                    <p>${u.bio}</p>
                    <small>${u.followers_count} seguidores</small>
                </div>
                <button class="btn-follow" onclick="follow(${u.id})">Seguir</button>
            </div>
        `;
    });
}

async function follow(id) {
    const res = await fetch('/api/social/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ follower_id: currentUser.id, following_id: id })
    });
    if (res.ok) alert("¡Ahora sigues a este usuario!");
}

function renderHeader() {
    document.getElementById('userNameHeader').innerText = currentUser.username;
    document.getElementById('userAvHeader').innerText = currentUser.username[0].toUpperCase();
    document.getElementById('userAvHeader').style.background = currentUser.color;
    document.getElementById('myBio').innerText = currentUser.bio;
    document.getElementById('myFollowers').innerText = currentUser.followers_count;
}

function logout() {
    localStorage.removeItem('emmanuel_session');
    location.reload();
}

window.onload = checkSession;
