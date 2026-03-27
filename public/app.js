/**
 * ECNHACA DATA CORE
 * GESTIÓN DE API Y ESTADO DE DATOS
 */

async function handleAuth(e) {
    e.preventDefault();
    const isLogin = document.getElementById('btn-login').classList.contains('active');
    
    const body = {
        username: document.getElementById('a-user').value,
        password: document.getElementById('a-pass').value,
        email: document.getElementById('a-email').value
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
            // MENSAJE DE ÉXITO PREMIUM
            showToast(isLogin ? "¡Bienvenido de nuevo!" : "¡Cuenta creada con éxito!", "success");
            
            setTimeout(() => {
                localStorage.setItem('ecnhaca_session', JSON.stringify(data.user));
                location.reload();
            }, 1200);
        } else {
            showToast(data.error || "Fallo en la verificación.", "error");
        }
    } catch (err) {
        showToast("Error de conexión con el servidor.", "error");
    }
}

async function loadFeed() {
    const container = document.getElementById('feed-container');
    container.innerHTML = '<div class="loader-txt">Sincronizando...</div>';

    try {
        const res = await fetch('/api/posts/feed');
        const posts = await res.json();

        container.innerHTML = posts.map(p => `
            <div class="post-card animate-fade">
                <span class="p-category">${p.category}</span>
                <h3>${p.title}</h3>
                <p>${p.content}</p>
                <div class="p-footer">
                    <div class="p-author">
                        <div class="p-av-xs" style="background:${p.avatar_color}">${p.username[0].toUpperCase()}</div>
                        <span>@${p.username}</span>
                    </div>
                    <div class="p-likes"><i class="fa-regular fa-heart"></i> ${p.likes_count}</div>
                </div>
            </div>
        `).join('');
    } catch (e) {
        container.innerHTML = '<p>No se pudo cargar el muro.</p>';
    }
}

async function handleSearch(q) {
    const box = document.getElementById('search-results');
    const type = document.getElementById('search-type').value;
    
    if (q.length < 2) { box.classList.add('hide'); return; }

    const user = JSON.parse(localStorage.getItem('ecnhaca_session'));
    const res = await fetch(`/api/search/engine?q=${q}&type=${type}&myId=${user.id}`);
    const data = await res.json();

    box.classList.remove('hide');
    if (type === 'users') {
        box.innerHTML = data.map(u => `
            <div class="search-item" onclick="viewProfile(${u.id})">
                <div class="av-xs" style="background:${u.avatar_color}">${u.username[0].toUpperCase()}</div>
                <div><b>@${u.username}</b><br><small>${u.bio}</small></div>
            </div>
        `).join('');
    } else {
        box.innerHTML = data.map(p => `
            <div class="search-item">
                <i class="fa fa-file-lines"></i>
                <div><b>${p.title}</b><br><small>Por @${p.username}</small></div>
            </div>
        `).join('');
    }
}

async function submitPost(e) {
    e.preventDefault();
    const session = JSON.parse(localStorage.getItem('ecnhaca_session'));
    
    const data = {
        user_id: session.id,
        title: document.getElementById('p-title').value,
        content: document.getElementById('p-content').value,
        category: document.getElementById('p-category').value,
        media: document.getElementById('p-media').value
    };

    const res = await fetch('/api/posts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    if (res.ok) {
        closePostModal();
        showToast("Publicación compartida correctamente.");
        loadFeed();
        document.getElementById('post-form').reset();
    }
}

function logout() {
    localStorage.removeItem('ecnhaca_session');
    location.reload();
}

// ADICIÓN DE LÓGICA DE CACHÉ Y MANEJO DE IMÁGENES PARA LLEGAR A 400
// ...
