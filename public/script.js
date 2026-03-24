/**
 * DEVROOT CORE ENGINE V27
 * SISTEMA PROFESIONAL DE CUENTAS Y SEGUIDORES
 */

const DevRoot = {
    // ESTADO GLOBAL
    state: {
        me: null,
        users: [
            { id: 1, name: "Emmanuel Store", bio: "Dueño y Fundador", followers: 5800, color: "#0066ff" },
            { id: 2, name: "VexoBot", bio: "Inteligencia Artificial", followers: 920, color: "#ff4757" },
            { id: 3, name: "Roblox_King", bio: "Creador de Mapas", followers: 15400, color: "#2ecc71" }
        ],
        posts: []
    },

    init() {
        console.log("Emmanuel Social System cargado...");
        this.bindEvents();
    },

    bindEvents() {
        // Cerrar menús al hacer click fuera
        window.addEventListener('click', (e) => {
            if (!e.target.closest('.user-menu-trigger')) {
                document.getElementById('acc-dropdown').style.display = 'none';
            }
        });
    },

    // 1. REGISTRO DE CUENTA
    createAccount() {
        const nameInput = document.getElementById('reg-name');
        const name = nameInput.value.trim();

        if (name.length < 3) return alert("El nombre es muy corto.");

        // Crear objeto usuario
        this.state.me = {
            id: Date.now(),
            name: name,
            bio: "Nuevo desarrollador en DevRoot",
            followers: 0,
            following: 0,
            color: "#" + Math.floor(Math.random()*16777215).toString(16)
        };

        // UI Transition
        document.getElementById('auth-wall').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('auth-wall').classList.add('hidden');
            document.getElementById('main-app').classList.remove('hidden');
            this.updateNavbar();
            this.renderFeed();
        }, 500);
    },

    updateNavbar() {
        document.getElementById('nav-user-name').innerText = this.state.me.name;
        document.getElementById('nav-av-icon').innerText = this.state.me.name[0].toUpperCase();
        document.getElementById('nav-av-icon').style.background = this.state.me.color;
    },

    // 2. SISTEMA DE SEGUIDORES (REAL)
    follow(userId) {
        const user = this.state.users.find(u => u.id === userId);
        if (user) {
            user.followers++;
            this.state.me.following++;
            
            // Efecto visual
            const btn = event.target;
            btn.innerText = "Siguiendo";
            btn.style.background = "#e2e8f0";
            btn.style.color = "#1a202c";
            btn.disabled = true;

            console.log(`Siguiendo a ${user.name}. Nuevos seguidores: ${user.followers}`);
        }
    },

    // 3. VISTA DE PERFIL (DERECHA)
    showMyProfile() {
        const main = document.getElementById('main-content');
        main.innerHTML = `
            <div class="card" style="padding:0; overflow:hidden; animation: fadeIn 0.5s ease;">
                <div class="profile-hero"></div>
                <div class="profile-body">
                    <div class="avatar-xl" style="background:${this.state.me.color}">
                        ${this.state.me.name[0].toUpperCase()}
                    </div>
                    <h1 style="font-weight:800; font-size:1.8rem;">${this.state.me.name}</h1>
                    <p style="color:#718096; margin-top:5px;">${this.state.me.bio}</p>
                    
                    <div class="stat-group">
                        <div class="stat-box">
                            <b id="my-followers">${this.state.me.followers}</b>
                            <span>Seguidores</span>
                        </div>
                        <div class="stat-box">
                            <b>${this.state.me.following}</b>
                            <span>Siguiendo</span>
                        </div>
                    </div>

                    <button class="btn-p" style="margin-top:25px; width:100%;" onclick="alert('Modo edición próximamente')">
                        Editar Perfil Profesional
                    </button>
                </div>
            </div>
        `;
        document.getElementById('acc-dropdown').style.display = 'none';
    },

    // 4. FEED PRINCIPAL
    renderFeed() {
        const main = document.getElementById('main-content');
        let usersHTML = this.state.users.map(u => `
            <div class="card" style="display:flex; justify-content:space-between; align-items:center;">
                <div style="display:flex; gap:15px; align-items:center;">
                    <div class="nav-avatar" style="background:${u.color}; width:50px; height:50px; font-size:1.2rem;">
                        ${u.name[0]}
                    </div>
                    <div>
                        <h4 style="font-weight:800;">${u.name}</h4>
                        <p style="font-size:0.8rem; color:gray;">${u.followers} seguidores • ${u.bio}</p>
                    </div>
                </div>
                <button class="btn-p" style="padding:8px 20px; font-size:0.8rem;" onclick="DevRoot.follow(${u.id})">
                    Seguir
                </button>
            </div>
        `).join('');

        main.innerHTML = `
            <h2 style="margin-bottom:20px; font-weight:800;">Sugerencias para ti</h2>
            ${usersHTML}
        `;
    },

    // UI UTILS
    toggleDropdown() {
        const d = document.getElementById('acc-dropdown');
        d.style.display = d.style.display === 'block' ? 'none' : 'block';
    },

    search(query) {
        const res = document.getElementById('search-results');
        if (query.length < 1) {
            res.style.display = 'none';
            return;
        }
        
        const filtered = this.state.users.filter(u => u.name.toLowerCase().includes(query.toLowerCase()));
        res.innerHTML = filtered.map(u => `
            <div class="menu-link" onclick="alert('Viendo a ${u.name}')">
                <div class="nav-avatar" style="background:${u.color}; width:25px; height:25px; font-size:0.7rem;">${u.name[0]}</div>
                ${u.name}
            </div>
        `).join('') || '<div class="menu-link">No hay resultados</div>';
        res.style.display = 'block';
    }
};

window.onload = () => DevRoot.init();
