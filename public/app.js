/**
 * EMMANUEL SOCIAL ENGINE - CLIENT SIDE
 * MANEJO DE ESTADOS Y API FETCH
 */

// ESTADO GLOBAL DE LA APP
const state = {
    user: JSON.parse(localStorage.getItem('emmanuel_user')) || null,
    searchResults: [],
    isSearching: false
};

// SELECTORES DOM
const feed = document.getElementById('mainFeed');
const searchInput = document.getElementById('globalSearch');
const authWall = document.getElementById('authWall');

/**
 * INICIALIZACIÓN DE LA WEB
 */
function init() {
    console.log("🛠️ App de Emmanuel Inicializada");
    checkAuth();
    loadDefaultProfiles();
}

/**
 * CONTROL DE ACCESO (AUTH)
 */
function checkAuth() {
    if (!state.user) {
        authWall.classList.remove('hidden');
    } else {
        authWall.classList.add('hidden');
        renderHeader();
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    btn.innerText = "Creando...";
    
    const data = {
        username: e.target.username.value,
        email: e.target.email.value,
        password: e.target.password.value
    };

    try {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await res.json();
        
        if (res.ok) {
            state.user = result.user;
            localStorage.setItem('emmanuel_user', JSON.stringify(result.user));
            location.reload();
        } else {
            alert(result.error);
        }
    } catch (err) {
        console.error("Error de red");
    } finally {
        btn.innerText = "Registrarse";
    }
}

/**
 * BUSCADOR EN TIEMPO REAL
 */
let debounceTimer;
function performSearch(query) {
    clearTimeout(debounceTimer);
    if (!query) return loadDefaultProfiles();

    debounceTimer = setTimeout(async () => {
        try {
            const res = await fetch(`/api/social/search?query=${query}`);
            const users = await res.json();
            renderProfiles(users);
        } catch (err) {
            console.error("Error buscando usuarios");
        }
    }, 300);
}

/**
 * RENDERIZADO DE PERFILES (ESTILO TIKTOK)
 */
function renderProfiles(users) {
    feed.innerHTML = users.length > 0 
        ? '' 
        : '<p class="empty-msg">No se encontraron usuarios en Emmanuel Store</p>';

    users.forEach((u, index) => {
        const card = document.createElement('div');
        card.className = 'profile-card animate-up';
        card.style.animationDelay = `${index * 0.1}s`;
        
        card.innerHTML = `
            <div class="avatar-circle" style="background: ${u.color}">
                ${u.username[0].toUpperCase()}
            </div>
            <div class="profile-info">
                <h4>
                    ${u.username} 
                    ${u.is_verified ? '<span class="verified-icon">●</span>' : ''}
                </h4>
                <p>${u.bio}</p>
                <small>👥 ${u.followers_count} Seguidores</small>
            </div>
            <button class="btn-follow" onclick="followUser(${u.id}, this)">
                Seguir
            </button>
        `;
        feed.appendChild(card);
    });
}

/**
 * ACCIÓN DE SEGUIR
 */
async function followUser(id, btn) {
    if (!state.user) return alert("Inicia sesión primero");
    
    btn.disabled = true;
    btn.innerText = "Siguiendo...";

    try {
        const res = await fetch('/api/social/follow', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                follower_id: state.user.id,
                following_id: id
            })
        });

        if (res.ok) {
            btn.classList.add('following');
            btn.innerText = "Siguiendo";
        }
    } catch (err) {
        btn.disabled = false;
        btn.innerText = "Seguir";
    }
}

// INICIO DE LA APP AL CARGAR
window.onload = init;
