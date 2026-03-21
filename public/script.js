// CONTROL DE VISTAS
function switchForm(type) {
    const login = document.getElementById('login-form');
    const register = document.getElementById('register-form');
    const statusText = document.getElementById('auth-status-text');

    if (type === 'reg') {
        login.classList.remove('active');
        register.classList.add('active');
        statusText.innerText = "Crea tu identificador en la red.";
    } else {
        register.classList.remove('active');
        login.classList.add('active');
        statusText.innerText = "Inicia sesión para desplegar tus ideas.";
    }
}

// SISTEMA DE NOTIFICACIONES
function notify(msg, type = 'success') {
    const toast = document.getElementById('notification-toast');
    toast.innerText = msg;
    toast.className = `toast visible ${type} animate__animated animate__fadeInRight`;
    
    setTimeout(() => {
        toast.classList.replace('animate__fadeInRight', 'animate__fadeOutRight');
        setTimeout(() => toast.classList.add('hidden'), 500);
    }, 3000);
}

// LOGICA DE REGISTRO
async function handleRegister() {
    const user = document.getElementById('r-user').value;
    const email = document.getElementById('r-email').value;
    const pass = document.getElementById('r-pass').value;

    if(!user || !email || !pass) return notify("Completa todos los nodos", "error");

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user, email, password: pass })
        });
        
        const data = await response.json();

        if (data.success) {
            notify("✅ ¡CUENTA CREADA! Redirigiendo...");
            // Pequeña animación de espera para que el usuario lea el mensaje
            setTimeout(() => {
                switchForm('log');
                document.getElementById('l-email').value = email;
            }, 1500);
        } else {
            notify("❌ Error: " + (data.error || "El email ya existe"), "error");
        }
    } catch (e) {
        notify("Fallo en la conexión con el nodo central", "error");
    }
}

// LOGICA DE LOGIN
async function handleLogin() {
    const email = document.getElementById('l-email').value;
    const pass = document.getElementById('l-pass').value;

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: pass })
        });
        
        const data = await response.json();

        if (data.success) {
            notify("Iniciando sesión...");
            startDashboard(data.user);
        } else {
            notify("❌ Credenciales incorrectas", "error");
        }
    } catch (e) {
        notify("Error de red", "error");
    }
}

function startDashboard(user) {
    document.getElementById('auth-screen').classList.add('animate__animated', 'animate__fadeOut');
    setTimeout(() => {
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');
        document.getElementById('user-display').innerText = user.name;
        document.getElementById('avatar-initial').innerText = user.name[0].toUpperCase();
        document.getElementById('menu-full-user').innerText = "@" + user.name.toLowerCase().replace(" ", "_");
    }, 500);
}

function toggleUserMenu() {
    document.getElementById('profile-menu').classList.toggle('active');
}

function logout() {
    location.reload();
}

// Cierre de menú al clickear fuera
window.onclick = function(e) {
    if (!e.target.closest('.nav-profile')) {
        document.getElementById('profile-menu').classList.remove('active');
    }
}
