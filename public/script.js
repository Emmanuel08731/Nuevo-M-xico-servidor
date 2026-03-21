/**
 * ==============================================================================
 * DEVROOT CORE ENGINE v6.0 - MASTER SCRIPT
 * AUTHOR: EMMANUEL (DIRECTOR)
 * YEAR: 2026
 * ==============================================================================
 */

"use strict";

// --- CONFIGURACIÓN GLOBAL ---
const CONFIG = {
    appName: "DevRoot",
    version: "6.0.0",
    apiBase: "/api",
    loaderTime: 2500,
    debug: true
};

// --- ESTADO DE LA APLICACIÓN ---
let APP_STATE = {
    currentUser: null,
    isAuthenticated: false,
    activeTab: 'login',
    posts: []
};

/**
 * 1. MOTOR DE CARGA (BOOTSTRAP)
 * Simula la sincronización con el servidor de Render.
 */
function initSystem() {
    const progressBar = document.getElementById('loading-progress');
    const statusText = document.querySelector('.loader-status');
    let width = 0;

    const interval = setInterval(() => {
        if (width >= 100) {
            clearInterval(interval);
            finishLoading();
        } else {
            width += Math.floor(Math.random() * 10) + 1;
            if (width > 100) width = 100;
            progressBar.style.width = width + '%';
            
            // Textos dinámicos de carga
            if (width > 20) statusText.innerText = "Sincronizando con PostgreSQL...";
            if (width > 50) statusText.innerText = "Cargando módulos de Emmanuel...";
            if (width > 80) statusText.innerText = "Desplegando infraestructura...";
        }
    }, 150);
}

function finishLoading() {
    const loader = document.getElementById('global-loader');
    loader.style.opacity = '0';
    loader.style.transform = 'translateY(-100%)';
    
    setTimeout(() => {
        loader.classList.add('hidden');
        if (CONFIG.debug) console.log("✅ Sistema Emmanuel v6.0 Listo.");
    }, 800);
}

/**
 * 2. NAVEGACIÓN Y FORMULARIOS
 */
function switchForm(type) {
    const loginForm = document.getElementById('form-login');
    const registerForm = document.getElementById('form-register');
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');

    if (type === 'login') {
        registerForm.classList.remove('active');
        tabRegister.classList.remove('active');
        setTimeout(() => {
            loginForm.classList.add('active');
            tabLogin.classList.add('active');
        }, 100);
    } else {
        loginForm.classList.remove('active');
        tabLogin.classList.remove('active');
        setTimeout(() => {
            registerForm.classList.add('active');
            tabRegister.classList.add('active');
        }, 100);
    }
}

/**
 * 3. COMUNICACIÓN CON EL SERVIDOR (API)
 */

// Registro de Usuario
async function executeRegister() {
    const user = document.getElementById('reg-user').value;
    const email = document.getElementById('reg-email').value;
    const pass = document.getElementById('reg-pass').value;

    if (!user || !email || !pass) {
        return spawnNotification("Error: Datos incompletos", "error");
    }

    spawnNotification("Enviando datos al nodo...", "info");

    try {
        const response = await fetch(`${CONFIG.apiBase}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user, email, password: pass })
        });
        
        const data = await response.json();

        if (data.success) {
            spawnNotification("¡Perfil creado! Ahora puedes ingresar.", "success");
            switchForm('login');
        } else {
            spawnNotification(data.error || "Error al registrar", "error");
        }
    } catch (err) {
        spawnNotification("Fallo de conexión con Render", "error");
    }
}

// Login de Usuario
async function executeLogin() {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-pass').value;

    if (!email || !pass) return spawnNotification("Faltan credenciales", "error");

    try {
        const response = await fetch(`${CONFIG.apiBase}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: pass })
        });

        const data = await response.json();

        if (data.success) {
            spawnNotification(`Bienvenido, ${data.user.name}`, "success");
            launchApp(data.user);
        } else {
            spawnNotification("Acceso Denegado: Credenciales inválidas", "error");
        }
    } catch (err) {
        spawnNotification("El servidor PostgreSQL no responde", "error");
    }
}

