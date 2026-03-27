/**
 * ECNHACA DATA ENGINE V200
 * API CRUD & BUSCADOR MASTER: EMMANUEL
 */

let MASTER_DB_CACHE = [];

// --- AUTENTICACIÓN ---
async function executeAuth(e) {
    e.preventDefault();
    const mode = document.getElementById('tab-btn-reg').classList.contains('active') ? 'register' : 'login';
    
    const payload = {
        username: document.getElementById('auth-user').value,
        password: document.getElementById('auth-pass').value,
        email: document.getElementById('auth-email').value
    };

    try {
        const res = await fetch(`/api/auth/${mode}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (res.ok) {
            localStorage.setItem('ec_session', JSON.stringify(data.user));
            notify("Sincronización Exitosa", "success");
            setTimeout(() => location.reload(), 1000);
        } else {
            notify(data.error, "error");
        }
    } catch (err) {
        notify("Error al conectar con Render", "error");
    }
}

function toggleAuthMode(mode) {
    const emailField = document.getElementById('email-field');
    const btnLogin = document.getElementById('tab-btn-login');
    const btnReg = document.getElementById('tab-btn-reg');

    if (mode === 'reg') {
        emailField.classList.remove('hide');
        btnReg.classList.add('active');
        btnLogin.classList.remove('active');
    } else {
        emailField.classList.add('hide');
        btnLogin.classList.add('active');
        btnReg.classList.remove('active');
    }
}

// --- GESTIÓN DE BASE DE DATOS (ADMIN PANEL) ---
async function syncUsers() {
    const tableBody = document.getElementById('admin-table-body');
    tableBody.innerHTML = '<tr><td colspan="5" align="center">Consultando PostgreSQL...</td></tr>';

    try {
        const res = await fetch('/api/admin/users');
        MASTER_DB_CACHE = await res.json();
        renderTable(MASTER_DB_CACHE);
        document.getElementById('stat-users').innerText = MASTER_DB_CACHE.length;
    } catch (err) {
        notify("Error de sincronización de DB", "error");
    }
}

/**
 * BUSCADOR MASTER EMMANUEL
 * Filtra por ID, Usuario o Gmail instantáneamente.
 */
function filterDatabase() {
    const query = document.getElementById('admin-search-input').value.toLowerCase();
    
    const filtered = MASTER_DB_CACHE.filter(u => {
        return (
            u.id.toString().includes(query) ||
            u.username.toLowerCase().includes(query) ||
            u.email.toLowerCase().includes(query)
        );
    });

    renderTable(filtered);
}

function renderTable(data) {
    const tableBody = document.getElementById('admin-table-body');
    
    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" align="center">No se encontraron registros.</td></tr>';
        return;
    }

    tableBody.innerHTML = data.map(u => `
        <tr>
            <td>#${u.id}</td>
            <td><strong>${u.username}</strong></td>
            <td>${u.email}</td>
            <td><span class="badge ${u.role}">${u.role}</span></td>
            <td>
                ${u.role !== 'admin' ? `
                    <button class="btn-delete" onclick="purgarUsuario(${u.id})">
                        <i class="fa fa-trash"></i> Eliminar
                    </button>
                ` : 'Master Access'}
            </td>
        </tr>
    `).join('');
}

async function purgarUsuario(id) {
    if (!confirm("EMMANUEL: ¿Confirmas la eliminación permanente de este registro?")) return;

    try {
        const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
        if (res.ok) {
            notify("Usuario purgado con éxito");
            syncUsers();
        } else {
            const data = await res.json();
            notify(data.error, "error");
        }
    } catch (err) {
        notify("Error al procesar purga", "error");
    }
}

// [MÁS LÓGICA DE CRUD DE PRODUCTOS PARA EMMANUEL STORE Y MANEJO DE IMÁGENES]
