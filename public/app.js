/**
 * ==========================================================
 * ECNHACA DATA ENGINE v300.0
 * DESARROLLADOR: EMMANUEL
 * PROPÓSITO: GESTIÓN DE DATOS, API FETCH Y POSTGRESQL
 * PROTOCOLO: WHITE MINIMALIST (DATABASE LAYER)
 * ==========================================================
 */

// --- CONFIGURACIÓN DE ENDPOINTS ---
const API_BASE = "/api";
const ENDPOINTS = {
    AUTH_LOGIN: `${API_BASE}/auth/login`,
    AUTH_REG: `${API_BASE}/auth/register`,
    ADMIN_USERS: `${API_BASE}/admin/users`,
    PRODUCTS: `${API_BASE}/products`,
    DB_STATUS: `${API_BASE}/status`
};

// --- CACHÉ LOCAL DE DATOS MASTER ---
let MASTER_CACHE = {
    users: [],
    products: [],
    logs: [],
    stats: {
        totalUsers: 0,
        totalSales: 0,
        dbLatency: 0
    }
};

/**
 * 1. GESTIÓN DE AUTENTICACIÓN (LOGIN & REGISTER)
 * Emmanuel: Aquí enviamos los datos al backend de Node.js.
 */
async function handleAuthAction(event) {
    event.preventDefault();
    
    const isRegister = !document.getElementById('group-email').classList.contains('hide');
    const endpoint = isRegister ? ENDPOINTS.AUTH_REG : ENDPOINTS.AUTH_LOGIN;
    
    const payload = {
        username: document.getElementById('auth-user').value.trim(),
        password: document.getElementById('auth-pass').value.trim()
    };

    if (isRegister) {
        payload.email = document.getElementById('auth-email').value.trim();
    }

    try {
        logData(`Iniciando petición a ${endpoint}...`);
        
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (response.ok) {
            // Guardar sesión y redirigir
            localStorage.setItem('ec_session', JSON.stringify(result.user));
            notify(isRegister ? "Cuenta creada con éxito." : "Acceso concedido.", "success");
            
            setTimeout(() => {
                location.reload(); // Recargar para entrar al Dashboard
            }, 1000);
        } else {
            notify(result.error || "Error en la autenticación.", "error");
            logError(result.error);
        }
    } catch (error) {
        notify("No se pudo conectar con el servidor de Render.", "error");
        logError(error);
    }
}

/**
 * 2. BUSCADOR MASTER (EMMANUEL EXCLUSIVE)
 * Sincroniza y filtra la base de datos de usuarios en tiempo real.
 */
async function syncMasterDatabase() {
    const tableBody = document.getElementById('master-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = `
        <tr>
            <td colspan="6" style="text-align: center; padding: 50px;">
                <i class="fa fa-spinner fa-spin" style="font-size: 1.5rem; margin-bottom: 15px; color: #86868b;"></i>
                <p style="font-weight: 600; color: #86868b;">Consultando PostgreSQL en Render...</p>
            </td>
        </tr>
    `;

    try {
        const response = await fetch(ENDPOINTS.ADMIN_USERS);
        const users = await response.json();

        if (response.ok) {
            MASTER_CACHE.users = users;
            renderMasterTable(users);
            updateDashboardStats();
            logData(`${users.length} usuarios sincronizados.`);
        } else {
            notify("Error al obtener usuarios.", "error");
        }
    } catch (error) {
        logError("Fallo en sincronización master: " + error);
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #ff3b30;">Error de conexión.</td></tr>`;
    }
}

/**
 * FILTRO AVANZADO EMMANUEL
 * Busca por ID, Usuario, Email o Rango simultáneamente.
 */
function executeMasterFilter() {
    const query = document.getElementById('master-search-input').value.toLowerCase().trim();
    
    const filteredResults = MASTER_CACHE.users.filter(user => {
        return (
            user.id.toString().includes(query) ||
            user.username.toLowerCase().includes(query) ||
            user.email.toLowerCase().includes(query) ||
            user.role.toLowerCase().includes(query)
        );
    });

    renderMasterTable(filteredResults);
}

