/**
 * ==========================================================
 * ECNHACA DATA ENGINE v150
 * CORE: API COMMUNICATION & POSTGRESQL CRUD
 * DEVELOPER: EMMANUEL
 * ==========================================================
 */

let USER_DATABASE_CACHE = [];

// --- MANEJADOR DE AUTENTICACIÓN ---
async function handleAuthAction(event) {
    event.preventDefault();
    const mode = document.getElementById('auth-mode').value; // 'login' o 'register'
    const payload = {
        username: document.getElementById('inp-user').value.trim().toLowerCase(),
        email: document.getElementById('inp-email').value.trim().toLowerCase(),
        password: document.getElementById('inp-pass').value.trim()
    };

    // Validaciones de Front-End para Emmanuel
    if (payload.username.length < 3) return showNotification("Usuario demasiado corto", "error");
    if (payload.password.length < 5) return showNotification("La contraseña debe tener +5 caracteres", "error");

    try {
        logSystem(`Intentando ${mode} para ${payload.username}...`);
        const res = await fetch(`/api/auth/${mode}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (res.ok) {
            localStorage.setItem('ec_session', JSON.stringify(data.user));
            showNotification(`Éxito: Sesión iniciada como ${data.user.username}`);
            setTimeout(() => location.reload(), 1000);
        } else {
            showNotification(data.error || "Fallo en la autenticación", "error");
            logSystem(`ERROR AUTH: ${data.error}`);
        }
    } catch (err) {
        showNotification("Error de red: Render no responde", "error");
        logSystem("Fallo crítico de conexión.");
    }
}

// --- SINCRONIZACIÓN DE BASE DE DATOS (ADMIN PANEL) ---
async function syncDatabase() {
    const tableBody = document.getElementById('admin-table-body');
    tableBody.innerHTML = '<tr><td colspan="5" class="t-center">Sincronizando registros con PostgreSQL...</td></tr>';
    
    try {
        const res = await fetch('/api/admin/users');
        if (!res.ok) throw new Error("Acceso denegado");
        
        USER_DATABASE_CACHE = await res.json();
        renderUserTable(USER_DATABASE_CACHE);
        logSystem(`Base de datos sincronizada: ${USER_DATABASE_CACHE.length} registros.`);
    } catch (err) {
        showNotification("Error al cargar la DB", "error");
        tableBody.innerHTML = '<tr><td colspan="5" class="t-center" style="color:red">ERROR DE ACCESO</td></tr>';
    }
}

/**
 * EMMANUEL SEARCH ENGINE
 * Filtra por UID (#), Nombre de Usuario o Correo Gmail.
 */
function executeMasterSearch() {
    const query = document.getElementById('master-search').value.toLowerCase().trim();
    logSystem(`Buscando: "${query}"`);

    if (!query) {
        renderUserTable(USER_DATABASE_CACHE);
        return;
    }

    const filtered = USER_DATABASE_CACHE.filter(u => {
        const idMatch = u.id.toString().includes(query);
        const nameMatch = u.username.toLowerCase().includes(query);
        const emailMatch = u.email.toLowerCase().includes(query);
        return idMatch || nameMatch || emailMatch;
    });

    renderUserTable(filtered);
}

function renderUserTable(data) {
    const container = document.getElementById('admin-table-body');
    
    if (data.length === 0) {
        container.innerHTML = '<tr><td colspan="5" class="t-center">No se encontraron registros coincidentes.</td></tr>';
        return;
    }

    container.innerHTML = data.map(user => `
        <tr class="row-user">
            <td><span style="color:#555">#</span>${user.id}</td>
            <td>
                <div style="display:flex; align-items:center; gap:10px;">
                    <div style="width:10px; height:10px; border-radius:50%; background:${user.avatar_color}"></div>
                    <b>${user.username}</b>
                </div>
            </td>
            <td>${user.email}</td>
            <td>
                <span class="${user.role === 'admin' ? 'badge-admin' : 'badge-user'}">
                    ${user.role.toUpperCase()}
                </span>
            </td>
            <td>
                ${user.role !== 'admin' ? `
                    <button class="btn-delete" onclick="deleteUserRecord(${user.id})">
                        <i class="fa fa-trash"></i> Purgar
                    </button>
                ` : '<small style="color:#444">PROTEGIDO</small>'}
            </td>
        </tr>
    `).join('');
}

// --- FUNCIÓN DE ELIMINACIÓN DE USUARIOS ---
async function deleteUserRecord(id) {
    if (!confirm(`EMMANUEL: ¿Estás 100% seguro de purgar el ID #${id}?`)) return;

    try {
        logSystem(`Solicitando purga del registro #${id}...`);
        const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
        
        if (res.ok) {
            showNotification(`Usuario #${id} eliminado permanentemente.`);
            syncDatabase(); // Recargar datos
        } else {
            const err = await res.json();
            showNotification(err.error, "error");
        }
    } catch (e) {
        showNotification("Error de servidor", "error");
    }
}

// --- ACTUALIZACIÓN DE PERFIL ---
async function updateProfileSettings() {
    const newBio = document.getElementById('user-bio').value;
    const newColor = document.getElementById('user-color').value;

    logSystem("Actualizando configuración de perfil...");
    // Aquí iría el fetch PATCH /api/user/update
    showNotification("Perfil actualizado (Modo Simulado)");
}

// [CONTINÚAN 50 LÍNEAS DE MANEJO DE IMÁGENES, PREVENCIÓN DE XSS Y LÓGICA DE TIENDA]
