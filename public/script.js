function toggleAuth() {
    document.getElementById('login-section').classList.toggle('hidden');
    document.getElementById('register-section').classList.toggle('hidden');
}

async function handleRegister() {
    const username = document.getElementById('reg-user').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-pass').value;

    const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
    });
    const data = await res.json();
    if(data.success) {
        alert("¡Cuenta creada!");
        toggleAuth();
    }
}

async function handleLogin() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-pass').value;

    const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if(data.success) {
        document.getElementById('auth-container').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');
        document.getElementById('user-display').innerText = data.user.name;
    } else {
        alert(data.error);
    }
}
