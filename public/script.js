/**
 * DEVROOT FRONTEND ENGINE V100
 * CLIENT-SIDE LOGIC FOR POSTGRESQL INTEGRATION
 */

const App = {
    // Estado global de la aplicación
    user: null,
    isMenuOpen: false,

    /**
     * Lógica de Autenticación (Login y Registro)
     * Conecta con las rutas de Node.js y guarda en la DB Global
     */
    async auth(type) {
        const username = document.getElementById('user-in').value.trim();
        const password = document.getElementById('pass-in').value.trim();
        const loader = document.getElementById('loader');

        if (!username || !password) {
            return this.notify("Emmanuel, completa todos los campos.");
        }

        // Mostrar cargador visual
        loader.classList.remove('hidden');
        
        try {
            const response = await fetch(`/api/${type}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                this.user = data;
                this.launchApp();
            } else {
                this.notify(data.error || "Error en la autenticación.");
            }
        } catch (error) {
            console.error("Error de conexión:", error);
            this.notify("No se pudo conectar con el servidor de Render.");
        } finally {
            loader.classList.add('hidden');
        }
    },

    /**
     * Activa la interfaz principal después del login
     */
    launchApp() {
        // Cambiar pantallas con animación
        document.getElementById('auth-wall').classList.add('hidden');
        const appWall = document.getElementById('app-wall');
        appWall.classList.remove('hidden');
        appWall.classList.add('animate-slide');

        // Personalizar la Navbar con los datos de PostgreSQL
        document.getElementById('nav-name').innerText = this.user.username;
        document.getElementById('menu-user-full').innerText = `@${this.user.username}`;
        
        const avatar = document.getElementById('nav-av');
        avatar.innerText = this.user.username[0].toUpperCase();
        avatar.style.background = this.user.color || '#0066ff';

        // Mensaje de bienvenida personalizado
        const contentArea = document.getElementById('content-area');
        contentArea.innerHTML = `
            <div class="welcome-card animate-pop">
                <i class="fa-solid fa-bolt" style="color: ${this.user.color}; font-size: 3rem; margin-bottom: 20px;"></i>
                <h2>¡Hola de nuevo, ${this.user.username}!</h2>
                <p>Tu cuenta está activa en la base de datos global de <b>PostgreSQL</b>.</p>
                <div class="stats-mini">
                    <span><i class="fa-solid fa-calendar"></i> Miembro desde hoy</span>
                </div>
            </div>
        `;
    },

    /**
     * Buscador en Tiempo Real
     * Consulta la base de datos global mientras escribes
     */
    async search(query) {
        const dropdown = document.getElementById('res-dropdown');
        
        if (query.length < 1) {
            dropdown.style.display = 'none';
            return;
        }

        try {
            const response = await fetch(`/api/search?q=${query}`);
            const results = await response.json();

            if (results.length > 0) {
                dropdown.innerHTML = results.map(u => `
                    <div class="menu-item" onclick="App.viewUser('${u.username}')">
                        <div class="avatar-mini" style="background: ${u.color}; width: 25px; height: 25px; font-size: 10px;">
                            ${u.username[0].toUpperCase()}
                        </div>
                        <div class="search-info">
                            <p style="margin:0; font-weight:700;">${u.username}</p>
                            <small style="color:#94a3b8;">${u.bio || 'Sin biografía'}</small>
                        </div>
                    </div>
                `).join('');
                dropdown.style.display = 'block';
            } else {
                dropdown.innerHTML = '<div class="menu-item"><small>No se encontraron resultados</small></div>';
                dropdown.style.display = 'block';
            }
        } catch (error) {
            console.error("Error en búsqueda:", error);
        }
    },

    /**
     * Muestra el perfil de otro usuario desde la DB
     */
    async viewUser(name) {
        document.getElementById('res-dropdown').style.display = 'none';
        const content = document.getElementById('content-area');
        
        content.innerHTML = '<div class="loader"></div>';

        try {
            const res = await fetch(`/api/user/${name}`);
            const data = await res.json();

            content.innerHTML = `
                <div class="welcome-card animate-pop">
                    <div class="avatar-mini" style="background:${data.color}; width:80px; height:80px; font-size:2rem; margin: 0 auto 20px;">
                        ${data.username[0].toUpperCase()}
                    </div>
                    <h2>${data.username}</h2>
                    <p>${data.bio}</p>
                    <button class="btn-primary" style="width:200px; margin: 20px auto;">Seguir Usuario</button>
                    <button class="btn-secondary" onclick="location.reload()">Volver al Inicio</button>
                </div>
            `;
        } catch (e) {
            this.notify("No se pudo cargar el perfil.");
        }
    },

    /**
     * Control del Menú Desplegable (Dropdown)
     */
    toggleDrop() {
        const menu = document.getElementById('drop-menu');
        this.isMenuOpen = !this.isMenuOpen;
        menu.style.display = this.isMenuOpen ? 'block' : 'none';
    },

    /**
     * Notificaciones simples (Alertas decoradas)
     */
    notify(msg) {
        // Usamos un alert simple, pero podrías cambiarlo por un Toast elegante
        alert(msg);
    }
};

/**
 * EVENTOS GLOBALES
 */

// Cerrar menús si el usuario hace click afuera
window.addEventListener('click', (e) => {
    // Cerrar dropdown del perfil
    if (!e.target.closest('.user-panel')) {
        document.getElementById('drop-menu').style.display = 'none';
        App.isMenuOpen = false;
    }
    
    // Cerrar resultados de búsqueda
    if (!e.target.closest('.search-engine')) {
        document.getElementById('res-dropdown').style.display = 'none';
    }
});

// Soporte para la tecla 'Enter' en el login
document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !document.getElementById('auth-wall').classList.contains('hidden')) {
        App.auth('login');
    }
});

console.log("🛠️ Emmanuel Store Script Loaded - Ready for Render");
