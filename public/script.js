const App = {
    user: null,

    async auth(type) {
        const username = document.getElementById('user-in').value;
        const password = document.getElementById('pass-in').value;

        if(!username || !password) return alert("Completa los campos, Emmanuel.");

        try {
            const res = await fetch(`/api/${type}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();
            if (res.ok) {
                this.user = data;
                this.launch();
            } else {
                alert(data.error);
            }
        } catch (e) {
            alert("Error de conexión con Render.");
        }
    },

    launch() {
        document.getElementById('auth-wall').classList.add('hidden');
        document.getElementById('app-wall').classList.remove('hidden');
        
        // Cargar datos en la UI
        document.getElementById('nav-user-name').innerText = this.user.username;
        document.getElementById('welcome-name').innerText = this.user.username;
        const av = document.getElementById('nav-avatar');
        av.innerText = this.user.username[0].toUpperCase();
        av.style.background = this.user.color;
    },

    async search(q) {
        const resultsBox = document.getElementById('search-results');
        if (q.length < 1) {
            resultsBox.style.display = 'none';
            return;
        }

        const res = await fetch(`/api/search?q=${q}`);
        const users = await res.json();

        if (users.length > 0) {
            resultsBox.innerHTML = users.map(u => `
                <div class="drop-item">
                    <div class="avatar-circle" style="background:${u.color}; width:25px; height:25px; font-size:12px;">${u.username[0]}</div>
                    <span>${u.username}</span>
                </div>
            `).join('');
            resultsBox.style.display = 'block';
        } else {
            resultsBox.style.display = 'none';
        }
    },

    toggleMenu() {
        const menu = document.getElementById('user-menu');
        menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
    }
};

// Cerrar el menú si haces click afuera
window.onclick = (event) => {
    if (!event.target.closest('.profile-section')) {
        document.getElementById('user-menu').style.display = 'none';
    }
}
