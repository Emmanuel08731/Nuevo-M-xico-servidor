/**
 * ==========================================================
 * ECNHACA SOCIAL ENGINE v400.0
 * DESARROLLADOR: EMMANUEL
 * PROPÓSITO: LÓGICA DE RED SOCIAL (POSTS, FOLLOWERS, SEARCH)
 * PROTOCOLO: WHITE MINIMALIST
 * ==========================================================
 */

// --- ESTADO GLOBAL DE LA RED ---
const STATE = {
    currentUser: {
        id: 1,
        username: "Emmanuel_Dev",
        followers: 128,
        following: 45,
        posts: 12
    },
    view: 'feed', // feed, profile, settings, search-users
    isMenuOpen: false
};

// --- ELEMENTOS DE LA INTERFAZ ---
const DOM = {
    preloader: document.getElementById('preloader'),
    userDropdown: document.getElementById('user-dropdown'),
    views: document.querySelectorAll('.content-view'),
    searchType: document.getElementById('search-type'),
    searchInput: document.getElementById('global-search'),
    postsContainer: document.getElementById('posts-container'),
    followersCount: document.getElementById('count-followers'),
    followingCount: document.getElementById('count-following'),
    modalPost: document.getElementById('modal-post-settings')
};

// --- 1. INICIALIZACIÓN ---
window.addEventListener('DOMContentLoaded', () => {
    console.log("ECNHACA Social cargando...");
    
    // Simular carga
    setTimeout(() => {
        DOM.preloader.style.opacity = '0';
        setTimeout(() => DOM.preloader.classList.add('hide'), 600);
    }, 1500);

    setupEventListeners();
});

function setupEventListeners() {
    // Escuchar Enter en el buscador
    DOM.searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') executeSearch();
    });

    // Cerrar menú al hacer clic fuera
    window.addEventListener('click', (e) => {
        if (!e.target.closest('.user-menu-section')) {
            DOM.userDropdown.classList.add('hide');
            STATE.isMenuOpen = false;
        }
    });
}

// --- 2. NAVEGACIÓN DE VISTAS ---
function showView(viewName) {
    DOM.views.forEach(v => v.classList.add('hide'));
    const target = document.getElementById(`view-${viewName}`);
    
    if (target) {
        target.classList.remove('hide');
        STATE.view = viewName;
        window.scrollTo(0, 0);
    }
    
    // Cerrar menú después de elegir
    DOM.userDropdown.classList.add('hide');
}

function toggleUserMenu() {
    STATE.isMenuOpen = !STATE.isMenuOpen;
    DOM.userDropdown.classList.toggle('hide', !STATE.isMenuOpen);
}

// --- 3. LÓGICA DE PUBLICACIONES ---
function submitPost() {
    const title = document.getElementById('post-title').value;
    const desc = document.getElementById('post-desc').value;
    const tag = document.getElementById('post-tag').value;

    if (!title || !desc) {
        alert("Emmanuel, por favor completa el título y la descripción.");
        return;
    }

    // Crear elemento de post (Simulación)
    const newPost = document.createElement('div');
    newPost.className = 'post-card';
    newPost.innerHTML = `
        <div class="post-header">
            <div class="u-info">
                <div class="u-pic">E</div>
                <div>
                    <b>${STATE.currentUser.username}</b>
                    <small>Ahora mismo • ${tag || 'General'}</small>
                </div>
            </div>
            <div class="post-actions">
                <button onclick="openPostSettings()"><i class="fa fa-ellipsis"></i></button>
            </div>
        </div>
        <div class="post-body">
            <h4>${title}</h4>
            <p>${desc}</p>
        </div>
        <div class="post-footer">
            <button class="btn-action" onclick="this.classList.toggle('active')"><i class="fa fa-heart"></i> Like</button>
            <button class="btn-action"><i class="fa fa-comment"></i> Comentar</button>
        </div>
    `;

    // Insertar al inicio del feed
    DOM.postsContainer.prepend(newPost);
    
    // Limpiar formulario
    document.getElementById('form-create-post').reset();
    
    // Actualizar contador
    STATE.currentUser.posts++;
    document.getElementById('count-posts').innerText = STATE.currentUser.posts;
}

function openPostSettings() {
    DOM.modalPost.classList.remove('hide');
}

function closeModals() {
    DOM.modalPost.classList.add('hide');
}

function deletePost() {
    if(confirm("¿Eliminar esta publicación de ECNHACA?")) {
        // En un caso real buscaríamos el ID, aquí simulamos borrar el último
        const lastPost = DOM.postsContainer.firstChild;
        if(lastPost) lastPost.remove();
        closeModals();
        STATE.currentUser.posts--;
        document.getElementById('count-posts').innerText = STATE.currentUser.posts;
    }
}

// --- 4. BUSCADOR DUAL (USUARIOS / POSTS) ---
function executeSearch() {
    const type = DOM.searchType.value;
    const query = DOM.searchInput.value.toLowerCase().trim();

    if (!query) return;

    if (type === 'users') {
        showView('search-users');
        renderUserResults(query);
    } else {
        showView('feed');
        // Filtrar posts existentes (lógica simple)
        console.log(`Buscando posts sobre: ${query}`);
    }
}

function renderUserResults(query) {
    const container = document.getElementById('users-result');
    container.innerHTML = ''; // Limpiar

    // Simulación de base de datos de usuarios
    const fakeUsers = [
        { id: 2, name: "Angel_User", bio: "Bot Developer", initial: "A" },
        { id: 3, name: "William_Dev", bio: "Roblox Scripter", initial: "W" },
        { id: 4, name: "Vexo_Bot", bio: "Official Service", initial: "V" }
    ];

    const results = fakeUsers.filter(u => u.name.toLowerCase().includes(query));

    if (results.length === 0) {
        container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; padding: 40px; color: #86868b;">No se encontró al usuario "${query}"</p>`;
        return;
    }

    results.forEach(u => {
        const card = document.createElement('div');
        card.className = 'user-card';
        card.innerHTML = `
            <div class="u-avatar-lg">${u.initial}</div>
            <h4>${u.name}</h4>
            <p>${u.bio}</p>
            <button class="btn-follow" onclick="toggleFollow(this, '${u.name}')">Seguir</button>
        `;
        container.appendChild(card);
    });
}

// --- 5. LÓGICA DE SEGUIDORES (FOLLOW/UNFOLLOW) ---
function toggleFollow(btn, username) {
    const isFollowing = btn.classList.contains('active');

    if (!isFollowing) {
        // Seguir
        btn.classList.add('active');
        btn.innerText = "Siguiendo";
        STATE.currentUser.following++;
        console.log(`Ahora sigues a ${username}`);
    } else {
        // Dejar de seguir
        btn.classList.remove('active');
        btn.innerText = "Seguir";
        STATE.currentUser.following--;
        console.log(`Diste unfollow a ${username}`);
    }

    // Actualizar UI del perfil
    DOM.followingCount.innerText = STATE.currentUser.following;
}

// --- 6. CERRAR SESIÓN ---
function logout() {
    if(confirm("¿Cerrar sesión en ECNHACA Style?")) {
        DOM.preloader.classList.remove('hide');
        DOM.preloader.style.opacity = '1';
        setTimeout(() => {
            location.reload();
        }, 1000);
    }
}

/**
 * FINAL DEL SCRIPT
 * Emmanuel, ya tienes la lógica de:
 * 1. Publicar con tema y descripción.
 * 2. Buscar usuarios específicos.
 * 3. Seguir/Dejar de seguir con cambio de contador.
 * 4. Navegación por el menú derecho.
 */
