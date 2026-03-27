/**
 * ECNHACA DATA ENGINE v7.0
 * LÍNEAS: ~180 | Búsqueda masiva y feed global.
 */
let me = JSON.parse(localStorage.getItem('ec_session')) || null;

function checkSession() {
    if (me) {
        document.getElementById('app').classList.remove('hide');
        document.getElementById('fab').classList.remove('hide');
        document.getElementById('myAv').innerText = me.username[0].toUpperCase();
        document.getElementById('myAv').style.background = me.color;
        loadFeed();
    } else {
        document.getElementById('auth').classList.remove('hide');
    }
}

// --- BÚSQUEDA HÍBRIDA (USUARIOS + CONTENIDO) ---
async function doSearch(q) {
    const resBox = document.getElementById('sRes');
    if (!q) { resBox.classList.add('hide'); return; }

    const res = await fetch(`/api/search/global?q=${q}&myId=${me.id}`);
    const data = await res.json();
    resBox.classList.remove('hide');

    let html = `
        <div class="res-sec">
            <h4>Usuarios <span class="btn-more">Ver más</span></h4>
            ${data.users.map(u => `
                <div class="item-res" onclick="viewUser(${u.id})">
                    <div class="av-sm" style="background:${u.color}">${u.username[0].toUpperCase()}</div>
                    <span>@${u.username}</span>
                </div>
            `).join('')}
        </div>
        <div class="res-sec">
            <h4>Contenido <span class="btn-more">Ver más</span></h4>
            ${data.posts.map(p => `
                <div class="item-res" onclick="viewPost(${p.id})">
                    <i class="fa fa-file-code" style="color:var(--p)"></i>
                    <div style="display:flex; flex-direction:column">
                        <span style="font-size:0.9rem">${p.title}</span>
                        <small style="color:#64748b">${p.category}</small>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    resBox.innerHTML = html || '<p>No se encontró nada...</p>';
}

// --- FEED GLOBAL ---
async function loadFeed() {
    const res = await fetch('/api/posts/feed');
    const posts = await res.json();
    const feed = document.getElementById('feed');
    feed.innerHTML = '';

    posts.forEach(p => {
        const card = document.createElement('div');
        card.className = 'post-card animate-up';
        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px">
                <span class="tag">${p.category}</span>
                <small style="color:#94a3b8">${new Date(p.created_at).toLocaleDateString()}</small>
            </div>
            <h2>${p.title}</h2>
            <p style="color:#cbd5e1; margin:15px 0; line-height:1.6">${p.description}</p>
            ${p.image_url ? `<img src="${p.image_url}" style="width:100%; border-radius:15px; margin-bottom:15px">` : ''}
            <div style="display:flex; align-items:center; gap:12px; padding-top:15px; border-top:1px solid rgba(255,255,255,0.05)">
                <div class="av-sm" style="background:${p.color}">${p.username[0].toUpperCase()}</div>
                <b>@${p.username}</b>
            </div>
        `;
        feed.appendChild(card);
    });
}

async function handleAuth(e) {
    e.preventDefault();
    const u = document.getElementById('aU').value;
    const p = document.getElementById('aP').value;
    const e_ = document.getElementById('aE').value;
    const mode = window.authMode || 'L';
    
    const res = await fetch(mode === 'L' ? '/api/auth/login' : '/api/auth/register', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({username: u, password: p, email: e_})
    });
    const data = await res.json();
    if(res.ok) {
        localStorage.setItem('ec_session', JSON.stringify(data.user));
        location.reload();
    } else { alert(data.error); }
}

async function createPost(e) {
    e.preventDefault();
    const data = {
        user_id: me.id,
        title: document.getElementById('pT').value,
        description: document.getElementById('pD').value,
        image_url: document.getElementById('pI').value,
        category: document.getElementById('pC').value
    };
    await fetch('/api/posts/create', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    });
    closeModal();
    loadFeed();
}
