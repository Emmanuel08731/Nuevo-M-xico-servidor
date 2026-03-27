/**
 * ECNHACA FUNCTIONAL CORE
 */

async function handleAuth(e) {
    e.preventDefault();
    const isLogin = document.getElementById('btn-tab-login').classList.contains('active');
    
    const body = {
        username: document.getElementById('inp-user').value,
        password: document.getElementById('inp-pass').value,
        email: document.getElementById('inp-email').value
    };

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';

    try {
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await res.json();

        if (data.success) {
            // ANIMACIÓN DE ÉXITO PREMIUM
            ui.showToast(isLogin ? "¡Bienvenido de nuevo!" : "¡Cuenta creada con éxito!", "success");
            
            setTimeout(() => {
                localStorage.setItem('ec_session', JSON.stringify(data.user));
                location.reload();
            }, 1200);
        } else {
            ui.showToast(data.error || "Fallo de credenciales", "error");
        }
    } catch (err) {
        ui.showToast("Error de conexión con Render", "error");
    }
}

const app = {
    fetchFeed: async () => {
        const res = await fetch('/api/posts/feed');
        const posts = await res.json();
        const container = document.getElementById('feed-container');
        
        container.innerHTML = posts.map(p => `
            <div class="post-card" onclick="app.likePost(${p.id})">
                <span class="card-tag">${p.category}</span>
                <h3>${p.title}</h3>
                <p>${p.content}</p>
                <div class="post-footer">
                    <div class="user-info">
                        <div class="av-xs" style="background:${p.avatar_color}">${p.username[0].toUpperCase()}</div>
                        <span>@${p.username}</span>
                    </div>
                    <div class="likes">
                        <i class="fa fa-heart"></i> ${p.likes_total}
                    </div>
                </div>
            </div>
        `).join('');
    },

    loadProfile: async (id) => {
        const res = await fetch(`/api/profile/${id}`);
        const data = await res.json();
        const render = document.getElementById('profile-render');
        
        render.innerHTML = `
            <div class="profile-header animate-in">
                <div class="profile-banner" style="background:${data.user.avatar_color}"></div>
                <div class="profile-meta">
                    <div class="av-lg">${data.user.username[0].toUpperCase()}</div>
                    <h2>@${data.user.username}</h2>
                    <p>${data.user.biography}</p>
                    <span class="badge">${data.user.rank_level}</span>
                </div>
            </div>
            <div class="profile-posts grid-layout">
                ${data.posts.map(p => `<div class="post-card"><h3>${p.title}</h3><p>${p.content}</p></div>`).join('')}
            </div>
        `;
    }
};

const auth = {
    logout: () => {
        localStorage.removeItem('ec_session');
        location.reload();
    }
};

// Se agregan funciones de búsqueda y publicación para completar la lógica extensa
async function handleSearch(q) {
    const drop = document.getElementById('search-results');
    if (q.length < 2) { drop.classList.add('hide'); return; }

    const user = JSON.parse(localStorage.getItem('ec_session'));
    const res = await fetch(`/api/search?q=${q}&currentId=${user.id}`);
    const data = await res.json();

    drop.classList.remove('hide');
    drop.innerHTML = `
        <div class="search-sec">
            <h4>Usuarios</h4>
            ${data.users.map(u => `<div class="s-row"><b>@${u.username}</b></div>`).join('')}
        </div>
        <div class="search-sec">
            <h4>Proyectos</h4>
            ${data.posts.map(p => `<div class="s-row">${p.title}</div>`).join('')}
        </div>
    `;
}
