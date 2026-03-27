/**
 * ECNHACA DATA CORE
 * GESTIÓN DE API Y ESTADOS DE SERVIDOR
 */

async function processAuth(e) {
    e.preventDefault();
    const isLogin = document.getElementById('btn-tab-login').classList.contains('active');
    
    const userInp = document.getElementById('inp-user');
    const passInp = document.getElementById('inp-pass');
    const emailInp = document.getElementById('inp-email');

    // Reset de errores visuales
    [userInp, passInp, emailInp].forEach(i => i.parentElement.classList.remove('vibrate'));

    const payload = {
        username: userInp.value,
        password: passInp.value,
        email: emailInp.value
    };

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';

    try {
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (data.success) {
            if (!isLogin) {
                // ÉXITO ANIMADO EN REGISTRO
                showSuccessAnim("¡Cuenta Creada!", "Ya puedes acceder a todas las funciones.");
                setTimeout(() => {
                    localStorage.setItem('ec_session', JSON.stringify(data.user));
                    location.reload();
                }, 2000);
            } else {
                localStorage.setItem('ec_session', JSON.stringify(data.user));
                location.reload();
            }
        } else {
            // ERROR CON VIBRACIÓN
            userInp.parentElement.classList.add('vibrate');
            passInp.parentElement.classList.add('vibrate');
            alert(data.error || "Fallo en la autenticación.");
        }
    } catch (err) {
        alert("Error de conexión con el servidor Ecnhaca.");
    }
}

async function loadFeed() {
    const container = document.getElementById('feed-container');
    container.innerHTML = '<div class="loading-state">Actualizando muro...</div>';

    try {
        const res = await fetch('/api/posts/feed');
        const posts = await res.json();

        if (posts.length === 0) {
            container.innerHTML = '<div class="empty">No hay publicaciones aún.</div>';
            return;
        }

        container.innerHTML = posts.map(p => `
            <article class="post-card">
                <div class="card-top">
                    <div class="card-av" style="background:${p.avatar_color}">${p.username[0].toUpperCase()}</div>
                    <div class="card-user-info">
                        <b>@${p.username}</b>
                        <span>${p.membership} Member</span>
                    </div>
                    <button class="btn-follow-mini" onclick="followUser(${p.user_id})">Seguir</button>
                </div>
                <div class="post-content">
                    <h3>${p.title}</h3>
                    <p>${p.content}</p>
                    ${p.media_url ? `<img src="${p.media_url}" class="post-img">` : ''}
                    <div class="post-tag"># ${p.category}</div>
                </div>
            </article>
        `).join('');
    } catch (e) {
        container.innerHTML = '<p>Error al cargar el feed.</p>';
    }
}

async function handleGlobalSearch(q) {
    const resultsBox = document.getElementById('search-results-drop');
    const type = document.getElementById('search-filter').value;
    
    if (q.length < 1) {
        resultsBox.classList.add('hide');
        return;
    }

    const session = JSON.parse(localStorage.getItem('ec_session'));
    const res = await fetch(`/api/search/engine?q=${q}&type=${type}&myId=${session.id}`);
    const data = await res.json();

    resultsBox.classList.remove('hide');
    if (data.length === 0) {
        resultsBox.innerHTML = '<div class="p-20">Sin resultados.</div>';
        return;
    }

    if (type === 'users') {
        resultsBox.innerHTML = data.map(u => `
            <div class="search-item" onclick="loadUserProfile(${u.id})">
                <div class="nav-av" style="background:${u.avatar_color}; width:25px; height:25px; font-size:0.6rem;">${u.username[0].toUpperCase()}</div>
                <div>
                    <b>@${u.username}</b>
                    <small style="display:block; font-size:0.7rem;">${u.followers_count} seguidores</small>
                </div>
            </div>
        `).join('');
    } else {
        resultsBox.innerHTML = data.map(p => `
            <div class="search-item">
                <i class="fa fa-file-lines" style="opacity:0.5"></i>
                <div>
                    <b>${p.title}</b>
                    <small style="display:block; font-size:0.7rem;">En ${p.category}</small>
                </div>
            </div>
        `).join('');
    }
}

async function loadUserProfile(userId) {
    const container = document.getElementById('view-profile');
    const content = document.getElementById('profile-content');
    
    // Cambiar vista
    document.getElementById('view-feed').classList.add('hide');
    container.classList.remove('hide');
    document.getElementById('search-results-drop').classList.add('hide');

    const res = await fetch(`/api/users/profile/${userId}`);
    const data = await res.json();

    content.innerHTML = `
        <div class="profile-header animate-slide-up">
            <div class="profile-banner">
                <div class="profile-av-main" style="background:${data.user.avatar_color}">${data.user.username[0].toUpperCase()}</div>
            </div>
            <div class="profile-meta">
                <h1>${data.user.username}</h1>
                <p class="bio-txt">${data.user.bio}</p>
                <div class="stats-bar">
                    <div class="stat-item"><b>${data.user.followers_count}</b><span>Seguidores</span></div>
                    <div class="stat-item"><b>${data.user.following_count}</b><span>Siguiendo</span></div>
                    <div class="stat-item"><b>${data.posts.length}</b><span>Posts</span></div>
                </div>
                <button class="main-action-btn" style="width:200px" onclick="followUser(${data.user.id})">Seguir Usuario</button>
            </div>
        </div>
        <hr style="margin:40px 0; opacity:0.1">
        <div class="feed-grid">
            ${data.posts.map(p => `
                <div class="post-card">
                    <h3>${p.title}</h3>
                    <p>${p.content}</p>
                    <div class="post-tag">${p.category}</div>
                </div>
            `).join('')}
        </div>
    `;
}

async function handlePostSubmit(e) {
    e.preventDefault();
    const session = JSON.parse(localStorage.getItem('ec_session'));
    
    const payload = {
        user_id: session.id,
        title: document.getElementById('post-title').value,
        content: document.getElementById('post-content').value,
        category: document.getElementById('post-category').value,
        media: document.getElementById('post-media').value
    };

    const res = await fetch('/api/posts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (res.ok) {
        closeCreateModal();
        showSuccessAnim("¡Publicado!", "Tu contenido ya está disponible en el muro.");
        loadFeed();
        document.getElementById('post-form').reset();
    }
}

function logoutSession() {
    localStorage.removeItem('ec_session');
    location.reload();
}
