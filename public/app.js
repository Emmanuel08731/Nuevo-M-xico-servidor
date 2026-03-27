/**
 * ECNHACA DATA CORE v9.0
 * Lógica de búsqueda híbrida y sincronización de publicaciones.
 */

let user = JSON.parse(localStorage.getItem('ec_session')) || null;

function initApp() {
    if (user) {
        document.getElementById('app-screen').classList.remove('hide');
        document.getElementById('my-av').innerText = user.username[0].toUpperCase();
        document.getElementById('my-av').style.background = user.color || '#6366f1';
        loadFeed();
    } else {
        document.getElementById('auth-screen').classList.remove('hide');
    }
}

// --- BUSCADOR DUAL (CONTENIDO Y USUARIOS) ---
async function performSearch(q) {
    const drop = document.getElementById('search-results');
    if (!q) { drop.classList.add('hide'); return; }

    const res = await fetch(`/api/search/global?q=${q}&myId=${user.id}`);
    const data = await res.json();
    drop.classList.remove('hide');

    let html = `
        <div class="res-sec">
            <h4>Usuarios <span class="btn-more" onclick="changeTab('users')">Ver más</span></h4>
            ${data.users.map(u => `
                <div class="res-item" onclick="openUserProfile(${u.id})">
                    <div class="av-xs" style="background:${u.profile_color}">${u.username[0].toUpperCase()}</div>
                    <b>@${u.username}</b>
                </div>
            `).join('')}
        </div>
        <div class="res-sec">
            <h4>Contenido <span class="btn-more" onclick="changeTab('feed')">Ver más</span></h4>
            ${data.posts.map(p => `
                <div class="res-item" onclick="viewPost(${p.id})">
                    <i class="fa fa-code"></i>
                    <div>
                        <span>${p.title}</span><br>
                        <small>${p.category}</small>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    drop.innerHTML = html || '<p>No hay resultados.</p>';
}

// --- FEED DINÁMICO ---
async function loadFeed() {
    const res = await fetch('/api/posts/feed');
    const posts = await res.json();
    const container = document.getElementById('posts-container');
    container.innerHTML = posts.map(p => `
        <article class="post-card">
            <div class="post-head">
                <span class="tag">${p.category}</span>
                <small>${new Date(p.created_at).toLocaleDateString()}</small>
            </div>
            <h2>${p.title}</h2>
            <p>${p.description}</p>
            ${p.image_url ? `<img src="${p.image_url}" class="post-img">` : ''}
            <div class="post-footer" onclick="openUserProfile(${p.user_id})">
                <div class="av-xs" style="background:${p.profile_color}">${p.username[0].toUpperCase()}</div>
                <b>@${p.username}</b>
            </div>
        </article>
    `).join('');
}

// [MÁS DE 700 LÍNEAS DE LÓGICA DE AUTH, PUBLICACIÓN, PERFILES Y FOLLOWS]
// ...
