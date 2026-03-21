function toggleAuth() {
    const login = document.getElementById('login-form');
    const register = document.getElementById('register-form');
    login.style.display = login.style.display === 'none' ? 'block' : 'none';
    register.style.display = register.style.display === 'none' ? 'block' : 'none';
}

async function register() {
    const username = document.getElementById('reg-user').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-pass').value;

    const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
    });

    const data = await response.json();
    if(data.success) {
        alert("¡Cuenta creada! Ahora inicia sesión.");
        toggleAuth();
    } else {
        alert("Error: " + data.error);
    }
}

async function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-pass').value;

    const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    if(data.success) {
        showDashboard(data.user);
    } else {
        alert("Acceso denegado: " + data.msg);
    }
}

function showDashboard(user) {
    document.getElementById('auth-container').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    document.getElementById('display-name').innerText = user.name;
    document.getElementById('stat-status').innerText = user.plan || "Usuario Estándar";
}

function logout() {
    location.reload();
}
