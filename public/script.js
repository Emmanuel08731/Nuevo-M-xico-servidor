/**
 * SISTEMA TITANIUM NUEVO MÉXICO
 * Versión Emmanuel 2026.4
 */

// 1. Loader y Animación de Scroll
window.addEventListener('load', () => {
    setTimeout(() => {
        document.getElementById('loader').style.opacity = '0';
        setTimeout(() => document.getElementById('loader').style.display = 'none', 500);
        checkReveal();
    }, 1200);
});

function checkReveal() {
    const reveals = document.querySelectorAll('.observe');
    reveals.forEach(el => {
        const top = el.getBoundingClientRect().top;
        if(top < window.innerHeight - 80) el.classList.add('show');
    });
}
window.addEventListener('scroll', checkReveal);

// 2. Sistema de Alertas Inteligentes
function showAlert(type) {
    const el = document.getElementById(`alert-${type}`);
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 3500);
}

// 3. Control de Ventanas
function openModal() { document.getElementById('modal').style.display = 'flex'; }
function closeModal() { document.getElementById('modal').style.display = 'none'; }

function switchAuth(t) {
    const isL = t === 'L';
    document.getElementById('formLogin').style.display = isL ? 'block' : 'none';
    document.getElementById('formReg').style.display = isL ? 'none' : 'block';
    document.getElementById('t-l').classList.toggle('active', isL);
    document.getElementById('t-r').classList.toggle('active', !isL);
}

// 4. Mecánica de Login
document.getElementById('formLogin').addEventListener('submit', async (e) => {
    e.preventDefault();
    const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ user: document.getElementById('l-u').value, pass: document.getElementById('l-p').value })
    });
    const d = await res.json();
    
    if (d.success) {
        document.getElementById('view-auth').style.display = 'none';
        document.getElementById('view-profile').style.display = 'block';
        
        // Cargar DNI
        document.getElementById('p-rp').innerText = d.user.nombre_rp;
        document.getElementById('p-mc').innerText = d.user.usuario_mc;
        document.getElementById('p-na').innerText = d.user.nacionalidad;

        if (d.user.es_admin) {
            document.getElementById('p-rank').innerText = "STAFF SUPREMO";
            document.getElementById('admin-trigger').style.display = 'block';
            
            // Renderizar Lista Admin
            const rows = document.getElementById('admin-rows');
            rows.innerHTML = d.adminList.map(u => `
                <tr>
                    <td><b>${u.usuario_mc}</b> <br> <small>${u.nombre_rp}</small></td>
                    <td>
                        <button class="btn-del" onclick="adminOp(${u.id}, 'del')">BORRAR</button>
                    </td>
                </tr>
            `).join('');
        }
    } else {
        if(d.errorType === 'NOT_FOUND') showAlert('notfound');
        else alert("Contraseña incorrecta");
    }
});

// 5. Gestión Administrativa con Reinicio
async function adminOp(id, action) {
    if(!confirm("¿Confirmar eliminación permanente?")) return;
    
    const res = await fetch('/api/admin/action', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({id, action})
    });
    const data = await res.json();

    if(data.deleted) {
        showAlert('deleted');
        // REINICIO AUTOMÁTICO TRAS 2 SEGUNDOS
        setTimeout(() => location.reload(), 2000);
    }
}

// 6. Registro
document.getElementById('formReg').addEventListener('submit', async (e) => {
    e.preventDefault();
    const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            u: document.getElementById('r-u').value,
            n: document.getElementById('r-n').value,
            d: document.getElementById('r-d').value,
            na: document.getElementById('r-na').value,
            p: document.getElementById('r-p').value
        })
    });
    const d = await res.json();
    if(d.success) { alert("¡Cuenta creada!"); location.reload(); }
});

function showAdminPanel() {
    document.getElementById('view-profile').style.display = 'none';
    document.getElementById('view-admin').style.display = 'block';
}
function hideAdminPanel() {
    document.getElementById('view-admin').style.display = 'none';
    document.getElementById('view-profile').style.display = 'block';
}

function copyIP() {
    navigator.clipboard.writeText("MC.NUEVOMEXICO.PRO");
    alert("IP Copiada");
}
