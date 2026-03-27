/**
 * EMMANUEL SOCIAL ENGINE - FRONTEND v5.0
 * Este script maneja toda la lógica interactiva de la red social.
 */

// --- 1. ESTADO GLOBAL DE LA APLICACIÓN ---
const App = {
    user: JSON.parse(localStorage.getItem('emmanuel_session')) || null,
    isSearching: false,
    currentTab: 'para-ti',
    apiBase: '/api',
    config: {
        debounceTime: 400, // Tiempo de espera para no saturar Postgres
        colors: {
            primary: '#fe2c55',
            accent: '#25f4ee'
        }
    }
};

// --- 2. INICIALIZACIÓN AL CARGAR LA PÁGINA ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 Sistema Emmanuel Social cargado...");
    initApp();
});

function initApp() {
    // Verificamos si hay una sesión activa en el navegador
    if (!App.user) {
        showScreen('authWall');
    } else {
        showScreen('mainLayout');
        updateHeaderUI();
        loadDynamicFeed(""); // Carga inicial de usuarios sugeridos
    }
    setupEventListeners();
}

// --- 3. GESTIÓN DE PANTALLAS (SPA LOGIC) ---
function showScreen(screenId) {
    const screens = ['authWall', 'mainLayout'];
    screens.forEach(s => {
        const el = document.getElementById(s);
        if (el) {
            s === screenId ? el.classList.remove('hidden') : el.classList.add('hidden');
        }
    });
}

// --- 4. SISTEMA DE AUTENTICACIÓN (LOGIN/REGISTRO) ---
let authMode = 'login';

function switchAuth(mode) {
    authMode = mode;
    const emailGroup = document.getElementById('emailGroup'); // Asegúrate de tener este ID en el HTML
    const btn = document.getElementById('authSubmitBtn');
    const tabs = document.querySelectorAll('.auth-tab');

    if (mode === 'register') {
        emailGroup?.classList.remove('hidden');
        btn.innerText = "Crear Mi Cuenta";
        tabs[1].classList.add('active');
        tabs[0].classList.remove('active');
    } else {
        emailGroup?.classList.add('hidden');
        btn.innerText = "Entrar Ahora";
        tabs[0].classList.add('active');
        tabs[1].classList.remove('active');
    }
}

async function handleAuth(event) {
    event.preventDefault();
    const btn = event.target.querySelector('button');
    const originalBtnText = btn.innerText;
    
    // Bloqueamos el botón para evitar doble clic
    btn.disabled = true;
    btn.innerText = "Conectando con Postgres...";

    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());

    const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            // Guardamos la sesión en el navegador (LocalStorage)
            App.user = result;
            localStorage.setItem('emmanuel_session', JSON.stringify(result));
            
            showNotification("¡Éxito! Entrando al sistema...", "success");
            setTimeout(() => location.reload(), 1000);
        } else {
            showNotification(result.error || "Error en la autenticación", "error");
            btn.disabled = false;
            btn.innerText = originalBtnText;
        }
    } catch (err) {
        showNotification("Fallo de red: ¿Está Render encendido?", "error");
        btn.disabled = false;
        btn.innerText = originalBtnText;
    }
}

// --- 5. BUSCADOR EN TIEMPO REAL (ALTA VELOCIDAD) ---
let searchDebounce;
function liveSearch(query) {
    clearTimeout(searchDebounce);
    
    // No buscamos si el texto es muy corto (ahorro de recursos)
    if (query.trim().length === 0) {
        return loadDynamicFeed("");
    }

    searchDebounce = setTimeout(async () => {
        console.log(`🔍 Buscando a: ${query}`);
        const feedContainer = document.getElementById('feedList');
        feedContainer.innerHTML = '<div class="loader-skeleton">Buscando...</div>';
        
        loadDynamicFeed(query);
    }, App.config.debounceTime);
}

async function loadDynamicFeed(query) {
    const feedContainer = document.getElementById('feedList');
    
    try {
        const response = await fetch(`/api/social/search?q=${query}`);
        const users = await response.json();
        
        renderUsers(users);
    } catch (err) {
        console.error("Error cargando el feed");
        feedContainer.innerHTML = '<p>Error al conectar con la base de datos de Oregon.</p>';
    }
}

// --- 6. RENDERIZADO DE COMPONENTES ---
function renderUsers(users) {
    const container = document.getElementById('feedList');
    container.innerHTML = '';

    if (users.length === 0) {
        container.innerHTML = `
            <div class="empty-state animate-up">
                <i class="fa fa-search"></i>
                <p>No hay resultados para tu búsqueda.</p>
            </div>
        `;
        return;
    }

    users.forEach((u, index) => {
        const card = document.createElement('div');
        card.className = 'profile-card animate-up';
        card.style.animationDelay = `${index * 0.05}s`;

        card.innerHTML = `
            <div class="profile-left">
                <div class="avatar-big" style="background: ${u.color || '#fe2c55'}">
                    ${u.username[0].toUpperCase()}
                </div>
                <div class="profile-main-info">
                    <h4>@${u.username} ${u.is_verified ? '<i class="fa fa-check-circle verified"></i>' : ''}</h4>
                    <p class="user-bio">${u.bio || 'Desarrollador en Emmanuel Store'}</p>
                    <div class="user-stats-mini">
                        <span><b>${u.followers_count || 0}</b> seguidores</span>
                    </div>
                </div>
            </div>
            <div class="profile-right">
                <button class="btn-follow" id="btn-follow-${u.id}" onclick="executeFollow(${u.id})">
                    Seguir
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

// --- 7. ACCIONES SOCIALES (FOLLOW SYSTEM) ---
async function executeFollow(targetId) {
    const btn = document.getElementById(`btn-follow-${targetId}`);
    
    if (btn.classList.contains('following')) return;

    try {
        const response = await fetch('/api/social/follow', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                follower_id: App.user.id,
                following_id: targetId
            })
        });

        if (response.ok) {
            btn.innerText = "Siguiendo";
            btn.classList.add('following');
            showNotification("¡Ahora sigues a este usuario!", "success");
        } else {
            const err = await response.json();
            showNotification(err.error, "info");
        }
    } catch (err) {
        showNotification("Error al procesar el follow", "error");
    }
}

// --- 8. UI HELPERS ---
function updateHeaderUI() {
    if (!App.user) return;
    
    const nameLabel = document.getElementById('userNameHeader');
    const avatar = document.getElementById('userAvHeader');
    
    if (nameLabel) nameLabel.innerText = App.user.username;
    if (avatar) {
        avatar.innerText = App.user.username[0].toUpperCase();
        avatar.style.background = App.user.color;
    }
}

function showNotification(msg, type) {
    // Emmanuel, aquí puedes crear un div de alerta dinámico
    console.log(`[${type.toUpperCase()}] ${msg}`);
    const toast = document.createElement('div');
    toast.className = `toast-notif ${type} animate-up`;
    toast.innerText = msg;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

function logout() {
    localStorage.removeItem('emmanuel_session');
    location.reload();
}

// --- 9. CONFIGURACIÓN DE EVENTOS ---
function setupEventListeners() {
    // Aquí puedes añadir más clics o efectos
}
