/**
 * PORTAL NUEVO MÉXICO RP v2026
 * Desarrollado por Emmanuel0606
 */

// --- 1. GESTIÓN DE CARGA Y SESIÓN PERSISTENTE ---
window.addEventListener('load', () => {
    const preloader = document.getElementById('loader');
    
    // Simular carga de sistema
    setTimeout(() => {
        preloader.style.opacity = '0';
        setTimeout(() => preloader.style.display = 'none', 500);

        // PERSISTENCIA: Revisar si el usuario ya estaba logueado
        const session = localStorage.getItem('nm_session');
        if (session) {
            const data = JSON.parse(session);
            applySessionData(data);
            showNotification("SESIÓN RESTAURADA", `Bienvenido de nuevo, ${data.userData.n_rp}.`, "🔐");
        }
    }, 1200);
});

// --- 2. NOTIFICACIONES PERSONALIZADAS ---
function showNotification(title, msg, icon = "⚠️") {
    const bar = document.getElementById('notif-bar');
    document.getElementById('nt').innerText = title;
    document.getElementById('nm').innerText = msg;
    document.getElementById('ni').innerText = icon;
    
    bar.classList.add('active');
    setTimeout(() => bar.classList.remove('active'), 4000);
}

// --- 3. CONTROL DE MODALES Y VISTAS ---
function openPortal() { document.getElementById('modal-portal').style.display = 'flex'; }
function closePortal() { document.getElementById('modal-portal').style.display = 'none'; }

function setTab(type) {
    const isLogin = type === 'L';
    document.getElementById('form-login').style.display = isLogin ? 'block' : 'none';
    document.getElementById('form-register').style.display = isLogin ? 'none' : 'block';
    document.getElementById('t-l').classList.toggle('active', isLogin);
    document.getElementById('t-r').classList.toggle('active', !isLogin);
}

// --- 4. LOGICA DE AUTENTICACIÓN ---
document.getElementById('form-login').addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = document.getElementById('li-u').value;
    const pass = document.getElementById('li-p').value;

    const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ user, pass })
    });
    const d = await res.json();

    if (d.success) {
        // GUARDAR SESIÓN EN EL NAVEGADOR
        localStorage.setItem('nm_session', JSON.stringify(d));
        applySessionData(d);
        showNotification("ACCESO EXITOSO", "Tu identidad ha sido verificada.", "✅");
    } else {
        // MANEJO DE ERROR (Si no existe o datos mal)
        showNotification("ERROR DE ACCESO", d.msg, "❌");
    }
});

// APLICAR DATOS DE SESIÓN A LA UI
function applySessionData(data) {
    document.getElementById('view-auth').style.display = 'none';
    document.getElementById('view-profile').style.display = 'block';
    document.getElementById('btn-login-trigger').innerText = "MI PERFIL";
    
    document.getElementById('dni-rp-name').innerText = data.userData.n_rp;
    document.getElementById('dni-mc-nick').innerText = data.userData.u_mc;
    document.getElementById('dni-nation').innerText = data.userData.nac;

    if (data.userData.adm) {
        document.getElementById('dni-rank').innerText = "FUNDADOR / STAFF";
        document.getElementById('admin-tools').style.display = 'block';
        
        // Cargar lista en la tabla
        if (data.fullList) {
            const table = document.getElementById('admin-table-rows');
            table.innerHTML = data.fullList.map(u => `
                <tr>
                    <td><b>${u.usuario_mc}</b></td>
                    <td>${u.nombre_rp}</td>
                    <td>
                        <button class="btn-del-user" onclick="deleteCitizen(${u.id})">BORRAR</button>
                    </td>
                </tr>
            `).join('');
        }
    }
}

// --- 5. GESTIÓN ADMINISTRATIVA (BORRADO REAL) ---
async function deleteCitizen(id) {
    if (!confirm("¿ESTÁS SEGURO? Esta acción eliminará al ciudadano de la BASE DE DATOS de forma permanente.")) return;

    const res = await fetch('/api/admin/delete', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ targetId: id })
    });
    const d = await res.json();

    if (d.success) {
        showNotification("SISTEMA", "Ciudadano eliminado. Sincronizando...", "🗑️");
        
        // REINICIO AUTOMÁTICO TRAS ELIMINAR PARA LIMPIAR LA VISTA
        setTimeout(() => {
            // Actualizar la sesión local quitando al usuario para que al recargar ya no aparezca
            const session = JSON.parse(localStorage.getItem('nm_session'));
            session.fullList = session.fullList.filter(u => u.id !== id);
            localStorage.setItem('nm_session', JSON.stringify(session));
            location.reload();
        }, 1500);
    } else {
        showNotification("FALLO", d.msg, "❌");
    }
}

// --- 6. REGISTRO ---
document.getElementById('form-register').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        u: document.getElementById('re-u').value,
        n: document.getElementById('re-n').value,
        d: document.getElementById('re-d').value,
        na: document.getElementById('re-na').value,
        p: document.getElementById('re-p').value
    };

    const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload)
    });
    const d = await res.json();

    if (d.success) {
        showNotification("BIENVENIDO", "Tu registro ha sido completado.", "🏢");
        setTimeout(() => location.reload(), 2000);
    } else {
        showNotification("ERROR", d.msg, "❌");
    }
});

// --- 7. UTILIDADES ---
function logout() {
    localStorage.removeItem('nm_session');
    location.reload();
}

function toggleAdminPanel() {
    const prof = document.getElementById('view-profile');
    const adm = document.getElementById('view-admin');
    if (prof.style.display === 'none') {
        prof.style.display = 'block'; adm.style.display = 'none';
    } else {
        prof.style.display = 'none'; adm.style.display = 'block';
    }
}

function copyIp() {
    navigator.clipboard.writeText("MC.NUEVOMEXICO.PRO");
    showNotification("PORTAPAPELES", "IP copiada: MC.NUEVOMEXICO.PRO", "📋");
}
