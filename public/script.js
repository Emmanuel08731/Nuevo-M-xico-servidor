let isLogin = true;
let currentUser = null;

function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.innerText = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000); // Se quita tras 3 seg
}

function toggleMode() {
    isLogin = !isLogin;
    document.getElementById('form-title').innerText = isLogin ? "Iniciar Sesión" : "Crear Cuenta";
    document.getElementById('btn-main').innerText = isLogin ? "Conectar" : "Inicializar";
}

async function authAction() {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('pass').value;
    const path = isLogin ? '/api/auth/login' : '/api/auth/register';

    const res = await fetch(path, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ email, password: pass, username: "Director Emmanuel" })
    });

    if(res.ok) {
        if(isLogin) {
            currentUser = email;
            document.getElementById('auth-screen').style.display = 'none';
            document.getElementById('dashboard').classList.add('dash-show');
            document.getElementById('dashboard').style.display = 'block';
            showToast("Nodo Conectado Correctamente");
        } else {
            showToast("Cuenta Creada en la Base de Datos");
            toggleMode();
        }
    } else {
        showToast("Error: Llave Incorrecta");
    }
}

function logout() {
    location.reload();
}

async function deleteAccount() {
    if(confirm("¿Seguro que quieres eliminar tu perfil?")) {
        await fetch('/api/auth/delete', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ email: currentUser })
        });
        showToast("Cuenta Eliminada del Sistema");
        setTimeout(() => logout(), 2000);
    }
}
