const App = {
    user: null,

    // Notificaciones dentro de la web
    showToast(msg, type = 'success') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<i class="fa-solid ${type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'}"></i> ${msg}`;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    },

    // Cambiar entre Login y Registro
    switch(view) {
        if (view === 'reg') {
            document.getElementById('view-login').classList.add('hidden');
            document.getElementById('view-reg').classList.remove('hidden');
        } else {
            document.getElementById('view-reg').classList.add('hidden');
            document.getElementById('view-login').classList.remove('hidden');
        }
    },

    // Autenticación Principal
    async auth(type) {
        let payload = {};
        if (type === 'register') {
            payload = {
                username: document.getElementById('r-user').value,
                email: document.getElementById('r-email').value,
                password: document.getElementById('r-pass').value
            };
        } else {
            payload = {
                username: document.getElementById('l-user').value,
                password: document.getElementById('l-pass').value
            };
        }

        try {
            const res = await fetch(`/api/${type}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (res.ok) {
                this.showToast(data.message, 'success');
                if (type === 'register') {
                    setTimeout(() => this.switch('login'), 1500);
                } else {
                    this.user = data.user;
                    setTimeout(() => this.launch(), 1000);
                }
            } else {
                // Aquí se muestra el error real de la base de datos
                this.showToast(data.error, 'error');
            }
        } catch (e) {
            this.showToast("Error de conexión con el servidor.", "error");
        }
    },

    launch() {
        document.getElementById('auth-wall').classList.add('hidden');
        document.getElementById('app-wall').classList.remove('hidden');
        
        document.getElementById('nav-user').innerText = this.user.username;
        document.getElementById('welcome-user').innerText = this.user.username;
        document.getElementById('menu-user-id').innerText = `@${this.user.username}`;
        
        const av = document.getElementById('nav-avatar');
        av.innerText = this.user.username[0].toUpperCase();
        av.style.background = this.user.color;
    },

    async search(q) {
        const results = document.getElementById('search-results');
        if (q.length < 1) return results.classList.add('hidden');

        const res = await fetch(`/api/search?q=${q}`);
        const data = await res.json();

        if (data.length > 0) {
            results.innerHTML = data.map(u => `
                <div class="drop-link">
                    <div class="avatar-circle" style="background:${u.color}; width:25px; height:25px; font-size:10px;">${u.username[0]}</div>
                    ${u.username}
                </div>
            `).join('');
            results.classList.remove('hidden');
        } else {
            results.classList.add('hidden');
        }
    },

    toggleMenu() {
        document.getElementById('user-menu').classList.toggle('hidden');
    }
};

// Cerrar menús al hacer click afuera
window.onclick = (e) => {
    if (!e.target.closest('.user-profile')) document.getElementById('user-menu').classList.add('hidden');
    if (!e.target.closest('.search-bar')) document.getElementById('search-results').classList.add('hidden');
};
