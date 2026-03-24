/**
 * CLIENT INTERFACE V70
 * CONEXIÓN DIRECTA A RENDER API
 */

const App = {
    user: null,

    init() {
        console.log("Emmanuel Store Network Iniciada.");
        this.loadInitialData();
    },

    // --- ACCIONES DE CUENTA ---
    async register() {
        const btn = document.getElementById('reg-btn');
        btn.innerText = "Registrando...";
        
        const payload = {
            username: document.getElementById('reg-user').value,
            email: document.getElementById('reg-mail').value,
            spec: document.getElementById('reg-spec').value,
            password: document.getElementById('reg-pass').value
        };

        try {
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (res.ok) {
                this.user = data;
                this.launch();
            } else {
                alert(data.error);
                btn.innerText = "Registrar y Guardar";
            }
        } catch (e) {
            alert("Error: No se pudo conectar con el servidor de Render.");
        }
    },

    async login() {
        const identity = document.getElementById('log-user').value;
        const password = document.getElementById('log-pass').value;

        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identity, password })
            });

            const data = await res.json();
            if (res.ok) {
                this.user = data;
                this.launch();
            } else {
                alert("Credenciales inválidas.");
            }
        } catch (e) {
            alert("Error de conexión. Revisa el estado de Render.");
        }
    },

    launch() {
        document.getElementById('auth-wall').style.display = 'none';
        document.getElementById('main-app').classList.remove('hidden');
        document.getElementById('nav-username').innerText = this.user.username;
        document.getElementById('nav-av').innerText = this.user.username[0].toUpperCase();
        document.getElementById('nav-av').style.background = this.user.avatarColor;
        this.renderView('inicio');
    },

    // --- BUSCADOR REAL ---
    async search(q) {
        const resultsBox = document.getElementById('search-results');
        if (q.length < 1) return resultsBox.style.display = 'none';

        const res = await fetch(`/api/search?q=${q}`);
        const users = await res.json();

        if (users.length > 0) {
            resultsBox.innerHTML = users.map(u => `
                <div class="search-item" onclick="App.renderProfile('${u.username}')">
                    <div class="av-mini" style="background:${u.avatarColor}">${u.username[0]}</div>
                    <b>${u.username}</b>
                </div>
            `).join('');
        } else {
            resultsBox.innerHTML = `
                <div class="no-res">No encontrado. Sugerencias:</div>
                <div id="search-sug-box"></div>
            `;
            this.loadSearchSuggestions();
        }
        resultsBox.style.display = 'block';
    },

    async loadSearchSuggestions() {
        const res = await fetch('/api/recommendations');
        const users = await res.json();
        document.getElementById('search-sug-box').innerHTML = users.map(u => `
            <div class="search-item" onclick="App.follow('${u._id}')">
                <span>${u.username}</span> <small>(Recomendado)</small>
            </div>
        `).join('');
    },

    // --- SISTEMA DE SEGUIDORES ---
    async follow(targetId) {
        const res = await fetch('/api/follow', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ myId: this.user._id, targetId })
        });
        if (res.ok) {
            alert("¡Ahora sigues a este usuario en la base de datos!");
            this.renderView('perfil');
        }
    },

    // --- RENDERIZADO DE VISTAS ---
    renderView(view) {
        const feed = document.getElementById('feed-central');
        feed.innerHTML = "";

        if (view === 'perfil') {
            feed.innerHTML = `
                <div class="profile-card animate-up">
                    <div class="banner-color" style="background:${this.user.avatarColor}"></div>
                    <div class="profile-main">
                        <div class="av-large" style="background:${this.user.avatarColor}">${this.user.username[0]}</div>
                        <h2>${this.user.username}</h2>
                        <p>${this.user.specialization}</p>
                        <div class="stats-row">
                            <div class="stat-item"><b>${this.user.followers.length}</b><br>Seguidores</div>
                            <div class="stat-item"><b>${this.user.following.length}</b><br>Siguiendo</div>
                        </div>
                    </div>
                </div>
            `;
        } else if (view === 'inicio') {
            feed.innerHTML = `
                <div class="card animate-up">
                    <h3 style="margin-bottom:15px;">Usuarios Registrados Recientemente</h3>
                    <div id="home-recommendations"></div>
                </div>
                <div class="empty-box">
                    <i class="fa-solid fa-ghost"></i>
                    <p>No hay publicaciones globales todavía.</p>
                </div>
            `;
            this.loadHomeRecommendations();
        }
    },

    async loadHomeRecommendations() {
        const res = await fetch('/api/recommendations');
        const users = await res.json();
        const list = document.getElementById('home-recommendations');
        list.innerHTML = users.filter(u => u._id !== this.user._id).map(u => `
            <div class="user-row-flex">
                <div style="display:flex; align-items:center; gap:10px;">
                    <div class="av-mini" style="background:${u.avatarColor}">${u.username[0]}</div>
                    <b>${u.username}</b>
                </div>
                <button class="btn-follow" onclick="App.follow('${u._id}')">Seguir</button>
            </div>
        `).join('');
    }
};

window.onload = () => App.init();
