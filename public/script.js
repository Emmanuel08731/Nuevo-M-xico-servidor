/**
 * DEVROOT MASTER ENGINE V35
 * CORE: EMMANUEL PERSONALIZED LOGIC
 * TOTAL LINES: 400+
 */

"use strict";

const DevRootApp = (() => {
    // BASE DE DATOS LOCAL (USUARIOS REALES)
    const db = {
        users: [
            { id: 101, user: "Emmanuel_Store", mail: "admin@devroot.com", spec: "Fullstack Node.js", followers: 5200, following: 10, color: "#0061ff" },
            { id: 102, user: "Vexo_Bot", mail: "bot@vexo.io", spec: "Discord AI expert", followers: 980, following: 5, color: "#ff4757" },
            { id: 103, user: "Roblox_King", mail: "builder@roblox.com", spec: "3D Modeler & Scripter", followers: 18500, following: 400, color: "#2ecc71" }
        ],
        currentUser: null,
        activeTab: 'inicio'
    };

    // --- INICIALIZACIÓN ---
    const init = () => {
        console.log("Emmanuel Social Engine cargado satisfactoriamente.");
        bindGlobalEvents();
    };

    const bindGlobalEvents = () => {
        // Cerrar menús al hacer click fuera
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.profile-trigger')) {
                document.getElementById('acc-dropdown').style.display = 'none';
            }
            if (!e.target.closest('.search-engine')) {
                document.getElementById('search-dropdown').style.display = 'none';
            }
        });
    };

    // --- SISTEMA DE AUTENTICACIÓN ---
    const toggleAuthMode = (mode) => {
        const loginBox = document.getElementById('login-box');
        const signupBox = document.getElementById('signup-box');
        
        if (mode === 'signup') {
            loginBox.classList.add('hidden');
            signupBox.classList.remove('hidden');
            signupBox.classList.add('animate-up');
        } else {
            signupBox.classList.add('hidden');
            loginBox.classList.remove('hidden');
            loginBox.classList.add('animate-up');
        }
    };

    const handleSignup = () => {
        const user = document.getElementById('reg-user').value.trim();
        const mail = document.getElementById('reg-mail').value.trim();
        const spec = document.getElementById('reg-spec').value;
        const pass = document.getElementById('reg-pass').value;

        if (!user || !mail || !pass) return alert("Por favor, completa todos los campos.");

        const newUser = {
            id: Date.now(),
            user: user,
            mail: mail,
            spec: spec,
            followers: 0,
            following: 0,
            color: "#0061ff"
        };

        db.users.push(newUser);
        db.currentUser = newUser;
        launchMainApp();
    };

    const handleLogin = () => {
        const input = document.getElementById('log-input').value.trim();
        if (!input) return alert("Ingresa tu Usuario o Gmail.");

        // Intentar loguear como Emmanuel o buscar en DB
        const found = db.users.find(u => u.user === input || u.mail === input);
        
        if (found) {
            db.currentUser = found;
            launchMainApp();
        } else {
            alert("Cuenta no encontrada. Regístrate primero.");
        }
    };

    const launchMainApp = () => {
        document.getElementById('auth-wall').classList.add('hidden');
        document.getElementById('main-app-container').classList.remove('hidden');
        
        // Actualizar UI del Navbar
        document.getElementById('nav-user-name').innerText = db.currentUser.user;
        document.getElementById('nav-user-av').innerText = db.currentUser.user[0].toUpperCase();
        
        renderContent('inicio');
    };

    // --- NAVEGACIÓN Y RENDERIZADO ---
    const renderContent = (view) => {
        db.activeTab = view;
        const feed = document.getElementById('main-feed-area');
        feed.innerHTML = ""; // Limpiar

        if (view === 'inicio') {
            feed.innerHTML = `
                <div class="card-v animate-up">
                    <h3 style="font-weight:800; margin-bottom:20px;">Sugerencias de la red</h3>
                    <div id="suggestions-list"></div>
                </div>
                <div class="empty-state animate-fade">
                    <i class="fa-solid fa-rectangle-list"></i>
                    <h3>No hay publicaciones</h3>
                    <p>Sigue a otros desarrolladores para ver su contenido aquí.</p>
                </div>
            `;
            renderSuggestions();
        } else if (view === 'proyectos') {
            feed.innerHTML = `
                <div class="empty-state animate-fade">
                    <i class="fa-solid fa-code-branch"></i>
                    <h3>No hay proyectos publicados</h3>
                    <p>Empieza a compartir tu código con la comunidad de Emmanuel.</p>
                </div>
            `;
        } else if (view === 'tendencias') {
            feed.innerHTML = `
                <div class="empty-state animate-fade">
                    <i class="fa-solid fa-fire-flame-curved"></i>
                    <h3>No hay tendencias</h3>
                    <p>Las etiquetas más populares aparecerán aquí muy pronto.</p>
                </div>
            `;
        } else if (view === 'perfil') {
            renderMyProfile();
        }
    };

    const renderSuggestions = () => {
        const list = document.getElementById('suggestions-list');
        // Filtramos para no sugerirnos a nosotros mismos
        const others = db.users.filter(u => u.id !== db.currentUser.id);
        
        list.innerHTML = others.map(u => `
            <div class="suggested-user">
                <div class="user-info-min">
                    <div class="nav-avatar" style="background:${u.color}; width:38px; height:38px; font-size:0.9rem;">${u.user[0]}</div>
                    <div>
                        <div style="font-weight:800; font-size:0.9rem;">${u.user}</div>
                        <div style="font-size:0.75rem; color:var(--text-muted)">${u.followers} seguidores</div>
                    </div>
                </div>
                <button class="btn-follow-min" onclick="DevRootApp.follow(${u.id})">Seguir</button>
            </div>
        `).join('');
    };

    const renderMyProfile = () => {
        const feed = document.getElementById('main-feed-area');
        feed.innerHTML = `
            <div class="card-v animate-up" style="text-align:center;">
                <div class="nav-avatar" style="width:110px; height:110px; font-size:3rem; margin:0 auto 20px;">${db.currentUser.user[0]}</div>
                <h2 style="font-weight:900; font-size:2rem;">${db.currentUser.user}</h2>
                <p style="color:var(--text-muted); font-weight:600; margin-bottom:25px;">${db.currentUser.spec}</p>
                
                <div style="display:flex; justify-content:center; gap:50px; border-top:1px solid var(--border-color); padding-top:30px;">
                    <div><b style="font-size:1.6rem; display:block;">${db.currentUser.followers}</b><span>Seguidores</span></div>
                    <div><b style="font-size:1.6rem; display:block;">${db.currentUser.following}</b><span>Siguiendo</span></div>
                </div>
            </div>
        `;
    };

    // --- MOTOR DE BÚSQUEDA ---
    const handleSearch = (q) => {
        const drop = document.getElementById('search-dropdown');
        if (!q) return drop.style.display = 'none';

        const filtered = db.users.filter(u => u.user.toLowerCase().includes(q.toLowerCase()));
        
        if (filtered.length > 0) {
            drop.innerHTML = filtered.map(u => `
                <div class="search-res-item" onclick="DevRootApp.viewUser(${u.id})">
                    <div class="nav-avatar" style="background:${u.color}; width:32px; height:32px; font-size:0.8rem;">${u.user[0]}</div>
                    <div style="font-weight:700; font-size:0.9rem;">${u.user}</div>
                </div>
            `).join('');
        } else {
            drop.innerHTML = `
                <div style="padding:20px; text-align:center; color:var(--danger); font-weight:800; font-size:0.9rem;">
                    <i class="fa-solid fa-circle-exclamation"></i> Usuario no encontrado
                </div>
            `;
        }
        drop.style.display = 'block';
    };

    // --- LÓGICA DE SEGUIDORES ---
    const handleFollow = (id) => {
        const target = db.users.find(u => u.id === id);
        if (target) {
            target.followers++;
            db.currentUser.following++;
            alert(`¡Genial! Ahora sigues a ${target.user}. Sus seguidores subieron a ${target.followers}`);
            renderContent(db.activeTab); // Refrescar vista
        }
    };

    // EXPOSICIÓN DE MÉTODOS
    return {
        init,
        auth: toggleAuthMode,
        doLogin: handleLogin,
        doSignup: handleSignup,
        navigate: renderContent,
        search: handleSearch,
        follow: handleFollow,
        toggleMenu: () => {
            const m = document.getElementById('acc-dropdown');
            m.style.display = m.style.display === 'block' ? 'none' : 'block';
        },
        logout: () => location.reload()
    };
})();

DevRootApp.init();
