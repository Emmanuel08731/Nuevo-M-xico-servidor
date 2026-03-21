// VARIABLES GLOBALES
let currentUser = null;

// SISTEMA DE ALERTAS PERSONALIZADAS
function showAlert(message, type = 'success') {
    const alertBox = document.getElementById('alert-system');
    const alert = document.createElement('div');
    alert.className = `custom-alert animate__animated animate__fadeInRight ${type}`;
    alert.innerHTML = `<span>${type === 'success' ? '✅' : '❌'}</span> ${message}`;
    alertBox.appendChild(alert);
    
    setTimeout(() => {
        alert.classList.replace('animate__fadeInRight', 'animate__fadeOutRight');
        setTimeout(() => alert.remove(), 500);
    }, 3500);
}

// CAMBIAR FORMULARIOS
function toggleAuthForms(target) {
    document.getElementById('form-login').classList.remove('active');
    document.getElementById('form-reg').classList.remove('active');
    
    if(target === 'reg') {
        document.getElementById('form-reg').classList.add('active');
    } else {
        document.getElementById('form-login').classList.add('active');
    }
}

// REGISTRO
async function processRegister() {
    const username = document.getElementById('reg-user').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-pass').value;

    if(!username || !email || !password) return showAlert("Por favor, llena todos los campos", "error");

    try {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        const data = await res.json();
        
        if(data.success) {
            showAlert("¡Cuenta creada! Ya puedes iniciar sesión.");
            toggleAuthForms('log');
            document.getElementById('log-email').value = email;
        } else {
            showAlert(data.error || "El email ya está en uso", "error");
        }
    } catch(e) {
        showAlert("Error al conectar con el servidor", "error");
    }
}

// LOGIN
async function processLogin() {
    const email = document.getElementById('log-email').value;
    const password = document.getElementById('log-pass').value;

    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        
        if(data.success) {
            showAlert("Acceso concedido. Cargando tu entorno...");
            currentUser = data.user;
            initApp();
        } else {
            showAlert("Credenciales incorrectas", "error");
        }
    } catch(e) {
        showAlert("Fallo en el servidor", "error");
    }
}

// INICIAR DASHBOARD
function initApp() {
    document.getElementById('auth-view').classList.add('animate__animated', 'animate__fadeOut');
    setTimeout(() => {
        document.getElementById('auth-view').style.display = 'none';
        document.getElementById('app-view').classList.remove('hidden');
        
        // Actualizar datos de UI
        document.getElementById('nav-username').innerText = currentUser.name;
        document.getElementById('drop-name').innerText = currentUser.name;
        document.getElementById('nav-avatar').innerText = currentUser.name[0].toUpperCase();
        document.getElementById('drop-handle').innerText = "@" + currentUser.name.toLowerCase().replace(/\s/g, '');
        
        loadFeed();
    }, 500);
}

// PUBLICAR POST
function publishPost() {
    const text = document.getElementById('post-text').value;
    if(!text.trim()) return;

    const feed = document.getElementById('posts-feed');
    const postHTML = `
        <div class="post-card">
            <div class="post-header">
                <div class="u-avatar">${currentUser.name[0]}</div>
                <div class="post-info">
                    <strong>${currentUser.name}</strong>
                    <span>Ahora mismo • 🌍 Público</span>
                </div>
            </div>
            <div class="post-body">
                ${text}
            </div>
        </div>
    `;
    
    feed.insertAdjacentHTML('afterbegin', postHTML);
    document.getElementById('post-text').value = '';
    showAlert("Publicación enviada");
}

function loadFeed() {
    // Aquí podrías hacer un fetch real a los posts de la DB
    console.log("Feed cargado satisfactoriamente.");
}

function toggleDropdown() {
    document.getElementById('user-menu').classList.toggle('show');
}

function killSession() {
    window.location.reload();
}

// Cerrar menú si se clickea fuera
window.onclick = function(e) {
    if (!e.target.closest('.user-pill')) {
        document.getElementById('user-menu').classList.remove('show');
    }
}