function renderMasterTable(data) {
    const tableBody = document.getElementById('master-table-body');
    
    if (data.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 30px;">No se encontraron coincidencias.</td></tr>`;
        return;
    }

    tableBody.innerHTML = data.map(user => `
        <tr>
            <td><code style="background: #f5f5f7; padding: 2px 6px; border-radius: 4px;">#${user.id}</code></td>
            <td style="font-weight: 800;">${user.username}</td>
            <td style="color: #86868b;">${user.email}</td>
            <td><span class="badge-${user.role === 'admin' ? 'admin' : 'user'}">${user.role.toUpperCase()}</span></td>
            <td style="font-size: 0.8rem;">${user.last_login ? new Date(user.last_login).toLocaleString() : 'Nunca'}</td>
            <td>
                <div style="display: flex; gap: 10px;">
                    <button class="btn-icon-sm" title="Editar" onclick="editUser(${user.id})"><i class="fa fa-pen"></i></button>
                    ${user.role !== 'admin' ? `
                        <button class="btn-purgar" title="Eliminar" onclick="purgeUser(${user.id})"><i class="fa fa-trash-can"></i></button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

/**
 * 3. GESTIÓN DE PRODUCTOS (EMMANUEL STORE)
 */
async function loadStoreProducts() {
    try {
        const response = await fetch(ENDPOINTS.PRODUCTS);
        const products = await response.json();
        
        if (response.ok) {
            MASTER_CACHE.products = products;
            // Aquí iría la lógica para pintar el catálogo de VibeBlox
            logData("Catálogo de productos cargado.");
        }
    } catch (error) {
        logError("Error al cargar la tienda.");
    }
}

/**
 * 4. ACCIONES DE ADMINISTRACIÓN (PURGA)
 */
async function purgeUser(userId) {
    const confirmPurge = confirm(`EMMANUEL: ¿Estás seguro de eliminar permanentemente al usuario #${userId}? Esta acción no se puede deshacer en PostgreSQL.`);
    
    if (!confirmPurge) return;

    try {
        const response = await fetch(`${ENDPOINTS.ADMIN_USERS}/${userId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            notify("Registro purgado correctamente.", "success");
            syncMasterDatabase(); // Refrescar tabla
        } else {
            const err = await response.json();
            notify(err.error || "No se pudo eliminar.", "error");
        }
    } catch (error) {
        notify("Error crítico de servidor.", "error");
    }
}

/**
 * 5. ESTADÍSTICAS Y DASHBOARD
 */
function updateDashboardStats() {
    const userCountEl = document.getElementById('stat-users-count');
    if (userCountEl) {
        userCountEl.innerText = MASTER_CACHE.users.length;
    }
    
    // Simular latencia de DB
    const pingEl = document.getElementById('stat-ping');
    if (pingEl) {
        const startTime = Date.now();
        fetch(ENDPOINTS.DB_STATUS).finally(() => {
            const latency = Date.now() - startTime;
            pingEl.innerText = `${latency} ms`;
        });
    }
}

/**
 * 6. LOGS DE SISTEMA Y DEBUGGING
 */
function logData(msg) {
    console.log(`%c [DATA] %c ${msg}`, "color: #34c759; font-weight: bold;", "color: #1d1d1f;");
}

function logError(msg) {
    console.error(`%c [ERROR DB] %c ${msg}`, "color: #ff3b30; font-weight: bold;", "color: #1d1d1f;");
}

/**
 * 7. INTEGRACIÓN CON VEXO BOT & VIBEBLOX
 * Emmanuel: Funciones preparadas para expandir tus otros servicios.
 */
async function sendVexoNotification(message) {
    logData("Enviando comando a Vexo Bot...");
    // Lógica para conectar con el webhook de Discord del Bot
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Iniciar carga automática de datos si el usuario es Admin
if (localStorage.getItem('ec_session')) {
    const user = JSON.parse(localStorage.getItem('ec_session'));
    if (user.role === 'admin') {
        setTimeout(syncMasterDatabase, 2000);
    }
    loadStoreProducts();
}

/**
 * 8. GESTIÓN DE ERRORES DE RED
 */
window.addEventListener('offline', () => {
    notify("Has perdido la conexión. ECNHACA Style funcionando en modo local.", "error");
});

window.addEventListener('online', () => {
    notify("Conexión restablecida. Sincronizando...", "success");
    syncMasterDatabase();
});

// --- FINAL DEL ARCHIVO APP.JS ---
// Emmanuel: Este archivo gestiona toda la comunicación con tu base de datos global.
