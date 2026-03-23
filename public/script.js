/**
 * ==============================================================================
 * DEVROOT ONYX CLIENT CONTROLLER
 * V40.0.1 - ADVANCED SOCIAL LOGIC
 * ==============================================================================
 */

// ESTADO GLOBAL DE LA APLICACIÓN
const STATE = {
    me: null,          // Mi usuario logueado
    activeProfile: null, // Usuario que estoy viendo
    isAuth: false
};

/**
 * MOTOR DE NOTIFICACIONES (TOASTS)
 */
const toast = (msg, type = 'success') => {
    const t = document.createElement('div');
    t.style.cssText = `
        position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%);
        background: #000; color: #fff; padding: 16px 32px; border-radius: 50px;
        font-weight: 700; z-index: 10000; box-shadow: 0 20px 40px rgba(0,0,0,0.2);
        animation: toastIn 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards;
    `;
    t.innerText = msg;
    document.body.appendChild(t);
    setTimeout(() => {
        t.style.opacity = '0';
        setTimeout(() => t.remove(), 500);
    }, 3000);
};

/**
 * FUNCIÓN: BÚSQUEDA UNIVERSAL (AL DAR ENTER)
 */
async function executeSearch(query) {
    const overlay = document.getElementById('search-results-overlay');
    const container = document.getElementById('search-res-list');

    if (query.length < 1) {
        overlay.style.display = 'none';
        return;
    }

    try {
        const response = await fetch(`/api/v1/search/universal?q=${encodeURIComponent(query)}`);
        const { results } = await response.json();

        overlay.style.display = 'block';
        container.innerHTML = "";

        if (results.people.length === 0) {
            container.innerHTML = `<p style="padding: 20px; text-align:center; color:#999; font-weight:600;">No se encontraron personas.</p>`;
            return;
        }

        results.people.forEach(user => {
            const el = document.createElement('div');
            el.className = 'res-card';
            el.onclick = () => loadFullProfile(user.uid);
            el.innerHTML = `
                <div class="res-avatar">${user.init}</div>
                <div>
                    <strong style="display:block">${user.name}</strong>
                    <small style="color:#888; font-weight:700">${user.rank}</small>
                </div>
            `;
            container.appendChild(el);
        });
    } catch (err) {
        console.error("Kernel Search Error:", err);
    }
}

/**
 * FUNCIÓN: CARGA COMPLETA DE PERFIL (LAYER 1)
 */
async function loadFullProfile(uid) {
    const modal = document.getElementById('onyx-profile-modal');
    modal.style.display = 'flex';
    document.getElementById('profile-shell-main').style.opacity = '0.5';

    try {
        const response = await fetch(`/api/v1/user/full-profile/${uid}`);
        const data = await response.json();

        STATE.activeProfile = data; // Guardar en estado global
        
        // Rellenar UI
        document.getElementById('p-avatar-box').innerText = data.identity.init;
        document.getElementById('p-name-txt').innerText = data.identity.name;
        document.getElementById('p-rank-txt').innerText = data.identity.rank;
        document.getElementById('p-bio-txt').innerText = data.identity.bio;
        
        // Stats
        document.getElementById('stat-followers').innerText = data.stats.followers;
        document.getElementById('stat-following').innerText = data.stats.following;
        document.getElementById('stat-posts').innerText = data.stats.posts;

        updateFollowButtonUI();
        document.getElementById('profile-shell-main').style.opacity = '1';
    } catch (err) {
        toast("Error al conectar con el nodo de perfil.", "error");
        closeProfileModal();
    }
}

/**
 * FUNCIÓN: MOSTRAR LISTADOS (LAYER 2)
 */
function openSocialList(type) {
    const layer = document.getElementById('onyx-list-layer');
    const title = document.getElementById('layer-title-txt');
    const container = document.getElementById('layer-scroll-box');

    if (!STATE.activeProfile) return;

    layer.style.display = 'flex';
    title.innerText = type === 'followers' ? 'Seguidores' : 'Siguiendo';
    container.innerHTML = "";

    const users = type === 'followers' 
        ? STATE.activeProfile.social.followers_list 
        : STATE.activeProfile.social.following_list;

    if (users.length === 0) {
        container.innerHTML = `<p style="margin-top:40px; text-align:center; color:#ccc; font-weight:800;">No hay registros todavía.</p>`;
        return;
    }

    users.forEach(u => {
        const item = document.createElement('div');
        item.className = 'list-item';
        item.onclick = () => {
            closeListLayer();
            loadFullProfile(u.uid);
        };
        item.innerHTML = `
            <div class="res-avatar" style="width:35px; height:35px; font-size:0.8rem">${u.init}</div>
            <div>
                <strong style="display:block; font-size:0.9rem">${u.name}</strong>
                <small style="color:#aaa; font-weight:700; font-size:0.7rem">${u.rank}</small>
            </div>
        `;
        container.appendChild(item);
    });
}

/**
 * FUNCIÓN: LÓGICA DE SEGUIMIENTO REAL
 */
async function toggleFollowAction() {
    if (!STATE.me) {
        toast("Inicia sesión para interactuar.");
        return;
    }

    const targetUid = STATE.activeProfile.identity.uid;
    const btn = document.getElementById('follow-main-btn');
    btn.disabled = true;

    try {
        const response = await fetch('/api/v1/social/toggle-follow', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ myUid: STATE.me.uid, targetUid: targetUid })
        });
        const data = await response.json();

        if (response.ok) {
            // Recargar datos para refrescar listas y números
            await loadFullProfile(targetUid);
            toast(data.status === 'followed' ? "Siguiendo con éxito" : "Has dejado de seguir");
        }
    } catch (err) {
        toast("Error de red social.", "error");
    } finally {
        btn.disabled = false;
    }
}

/**
 * UI HELPERS
 */
function updateFollowButtonUI() {
    const btn = document.getElementById('follow-main-btn');
    if (!STATE.me || STATE.me.uid === STATE.activeProfile.identity.uid) {
        btn.style.display = 'none';
        return;
    }
    
    btn.style.display = 'block';
    const amIFollowing = STATE.activeProfile.social.followers_list.some(u => u.uid === STATE.me.uid);
    
    if (amIFollowing) {
        btn.innerText = "Dejar de Seguir";
        btn.className = "btn-social unfollow";
    } else {
        btn.innerText = "Seguir Usuario";
        btn.className = "btn-social follow";
    }
}

function closeProfileModal() {
    document.getElementById('onyx-profile-modal').style.display = 'none';
    closeListLayer();
}

function closeListLayer() {
    document.getElementById('onyx-list-layer').style.display = 'none';
}

// EVENT LISTENERS DE CIERRE
window.onclick = (e) => {
    if (e.target.id === 'onyx-profile-modal') closeProfileModal();
    if (!e.target.closest('.search-container')) document.getElementById('search-results-overlay').style.display = 'none';
};
