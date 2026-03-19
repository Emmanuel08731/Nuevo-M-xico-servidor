/**
 * EMERALD HOSTING CORE - EMMANUEL 2026
 * Manejo de sesiones y base de datos
 */

// 1. CARGA INICIAL Y PERSISTENCIA
window.addEventListener('load', () => {
    const saved = localStorage.getItem('emerald_session');
    if (saved) {
        renderDashboard(JSON.parse(saved));
        pushNotify("SISTEMA", "Sesión de hosting restaurada.", "✅");
    }
});

// 2. SISTEMA DE NOTIFICACIONES (Adiós Alerts)
function pushNotify(title, msg, icon = "⚠️") {
    const toast = document.getElementById('notify');
    document.getElementById('nt-title').innerText = title;
    document.getElementById('nt-msg').innerText = msg;
    
    toast.classList.add('active');
    setTimeout(() => toast.classList.remove('active'), 4000);
}

// 3. CONTROL DE MODAL
function openModal() { document.getElementById('modal').style.display = 'flex'; }
function closeModal() { document.getElementById('modal').style.display = 'none'; }

// 4. LOGIN CON TRATAMIENTO DE DATOS
document.getElementById('form-login').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('l-email').value;
    const pass = document.getElementById('l-pass').value;

    const res = await fetch('/api/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ email, pass })
    });
    const d = await res.json();

    if (d.success) {
        // PERSISTENCIA: Guardar sesión
        localStorage.setItem('emerald_session', JSON.stringify(d));
        renderDashboard(d);
        pushNotify("ACCESO CONCEDIDO", "Bienvenido al panel de control.");
    } else {
        if(d.error === 'NOT_FOUND') pushNotify("ERROR", "El usuario no existe en la base de datos.");
        else pushNotify("ERROR", "Contraseña de hosting incorrecta.");
    }
});

function renderDashboard(data) {
    document.getElementById('view-auth').style.display = 'none';
    document.getElementById('view-dash').style.display = 'block';
    
    document.getElementById('u-name').innerText = `Hola, ${data.user.nombre_cliente}`;
    document.getElementById('u-plan').innerText = `Plan: ${data.user.plan}`;

    // Si es Emmanuel (Admin)
    if (data.user.es_admin) {
        document.getElementById('adm-box').style.display = 'block';
        const rows = document.getElementById('client-rows');
        if (data.clients) {
            rows.innerHTML = data.clients.map(c => `
                <tr>
                    <td><b>${c.nombre_cliente}</b><br><small>${c.email}</small></td>
                    <td>${c.plan}</td>
                    <td><button class="btn-del" onclick="deleteClient(${c.id})">BORRAR</button></td>
                </tr>
            `).join('');
        }
    }
}

// 5. BORRADO REAL Y REINICIO
async function deleteClient(id) {
    if (!confirm("¿Eliminar cliente y sus servicios de la DB permanentemente?")) return;

    const res = await fetch('/api/admin/delete-client', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ targetId: id })
    });

    if ( (await res.json()).success ) {
        pushNotify("SISTEMA", "Cliente borrado. Reiniciando base de datos visual...", "🗑️");
        
        // Actualizar sesión local y recargar
        const session = JSON.parse(localStorage.getItem('emerald_session'));
        session.clients = session.clients.filter(c => c.id !== id);
        localStorage.setItem('emerald_session', JSON.stringify(session));
        
        setTimeout(() => location.reload(), 1500);
    }
}

function showAdmin() {
    document.getElementById('view-dash').style.display = 'none';
    document.getElementById('view-admin').style.display = 'block';
}

function hideAdmin() {
    document.getElementById('view-admin').style.display = 'none';
    document.getElementById('view-dash').style.display = 'block';
}

function logout() {
    localStorage.removeItem('emerald_session');
    location.reload();
}
