/**
 * ECNHACA DATA CORE
 * Comunicación con el servidor y manejo de estados.
 */

const API_URL = ''; // En Render se deja vacío si es el mismo dominio

async function handleAuth(e) {
    e.preventDefault();
    const isLogin = !document.getElementById('tab-reg').classList.contains('active');
    const username = document.getElementById('a-user').value;
    const pass = document.getElementById('a-pass').value;
    const email = document.getElementById('a-email').value;

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const body = isLogin ? { username, password: pass } : { username, email, password: pass };

    try {
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await res.json();

        if (data.success) {
            localStorage.setItem('ec_user', JSON.stringify(data.user));
            showToast(isLogin ? "¡Bienvenido de nuevo!" : "Cuenta creada con éxito");
            setTimeout(() => location.reload(), 1000);
        } else {
            showToast(data.error || "Error en el proceso", "error");
        }
    } catch (err) {
        showToast("Error de conexión con el servidor", "error");
    }
}

async function handleSearch(q) {
    const drop = document.getElementById('search-results');
    const usersBox = document.getElementById('users-results');
    const postsBox = document.getElementById('posts-results');
    
    if (q.length < 2) {
        drop.classList.add('hide');
        return;
    }

    const user = JSON.parse(localStorage.getItem('ec_user'));
    const res = await fetch(`/api/search/global?q=${q}&myId=${user.id}`);
    const data = await res.json();

    drop.classList.remove('hide');
    
    usersBox.innerHTML = data.users.length ? data.users.map(u => `
        <div class="search-item" onclick="viewUserProfile(${u.id})">
            <div class="av-xs" style="background:${u.avatar_color}">${u.username[0].toUpperCase()}</div>
            <span>@${u.username}</span>
        </div>
    `).join('') : '<p class="no-res">No se encontraron usuarios</p>';

    postsBox.innerHTML = data.posts.length ? data.posts.map(p => `
        <div class="search-item">
            <i class="fa fa-file-code"></i>
            <div>
                <b>${p.title}</b><br>
                <small>${p.category}</small>
            </div>
        </div>
    `).join('') : '<p class="no-res">No se encontró contenido</p>';
}

async function loadFeed() {
    const res = await fetch('/api/posts/feed');
    const posts = await res.json();
    const container = document.getElementById('posts-feed');

    container.innerHTML = posts.map(p => `
        <div class="post-card" onclick="viewPostDetail(${p.id})">
            <div class="post-tag">${p.category}</div>
            <h2>${p.title}</h2>
            <p>${p.content}</p>
            <div class="post-user">
                <div class="av-xs" style="background:${p.avatar_color}">${p.username[0].toUpperCase()}</div>
                <span>@${p.username}</span>
            </div>
        </div>
    `).join('');
}

async function submitPost(e) {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem('ec_user'));
    const postData = {
        user_id: user.id,
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
        closePostModal();
        showToast("Publicado correctamente");
        loadFeed();
        document.getElementById('create-post-form').reset();
    }
}

function logout() {
    localStorage.removeItem('ec_user');
    location.reload();
}

// [MÁS DE 200 LÍNEAS DE LÓGICA DE PERFILES, SEGUIR USUARIOS Y MANEJO DE IMÁGENES]
