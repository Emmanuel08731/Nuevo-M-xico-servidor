/**
 * EMMANUEL SOCIAL ENGINE v5.0
 * SISTEMA DE INTERACCIÓN EN TIEMPO REAL
 */

const state = {
    currentUser: JSON.parse(localStorage.getItem('emmanuel_session')) || null,
    isSearching: false,
    lastQuery: ''
};

// 1. INICIALIZADOR
document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 Red Social de Emmanuel Iniciada");
    initApp();
});

function initApp() {
    if (!state.currentUser) {
        document.getElementById('authWall').classList.remove('hidden');
    } else {
        document.getElementById('authWall').classList.add('hidden');
        setupUI();
        loadInitialFeed();
    }
}

// 2. SISTEMA DE REGISTRO / LOGIN
async function handleRegister(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    try {
        showToast("Conectando con Postgres...", "info");
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await res.json();

        if (res.ok) {
            state.currentUser = result.user;
            localStorage.setItem('emmanuel_session', JSON.stringify(result.user));
            showToast("¡Bienvenido a tu nueva red!", "success");
            setTimeout(() => location.reload(), 1500);
        } else {
            showToast(result.error, "error");
        }
    } catch (err) {
        showToast("Error de conexión al servidor", "error");
    }
}

// 3. BUSCADOR INTELIGENTE (ESTILO TIKTOK)
let searchTimer;
function performSearch(query) {
    state.lastQuery = query;
    clearTimeout(searchTimer);
    
    if (query.trim().length === 0) {
        return loadInitialFeed();
    }

    searchTimer = setTimeout(async () => {
        const feed = document.getElementById('mainFeed');
        feed.innerHTML = '<div class="loader-spinner"></div>';

        try {
            const res = await fetch(`/api/social/search?query=${query}`);
            const users = await res.json();
            renderUsers(users);
        } catch (err) {
            console.error("Error en búsqueda");
        }
    }, 400);
}

// 4. RENDERIZADO DE PERFILES
function renderUsers(users) {
    const feed = document.getElementById('mainFeed');
    feed.innerHTML = '';

    if (users.length === 0) {
        feed.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-user-slash"></i>
                <p>No encontramos a "${state.lastQuery}" en Emmanuel Store</p>
            </div>
        `;
        return;
    }

    users.forEach((u, i) => {
        const card = document.createElement('div');
        card.className = 'profile-card animate-up';
        card.style.animationDelay = `${i * 0.1}s`;

        card.innerHTML = `
            <div class="avatar-circle" style="background: ${u.color || '#fe2c55'}">
                ${u.username[0].toUpperCase()}
            </div>
            <div class="profile-info">
                <h4>${u.username} ${u.is_verified ? '<i class="fa-solid fa-circle-check verified"></i>' : ''}</h4>
                <p>${u.bio || 'Sin biografía disponible.'}</p>
                <div class="profile-stats">
                    <span><b>${u.followers_count}</b> seguidores</span>
                </div>
            </div>
            <button class="btn-follow" id="btn-${u.id}" onclick="followAction(${u.id})">
                Seguir
            </button>
        `;
        feed.appendChild(card);
    });
}

// 5. ACCIÓN DE SEGUIR (DATABASE CONNECT)
async function followAction(targetId) {
    const btn = document.getElementById(`btn-${targetId}`);
    
    if (btn.classList.contains('following')) return;

    try {
        const res = await fetch('/api/social/follow', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                follower_id: state.currentUser.id,
                following_id: targetId
            })
        });

        if (res.ok) {
            btn.innerText = "Siguiendo";
            btn.classList.add('following');
            showToast("¡Nuevo amigo seguido!", "success");
        }
    } catch (err) {
        showToast("Error al seguir usuario", "error");
    }
}

// 6. UI Y UTILIDADES
function setupUI() {
    document.getElementById('navUsername').innerText = state.currentUser.username;
    const avatar = document.getElementById('navAvatar');
    avatar.innerText = state.currentUser.username[0].toUpperCase();
    avatar.style.background = state.currentUser.color || '#fe2c55';
    
    document.getElementById('userFollowers').innerText = state.currentUser.followers_count || 0;
    document.getElementById('userFollowing').innerText = state.currentUser.following_count || 0;
}

async function loadInitialFeed() {
    // Carga usuarios por defecto para que la web no esté vacía
    const res = await fetch('/api/social/search?query=');
    const users = await res.json();
    renderUsers(users);
}

function showToast(msg, type) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fa-solid fa-info-circle"></i> ${msg}`;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

function toggleAuth() {
    showToast("Función de Login próximamente...", "info");
}

function logout() {
    localStorage.removeItem('emmanuel_session');
    location.reload();
}
