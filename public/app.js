/* ECNHACA DATA ENGINE v105 
    CRUD, AUTH Y LOGICA ADMIN 
*/

async function handleAuth(e) {
    e.preventDefault();
    const mode = document.getElementById('tab-login').classList.contains('active') ? 'login' : 'reg';
    const username = document.getElementById('auth-user').value;
    const password = document.getElementById('auth-pass').value;
    const email = document.getElementById('auth-email').value;

    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';

    try {
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ username, password, email })
        });

        const data = await res.json();

        if(res.ok) {
            localStorage.setItem('ec_session', JSON.stringify(data.user));
            showToast('suc', `¡Bienvenido, ${data.user.username}!`);
            setTimeout(() => location.reload(), 1000);
        } else {
            // ERROR DE DUPLICADOS O CREDENCIALES
            showToast('err', data.error || "Error en la autenticación");
        }
    } catch (err) {
        showToast('err', "Servidor fuera de línea");
    }
}

// PANEL ADMIN EMMANUEL
let cacheUsers = [];

async function loadAdminPanel() {
    const res = await fetch('/api/admin/users');
    cacheUsers = await res.json();
    document.getElementById('stat-users').innerText = cacheUsers.length;
    renderAdminTable(cacheUsers);
}

function renderAdminTable(users) {
    const tbody = document.getElementById('admin-tbody');
    tbody.innerHTML = users.map(u => `
        <tr class="animate-up">
            <td>#${u.id}</td>
            <td><b>${u.username}</b></td>
            <td>${u.email}</td>
            <td><span class="role-badge ${u.role}">${u.role}</span></td>
            <td>
                ${u.role !== 'admin' ? `
                    <button class="btn-del" onclick="askDeleteUser(${u.id})">
                        <i class="fa fa-trash"></i> Eliminar
                    </button>
                ` : '<i class="fa fa-lock" title="Inmune"></i>'}
            </td>
        </tr>
    `).join('');
}

// BUSCADOR DE USUARIOS EN PANEL ADMIN
function adminSearch() {
    const q = document.getElementById('admin-user-q').value.toLowerCase();
    const filtered = cacheUsers.filter(u => 
        u.username.toLowerCase().includes(q) || 
        u.email.toLowerCase().includes(q) || 
        u.id.toString().includes(q)
    );
    renderAdminTable(filtered);
}

async function askDeleteUser(id) {
    const modal = document.getElementById('modal-confirm');
    modal.classList.remove('hide');
    document.getElementById('btn-execute-del').onclick = async () => {
        const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
        if(res.ok) {
            modal.classList.add('hide');
            showToast('suc', "Usuario eliminado de la red");
            loadAdminPanel();
        }
    };
}

// FEED Y POSTS
async function loadFeed() {
    const container = document.getElementById('feed-container');
    container.innerHTML = '<div class="loader-circle"></div>';
    
    const res = await fetch('/api/posts');
    const posts = await res.json();
    
    container.innerHTML = posts.map(p => `
        <div class="card">
            <div class="card-user">
                <div class="av-xs" style="background:${p.avatar_color}">${p.username[0]}</div>
                <span>@${p.username}</span>
            </div>
            <h3>${p.title}</h3>
            <p>${p.content}</p>
            <div class="card-footer">
                <span class="cat-tag">#${p.category}</span>
                <span class="date-tag">${new Date(p.created_at).toLocaleDateString()}</span>
            </div>
        </div>
    `).join('');
}

// ... (Aquí continúan 300 líneas de validación de inputs, envío de posts y lógica de perfil) ...
