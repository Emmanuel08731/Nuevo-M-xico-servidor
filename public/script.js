// --- SISTEMA DE GESTIÓN DE UI ---
window.addEventListener('load', () => {
    setTimeout(() => {
        document.getElementById('loader').style.opacity = '0';
        setTimeout(() => document.getElementById('loader').style.display = 'none', 500);
    }, 1500);
});

function showBox(type) {
    document.getElementById('box-login').classList.remove('active');
    document.getElementById('box-reg').classList.remove('active');
    document.getElementById(`box-${type}`).classList.add('active');
}

function notify(msg, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast animate__animated animate__fadeInRight ${type}`;
    toast.innerHTML = `<strong>${type === 'success' ? '✅' : '❌'}</strong> ${msg}`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.replace('animate__fadeInRight', 'animate__fadeOutRight');
        setTimeout(() => toast.remove(), 500);
    }, 4000);
}

// --- LÓGICA DE SERVIDOR ---
async function doRegister() {
    const username = document.getElementById('r-user').value;
    const email = document.getElementById('r-email').value;
    const password = document.getElementById('r-pass').value;

    if(!username || !email || !password) return notify("Completa todos los nodos", "error");

    try {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        const data = await res.json();

        if(data.success) {
            notify("¡Cuenta creada! Inicializando entorno de login...");
            setTimeout(() => {
                showBox('login');
                document.getElementById('l-email').value = email;
            }, 1000);
        } else {
            notify(data.error || "Email ya registrado", "error");
        }
    } catch(e) { notify("Error de red central", "error"); }
}

async function doLogin() {
    const email = document.getElementById('l-email').value;
    const password = document.getElementById('l-pass').value;

    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if(data.success) {
            notify("Sincronizando perfil...");
            launchApp(data.user);
        } else {
            notify("Acceso denegado: Credenciales inválidas", "error");
        }
    } catch(e) { notify("Servidor no responde", "error"); }
}

function launchApp(user) {
    document.getElementById('view-auth').classList.add('animate__animated', 'animate__fadeOut');
    setTimeout(() => {
        document.getElementById('view-auth').style.display = 'none';
        document.getElementById('view-app').classList.remove('hidden');
        
        // Carga de datos
        document.getElementById('u-name').innerText = user.name;
        document.getElementById('u-avatar').innerText = user.name[0].toUpperCase();
        document.getElementById('u-handle').innerText = "@" + user.name.toLowerCase().replace(/\s/g, '');
        document.getElementById('drop-email').innerText = user.email;
        
        loadFeed();
    }, 600);
}

function createPost() {
    const text = document.getElementById('post-input').value;
    if(!text.trim()) return;

    const feed = document.getElementById('feed-items');
    const post = document.createElement('div');
    post.className = 'post-card';
    post.innerHTML = `
        <div class="composer-header">
            <div class="user-avatar xs">${document.getElementById('u-avatar').innerText}</div>
            <div>
                <strong>${document.getElementById('u-name').innerText}</strong>
                <p style="font-size: 0.8rem; color: #888;">Ahora mismo • 🌍</p>
            </div>
        </div>
        <div class="post-body">${text}</div>
    `;
    
    feed.prepend(post);
    document.getElementById('post-input').value = '';
    notify("Publicación desplegada con éxito");
}

function toggleUserMenu() {
    document.getElementById('user-dropdown').classList.toggle('active');
}

function forceLogout() {
    location.reload();
}
