/**
 * ECNHACA SOCIAL ENGINE v1.0
 * Desarrollado por Emmanuel Dev
 * Lógica: SPA, PostgreSQL Real-time Fetch, Session Management
 */

// --- 1. ESTADO GLOBAL ---
let usuarioActual = JSON.parse(localStorage.getItem('ecnhaca_user')) || null;
let modoAuth = 'login';
let busquedaActiva = false;

// --- 2. INICIALIZADOR DEL SISTEMA ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("⚡ Ecnhaca Engine: Sistema listo.");
    verificarSesion();
    
    // Cerrar el menú desplegable si se hace clic fuera
    window.addEventListener('click', (e) => {
        const menu = document.getElementById('dropdown');
        const trigger = document.querySelector('.user-trigger');
        if (menu && !trigger.contains(e.target) && !menu.contains(e.target)) {
            menu.classList.add('hide');
        }
    });
});

/**
 * Verifica si el usuario ya está logueado en Ecnhaca
 */
function verificarSesion() {
    const authBox = document.getElementById('authBox');
    const app = document.getElementById('app');

    if (usuarioActual) {
        authBox.classList.add('hide');
        app.classList.remove('hide');
        cargarDatosHeader();
        irA('feed');
    } else {
        authBox.classList.remove('hide');
        app.classList.add('hide');
    }
}

// --- 3. LÓGICA DE AUTENTICACIÓN ---

function setMode(m) {
    modoAuth = m;
    const inputMail = document.getElementById('e');
    const btnPrincipal = document.getElementById('btnA');
    const tabL = document.getElementById('tL');
    const tabR = document.getElementById('tR');

    if (m === 'reg') {
        inputMail.classList.remove('hide');
        btnPrincipal.innerText = "Crear Cuenta de Ecnhaca";
        tabR.classList.add('active');
        tabL.classList.remove('active');
    } else {
        inputMail.classList.add('hide');
        btnPrincipal.innerText = "Iniciar Sesión";
        tabL.classList.add('active');
        tabR.classList.remove('active');
    }
}

async function doAuth(event) {
    event.preventDefault();
    const user = document.getElementById('u').value.trim();
    const pass = document.getElementById('p').value.trim();
    const email = document.getElementById('e').value.trim();

    const path = modoAuth === 'login' ? '/api/login' : '/api/register';
    const payload = modoAuth === 'login' ? { username: user, password: pass } : { username: user, email, password: pass };

    try {
        const res = await fetch(path, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            const data = await res.json();
            localStorage.setItem('ecnhaca_user', JSON.stringify(data));
            location.reload(); // Reiniciar para aplicar cambios
        } else {
            const err = await res.json();
            alert("Error: " + (err.error || "Datos incorrectos"));
        }
    } catch (e) {
        alert("No se pudo conectar con el servidor de Ecnhaca en Render.");
    }
}

// --- 4. NAVEGACIÓN ENTRE VISTAS (SPA) ---

/**
 * Cambia entre Feed, Perfil y Configuración sin recargar
 */
function irA(vista) {
    // Ocultar todas las vistas primero
    const vistas = ['view-feed', 'view-profile', 'view-settings'];
    vistas.forEach(v => document.getElementById(v).classList.add('hide'));

    // Mostrar la vista seleccionada
    const vistaActiva = document.getElementById('view-' + vista);
    vistaActiva.classList.remove('hide');
    vistaActiva.classList.add('animate-up');

    // Cerrar menú siempre al navegar
    document.getElementById('dropdown').classList.add('hide');

    if (vista === 'profile') {
        cargarEstadisticasPerfil();
    }
}

function toggleMenu() {
    const menu = document.getElementById('dropdown');
    menu.classList.toggle('hide');
}

// --- 5. BUSCADOR DE USUARIOS ---

let timerBusqueda;
async function search(q) {
    const lista = document.getElementById('results');
    const emptyMsg = document.getElementById('empty-msg');

    clearTimeout(timerBusqueda);

    if (q.length < 1) {
        lista.innerHTML = '';
        emptyMsg.classList.remove('hide');
        return;
    }

    emptyMsg.classList.add('hide');

    timerBusqueda = setTimeout(async () => {
        try {
            const res = await fetch(`/api/search?q=${q}&myId=${usuarioActual.id}`);
            const usuarios = await res.json();
            
            lista.innerHTML = '';
            
            if (usuarios.length === 0) {
                lista.innerHTML = '<p class="no-found">No se encontró a nadie con ese nombre.</p>';
                return;
            }

            usuarios.forEach((u, i) => {
                const card = document.createElement('div');
                card.className = 'user-card';
                card.style.animationDelay = `${i * 0.05}s`;
                
                card.innerHTML = `
                    <div class="mini-av" style="background:${u.color}">${u.username[0].toUpperCase()}</div>
                    <div class="u-info">
                        <b>@${u.username}</b>
                        <p>${u.followers} seguidores</p>
                    </div>
                    <button class="btn-follow ${u.am_following > 0 ? 'following' : ''}" 
                            onclick="ejecutarFollow(${u.id}, this)">
                        ${u.am_following > 0 ? 'Siguiendo' : 'Seguir'}
                    </button>
                `;
                lista.appendChild(card);
            });
        } catch (e) {
            console.error("Error en búsqueda remota");
        }
    }, 350);
}

// --- 6. ACCIÓN DE SEGUIR ---

async function ejecutarFollow(idTarget, boton) {
    if (boton.classList.contains('following')) return;

    // Efecto visual de carga
    boton.innerText = "...";
    boton.disabled = true;

    try {
        const res = await fetch('/api/follow', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ myId: usuarioActual.id, targetId: idTarget })
        });

        if (res.ok) {
            boton.innerText = "Siguiendo";
            boton.classList.add('following');
            boton.disabled = false;
        }
    } catch (e) {
        boton.innerText = "Seguir";
        boton.disabled = false;
    }
}

// --- 7. CARGA DE DATOS DINÁMICOS ---

function cargarDatosHeader() {
    const avatar = document.getElementById('myAv');
    avatar.innerText = usuarioActual.username[0].toUpperCase();
    avatar.style.background = usuarioActual.color || '#6366f1';
}

async function cargarEstadisticasPerfil() {
    // Actualizar visual del perfil
    document.getElementById('pAv').innerText = usuarioActual.username[0].toUpperCase();
    document.getElementById('pAv').style.background = usuarioActual.color;
    document.getElementById('pName').innerText = "@" + usuarioActual.username;
    document.getElementById('pBio').innerText = usuarioActual.bio || "Usuario de Ecnhaca";

    try {
        const res = await fetch(`/api/profile-stats/${usuarioActual.id}`);
        const stats = await res.json();
        
        // Animación de números
        animarNumero('s-followers', stats.followers);
        animarNumero('s-following', stats.following);
    } catch (e) {
        console.error("No se pudieron cargar las estadísticas.");
    }
}

function animarNumero(id, valor) {
    const el = document.getElementById(id);
    el.innerText = valor; // En una versión más pro, aquí haríamos un contador que sube
}

function logout() {
    const confirmar = confirm("¿Emmanuel, seguro que quieres cerrar sesión en Ecnhaca?");
    if (confirmar) {
        localStorage.removeItem('ecnhaca_user');
        location.reload();
    }
}

/**
 * Función estética para scroll suave
 */
function scrollArriba() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
