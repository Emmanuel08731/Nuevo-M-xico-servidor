/**
 * ==========================================================
 * ECNHACA SOCIAL DATA ENGINE v400.0
 * DESARROLLADOR: EMMANUEL
 * PROPÓSITO: CONEXIÓN POSTGRESQL & LÓGICA DE RED SOCIAL
 * PROTOCOLO: WHITE MINIMALIST (DATABASE LAYER)
 * ==========================================================
 */

const API_URL = "/api"; // Tu endpoint en Render

// --- MOTOR DE DATOS SOCIALES ---
const SOCIAL_ENGINE = {
    
    // 1. GESTIÓN DE PUBLICACIONES (POSTS)
    async createPost(postData) {
        try {
            const response = await fetch(`${API_URL}/posts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(postData)
            });
            
            if (!response.ok) throw new Error("Error al publicar en ECNHACA");
            
            const result = await response.json();
            notify("Publicación compartida con éxito", "success");
            return result;
        } catch (err) {
            console.error("Critical DB Error:", err);
            notify("No se pudo conectar con la base de datos", "error");
            return null;
        }
    },

    async deletePost(postId) {
        try {
            const response = await fetch(`${API_URL}/posts/${postId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                notify("Publicación eliminada correctamente", "success");
                return true;
            }
        } catch (err) {
            notify("Error al purgar la publicación", "error");
            return false;
        }
    },

    // 2. SISTEMA DE BÚSQUEDA DUAL (POSTS / USUARIOS)
    async search(type, query) {
        const endpoint = type === 'users' ? 'users/search' : 'posts/search';
        try {
            const response = await fetch(`${API_URL}/${endpoint}?q=${encodeURIComponent(query)}`);
            const data = await response.json();
            return data;
        } catch (err) {
            console.error("Search failed:", err);
            return [];
        }
    },

    // 3. LÓGICA DE SEGUIDORES (FOLLOW SYSTEM)
    async toggleFollow(targetUserId, isFollowing) {
        const action = isFollowing ? 'unfollow' : 'follow';
        try {
            const response = await fetch(`${API_URL}/users/${action}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetId: targetUserId })
            });

            if (response.ok) {
                const updatedData = await response.json();
                // Actualizamos los contadores locales en tiempo real
                this.updateLocalStats(updatedData.followers, updatedData.following);
                return true;
            }
        } catch (err) {
            notify("Error al actualizar seguimiento", "error");
            return false;
        }
    },

    // 4. ACTUALIZACIÓN DE INTERFAZ (STATS)
    updateLocalStats(followers, following) {
        const followersEl = document.getElementById('count-followers');
        const followingEl = document.getElementById('count-following');
        
        if (followersEl) followersEl.innerText = followers;
        if (followingEl) followingEl.innerText = following;
        
        // Sincronizamos con el STATE del script.js
        STATE.currentUser.followers = followers;
        STATE.currentUser.following = following;
    },

    // 5. CARGA DE PERFIL COMPLETO
    async loadProfileData(username) {
        try {
            const response = await fetch(`${API_URL}/users/profile/${username}`);
            const profile = await response.json();
            
            if (response.ok) {
                document.getElementById('profile-name').innerText = profile.username;
                document.getElementById('count-followers').innerText = profile.followers_count;
                document.getElementById('count-following').innerText = profile.following_count;
                document.getElementById('count-posts').innerText = profile.posts_count;
                
                this.renderProfilePosts(profile.posts);
            }
        } catch (err) {
            console.error("Profile load error:", err);
        }
    },

    renderProfilePosts(posts) {
        const container = document.getElementById('profile-posts');
        if (!container) return;
        
        container.innerHTML = posts.length > 0 ? '' : '<p class="m-t-20" style="color:#86868b">Aún no hay publicaciones.</p>';
        
        posts.forEach(post => {
            const postEl = document.createElement('div');
            postEl.className = 'post-card';
            postEl.innerHTML = `
                <div class="post-header">
                    <div class="u-info">
                        <div class="u-pic">E</div>
                        <div>
                            <b>${post.username}</b>
                            <small>${new Date(post.created_at).toLocaleDateString()} • ${post.topic}</small>
                        </div>
                    </div>
                </div>
                <div class="post-body">
                    <h4>${post.title}</h4>
                    <p>${post.content}</p>
                </div>
            `;
            container.appendChild(postEl);
        });
    }
};

/**
 * INTEGRACIÓN CON EL FRONTEND (EVENTOS)
 * Emmanuel: Estas funciones conectan el script.js con este app.js
 */

// Sobrescribimos la función de publicación para que use la DB
async function submitPost() {
    const title = document.getElementById('post-title').value;
    const desc = document.getElementById('post-desc').value;
    const tag = document.getElementById('post-tag').value;

    if (!title || !desc) {
        notify("Completa los campos obligatorios", "error");
        return;
    }

    const payload = {
        title: title,
        content: desc,
        topic: tag || "Web Develop",
        user_id: STATE.currentUser.id
    };

    const success = await SOCIAL_ENGINE.createPost(payload);
    
    if (success) {
        // Recargar el feed o insertar el post visualmente
        location.reload(); 
    }
}

// Sobrescribimos la búsqueda para que sea real
async function executeSearch() {
    const type = document.getElementById('search-type').value;
    const query = document.getElementById('global-search').value.toLowerCase().trim();

    if (!query) return;

    const results = await SOCIAL_ENGINE.search(type, query);

    if (type === 'users') {
        showView('search-users');
        const container = document.getElementById('users-result');
        container.innerHTML = results.map(u => `
            <div class="user-card">
                <div class="u-avatar-lg">${u.username.charAt(0).toUpperCase()}</div>
                <h4>${u.username}</h4>
                <p>${u.bio || 'Miembro de ECNHACA'}</p>
                <button class="btn-follow ${u.is_following ? 'active' : ''}" 
                        onclick="handleFollowClick(this, ${u.id})">
                    ${u.is_following ? 'Siguiendo' : 'Seguir'}
                </button>
            </div>
        `).join('');
    } else {
        // Lógica para mostrar posts encontrados
        notify(`Encontradas ${results.length} publicaciones`, "success");
    }
}

async function handleFollowClick(btn, targetId) {
    const isCurrentlyFollowing = btn.classList.contains('active');
    const success = await SOCIAL_ENGINE.toggleFollow(targetId, isCurrentlyFollowing);
    
    if (success) {
        btn.classList.toggle('active');
        btn.innerText = btn.classList.contains('active') ? 'Siguiendo' : 'Seguir';
    }
}

// Inicializar datos al cargar perfil
if (STATE.view === 'profile') {
    SOCIAL_ENGINE.loadProfileData(STATE.currentUser.username);
}

/**
 * FIN DEL ARCHIVO APP.JS
 * Emmanuel, este código está listo para conectarse a tus tablas de:
 * - users (id, username, bio, followers_count, following_count)
 * - posts (id, user_id, title, content, topic, created_at)
 * - follows (follower_id, followed_id)
 */
