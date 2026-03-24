/**
 * DEVROOT ENGINE V25 - CORE LOGIC
 * SISTEMA DE REGISTRO DINÁMICO & BÚSQUEDA
 */

"use strict";

const SocialEngine = (() => {
    // ESTADO DE LA APP
    const state = {
        currentUser: null,
        users: [
            { id: 101, name: 'Emmanuel Store', bio: 'Ofreciendo los mejores bots de Discord.', followers: 1500, following: 20, color: '#0062ff' },
            { id: 102, name: 'VibeBlox_Admin', bio: 'Dueño de la colección tactical gear.', followers: 890, following: 400, color: '#ff4757' },
            { id: 103, name: 'Roblox_Scripter', bio: 'Programador Luau avanzado.', followers: 3200, following: 100, color: '#2ecc71' }
        ],
        view: 'feed'
    };

    // --- MANEJO DE VISTAS ---
    const navigate = (viewId) => {
        document.querySelectorAll('.view-section').forEach(s => s.classList.add('hidden'));
        document.getElementById(viewId).classList.remove('hidden');
        document.getElementById(viewId).classList.add('animate-pop');
        window.scrollTo(0,0);
    };

    // --- SISTEMA DE REGISTRO (SIGN UP) ---
    const handleRegister = () => {
        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const pass = document.getElementById('reg-pass').value;
        const bio = document.getElementById('reg-bio').value;

        if (!name || !email || !pass) return alert("Completa los campos obligatorios");

        // Creamos el objeto del nuevo usuario
        const newUser = {
            id: Date.now(),
            name: name,
            bio: bio || 'Nuevo desarrollador en DevRoot',
            followers: 0,
            following: 0,
            color: '#' + Math.floor(Math.random()*16777215).toString(16)
        };

        // Guardamos y entramos
        state.users.push(newUser);
        state.currentUser = newUser;
        
        launchApp();
    };

    const launchApp = () => {
        document.getElementById('auth-container').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');
        
        // Actualizar UI del Navbar
        document.getElementById('nav-user-av').innerText = state.currentUser.name[0];
        document.getElementById('nav-user-name').innerText = state.currentUser.name;
        
        renderFeed();
    };

    // --- BÚSQUEDA EN TIEMPO REAL ---
    const searchUsers = (query) => {
        const box = document.getElementById('search-res-box');
        if (!query) return box.style.display = 'none';

        const filtered = state.users.filter(u => u.name.toLowerCase().includes(query.toLowerCase()));
        
        if (filtered.length > 0) {
            box.innerHTML = filtered.map(u => `
                <div class="res-item" onclick="SocialEngine.openProfile(${u.id})">
                    <div class="av-mini" style="background:${u.color}">${u.name[0]}</div>
                    <div>
                        <div style="font-weight:700; font-size:0.9rem">${u.name}</div>
                        <div style="font-size:0.7rem; color:gray">Ver Perfil</div>
                    </div>
                </div>
            `).join('');
            box.style.display = 'block';
        } else {
            box.innerHTML = '<div style="padding:15px; font-size:0.8rem; color:gray">Sin resultados</div>';
            box.style.display = 'block';
        }
    };

    // --- PERFILES ---
    const openProfile = (id) => {
        const user = state.users.find(u => u.id === id);
        if (!user) return;

        const profileHTML = `
            <div class="prof-header"></div>
            <div class="prof-content">
                <div class="prof-av-large" style="background:${user.color}">${user.name[0]}</div>
                <h2 style="font-size:2rem; font-weight:800">${user.name}</h2>
                <p style="color:var(--text-gray); margin-bottom:20px">${user.bio}</p>
                <button class="btn-follow-action" onclick="this.innerText='Siguiendo'">Seguir</button>
                <div class="prof-stats">
                    <div class="stat-unit"><strong>${user.followers}</strong><span>Seguidores</span></div>
                    <div class="stat-unit"><strong>${user.following}</strong><span>Siguiendo</span></div>
                </div>
            </div>
        `;
        document.getElementById('profile-view').innerHTML = profileHTML;
        document.getElementById('search-res-box').style.display = 'none';
        navigate('profile-view');
    };

    const renderFeed = () => {
        const feed = document.getElementById('feed-view');
        feed.innerHTML = `
            <div class="card animate-pop" style="text-align:center; padding:80px 20px">
                <i class="fa-solid fa-wind" style="font-size:3rem; opacity:0.1; margin-bottom:20px; display:block"></i>
                <h3 style="font-weight:800">Tu muro está listo, ${state.currentUser.name}</h3>
                <p style="color:var(--text-gray)">Usa el buscador para conectar con otros desarrolladores.</p>
            </div>
        `;
    };

    // EXPOSICIÓN PÚBLICA
    return {
        toggleAuth: (mode) => {
            if (mode === 'signup') {
                document.getElementById('login-form').classList.add('hidden');
                document.getElementById('signup-form').classList.remove('hidden');
                document.getElementById('signup-form').classList.add('animate-right');
            } else {
                document.getElementById('signup-form').classList.add('hidden');
                document.getElementById('login-form').classList.remove('hidden');
                document.getElementById('login-form').classList.add('animate-left');
            }
        },
        register: handleRegister,
        login: () => {
             // Simulación de login rápido
             state.currentUser = state.users[0];
             launchApp();
        },
        search: searchUsers,
        openProfile: openProfile,
        navigate: navigate
    };
})();
