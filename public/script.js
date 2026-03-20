/**
 * JEXACTYL CLIENT ENGINE v2.0
 * Gestionado por Emmanuel para Emerald Hosting
 */

let state = {
    user: null,
    servers: [],
    activeView: 'landing',
    logs: []
};

// 1. PERSISTENCIA AUTOMÁTICA
window.onload = () => {
    const saved = localStorage.getItem('emerald_session');
    if (saved) {
        state.user = JSON.parse(saved);
        updateUI();
        notify("SESIÓN", "Conexión restaurada con el nodo central.", "info");
    }
};

// 2. SISTEMA DE NOTIFICACIONES (SIN ALERTS)
function notify(title, msg, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<b>${title}</b><p>${msg}</p>`;
    container.appendChild(toast);
    setTimeout(() => { toast.classList.add('fade-out'); setTimeout(() => toast.remove(), 500); }, 4000);
}

// 3. AUTENTICACIÓN
async function handleAuth() {
    const email = document.getElementById('log-email').value;
    const password = document.getElementById('log-pass').value;

    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (data.success) {
            state.user = data.user;
            state.servers = data.servers;
            localStorage.setItem('emerald_session', JSON.stringify(data.user));
            document.getElementById('login-overlay').style.display = 'none';
            updateUI();
            notify("WELCOME", "Dashboard initialized successfully.");
        } else {
            notify("ERROR", "Invalid email or master password.", "error");
        }
    } catch (e) {
        notify("FATAL", "Database connection lost.", "error");
    }
}

// 4. CAMBIO DE VISTAS (SPA STYLE)
function updateUI() {
    // Esconder todo
    document.getElementById('view-landing').style.display = 'none';
    document.getElementById('view-plans').style.display = 'none';
    document.getElementById('view-console').style.display = 'none';

    document.getElementById('user-display-name').innerText = state.user.nombre_cliente;

    if (state.user.plan === 'Ninguno') {
        document.getElementById('view-plans').style.display = 'block';
    } else {
        document.getElementById('view-console').style.display = 'block';
        startConsoleSimulation();
    }
}

// 5. SIMULACIÓN DE TERMINAL REALISTA
function startConsoleSimulation() {
    const logBox = document.getElementById('console-logs');
    const messages = [
        "[DOCKER] Container emerald-v-1 starting...",
        "[FILES] Extracting bot.zip...",
        "[NODE] Node.js v22.2.0 initialized",
        "[NPM] Running 'npm install'...",
        "[DB] Connected to Global PostgreSQL",
        "[SUCCESS] Vexol Bot v2.1 Online!"
    ];

    let i = 0;
    const interval = setInterval(() => {
        if (i < messages.length) {
            const line = document.createElement('div');
            line.className = 'log-line';
            line.innerText = messages[i];
            logBox.appendChild(line);
            logBox.scrollTop = logBox.scrollHeight;
            i++;
        } else {
            clearInterval(interval);
        }
    }, 1500);
}

// 6. ACCIONES DE PODER
function powerAction(action) {
    notify("SERVER", `Action [${action.toUpperCase()}] sent to node.`, "info");
    if (action === 'stop') {
        document.getElementById('console-logs').innerHTML += `<div class="log-line text-red">[SYSTEM] Process terminated by user.</div>`;
    }
}

function showPlansView() {
    document.getElementById('view-landing').style.display = 'none';
    document.getElementById('view-console').style.display = 'none';
    document.getElementById('view-plans').style.display = 'block';
}

function openLogin() {
    document.getElementById('login-overlay').style.display = 'flex';
}
