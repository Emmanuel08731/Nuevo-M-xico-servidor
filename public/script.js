let isLogin = true;
let currentUser = null;

function msg(text) {
    const toast = document.getElementById('toast');
    toast.innerText = text;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function switchAuth() {
    isLogin = !isLogin;
    document.getElementById('auth-title').innerText = isLogin ? "Iniciar Sesión" : "Crear Perfil";
    document.getElementById('btn-auth').innerText = isLogin ? "Conectar" : "Inicializar";
}

async function runAuth() {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('pass').value;
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';

    if(!email || !pass) return msg("Completa todos los campos");

    const res = await fetch(endpoint, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ email, password: pass, username: "Emmanuel Director" })
    });

    const data = await res.json();

    if(res.ok) {
        if(isLogin) {
            currentUser = data.user;
            document.getElementById('auth-screen').classList.add('hidden');
            document.getElementById('dashboard').classList.remove('hidden');
            document.getElementById('display-name').innerText = data.user.name;
            document.getElementById('drop-user').innerText = data.user.name;
            msg("Nodo Conectado Correctamente");
        } else {
            msg("Perfil creado en la base de datos");
            switchAuth();
        }
    } else {
        msg(data.error || "Error de conexión");
    }
}

function toggleDrop() { document.getElementById('user-drop').classList.toggle('drop-hidden'); }
function openSettings() { document.getElementById('modal-settings').classList.remove('modal-hidden'); toggleDrop(); }
function closeSettings() { document.getElementById('modal-settings').classList.add('modal-hidden'); }

async function destroyAccount() {
    if(confirm("¿Eliminar perfil de DevRoot permanentemente?")) {
        await fetch('/api/auth/delete', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ email: currentUser.email })
        });
        msg("Cuenta eliminada del sistema");
        setTimeout(() => location.reload(), 2000);
    }
}

function exit() { location.reload(); }
