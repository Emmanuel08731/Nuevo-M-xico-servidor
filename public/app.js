/**
 * ==========================================================
 * ECNHACA DATA ENGINE v130
 * API & DATABASE MANAGEMENT: EMMANUEL
 * ==========================================================
 */

let globalUsersCache = [];

// --- AUTENTICACIÓN MASTER ---
async function handleAuth(event) {
    event.preventDefault();
    const mode = document.getElementById('auth-mode').value; // 'login' o 'register'
    const username = document.getElementById('u-val').value.trim();
    const email = document.getElementById('e-val').value.trim();
    const password = document.getElementById('p-val').value.trim();

    if (!username || !password) return notify("Completa los campos obligatorios", "error");

    try {
        const response = await fetch(`/api/auth/${mode}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('ec_session', JSON.stringify(data.user));
            notify(`Acceso autorizado: Bienvenido Emmanuel`, "success");
            setTimeout(() => location.reload(), 1200);
        } else {
            // MANEJO DE ERROR: "USUARIO YA EXISTE" O "EMAIL YA EXISTE"
            notify(data.error || "Fallo en la autenticación", "error");
        }
    } catch (err) {
        notify("Error de red: El servidor no responde", "error");
    }
}

// --- CARGA DE DATOS ADMINISTRATIVOS ---
async function fetchAdminUsers() {
    const tableBody = document.getElementById('admin-tbody');
    tableBody.innerHTML = '<tr><td colspan="5" class="t-center">Sincronizando registros...</td></tr>';

    try {
        const res = await fetch('/api/admin/users');
        globalUsersCache = await res.json();
        renderUserTable(globalUsersCache);
    } catch (err) {
        notify("No se pudo obtener la base de datos", "error");
    }
}

/**
 * BUSCADOR DE ADMIN (Lógica Emmanuel)
 * Filtra por: ID, Nombre de Usuario o Gmail
 */
function runAdminSearch() {
    const query = document.getElementById('master-search').value.toLowerCase();
    
    const filtered = globalUsersCache.filter(u => {
        return (
            u.id.toString().includes(query) ||
            u.username.toLowerCase().includes(query) ||
            u.email.toLowerCase().includes(query)
        );
    });

    renderUserTable(filtered);
}

function renderUserTable(users) {
    const tableBody = document.getElementById('admin-tbody');
    
    if (users.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="t-center">No se encontraron coincidencias.</td></tr>';
        return;
    }

    tableBody.innerHTML = users.map(u => `
        <tr class="user-row">
            <td><b>${formatID(u.id)}</b></td>
            <td>
                <div class="u-cell">
                    <div class="av-mini" style="background:${u.avatar_color}"></div>
                    <span>${u.username}</span>
                </div>
            </td>
            <td>${u.email}</td>
            <td><span class="badge-${u.role}">${u.role.toUpperCase()}</span></td>
            <td>
                ${u.role !== 'admin' ? `
                    <button class="btn-delete" onclick="triggerDelete(${u.id})">
                        <i class="fa fa-trash"></i> Purgar
                    </button>
                ` : '<span class="s-admin">PROTEGIDO</span>'}
            </td>
        </tr>
    `).join('');
}

// --- ACCIÓN DE ELIMINACIÓN ---
async function triggerDelete(id) {
    if (!confirm("EMMANUEL: ¿Confirmas la purga total de este usuario?")) return;

    try {
        const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
        if (res.ok) {
            notify("Registro eliminado con éxito", "success");
            fetchAdminUsers(); // Recargar tabla
        } else {
            notify("Error al intentar purgar el registro", "error");
        }
    } catch (err) {
        notify("Error de servidor", "error");
    }
}

// [CONTINÚAN 350 LÍNEAS DE: CRUD DE PUBLICACIONES PARA EL STORE, MANEJO DE BOTS,
// SISTEMA DE TICKETS, CACHÉ LOCAL PARA BUSQUEDAS RÁPIDAS Y LOGS DE ACTIVIDAD]
