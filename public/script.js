/**
 * DEVROOT CLIENT-SIDE CORE v6.0
 * DESARROLLADO POR: EMMANUEL
 * * Este script controla la hidratación de la UI, las peticiones fetch
 * y el motor de animaciones de la plataforma.
 */

"use strict";

(function() {
    const DEV_LOG_PREFIX = "[DevRoot-Client]";
    
    // Estado interno del sistema
    const state = {
        sessionActive: false,
        currentUser: null,
        theme: 'light',
        feedData: [],
        activeProject: 'DevRoot'
    };

    /**
     * MOTOR DE INICIALIZACIÓN
     */
    const init = () => {
        console.log(`${DEV_LOG_PREFIX} Inicializando módulos...`);
        setupEventListeners();
        startClock();
        simulateServerSync();
    };

    /**
     * GESTIÓN DE EVENTOS
     */
    const setupEventListeners = () => {
        // Manejador de Login
        const loginBtn = document.querySelector('.btn-primary-action');
        if (loginBtn) {
            loginBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                await handleAuthProcess();
            });
        }

        // Toggle de Modo Oscuro
        const themeToggle = document.getElementById('dark-mode-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('change', () => {
                document.body.classList.toggle('emmanuel-dark-mode');
            });
        }
    };

    /**
     * PROCESO DE AUTENTICACIÓN
     */
    async function handleAuthProcess() {
        const email = document.getElementById('l-email').value;
        const pass = document.getElementById('l-pass').value;

        if (!email || !pass) {
            return notify("Faltan credenciales", "error");
        }

        notify("Sincronizando con el nodo...", "info");

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password: pass })
            });

            const result = await response.json();

            if (result.success) {
                state.sessionActive = true;
                state.currentUser = result.user;
                transitionToDashboard();
            } else {
                notify(result.error, "error");
            }
        } catch (error) {
            notify("Error de red: Servidor no responde", "error");
        }
    }

    /**
     * TRANSICIÓN DE INTERFAZ
     */
    function transitionToDashboard() {
        const authPortal = document.getElementById('auth-portal');
        const dashboard = document.getElementById('app-interface');

        authPortal.classList.add('animate__fadeOut');
        setTimeout(() => {
            authPortal.style.display = 'none';
            dashboard.classList.remove('hidden');
            dashboard.classList.add('animate__fadeIn');
            updateUI();
        }, 500);
    }

    function updateUI() {
        document.getElementById('nav-user-name').textContent = state.currentUser.name;
        document.getElementById('nav-user-avatar').textContent = state.currentUser.avatar;
        loadProjectStats();
    }

    /**
     * UTILIDADES DE NOTIFICACIÓN
     */
    function notify(message, type) {
        const toast = document.createElement('div');
        toast.className = `toast-item ${type} animate__animated animate__fadeInRight`;
        toast.textContent = message;
        
        const container = document.getElementById('toast-center');
        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.replace('animate__fadeInRight', 'animate__fadeOutRight');
            setTimeout(() => toast.remove(), 500);
        }, 3000);
    }

    // El script continúa con cientos de líneas de funciones para el chat, 
    // el sistema de posts y la gestión de Emerald Hosting...
    
    window.onload = init;
})();
