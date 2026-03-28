/**
 * ==========================================================
 * ECNHACA SOCIAL CORE - APP.JS
 * CONEXIÓN A BASE DE DATOS (RENDER)
 * DESARROLLADOR: EMMANUEL
 * ==========================================================
 */

// Usamos la URL de tu servicio web (NO la de postgresql directamente)
const API_BASE = window.location.origin + "/api";

const App = {
    // 1. CARGAR DATOS INICIALES DEL PERFIL
    async loadProfile(username) {
        try {
            const res = await fetch(`${API_BASE}/users/profile/${username}`);
            const data = await res.json();
            
            if (res.ok) {
                document.getElementById('count-followers').innerText = data.followers;
                document.getElementById('count-following').innerText = data.following;
                document.getElementById('count-posts').innerText = data.posts_count;
                // Actualizamos el objeto global de stats
                stats.followers = data.followers;
                stats.posts = data.posts_count;
            }
        } catch (err) {
            console.error("Error al cargar perfil:", err);
        }
    },

    // 2. GUARDAR POST EN LA NUBE
    async savePostToDB(postData) {
        try {
            const res = await fetch(`${API_BASE}/posts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(postData)
            });
            return await res.json();
        } catch (err) {
            console.error("Error al guardar post:", err);
            return null;
        }
    },

    // 3. SISTEMA DE FOLLOW/UNFOLLOW REAL
    async syncFollow(targetId, action) {
        try {
            const res = await fetch(`${API_BASE}/users/follow`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    targetId: targetId,
                    action: action // 'follow' o 'unfollow'
                })
            });
            return res.ok;
        } catch (err) {
            console.error("Error de seguimiento:", err);
            return false;
        }
    },

    // 4. ELIMINAR POST DE LA DB
    async deletePostFromDB(postId) {
        try {
            const res = await fetch(`${API_BASE}/posts/${postId}`, {
                method: 'DELETE'
            });
            return res.ok;
        } catch (err) {
            return false;
        }
    }
};

/**
 * INTEGRACIÓN CON LAS FUNCIONES DE SCRIPT.JS
 * Modificamos las funciones para que usen la base de datos
 */

// Modificar addPost para que sea asíncrona
async function addPost() {
    const title = document.getElementById('post-title').value;
    const desc = document.getElementById('post-desc').value;
    const topic = document.getElementById('post-topic').value || "General";

    if(!title || !desc) return;

    const payload = {
        title,
        description: desc,
        topic,
        username: "Emmanuel" // Esto vendrá de tu sesión
    };

    const result = await App.savePostToDB(payload);
    
    if (result) {
        // Si se guardó en Render, lo mostramos en pantalla
        renderPost(result); 
        updatePostCount(1);
        // Limpiar
        document.getElementById('post-title').value = "";
        document.getElementById('post-desc').value = "";
    }
}

// Modificar toggleFollow para que sea asíncrona
async function toggleFollow(btn, targetUserId) {
    const isFollowing = btn.innerText === "Dejar de seguir";
    const action = isFollowing ? 'unfollow' : 'follow';

    const success = await App.syncFollow(targetUserId, action);

    if (success) {
        if (!isFollowing) {
            btn.innerText = "Dejar de seguir";
            btn.style.background = "#e1e1e1";
            btn.style.color = "black";
            stats.followers++;
        } else {
            btn.innerText = "Seguir";
            btn.style.background = "black";
            btn.style.color = "white";
            stats.followers--;
        }
        document.getElementById('count-followers').innerText = stats.followers;
    }
}

// Inicialización al cargar la página
window.addEventListener('load', () => {
    App.loadProfile("Emmanuel");
});