/**
 * 4. GESTIÓN DEL DASHBOARD
 */
function launchApp(user) {
    APP_STATE.currentUser = user;
    APP_STATE.isAuthenticated = true;

    // Animación de salida del portal
    document.getElementById('auth-portal').classList.add('animate__animated', 'animate__fadeOutUp');
    
    setTimeout(() => {
        document.getElementById('auth-portal').classList.add('hidden');
        document.getElementById('main-application').classList.remove('hidden');
        
        // Sincronizar UI
        document.getElementById('user-display-name').innerText = user.name;
        document.getElementById('user-display-avatar').innerText = user.name[0].toUpperCase();
        document.getElementById('user-display-tag').innerText = `@${user.name.toLowerCase().replace(/\s/g, '')}`;
        document.getElementById('drop-email').innerText = user.email;
        
        fetchPosts(); // Cargar el feed
    }, 600);
}

/**
 * 5. MOTOR DE FEED Y PUBLICACIONES
 */
async function publishNewPost() {
    const input = document.getElementById('main-post-input');
    const content = input.value;

    if (!content.trim()) return;

    const postData = {
        user_id: APP_STATE.currentUser.id,
        content: content
    };

    try {
        const response = await fetch(`${CONFIG.apiBase}/posts/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(postData)
        });

        const data = await response.json();
        if (data.success) {
            input.value = '';
            fetchPosts(); // Recargar feed
            spawnNotification("Publicación desplegada con éxito.");
        }
    } catch (err) {
        spawnNotification("Error al publicar.", "error");
    }
}

async function fetchPosts() {
    const feedList = document.getElementById('global-feed-list');
    
    try {
        const response = await fetch(`${CONFIG.apiBase}/posts/all`);
        const data = await response.json();

        if (data.success) {
            feedList.innerHTML = ''; // Limpiar
            data.posts.forEach(post => {
                const postEl = document.createElement('div');
                postEl.className = 'post-card-premium animate__animated animate__fadeInUp';
                
                postEl.innerHTML = `
                    <div class="p-header">
                        <div class="p-avatar-box">
                            <div class="avatar">${post.username[0].toUpperCase()}</div>
                            ${post.is_verified ? '<i class="fa-solid fa-circle-check v-icon"></i>' : ''}
                        </div>
                        <div class="p-user-info">
                            <strong>${post.username}</strong>
                            <span>${new Date(post.created_at).toLocaleString()}</span>
                        </div>
                    </div>
                    <div class="p-content">${post.content}</div>
                    <div class="p-footer">
                        <button><i class="fa-regular fa-heart"></i> ${post.likes || 0}</button>
                        <button><i class="fa-regular fa-comment"></i> 0</button>
                        <button><i class="fa-solid fa-share-nodes"></i></button>
                    </div>
                `;
                feedList.appendChild(postEl);
            });
        }
    } catch (err) {
        console.error("Error cargando feed.");
    }
}

/**
 * 6. UTILIDADES DE INTERFAZ
 */
function spawnNotification(msg, type = 'success') {
    const hub = document.getElementById('notification-hub');
    const toast = document.createElement('div');
    toast.className = `toast-item ${type} animate__animated animate__fadeInRight`;
    
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
    
    toast.innerHTML = `
        <i class="fa-solid ${icon}"></i>
        <span>${msg}</span>
    `;

    hub.appendChild(toast);

    setTimeout(() => {
        toast.classList.replace('animate__fadeInRight', 'animate__fadeOutRight');
        setTimeout(() => toast.remove(), 500);
    }, 4000);
}

function toggleUserDropdown() {
    document.getElementById('user-dropdown').classList.toggle('active');
}

function systemLogout() {
    location.reload(); // Reiniciar el estado
}

// Inicializar el sistema al cargar
window.addEventListener('DOMContentLoaded', initSystem);
