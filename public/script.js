// Funciones de vista
function showRegister() {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('register-section').style.display = 'block';
    document.getElementById('auth-msg').innerText = "Únete a la comunidad DevRoot";
}

function showLogin() {
    document.getElementById('register-section').style.display = 'none';
    document.getElementById('login-section').style.display = 'block';
    document.getElementById('auth-msg').innerText = "Bienvenido a la raíz del código";
}

function toggleMenu() {
    document.getElementById('drop-menu').classList.toggle('active');
}

// Registro
async function register() {
    const username = document.getElementById('reg-user').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-pass').value;

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        const data = await response.json();
        
        if(data.success) {
            alert("✅ ¡Cuenta creada con éxito!");
            showLogin(); // Te lleva al login automáticamente
        } else {
            alert("Error: " + (data.error || "Datos inválidos"));
        }
    } catch (e) {
        alert("Fallo de conexión con el servidor.");
    }
}

// Login
async function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-pass').value;

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();

        if(data.success) {
            enterDashboard(data.user);
        } else {
            alert("❌ Error: " + data.msg);
        }
    } catch (e) {
        alert("Fallo de conexión.");
    }
}

function enterDashboard(user) {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('main-dashboard').style.display = 'block';
    document.getElementById('user-name-display').innerText = user.name;
    document.getElementById('menu-user-full').innerText = "@" + user.name.replace(/\s/g, '').toLowerCase();
}

function logout() {
    window.location.reload();
}

// Cerrar menú si haces clic fuera
window.onclick = function(event) {
    if (!event.target.closest('.profile-trigger')) {
        const menu = document.getElementById('drop-menu');
        if (menu.classList.contains('active')) menu.classList.remove('active');
    }
}
