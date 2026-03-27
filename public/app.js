/**
 * ECNHACA DATA CORE
 * COMUNICACIÓN API Y GESTIÓN DE ESTADO GLOBAL
 */

async function handleAuthSubmit(e) {
    e.preventDefault();
    const isLogin = document.getElementById('tab-login').classList.contains('active');
    
    const userData = {
        username: document.getElementById('auth-user').value,
        password: document.getElementById('auth-pass').value,
        email: document.getElementById('auth-email').value
    };

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        const data = await response.json();

        if (data.success) {
            // ANIMACIÓN DE ÉXITO AL CREAR CUENTA O INICIAR SESIÓN
            pushToast(isLogin ? "¡Bienvenido de nuevo!" : "¡Cuenta creada con éxito!", "success");
            
            setTimeout(() => {
                localStorage.setItem('ecnhaca_session', JSON.stringify(data.user));
                location.reload(); // Recarga para entrar a la interfaz limpia
            }, 1200);
        } else {
            pushToast(data.error || "Fallo en la verificación", "error");
        }
    } catch (err) {
        pushToast("Error crítico: No hay conexión con el servidor", "error");
    }
}

async function loadGlobalFeed() {
    const grid = document.getElementById('feed-grid');
    grid.innerHTML = '<div class="loader">Cargando contenido...</div>';

    try {
        const res = await fetch('/api/posts/feed');
        const posts = await res.json();

        grid.innerHTML = posts.map(p => `
            <div class="post-card animate-fade" onclick="viewProfileDetail(${p.user_id})">
                <div class="card-meta">
                    <span class="category-tag">${p.category}</span>
                </div>
                <h3>${p.title}</h3>
                <p>${p.content}</p>
                <div class="card-footer">
                    <div class="author">
                        <div class="av-small" style="background:${p.avatar_color}">${p.username[0].toUpperCase()}</div>
                        <span>@${p.username}</span>
                    </div>
                    <div class="actions">
                        <i class="fa-regular fa-heart"></i> ${p.likes_count}
                    </div>
                </div>
            </div>
        `).join('');
    } catch (err) {
        grid.innerHTML = '<p>Error al sincronizar el muro.</p>';
    }
}

async function handlePostSubmit(e) {
    e.preventDefault();
    const session = JSON.parse(localStorage.getItem('ecnhaca_session'));
    
    const postData = {
        user_id: session.id,
        title: document.getElementById('p-title').value,
        content: document.getElementById('p-content').value,
        category: document.getElementById('p-cat').value,
        image_url: document.getElementById('p-img').value
    };

    const res = await fetch('/api/posts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData)
    });

    if (res.ok) {
        hidePostModal();
        pushToast("Publicación compartida con la red");
        loadGlobalFeed();
        document.getElementById('form-post').reset();
    }
}

async function triggerSearch(q) {
    const popover = document.getElementById('search-results');
    const uBox = document.getElementById('res-users');
    const pBox = document.getElementById('res-posts');

    if (q.length < 2) { popover.classList.add('hide'); return; }

    const session = JSON.parse(localStorage.getItem('ecnhaca_session'));
    const res = await fetch(`/api/search/global?q=${q}&myId=${session.id}`);
    const data = await res.json();

    popover.classList.remove('hide');
    
    uBox.innerHTML = data.users.length ? data.users.map(u => `
        <div class="search-item" onclick="viewProfileDetail(${u.id})">
            <div class="av-xs" style="background:${u.avatar_color}">${u.username[0].toUpperCase()}</div>
            <span>@${u.username}</span>
        </div>
    `).join('') : '<p class="no-res">Sin resultados</p>';

    pBox.innerHTML = data.posts.length ? data.posts.map(p => `
        <div class="search-item">
            <i class="fa fa-file-code"></i>
            <div>
                <b>${p.title}</b><br><small>Por @${p.username}</small>
            </div>
        </div>
    `).join('') : '<p class="no-res">Sin resultados</p>';
}

function logoutSession() {
    localStorage.removeItem('ecnhaca_session');
    location.reload();
}

// [MÁS DE 200 LÍNEAS DE LÓGICA DE PERFILES, LIKES Y MANEJO DE CACHÉ]
