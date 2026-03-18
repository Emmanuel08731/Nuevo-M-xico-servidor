/**
 * SISTEMA INTEGRAL NUEVO MÉXICO RP
 * Core Versión 2026 - Control Emmanuel
 */

// 1. Loader & Animaciones de Scroll
window.addEventListener('load', () => {
    setTimeout(() => {
        document.getElementById('loader').style.display = 'none';
        checkReveal();
    }, 1000);
});

function checkReveal() {
    const reveals = document.querySelectorAll('.reveal');
    reveals.forEach(el => {
        const windowHeight = window.innerHeight;
        const revealTop = el.getBoundingClientRect().top;
        if (revealTop < windowHeight - 100) {
            el.classList.add('active');
        }
    });
}
window.addEventListener('scroll', checkReveal);

// 2. Control de Interfaz (Modales y Tabs)
function toggleModal(show) {
    document.getElementById('modal').style.display = show ? 'flex' : 'none';
}

function switchAuth(type) {
    const isL = type === 'L';
    document.getElementById('loginForm').style.display = isL ? 'block' : 'none';
    document.getElementById('regForm').style.display = isL ? 'none' : 'block';
    document.getElementById('tabL').classList.toggle('active', isL);
    document.getElementById('tabR').classList.toggle('active', !isL);
}

// 3. Mecánica de Copiado
function copyIP() {
    const ip = "MC.NUEVOMEXICO.PRO";
    navigator.clipboard.writeText(ip).then(() => {
        const text = document.getElementById('ip-text');
        text.innerText = "¡IP COPIADA!";
        text.style.color = "#00b894";
        setTimeout(() => {
            text.innerText = ip;
            text.style.color = "";
        }, 2000);
    });
}

// 4. Lógica de Login (Con Rango Emmanuel)
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        user: document.getElementById('lUser').value,
        pass: document.getElementById('lPass').value
    };

    const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    });
    const result = await res.json();

    if(result.success) {
        document.getElementById('auth-view').style.display = 'none';
        
        if(result.user.es_admin) {
            // MOSTRAR PANEL ADMIN
            document.getElementById('admin-view').style.display = 'block';
            const tbody = document.getElementById('admin-tbody');
            tbody.innerHTML = result.admin.map(u => `
                <tr>
                    <td><b>${u.usuario_mc}</b></td>
                    <td>${u.nombre_rp}</td>
                    <td>
                        ${!u.es_admin ? `<button onclick="adminAction(${u.id}, 'promote')" style="color:green; border:none; background:none; cursor:pointer; font-weight:800">PROM</button>` : '⭐'}
                        <button onclick="adminAction(${u.id}, 'delete')" style="color:red; border:none; background:none; cursor:pointer; font-weight:800; margin-left:10px">DEL</button>
                    </td>
                </tr>
            `).join('');
        } else {
            // MOSTRAR DNI CIUDADANO
            document.getElementById('user-view').style.display = 'block';
            document.getElementById('dni-rp').innerText = result.user.nombre_rp;
            document.getElementById('dni-mc').innerText = result.user.usuario_mc;
            document.getElementById('dni-na').innerText = result.user.nacionalidad;
        }
    } else {
        alert(result.msg);
    }
});

// 5. Lógica de Registro
document.getElementById('regForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        user: document.getElementById('rUser').value,
        rpname: document.getElementById('rName').value,
        bday: document.getElementById('rBirth').value,
        nation: document.getElementById('rNation').value,
        pass: document.getElementById('rPass').value
    };

    const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    });
    const result = await res.json();
    if(result.success) { alert("¡Registro exitoso! Ya puedes entrar."); location.reload(); }
    else { alert(result.msg); }
});

// 6. Acciones de Emmanuel
async function adminAction(id, type) {
    if(!confirm("¿Seguro de realizar esta acción?")) return;
    await fetch('/api/admin/action', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ targetId: id, action: type })
    });
    location.reload();
}
