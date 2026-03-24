/**
 * DEVROOT FRONTEND CORE V50
 * PERSISTENCIA REAL Y MOTOR DE BÚSQUEDA SIN FANTASMAS
 */

const App = {
    user: null,
    
    init() {
        console.log("Sistema DevRoot Operativo.");
        this.loadRecommendations();
    },

    // --- AUTENTICACIÓN ---
    async register() {
        const username = document.getElementById('reg-user').value;
        const email = document.getElementById('reg-mail').value;
        const spec = document.getElementById('reg-spec').value;
        const password = document.getElementById('reg-pass').value;

        if (!username || !email || !password) return alert("Completa los datos obligatorios.");

        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, spec, password })
        });

        const data = await res.json();
        if (res.ok) {
            this.user = data;
            this.startApp();
        } else {
            alert(data.error);
        }
    },

    async login() {
        const identity = document.getElementById('log-user').value;
        const password = document.getElementById('log-pass').value;

        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identity, password })
        });

        const data = await res.json();
        if (res.ok) {
            this.user = data;
            this.startApp();
        } else {
            alert("Credenciales incorrectas.");
        }
    },

    startApp() {
        document.getElementById('auth-wall').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');
        
        document.getElementById('nav-user-name').innerText = this.user.username;
        document.getElementById('nav-av').innerText = this.user.username[0].toUpperCase();
        document.getElementById('nav-av').style.background = this.user.avatarColor;
        
        this.renderView('inicio');
    },

    // --- MOTOR DE BÚSQUEDA ---
    async handleSearch(query) {
        const drop = document.getElementById('search-results');
        if (query.length < 1) {
            drop.style.display = 'none';
            return;
        }

        const res = await fetch(`/api/search?query=${query}`);
        const users = await res.json();

        if (users.length > 0) {
            drop.innerHTML = users.map(u => `
                <div class="res-item" onclick="App.viewProfile('${u.username}')">
                    <div class="av-nav" style="background:${u.avatarColor}; width:32px; height:32px; font-size:0.8rem;">${u.username[0]}</div>
                    <div>
                        <div style="font-weight:700; font-size:0.9rem;">${u.username}</div>
                        <div style="font-size:0.7rem; color:gray;">${u.specialization}</div>
                    </div>
                </div>
            `).join('');
        } else {
            // Si no existe, mostrar recomendaciones
            drop.innerHTML = `
                <div style="padding:15px; text-align:center; color:red; font-weight:800; font-size:0.8rem;">
                    Usuario no encontrado.
                </div>
                <div style="padding:10px; border-top:1px solid #eee; background:#f9f9f9; font-size:0.7rem; font-weight:800; color:gray;">
                    TE RECOMENDAMOS:
                </div>
                <div id="search-sug"></div>
            `;
            this.loadSearchSuggestions();
        }
        drop.style.display = 'block';
    },

    async loadSearchSuggestions() {
        const res = await fetch('/api/recommendations');
        const users = await res.json();
        const container = document.getElementById('search-sug');
        container.innerHTML = users.map(u => `
            <div class="res-item" onclick="App.viewProfile('${u.username}')">
                <b>${u.username}</b> <small style="margin-left:5px; color:var(--brand)">Seguir</small>
            </div>
        `).join('');
    },

    // --- VISTAS ---
    async renderView(view) {
        const feed = document.getElementById('main-content');
        feed.innerHTML = "";

        if (view === 'inicio') {
            feed.innerHTML = `
                <div class="card animate-slide">
                    <h3 style="font-weight:800; margin-bottom:15px;">Personas que quizás conozcas</h3>
                    <div id="home-recommendations"></div>
                </div>
                <div class="empty-state">
                    <i class="fa-solid fa-layer-group"></i>
                    <h3>No hay publicaciones</h3>
                    <p>Los posts de las personas que sigues aparecerán aquí.</p>
                </div>
            `;
            this.loadHomeRecommendations();
        } else if (view === 'perfil') {
            feed.innerHTML = `
                <div class="card animate-slide" style="padding:0; overflow:hidden;">
                    <div class="profile-header"></div>
                    <div class="profile-content">
                        <div class="av-big" style="background:${this.user.avatarColor}">${this.user.username[0]}</div>
                        <h2 style="font-weight:900;">${this.user.username}</h2>
                        <p style="color:gray; font-weight:600;">${this.user.specialization}</p>
                        <div class="stat-row">
                            <div class="stat"><b>${this.user.followers.length}</b><span>Seguidores</span></div>
                            <div class="stat"><b>${this.user.following.length}</b><span>Siguiendo</span></div>
                        </div>
                    </div>
                    <div style="padding:30px;">
                        <button class="btn-main" style="background:var(--brand)">Editar Perfil</button>
                    </div>
                </div>
            `;
        } else if (view === 'proyectos') {
            feed.innerHTML = `<div class="empty-state"><i class="fa-solid fa-code"></i><h3>No hay proyectos publicados</h3></div>`;
        } else if (view === 'tendencias') {
            feed.innerHTML = `<div class="empty-state"><i class="fa-solid fa-fire"></i><h3>No hay cosas publicadas</h3></div>`;
        }
    },

    async loadHomeRecommendations() {
        const res = await fetch('/api/recommendations');
        const users = await res.json();
        const list = document.getElementById('home-recommendations');
        list.innerHTML = users.filter(u => u._id !== this.user._id).map(u => `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 0; border-bottom:1px solid #f1f5f9;">
                <div style="display:flex; gap:12px; align-items:center;">
                    <div class="av-nav" style="background:${u.avatarColor}; width:35px; height:35px;">${u.username[0]}</div>
                    <b style="font-size:0.9rem;">${u.username}</b>
                </div>
                <button class="btn-main" style="width:auto; padding:6px 15px; font-size:0.7rem; margin:0;" onclick="App.followUser('${u._id}')">Seguir</button>
            </div>
        `).join('');
    },

    async followUser(targetId) {
        const res = await fetch('/api/follow', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ followerId: this.user._id, targetId })
        });
        if (res.ok) {
            alert("¡Ahora sigues a este usuario!");
            location.reload(); // Recargar para actualizar datos del servidor
        }
    },

    toggleMenu() {
        const d = document.getElementById('acc-dropdown');
        d.style.display = d.style.display === 'block' ? 'none' : 'block';
    },

    switchAuth(mode) {
        if (mode === 'signup') {
            document.getElementById('login-form').classList.add('hidden');
            document.getElementById('signup-form').classList.remove('hidden');
        } else {
            document.getElementById('signup-form').classList.add('hidden');
            document.getElementById('login-form').classList.remove('hidden');
        }
    }
};

window.onload = () => App.init();
