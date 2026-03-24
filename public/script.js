/**
 * DEVROOT FRONTEND ENGINE V40
 * CONEXIÓN CON API REAL
 */

const UI = {
    current: null,

    init() {
        this.bindEvents();
        this.loadRecommendations();
    },

    bindEvents() {
        // Buscador en tiempo real
        const searchInput = document.getElementById('global-search');
        searchInput.oninput = (e) => this.handleSearch(e.target.value);
    },

    // --- ACCIONES DE CUENTA ---
    async register() {
        const data = {
            username: document.getElementById('reg-user').value,
            email: document.getElementById('reg-mail').value,
            spec: document.getElementById('reg-spec').value,
            password: document.getElementById('reg-pass').value
        };

        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await res.json();
        if (res.ok) {
            this.current = result;
            this.enterApp();
        } else {
            alert(result.msg);
        }
    },

    async login() {
        const identity = document.getElementById('log-user').value;
        const pass = document.getElementById('log-pass').value;

        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identity, password: pass })
        });

        const result = await res.json();
        if (res.ok) {
            this.current = result;
            this.enterApp();
        } else {
            alert("Usuario o contraseña incorrectos");
        }
    },

    enterApp() {
        document.getElementById('auth-wall').style.display = 'none';
        document.getElementById('main-app').classList.remove('hidden');
        document.getElementById('nav-user').innerText = this.current.username;
        document.getElementById('nav-av').innerText = this.current.username[0];
        this.renderView('inicio');
    },

    // --- BUSCADOR REAL ---
    async handleSearch(query) {
        const drop = document.getElementById('search-drop');
        if (query.length < 1) {
            drop.style.display = 'none';
            return;
        }

        const res = await fetch(`/api/users/search?q=${query}`);
        const users = await res.json();

        if (users.length > 0) {
            drop.innerHTML = users.map(u => `
                <div class="search-item" onclick="UI.viewUser('${u._id}')">
                    <div class="mini-av" style="background:${u.color}">${u.username[0]}</div>
                    <b>${u.username}</b>
                </div>
            `).join('');
        } else {
            // Si no hay resultados, mostrar recomendaciones
            drop.innerHTML = `<div class="no-res">No encontrado. Sugerencias:</div>`;
            this.loadSearchSuggestions(drop);
        }
        drop.style.display = 'block';
    },

    async loadSearchSuggestions(container) {
        const res = await fetch('/api/users/recommendations');
        const users = await res.json();
        container.innerHTML += users.map(u => `
            <div class="search-item" onclick="UI.viewUser('${u._id}')">
                <span>${u.username}</span> <small>(Recomendado)</small>
            </div>
        `).join('');
    },

    // --- SEGUIDORES ---
    async follow(targetId) {
        await fetch('/api/users/follow', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ myId: this.current._id, targetId })
        });
        alert("¡Ahora lo sigues!");
        this.renderView('perfil'); // Actualizar contadores
    },

    // --- VISTAS ---
    renderView(view) {
        const content = document.getElementById('feed-content');
        if (view === 'perfil') {
            content.innerHTML = `
                <div class="profile-card animate">
                    <div class="av-big" style="background:${this.current.color}">${this.current.username[0]}</div>
                    <h2>${this.current.username}</h2>
                    <p>${this.current.spec}</p>
                    <div class="stats">
                        <div class="stat"><b>${this.current.followers.length}</b><br>Seguidores</div>
                        <div class="stat"><b>${this.current.following.length}</b><br>Siguiendo</div>
                    </div>
                </div>
            `;
        } else {
            content.innerHTML = `<div class="empty"><h3>Sección ${view}</h3><p>No hay publicaciones por ahora.</p></div>`;
        }
    }
};

window.onload = () => UI.init();
