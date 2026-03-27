/**
 * ECNHACA DATA CORE
 */
async function executeAuth(e) {
    e.preventDefault();
    const isLogin = document.getElementById('tab-login').classList.contains('active');
    const u = document.getElementById('user-field').value;
    const p = document.getElementById('pass-field').value;
    const em = document.getElementById('email-field').value;

    const route = isLogin ? '/api/auth/login' : '/api/auth/register';
    try {
        const res = await fetch(route, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: u, password: p, email: em })
        });
        const data = await res.json();
        if (data.success) {
            toast(isLogin ? "¡Bienvenido de nuevo!" : "¡Cuenta creada con éxito!", "success");
            setTimeout(() => {
                localStorage.setItem('ec_session', JSON.stringify(data.user));
                location.reload();
            }, 1200);
        } else {
            toast(data.error || "Error de verificación", "error");
        }
    } catch (err) { toast("Servidor desconectado", "error"); }
}

async function initFeed() {
    const res = await fetch('/api/posts/all');
    const posts = await res.json();
    const feed = document.getElementById('post-feed');
    feed.innerHTML = posts.map(p => `
        <div class="post-card animate-slide">
            <div class="p-header">
                <div class="p-av" style="background:${p.avatar_color}">${p.username[0].toUpperCase()}</div>
                <b>@${p.username}</b>
            </div>
            <h3>${p.title}</h3>
            <p>${p.content}</p>
            <div class="p-tag">#${p.category}</div>
        </div>
    `).join('');
}

async function searchEngine(q) {
    const box = document.getElementById('search-results');
    const type = document.getElementById('search-select').value;
    if (q.length < 2) { box.classList.add('hide'); return; }

    const user = JSON.parse(localStorage.getItem('ec_session'));
    const res = await fetch(`/api/search/global?q=${q}&type=${type}&myId=${user.id}`);
    const data = await res.json();
    
    box.classList.remove('hide');
    box.innerHTML = data.map(item => `
        <div class="search-item" onclick="viewDetail('${type}', ${item.id})">
            <i class="fa ${type==='users'?'fa-user':'fa-file-code'}"></i>
            <span>${type==='users' ? item.username : item.title}</span>
        </div>
    `).join('') || '<div class="p-10">Sin resultados</div>';
}

async function submitNewPost(e) {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem('ec_session'));
    const body = {
        user_id: user.id,
        title: document.getElementById('p-title').value,
        content: document.getElementById('p-text').value,
        category: document.getElementById('p-cat').value,
        image: document.getElementById('p-img').value
    };
    const res = await fetch('/api/posts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    if (res.ok) {
        hideModalPost();
        toast("Publicación compartida");
        initFeed();
    }
}

function logoutSession() {
    localStorage.removeItem('ec_session');
    location.reload();
}
// [RELLENO PARA 400 RENGLONES DE LÓGICA DE DATOS]
