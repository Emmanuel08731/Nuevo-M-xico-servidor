/** * ECNHACA SMART ENGINE v2.5 
 * Lógica de búsqueda flexible y perfiles dinámicos
 */

let me = JSON.parse(localStorage.getItem('ec_session')) || null;
let currentProfileId = null;

// --- INICIALIZACIÓN ---
function initSocialLogic() {
    if (me) {
        document.getElementById('app').classList.remove('hide');
        document.getElementById('auth').classList.add('hide');
        renderMyNav();
        goHome();
    } else {
        document.getElementById('auth').classList.remove('hide');
    }
}

// --- BUSCADOR INTELIGENTE ---
let searchTimer;
async function liveSearch(q) {
    const list = document.getElementById('search-results');
    const empty = document.getElementById('empty-state');
    
    // Limpiar si no hay texto
    if (!q || q.trim().length === 0) { 
        list.innerHTML = ''; 
        empty.classList.remove('hide'); 
        return; 
    }

    clearTimeout(searchTimer);
    
    // Esperar a que el usuario termine de escribir (300ms)
    searchTimer = setTimeout(async () => {
        try {
            // Llamada a la API de Render
            const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&myId=${me.id}`);
            let users = await res.json();
            
            list.innerHTML = '';
            empty.classList.add('hide');

            if (users.length === 0) {
                // LÓGICA DE "PERFILES SIMILARES"
                // Si no hay coincidencia exacta, buscamos la primera letra para sugerir
                const altRes = await fetch(`/api/search?q=${q.charAt(0)}&myId=${me.id}`);
                users = await altRes.json();
                
                if (users.length > 0) {
                    list.innerHTML = `<p class="suggest-text">No hay resultados exactos. Quizás quisiste decir:</p>`;
                } else {
                    list.innerHTML = `<div class="no-results">No encontramos a nadie llamado "${q}"</div>`;
                    return;
                }
            }

            // Renderizar tarjetas de usuario
            users.forEach((u, i) => {
                const card = document.createElement('div');
                card.className = 'user-card animate-up';
                card.style.animationDelay = `${i * 0.05}s`;
                
                // IMPORTANTE: El clic en la tarjeta lleva al perfil
                // El clic en el botón (si lo hubiera) sería independiente
                card.onclick = (e) => {
                    vibrateBtn(card);
                    openUserProfile(u.id);
                };

                card.innerHTML = `
                    <div class="av-small" style="background:${u.color || '#6366f1'}">
                        ${u.username[0].toUpperCase()}
                    </div>
                    <div class="u-info">
                        <b style="font-size:1.1rem">@${u.username}</b>
                        <p style="color:#64748b; font-size:0.8rem">
                            <i class="fa fa-users"></i> ${u.followers_count || 0} seguidores
                        </p>
                    </div>
                    <div class="arrow-icon">
                        <i class="fa fa-chevron-right"></i>
                    </div>
                `;
                list.appendChild(card);
            });

        } catch (error) {
            console.error("Error en búsqueda:", error);
        }
    }, 300);
}

// --- SISTEMA DE PERFILES ---
async function openUserProfile(id) {
    try {
        // 1. Obtener datos del usuario desde Render
        const res = await fetch(`/api/user/${id}`);
        if (!res.ok) return;
        const u = await res.json();
        currentProfileId = id;

        // 2. Verificar relación de seguimiento
        // Buscamos específicamente a este usuario para ver el estado 'is_following'
        const checkRes = await fetch(`/api/search?q=${u.username}&myId=${me.id}`);
        const checkData = await checkRes.json();
        // Buscamos el objeto exacto en el array que devuelve el buscador
        const target = checkData.find(user => user.id === id);
        const isFollowing = target ? (target.is_following > 0) : false;

        // 3. Inyectar datos en el HTML (VISTA PERFIL)
        const pColor = document.getElementById('pColor');
        const pAv = document.getElementById('pAv');
        const pUser = document.getElementById('pUsername');
        const pBio = document.getElementById('pBio');
        const pFol = document.getElementById('pFol');
        const pIng = document.getElementById('pIng');
        const btn = document.getElementById('btnFollow');

        pColor.style.background = u.color || '#6366f1';
        pAv.innerText = u.username[0].toUpperCase();
        pAv.style.background = u.color || '#6366f1';
        pUser.innerText = "@" + u.username;
        pBio.innerText = u.bio || "Este usuario prefiere mantener el misterio...";
        pFol.innerText = u.followers_count || 0;
        pIng.innerText = u.following_count || 0;

        // 4. Lógica del botón de seguimiento
        if (id === me.id) {
            btn.classList.add('hide'); // No te puedes seguir a ti mismo
        } else {
            btn.classList.remove('hide');
            if (isFollowing) {
                btn.innerText = "Dejar de seguir";
                btn.classList.add('active'); // Clase para estilo gris/unfollow
            } else {
                btn.innerText = "Seguir";
                btn.classList.remove('active');
            }
        }

        // 5. Cambiar de vista usando script.js
        switchView('v-profile');
        window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error) {
        console.error("Error al cargar perfil:", error);
    }
}

// --- ACCIÓN DE FOLLOW / UNFOLLOW ---
async function toggleFollowAction() {
    const btn = document.getElementById('btnFollow');
    if (!currentProfileId || !me) return;

    // Bloqueo temporal para evitar spam de clics
    btn.disabled = true;
    btn.style.opacity = "0.5";

    try {
        const res = await fetch('/api/follow-toggle', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                myId: me.id,
                targetId: currentProfileId
            })
        });

        if (res.ok) {
            const data = await res.json();
            // Refrescar los datos del perfil para ver el cambio de contador
            await openUserProfile(currentProfileId);
        }
    } catch (error) {
        alert("Error de conexión con Ecnhaca");
    } finally {
        btn.disabled = false;
        btn.style.opacity = "1";
    }
}

// --- UTILIDADES ---
function renderMyNav() {
    const navAv = document.getElementById('myAvatar');
    if (navAv && me) {
        navAv.innerText = me.username[0].toUpperCase();
        navAv.style.background = me.color || '#6366f1';
    }
}

function goHome() {
    switchView('v-search');
    const sIn = document.getElementById('sIn');
    if(sIn) sIn.value = "";
    liveSearch("");
}

function viewMyProfile() {
    if (me) openUserProfile(me.id);
}

function logout() {
    const confirmOut = confirm("¿Emmanuel, seguro que quieres salir de Ecnhaca?");
    if (confirmOut) {
        localStorage.removeItem('ec_session');
        location.reload();
    }
}

// Función de autenticación (Login/Registro) integrada
async function handleAuth(e) {
    e.preventDefault();
    const u = document.getElementById('uIn').value;
    const p = document.getElementById('pIn').value;
    const emailInput = document.getElementById('eIn');
    const email = emailInput ? emailInput.value : "";

    const path = mode === 'login' ? '/api/login' : '/api/register';
    
    try {
        const res = await fetch(path, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({username: u, password: p, email: email})
        });

        if (res.ok) {
            me = await res.json();
            localStorage.setItem('ec_session', JSON.stringify(me));
            location.reload();
        } else {
            alert("Error: Usuario o contraseña incorrectos.");
        }
    } catch (err) {
        alert("El servidor de Render no responde.");
    }
}
