/**
 * ==========================================================
 * ECNHACA SOCIAL ENGINE v500.0
 * DESARROLLADOR: EMMANUEL
 * LÓGICA: AUTH, NAVEGACIÓN, MODAL DINÁMICO Y SEGUIDORES
 * ==========================================================
 */

const STATE = {
    isAuthenticated: false,
    user: {
        username: "",
        followers: 0,
        following: 0,
        posts: 0
    },
    activeView: 'feed'
};

const UI = {
    authView: document.getElementById('view-auth'),
    appView: document.getElementById('view-app'),
    preloader: document.getElementById('preloader'),
    dropdown: document.getElementById('user-dropdown'),
    publishModal: document.getElementById('publish-overlay'),
    // Stats del perfil
    statFollowers: document.getElementById('stat-followers'),
    statFollowing: document.getElementById('stat-following'),
    statPosts: document.getElementById('stat-posts')
};

// --- 1. CARGA INICIAL ---
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        UI.preloader.style.opacity = '0';
        setTimeout(() => UI.preloader.classList.add('hide'), 600);
    }, 1200);

    // Verificar si ya había una sesión (opcional)
    const savedSession = localStorage.getItem('ec_session');
    if (savedSession) {
        STATE.user = JSON.parse(savedSession);
        launchApp();
    }
});

// --- 2. SISTEMA DE AUTENTICACIÓN ---
function setAuthMode(mode) {
    const tabLogin = document.getElementById('tab-login');
    const tabReg = document.getElementById('tab-reg');
    const emailGroup = document.getElementById('reg-email-group');

    if (mode === 'register') {
        tabReg.classList.add('active');
        tabLogin.classList.remove('active');
        emailGroup.classList.remove('hide');
    } else {
        tabLogin.classList.add('active');
        tabReg.classList.remove('active');
        emailGroup.classList.add('hide');
    }
}

function handleAuth(event) {
    event.preventDefault();
    const username = document.getElementById('auth-user').value.trim();
    
    if (!username) return;

    // Emmanuel: Al iniciar sesión o registrarse, seteamos los datos de la red
    STATE.user.username = username;
    STATE.user.followers = 0;
    STATE.user.following = 0;
    STATE.user.posts = 0;

    localStorage.setItem('ec_session', JSON.stringify(STATE.user));
    launchApp();
}

function launchApp() {
    UI.authView.classList.add('hide');
    UI.appView.classList.remove('hide');
    
    // Actualizar UI con el nombre del usuario
    document.getElementById('nav-avatar').innerText = STATE.user.username.charAt(0).toUpperCase();
    document.getElementById('drop-username').innerText = STATE.user.username;
    document.getElementById('profile-username').innerText = STATE.user.username;
    document.getElementById('profile-avatar').innerText = STATE.user.username.charAt(0).toUpperCase();
    
    updateStats();
    notify(`Bienvenido a ECNHACA, ${STATE.user.username}`, "success");
}

// --- 3. NAVEGACIÓN Y MENÚS ---
function toggleDropdown() {
    UI.dropdown.classList.toggle('hide');
}

function showView(viewName) {
    const views = document.querySelectorAll('.view-sec');
    views.forEach(v => v.classList.add('hide'));
    
    document.getElementById(`sec-${viewName}`).classList.remove('hide');
    UI.dropdown.classList.add('hide');
    window.scrollTo(0, 0);
}

// --- 4. MODAL DE PUBLICACIÓN (ANIMADO) ---
function togglePublishModal() {
    UI.publishModal.classList.toggle('hide');
}

function publishPost() {
    const title = document.getElementById('post-title').value;
    const content = document.getElementById('post-content').value;
    const topic = document.getElementById('post-topic').value || "General";

    if (!title || !content) {
        notify("Emmanuel, el título y contenido son obligatorios", "error");
        return;
    }

    // Crear el elemento visual del post
    const feed = document.getElementById('feed-container');
    // Si es el primer post, quitamos el mensaje de "vacío"
    if (STATE.user.posts === 0) feed.innerHTML = "";

    const postHTML = `
        <div class="post-card animated-in" style="margin-bottom: 20px;">
            <div class="post-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div class="u-avatar" style="width: 35px; height: 35px; font-size: 0.8rem;">${STATE.user.username.charAt(0).toUpperCase()}</div>
                    <div>
                        <b style="font-size: 0.9rem;">${STATE.user.username}</b>
                        <small style="display: block; color: #86868b; font-size: 0.7rem;">Ahora mismo • ${topic}</small>
                    </div>
                </div>
                <button onclick="deletePost(this)" style="background: none; border: none; color: #d2d2d7; cursor: pointer;"><i class="fa fa-trash"></i></button>
            </div>
            <h3 style="margin-bottom: 10px; font-size: 1.1rem; font-weight: 800;">${title}</h3>
            <p style="font-size: 0.95rem; line-height: 1.5; color: #333;">${content}</p>
        </div>
    `;

    feed.insertAdjacentHTML('afterbegin', postHTML);
    
    // Actualizar conteo
    STATE.user.posts++;
    updateStats();
    
    // Limpiar y cerrar
    document.getElementById('post-title').value = "";
    document.getElementById('post-content').value = "";
    togglePublishModal();
    notify("Publicación enviada", "success");
}

function deletePost(btn) {
    if(confirm("¿Eliminar publicación?")) {
        btn.closest('.post-card').remove();
        STATE.user.posts--;
        updateStats();
        if(STATE.user.posts === 0) renderEmptyState();
    }
}

// --- 5. BUSCADOR DUAL ---
function executeSearch() {
    const type = document.getElementById('search-type').value;
    const query = document.getElementById('global-search').value.toLowerCase().trim();

    if (!query) return;

    if (type === 'users') {
        showView('search-users');
        const grid = document.getElementById('users-result-grid');
        grid.innerHTML = `
            <div class="user-card">
                <div class="u-avatar-lg" style="width: 60px; height: 60px; background: #f5f5f7; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; font-weight: 800;">${query.charAt(0).toUpperCase()}</div>
                <h4>${query}</h4>
                <button class="btn-follow" style="margin-top: 10px; padding: 5px 15px; border-radius: 20px; border: 1px solid #000; background: none; font-weight: 700; cursor: pointer;" onclick="toggleFollow(this)">Seguir</button>
            </div>
        `;
    } else {
        notify(`Buscando publicaciones sobre: ${query}`, "success");
    }
}

function toggleFollow(btn) {
    if (btn.innerText === "Seguir") {
        btn.innerText = "Siguiendo";
        btn.style.background = "#000";
        btn.style.color = "#fff";
        STATE.user.following++;
    } else {
        btn.innerText = "Seguir";
        btn.style.background = "none";
        btn.style.color = "#000";
        STATE.user.following--;
    }
    updateStats();
}

// --- 6. UTILIDADES ---
function updateStats() {
    UI.statFollowers.innerText = STATE.user.followers;
    UI.statFollowing.innerText = STATE.user.following;
    UI.statPosts.innerText = STATE.user.posts;
}

function renderEmptyState() {
    document.getElementById('feed-container').innerHTML = `
        <div class="empty-state" style="text-align: center; padding: 50px; color: #86868b;">
            <i class="fa fa-earth-americas" style="font-size: 2rem; margin-bottom: 10px;"></i>
            <p>Aún no hay publicaciones en tu red.</p>
        </div>
    `;
}

function notify(msg, type) {
    const box = document.getElementById('toast-box');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerText = msg;
    box.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function logout() {
    localStorage.removeItem('ec_session');
    location.reload();
}
