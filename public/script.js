/**
 * SISTEMA DE INTERACCIÓN NUEVO MÉXICO RP
 * Desarrollado para Emmanuel0606
 */

// 1. Animaciones de Revelado al Scroll
function reveal() {
    const reveals = document.querySelectorAll(".reveal");
    for (let i = 0; i < reveals.length; i++) {
        let windowHeight = window.innerHeight;
        let elementTop = reveals[i].getBoundingClientRect().top;
        let elementVisible = 100;
        if (elementTop < windowHeight - elementVisible) {
            reveals[i].classList.add("active");
        }
    }
}
window.addEventListener("scroll", reveal);
window.onload = reveal; // Activar al cargar

// 2. Copiar IP al portapapeles
function copyIP() {
    const ip = "MC.NUEVOMEXICO.PRO";
    navigator.clipboard.writeText(ip).then(() => {
        const text = document.getElementById("copyText");
        const box = document.getElementById("ipBox");
        text.innerText = "¡COPIADA CON ÉXITO!";
        box.style.borderColor = "#2ecc71";
        setTimeout(() => {
            text.innerText = "Click para copiar";
            box.style.borderColor = "#eee";
        }, 2000);
    });
}

// 3. Manejo de Modal y Tabs
function openModal() { document.getElementById("modal").style.display = "flex"; }
function closeModal() { document.getElementById("modal").style.display = "none"; }

function switchTab(type) {
    const isL = type === 'login';
    document.getElementById("formLogin").style.display = isL ? "block" : "none";
    document.getElementById("formReg").style.display = isL ? "none" : "block";
    document.getElementById("tabL").classList.toggle("active", isL);
    document.getElementById("tabR").classList.toggle("active", !isL);
}

// 4. Mecánica de Registro (AJAX)
document.getElementById("formReg").addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = {
        user_mc: document.getElementById("rUser").value,
        name_rp: document.getElementById("rName").value,
        birth: document.getElementById("rBirth").value,
        nation: document.getElementById("rNation").value,
        pass: document.getElementById("rPass").value
    };

    const res = await fetch('/api/register', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    });
    const result = await res.json();
    alert(result.message);
    if(result.success) location.reload();
});

// 5. Mecánica de Login y Panel de Admin
document.getElementById("formLogin").addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = {
        user_mc: document.getElementById("lUser").value,
        pass: document.getElementById("lPass").value
    };

    const res = await fetch('/api/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    });
    const result = await res.json();

    if(result.success) {
        document.getElementById("formLogin").style.display = "none";
        document.getElementById("formReg").style.display = "none";
        document.querySelector(".modal-header").style.display = "none";
        
        const panel = document.getElementById("adminPanel");
        panel.style.display = "block";

        if(result.user.es_admin) {
            const list = document.getElementById("userList");
            list.innerHTML = `<h4>Usuarios Registrados:</h4>` + result.adminData.map(u => `
                <div class="user-row">
                    <span>${u.usuario_mc} (${u.nombre_rp})</span>
                    <div class="actions">
                        <button onclick="promote(${u.id})">⭐</button>
                        <button onclick="deleteU(${u.id})" style="color:red">🗑️</button>
                    </div>
                </div>
            `).join('');
        } else {
            document.getElementById("userList").innerHTML = `<h3>Bienvenido ${result.user.nombre_rp}</h3>`;
        }
    } else {
        alert(result.msg);
    }
});

async function promote(id) {
    await fetch('/api/promote', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ targetId: id })
    });
    alert("Usuario promovido a Admin");
    location.reload();
}

async function deleteU(id) {
    if(!confirm("¿Borrar usuario?")) return;
    await fetch('/api/delete-user', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ targetId: id })
    });
    location.reload();
}
