let stats = { followers: 0, following: 0, posts: 0 };
let currentUsername = "";

// 1. LOGIN DUAL
function handleLogin() {
    const user = document.getElementById('login-user').value.trim();
    if(!user) return alert("Ingresa un usuario");

    currentUsername = user;
    
    // Ocultar Auth y mostrar App
    document.getElementById('view-auth').classList.add('hide');
    document.getElementById('view-app').classList.remove('hide');

    // Inicializar Interfaz
    document.getElementById('nav-avatar').innerText = user.charAt(0).toUpperCase();
    document.getElementById('profile-pic').innerText = user.charAt(0).toUpperCase();
    document.getElementById('profile-name').innerText = user;
}

// 2. NAVEGACIÓN
function toggleDropdown() {
    document.getElementById('user-menu').classList.toggle('hide');
}

function showSection(section) {
    document.querySelectorAll('.view-content').forEach(v => v.classList.add('hide'));
    document.getElementById(`sec-${section}`).classList.remove('hide');
    document.getElementById('user-menu').classList.add('hide');
}

// 3. PUBLICAR
function addPost() {
    const title = document.getElementById('post-title').value;
    const desc = document.getElementById('post-desc').value;
    const topic = document.getElementById('post-topic').value || "General";

    if(!title || !desc) return alert("Completa título y descripción");

    const feed = document.getElementById('feed-items');
    if(stats.posts === 0) feed.innerHTML = ""; // Limpiar mensaje vacío

    const postHTML = `
        <div class="post-card">
            <div style="display:flex; justify-content:space-between; margin-bottom:10px">
                <small style="color:gray"><b>${topic}</b> • Ahora mismo</small>
                <button onclick="this.parentElement.parentElement.remove(); updateStats('posts', -1)" style="border:none; background:none; color:red; cursor:pointer"><i class="fa fa-trash"></i></button>
            </div>
            <h4>${title}</h4>
            <p>${desc}</p>
        </div>
    `;

    feed.insertAdjacentHTML('afterbegin', postHTML);
    updateStats('posts', 1);

    // Limpiar campos
    document.getElementById('post-title').value = "";
    document.getElementById('post-desc').value = "";
}

// 4. BUSCAR USUARIOS / POSTS
function executeSearch() {
    const type = document.getElementById('search-type').value;
    const query = document.getElementById('main-search').value.trim();

    if(!query) return;

    if(type === 'users') {
        const resultHTML = `
            <div class="post-card" style="text-align:center">
                <div class="avatar-circle" style="margin: 0 auto 10px; width: 50px; height: 50px;">${query.charAt(0).toUpperCase()}</div>
                <h4>${query}</h4>
                <button class="btn-post" style="width:auto; padding: 8px 20px" onclick="toggleFollow(this)">Seguir</button>
            </div>
        `;
        document.getElementById('feed-items').innerHTML = resultHTML;
    }
}

function toggleFollow(btn) {
    if(btn.innerText === "Seguir") {
        btn.innerText = "Dejar de seguir";
        btn.style.background = "#e1e1e1";
        btn.style.color = "black";
        updateStats('followers', 1);
    } else {
        btn.innerText = "Seguir";
        btn.style.background = "black";
        btn.style.color = "white";
        updateStats('followers', -1);
    }
}

// 5. ACTUALIZAR CONTADORES
function updateStats(key, val) {
    stats[key] += val;
    document.getElementById(`stat-${key}`).innerText = stats[key];
    if(key === 'posts') document.getElementById('stat-posts').innerText = stats.posts;
}

function logout() {
    location.reload();
}
