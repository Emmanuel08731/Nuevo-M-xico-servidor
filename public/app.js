/**
 * ECNHACA DATA CORE
 * MANEJO DE FETCH, BÚSQUEDA Y POSTS
 */

async function executeAuth(e) {
    e.preventDefault();
    const mode = document.getElementById('tab-login').classList.contains('active') ? 'login' : 'reg';
    const username = document.getElementById('auth-user').value;
    const password = document.getElementById('auth-pass').value;
    const email = document.getElementById('auth-email').value;

    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const payload = { username, password };
    if (mode === 'reg') payload.email = email;

    try {
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (data.success) {
            localStorage.setItem('ec_user', JSON.stringify(data.user));
            showStatus('success', '¡Acceso Correcto!', 'Sincronizando tus datos...');
            setTimeout(() => location.reload(), 1200);
        } else {
            // ANIMACIÓN DE ERROR SI LA CUENTA NO EXISTE O FALLA
            showStatus('error', 'Fallo de Acceso', data.error || 'Datos no válidos.');
        }
    } catch (err) {
        showStatus('error', 'Error de Red', 'No se pudo conectar con el servidor Render.');
    }
}

async function loadFeed() {
    const grid = document.getElementById('feed-items');
    grid.innerHTML = '<p style="padding:20px;">Cargando proyectos...</p>';

    try {
        const res = await fetch('/api/posts/feed');
        const posts = await res.json();

        if (posts.length === 0) {
            grid.innerHTML = '<div class="card-post">Todavía no hay nada aquí. ¡Sé el primero!</div>';
            return;
        }

        grid.innerHTML = posts.map(p => `
            <div class="card-post">
                <div style="display:flex; align-items:center; gap:10px; margin-bottom:12px;">
                    <div class="nav-av" style="background:${p.avatar_color}">${p.username[0].toUpperCase()}</div>
                    <b style="font-size:0.9rem;">@${p.username}</b>
                </div>
                <h3>${p.title}</h3>
                <p>${p.content}</p>
                ${p.media_url ? `<img src="${p.media_url}" class="post-media">` : ''}
                <div class="tag">${p.category}</div>
            </div>
        `).join('');
    } catch (e) {
        grid.innerHTML = '<p>Error al cargar el feed dinámico.</p>';
    }
}

async function runSearch() {
    const query = document.getElementById('search-input').value;
    const type = document.getElementById('search-type').value;

    if (query.trim().length < 1) return;

    navigate('search');
    document.getElementById('display-query').innerText = query;
    const grid = document.getElementById('search-results');
    grid.innerHTML = '<p style="padding:20px;">Escaneando base de datos...</p>';

    try {
        const res = await fetch(`/api/search/deep?q=${query}&type=${type}`);
        const data = await res.json();

        if (data.length === 0) {
            grid.innerHTML = '<div class="card-post">No hay resultados para esa búsqueda.</div>';
            return;
        }

        grid.innerHTML = data.map(i => `
            <div class="card-post">
                ${type === 'users' ? `
                    <div class="av-large" style="width:60px; height:60px; font-size:1.5rem; background:${i.avatar_color}">${i.username[0].toUpperCase()}</div>
                    <h3 style="text-align:center;">@${i.username}</h3>
                    <p style="text-align:center;">${i.bio}</p>
                    <button class="btn-primary" style="padding:10px;" onclick="loadExternalProfile(${i.id})">Ver Perfil</button>
                ` : `
                    <h3>${i.title}</h3>
                    <p>${i.content}</p>
                    <div class="tag">${i.category}</div>
                    <div style="margin-top:10px; font-size:0.7rem; opacity:0.6;">Autor: @${i.username}</div>
                `}
            </div>
        `).join('');
    } catch (e) {
        grid.innerHTML = '<p>Fallo en la conexión de búsqueda.</p>';
    }
}

async function handlePost(e) {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem('ec_user'));
    
    const payload = {
        user_id: user.id,
        title: document.getElementById('post-title').value,
        content: document.getElementById('post-text').value,
        category: document.getElementById('post-cat').value,
        media: document.getElementById('post-img').value
    };

    try {
        const res = await fetch('/api/posts/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            toggleModal(false);
            showStatus('success', '¡Proyecto Publicado!', 'Tu avance ya es visible para todos.');
            loadFeed();
            e.target.reset();
        }
    } catch (e) {
        showStatus('error', 'Error de Envío', 'No se pudo publicar el proyecto.');
    }
}

function processLogout() {
    localStorage.removeItem('ec_user');
    location.reload();
}
