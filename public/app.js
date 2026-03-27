let sesion = JSON.parse(localStorage.getItem('emmanuel_user')) || null;
let modo = 'login';

// 1. ARRANCAR WEB
window.onload = () => {
    if (sesion) {
        document.getElementById('authBox').classList.add('hidden');
        document.getElementById('webContent').classList.remove('hidden');
        document.getElementById('me').innerText = `Hola, ${sesion.username}`;
        buscarDB(""); // Carga inicial
    }
};

// 2. CAMBIAR ENTRE LOGIN Y REGISTRO
function setAuth(m) {
    modo = m;
    document.getElementById('mail').classList.toggle('hidden', m === 'login');
    document.getElementById('tabL').classList.toggle('active', m === 'login');
    document.getElementById('tabR').classList.toggle('active', m === 'reg');
    document.getElementById('mainBtn').innerText = m === 'login' ? 'Entrar' : 'Registrarse';
}

// 3. EJECUTAR AUTH (CONECTA A RENDER)
async function ejecutarAuth(e) {
    e.preventDefault();
    const u = document.getElementById('user').value;
    const p = document.getElementById('pass').value;
    const m = document.getElementById('mail').value;

    const ruta = modo === 'login' ? '/api/login' : '/api/register';
    const datos = modo === 'login' ? {username: u, password: p} : {username: u, email: m, password: p};

    const res = await fetch(ruta, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(datos)
    });

    if (res.ok) {
        const user = await res.json();
        localStorage.setItem('emmanuel_user', JSON.stringify(user));
        location.reload();
    } else {
        alert("Error: Datos incorrectos o usuario ya existe");
    }
}

// 4. BUSCADOR EN TIEMPO REAL (LECTURA DE POSTGRES)
async function buscarDB(query) {
    const res = await fetch(`/api/search?q=${query}`);
    const usuarios = await res.json();
    const lista = document.getElementById('feed');
    lista.innerHTML = '';

    usuarios.forEach(user => {
        lista.innerHTML += `
            <div class="user-item">
                <div class="av">${user.username[0].toUpperCase()}</div>
                <div class="txt">
                    <div class="u-name">@${user.username}</div>
                    <div class="u-bio">${user.bio}</div>
                </div>
            </div>
        `;
    });
}
