/**
 * EMMANUEL SOCIAL ENGINE v5.0
 * CLIENT-SIDE INTERACTION LOGIC
 * Desarrollado para: Emmanuel Store
 */

// --- CONFIGURACIÓN Y ESTADO ---
const AppState = {
    user: JSON.parse(localStorage.getItem('emmanuel_user')) || null,
    isSearching: false,
    lastQuery: '',
    apiBase: '/api/social'
};

// --- INICIALIZADOR ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("🔥 Script de Emmanuel Store cargado correctamente");
    initSocialEngine();
});

function initSocialEngine() {
    // Si no hay sesión, mandamos al login (Auth Wall)
    if (!AppState.user) {
        showAuthWall();
    } else {
        hideAuthWall();
        updateUIHeader();
        loadInitialFeed();
    }
}

// --- SISTEMA DE AUTENTICACIÓN ---

/**
 * Registra un nuevo usuario y guarda la sesión en el navegador
 */
async function handleRegister(event) {
    event.preventDefault();
    const btn = event.target.querySelector('button');
    const originalText = btn.innerText;
    
    btn.disabled = true;
    btn.innerText = "Conectando con Postgres...";

    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());

    try {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await res.json();

        if (res.ok) {
            AppState.user = result.user;
            localStorage.setItem('emmanuel_user', JSON.stringify(result.user));
            notify("¡Cuenta creada con éxito!", "success");
            setTimeout(() => location.reload(), 1000);
        } else {
            notify(result.error, "error");
            btn.disabled = false;
            btn.innerText = originalText;
        }
    } catch (err) {
        notify("Error de red: El servidor no responde", "error");
        btn.disabled = false;
        btn.innerText = originalText;
    }
}

// --- BUSCADOR TIPO TIKTOK ---

let searchTimeout;
/**
 * Busca usuarios en tiempo real mientras Emmanuel escribe
 */
function performSearch(query) {
    const feed = document.getElementById('mainFeed');
    AppState.lastQuery = query;

    // Limpiamos el temporizador previo (Debounce)
    clearTimeout(searchTimeout);

    if (query.trim().length === 0) {
        return loadInitialFeed();
    }

    // Esperamos 400ms antes de consultar a Postgres
    searchTimeout = setTimeout(async () => {
        feed.innerHTML = '<div class="loader-shimmer">Buscando en la base de datos...</div>';
        
        try {
            const res = await fetch(`/api/social/search?query=${query}`);
            const users = await res.json();
            renderUserFeed(users);
        } catch (err) {
            console.error("Error en la búsqueda remota");
        }
    }, 400);
}

// --- RENDERIZADO DE INTERFAZ ---

/**
 * Dibuja las tarjetas de usuario en el feed principal
 */
function renderUserFeed(users) {
    const feed = document.getElementById('mainFeed');
    feed.innerHTML = ''; // Limpiar feed actual

    if (users.length === 0) {
        feed.innerHTML = `
            <div class="no-results animate-up">
                <i class="fa-solid fa-ghost"></i>
                <p>No encontramos a nadie llamado "${AppState.lastQuery}"</p>
                <button onclick="loadInitialFeed()" class="btn-retry">Ver sugerencias</button>
            </div>
        `;
        return;
    }

    users.forEach((u, index) => {
        const card = document.createElement('div');
        card.className = 'profile-card animate-up';
        card.style.animationDelay = `${index * 0.05}s`;

        // Generamos el HTML de la tarjeta
        card.innerHTML = `
            <div class="profile-left">
                <div class="avatar-circle" style="background: ${u.color}">
                    ${u.username[0].toUpperCase()}
                </div>
                <div class="profile-details">
                    <h4>
                        ${u.username} 
                        ${u.is_verified ? '<i class="fa-solid fa-circle-check verified"></i>' : ''}
                    </h4>
                    <p class="bio-text">${u.bio || '¡Soy parte de la red de Emmanuel!'}</p>
                    <div class="stats-row">
                        <span><b>${u.followers_count}</b> seguidores</span>
                    </div>
                </div>
            </div>
            <div class="profile-actions">
                <button class="btn-follow" id="f-btn-${u.id}" onclick="executeFollow(${u.id})">
                    Seguir
                </button>
            </div>
        `;
        feed.appendChild(card);
    });
}

// --- ACCIONES SOCIALES (DB WRITE) ---

/**
 * Registra la relación de seguimiento en Postgres
 */
async function executeFollow(targetId) {
    const btn = document.getElementById(`f-btn-${targetId}`);
    
    if (!AppState.user) return notify("Inicia sesión para seguir personas", "info");
    if (btn.classList.contains('active')) return;

    btn.innerText = "...";
    
    try {
        const res = await fetch('/api/social/follow', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                follower_id: AppState.user.id,
                following_id: targetId
            })
        });

        if (res.ok) {
            btn.innerText = "Siguiendo";
            btn.classList.add('active');
            btn.style.background = "#f1f1f2";
            btn.style.color = "#000";
            notify("¡Ahora sigues a este usuario!", "success");
        } else {
            notify("No puedes seguirte a ti mismo", "error");
            btn.innerText = "Seguir";
        }
    } catch (err) {
        notify("Error al conectar con Postgres", "error");
        btn.innerText = "Seguir";
    }
}

// --- UTILIDADES DE UI ---

function updateUIHeader() {
    const navName = document.getElementById('navUsername');
    const navAv = document.getElementById('navAvatar');
    
    if (navName && AppState.user) {
        navName.innerText = AppState.user.username;
        navAv.innerText = AppState.user.username[0].toUpperCase();
        navAv.style.background = AppState.user.color;
    }
}

async function loadInitialFeed() {
    try {
        const res = await fetch('/api/social/search?query='); // Carga global
        const users = await res.json();
        renderUserFeed(users);
    } catch (e) {
        console.log("Error cargando feed inicial");
    }
}

function notify(msg, type) {
    console.log(`[${type.toUpperCase()}] ${msg}`);
    // Aquí puedes disparar un Toast si lo tienes en el CSS
    const toast = document.createElement('div');
    toast.className = `toast-notif ${type} animate-up`;
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function showAuthWall() {
    document.getElementById('authWall').classList.remove('hidden');
}

function hideAuthWall() {
    document.getElementById('authWall').classList.add('hidden');
}

function logout() {
    localStorage.removeItem('emmanuel_user');
    location.reload();
}
