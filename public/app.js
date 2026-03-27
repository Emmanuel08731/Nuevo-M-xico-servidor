/**
 * ECNHACA DATA ENGINE
 * Auth, Posts, Search y Perfiles
 */

let me = JSON.parse(localStorage.getItem('ec_session')) || null;
let mode = 'login';
let currentProfileId = null;

// Inicio de App
window.onload = () => {
    if (me) {
        document.getElementById('app').classList.remove('hide');
        document.getElementById('auth').classList.add('hide');
        setupNav();
        showView('feed');
    } else {
        document.getElementById('auth').classList.remove('hide');
    }
};

// Auth
function setMode(m) {
    mode = m;
    document.getElementById('eIn').classList.toggle('hide', m === 'login');
    document.getElementById('tab-l').classList.toggle('active', m === 'login');
    document.getElementById('tab-r').classList.toggle('active', m === 'reg');
}

async function authSubmit(e) {
    e.preventDefault();
    const username = document.getElementById('uIn').value;
    const password = document.getElementById('pIn').value;
    const email = document.getElementById('eIn').value;

    const path = mode === 'login' ? '/api/login' : '/api/register';
    const res = await fetch(path, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({username, password, email})
    });

    const data = await res.json();
    if (res.ok) {
        me = data.user;
        localStorage.setItem('ec_session', JSON.stringify(me));
        location.reload();
    } else {
        alert(data.error);
    }
}

// Publicaciones
async function handlePostSubmit(e) {
    e.preventDefault();
    const postData = {
        user_id: me.id,
        title: document.getElementById('postTitle').value,
        description: document.getElementById('postDesc').value,
        image_url: document.getElementById('postImg').value,
        category: document.getElementById('postTag').value
    };

    const res = await fetch('/api/posts', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(postData)
    });

    if (res.ok) {
        closePostModal();
        showView('feed');
        e.target.reset();
    }
}

async function loadPosts() {
    const res = await fetch('/api/posts');
    const posts = await res.json();
    const list = document.getElementById('post-list');
    list.innerHTML = '';

    posts.forEach(p => {
        const card = document.createElement('div');
        card.className = 'post-card animate-pop';
        card.innerHTML = `
            ${p.image_url ? `<img src="${p.image_url}" class="post-img">` : ''}
            <div class="post-body">
                <span class="post-tag">${p.category}</span>
                <h3>${p.title}</h3>
                <p style="color:#64748b; font-size:0.9rem; margin:10px 0">${p.description}</p>
                <div class="post-user" onclick="loadProfile(${p.user_id})">
                    <div class="av-sm" style="background:${p.color}">${p.username[0].toUpperCase()}</div>
                    <b>@${p.username}</b>
                </div>
            </div>
        `;
        list.appendChild(card);
    });
}

// Perfiles y Búsqueda
async function searchUsers(q) {
    if(!q) return showView('feed');
    showView('search');
    const res = await fetch(`/api/search?q=${q}&myId=${me.id}`);
    const users = await res.json();
    const list = document.getElementById('search-results');
    list.innerHTML = '';

    users.forEach(u => {
        const div = document.createElement('div');
        div.className = 'user-card';
        div.onclick = () => loadProfile(u.id);
        div.innerHTML = `
            <div class="av-sm" style="background:${u.color}">${u.username[0].toUpperCase()}</div>
            <b>@${u.username}</b>
        `;
        list.appendChild(div);
    });
}

async function loadProfile(id) {
    currentProfileId = id;
    const res = await fetch(`/api/user/${id}`);
    const u = await res.json();

    document.getElementById('pBanner').style.background = u.color;
    document.getElementById('pAvLarge').innerText = u.username[0].toUpperCase();
    document.getElementById('pAvLarge').style.background = u.color;
    document.getElementById('pUser').innerText = "@" + u.username;
    document.getElementById('pBio').innerText = u.bio;
    document.getElementById('pFolCount').innerText = u.followers_count;

    showView('profile');
}

function setupNav() {
    const av = document.getElementById('myAv');
    av.innerText = me.username[0].toUpperCase();
    av.style.background = me.color;
}

function logout() {
    localStorage.removeItem('ec_session');
    location.reload();
}
