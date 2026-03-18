/**
 * SISTEMA INTEGRADO DE NUEVO MÉXICO RP
 * Core Version 2026.1 - Desarrollo Emmanuel
 */

// 1. Manejo del Loader y Animaciones de Entrada
window.addEventListener('load', () => {
    setTimeout(() => {
        document.getElementById('loader').style.opacity = '0';
        setTimeout(() => document.getElementById('loader').style.display = 'none', 500);
        checkReveal();
    }, 1000);
});

function checkReveal() {
    const reveals = document.querySelectorAll('.reveal');
    reveals.forEach(el => {
        const top = el.getBoundingClientRect().top;
        if(top < window.innerHeight - 100) el.classList.add('active');
    });
}
window.addEventListener('scroll', checkReveal);

// 2. Sistema de Notificaciones Toast
function notify(msg) {
    const t = document.getElementById('toast');
    t.innerText = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}

// 3. Control de Modales y Vistas
function showModal() { document.getElementById('mainModal').style.display = 'flex'; }
function closeModal() { document.getElementById('mainModal').style.display = 'none'; }

function toggleAuth(type) {
    const isL = type === 'L';
    document.getElementById('fLogin').style.display = isL ? 'block' : 'none';
    document.getElementById('fReg').style.display = isL ? 'none' : 'block';
    document.getElementById('btnL').classList.toggle('active', isL);
    document.getElementById('btnR').classList.toggle('active', !isL);
}

// 4. Lógica de Login y Rango Emmanuel
document.getElementById('fLogin').addEventListener('submit', async (e) => {
    e.preventDefault();
    const res = await fetch('/api/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ user: document.getElementById('lUser').value, pass: document.getElementById('lPass').value })
    });
    const data = await res.json();
    
    if (data.success) {
        notify("¡Acceso concedido ciudadano!");
        document.getElementById('auth-box').style.display = 'none';
        document.getElementById('user-box').style.display = 'block';
        
        // Cargar Información Ciudadana
        document.getElementById('dni-nombre').innerText = data.userData.nombre_rp;
        document.getElementById('dni-mc').innerText = data.userData.usuario_mc;
        document.getElementById('dni-nacion').innerText = data.userData.nacionalidad;

        // ¿Es Emmanuel?
        if (data.userData.es_admin) {
            document.getElementById('user-rank').innerText = "FUNDADOR / STAFF";
            document.getElementById('user-rank').style.background = "#fff3cd";
            document.getElementById('user-rank').style.color = "#856404";
            document.getElementById('btn-to-admin').style.display = 'block';
            
            // Llenar tabla admin
            const tbody = document.getElementById('admin-table-body');
            tbody.innerHTML = data.adminData.map(u => `
                <tr>
                    <td><b>${u.usuario_mc}</b></td>
                    <td>${u.nombre_rp}</td>
                    <td>${u.es_admin ? '⭐ STAFF' : 'Civil'}</td>
                    <td>
                        ${!u.es_admin ? `<button class="btn-act-prom" onclick="adminOp(${u.id}, 'promote')">PROM</button>` : ''}
                        <button class="btn-act-del" onclick="adminOp(${u.id}, 'delete')">ELIMINAR</button>
                    </td>
                </tr>
            `).join('');
        }
    } else {
        notify(data.msg);
    }
});

// 5. Navegación Interna (DNI <-> PANEL)
function openAdminPanel() {
    document.getElementById('user-box').style.display = 'none';
    document.getElementById('admin-box').style.display = 'block';
}

function backToDNI() {
    document.getElementById('admin-box').style.display = 'none';
    document.getElementById('user-box').style.display = 'block';
}

// 6. Registro de Personaje
document.getElementById('fReg').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        user: document.getElementById('rUser').value,
        rp: document.getElementById('rName').value,
        bday: document.getElementById('rBday').value,
        nation: document.getElementById('rNation').value,
        pass: document.getElementById('rPass').value
    };
    const res = await fetch('/api/register', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload)
    });
    const d = await res.json();
    if (d.success) {
        notify("¡Bienvenido a Nuevo México!");
        location.reload();
    } else {
        notify(d.msg);
    }
});

// 7. Acciones Administrativas
async function adminOp(id, action) {
    if(!confirm("¿Estás seguro de realizar esta acción irreversible?")) return;
    await fetch('/api/admin/action', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ targetId: id, actionType: action })
    });
    location.reload();
}

// 8. Utilidades
function copyIP() {
    navigator.clipboard.writeText("MC.NUEVOMEXICO.PRO");
    notify("¡IP copiada al portapapeles!");
}
