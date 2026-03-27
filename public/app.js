/**
 * ==========================================================
 * ECNHACA SOCIAL DATA ENGINE v500.0
 * CONEXIÓN: RENDER POSTGRESQL API
 * DESARROLLADOR: EMMANUEL
 * ==========================================================
 */

const API_BASE = "postgresql://base_datos_global_user:mEDJcu2NtduJqv662gaUvOIuPDh1HFi3@dpg-d6u5u3fkijhs73fhh1hg-a.virginia-postgres.render.com/base_datos_global"; // Cambia esto por tu URL de Render

const DB = {
    
    // 1. REGISTRO / LOGIN REAL
    async authUser(userData, isRegister) {
        const endpoint = isRegister ? '/auth/register' : '/auth/login';
        try {
            const response = await fetch(`${API_BASE}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Error en Auth");
            return data;
        } catch (err) {
            this.handleError(err);
            return null;
        }
    },

    // 2. ENVIAR POST A POSTGRESQL
    async savePost(postData) {
        try {
            const response = await fetch(`${API_BASE}/posts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(postData)
            });
            return await response.json();
        } catch (err) {
            this.handleError("Error al guardar post");
        }
    },

    // 3. OBTENER FEED GLOBAL
    async fetchFeed() {
        try {
            const response = await fetch(`${API_BASE}/posts`);
            return await response.json();
        } catch (err) {
            return [];
        }
    },

    // 4. SISTEMA DE SEGUIDORES (FOLLOW)
    async toggleFollowInDB(targetId, action) {
        try {
            const response = await fetch(`${API_BASE}/users/follow`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    followerId: STATE.user.id,
                    targetId: targetId,
                    type: action // 'follow' o 'unfollow'
                })
            });
            return response.ok;
        } catch (err) {
            this.handleError("Error de conexión con la DB");
        }
    },

    // 5. BUSCADOR REAL EN TABLA DE USUARIOS
    async searchUsers(query) {
        try {
            const response = await fetch(`${API_BASE}/users/search?q=${query}`);
            return await response.json();
        } catch (err) {
            return [];
        }
    },

    handleError(msg) {
        console.error("ECNHACA DB ERROR:", msg);
        if(typeof notify === 'function') notify(msg, "error");
    }
};

/**
 * SOBREESCRITURA DE FUNCIONES DEL SCRIPT.JS
 * Emmanuel: Aquí conectamos la interfaz con la base de datos.
 */

// Modificamos handleAuth para que sea asíncrono
async function handleAuth(event) {
    event.preventDefault();
    const user = document.getElementById('auth-user').value.trim();
    const pass = document.getElementById('auth-pass').value.trim();
    const isReg = !document.getElementById('reg-email-group').classList.contains('hide');

    const result = await DB.authUser({ username: user, password: pass }, isReg);

    if (result) {
        STATE.user = result.user; // Cargamos ID, seguidores y posts reales desde Render
        localStorage.setItem('ec_session', JSON.stringify(STATE.user));
        launchApp();
        loadInitialFeed();
    }
}

// Modificamos publishPost para que guarde en la nube
async function publishPost() {
    const title = document.getElementById('post-title').value;
    const content = document.getElementById('post-content').value;
    const topic = document.getElementById('post-topic').value || "Web Develop";

    if (!title || !content) return;

    const payload = {
        userId: STATE.user.id,
        title,
        content,
        topic
    };

    const saved = await DB.savePost(payload);
    
    if (saved) {
        // En lugar de recargar, podemos insertar el post arriba
        location.reload(); 
    }
}

// Cargar posts reales al iniciar
async function loadInitialFeed() {
    const posts = await DB.fetchFeed();
    const container = document.getElementById('feed-container');
    
    if (posts.length > 0) {
        container.innerHTML = "";
        posts.forEach(post => {
            // Aquí reusamos la lógica de pintar el HTML del post del script.js
            renderPostCard(post);
        });
    }
}

/**
 * FIN DE APP.JS
 * Este archivo es el puente entre tu diseño minimalista 
 * y el servidor de base de datos en Render.
 */
