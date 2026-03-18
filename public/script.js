/**
 * SISTEMA INTEGRADO DE NUEVO MÉXICO RP
 * Core: 2026 Stable
 */

// 1. Funciones de Navegación del Modal
function openModal() { document.getElementById('mainModal').style.display = 'flex'; }
function closeModal() { document.getElementById('mainModal').style.display = 'none'; }

function toggleAuth(type) {
    const isL = type === 'L';
    document.getElementById('fLogin').style.display = isL ? 'block' : 'none';
    document.getElementById('fReg').style.display = isL ? 'none' : 'block';
    document.getElementById('tabL').classList.toggle('active', isL);
    document.getElementById('tabR').classList.toggle('active', !isL);
}

// 2. Función Copiar IP con feedback
function copyIP() {
    navigator.clipboard.writeText("MC.NUEVOMEXICO.PRO");
    const sub = document.querySelector('.ip-sub');
    sub.innerText = "¡COPIADA CON ÉXITO!";
    sub.style.color = "#2ecc71";
    setTimeout(() => {
        sub.innerText = "CLICK PARA COPIAR IP";
        sub.style.color = "#aaa";
    }, 2000);
}

// 3. Envío de Formularios (AJAX)
document.getElementById('fReg').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        u_mc: document.getElementById('rU').value,
        n_rp: document.getElementById('rN').value,
        bday: document.getElementById('rD').value,
        nation: document.getElementById('rNa').value,
        pass: document.getElementById('rP').value
    };

    const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    });
    const result = await res.json();
    alert(result.msg);
    if(result.success) location.reload();
});

// 4. Mecánica de Login y Construcción de Paneles
document.getElementById('fLogin').addEventListener('submit', async (e) => {
    e.preventDefault();
    const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ u_mc: document.getElementById('lU').value, pass: document.getElementById('lP').value })
    });
    const data = await res.json();

    if(data.success) {
        document.getElementById('view-auth').style.display = 'none';
        
        if(data.userData.es_admin) {
            // CONSTRUIR PANEL ADMIN EMMANUEL
            document.getElementById('view-admin').style.display = 'block';
            document.getElementById('admin-count').innerText = data.adminData.length;
            const table = document.getElementById('admin-rows');
            table.innerHTML = data.adminData.map(user => `
                <tr>
                    <td><b>${user.usuario_mc}</b></td>
                    <td>${user.nombre_rp}</td>
                    <td>
                        ${!user.es_admin ? `<button class="btn-up" onclick="promoteUser(${user.id})">PROMOVER</button>` : '⭐'}
                        <button class="btn-del" onclick="deleteUser(${user.id})">ELIMINAR</button>
                    </td>
                </tr>
            `).join('');
        } else {
            // CONSTRUIR DNI CIUDADANO
            document.getElementById('view-user').style.display = 'block';
            document.getElementById('dni-rpname').innerText = data.userData.nombre_rp;
            document.getElementById('dni-id').innerText = "#" + data.userData.id.toString().padStart(3, '0');
            document.getElementById('dni-mc').innerText = data.userData.usuario_mc;
            document.getElementById('dni-nation').innerText = data.userData.nacionalidad;
        }
    } else {
        alert(data.msg);
    }
});

// 5. Acciones Administrativas
async function promoteUser(id) {
    if(!confirm("¿Seguro que quieres ascender a este usuario a ADMIN?")) return;
    await fetch('/api/admin/promote', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({id})
    });
    location.reload();
}

async function deleteUser(id) {
    if(!confirm("¿ELIMINAR PERMANENTEMENTE A ESTE CIUDADANO?")) return;
    await fetch('/api/admin/delete', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({id})
    });
    location.reload();
}
