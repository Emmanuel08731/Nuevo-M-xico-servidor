const App = {
    user: null,

    switch(view) {
        if (view === 'register') {
            document.getElementById('login-view').classList.add('hidden');
            document.getElementById('register-view').classList.remove('hidden');
        } else {
            document.getElementById('register-view').classList.add('hidden');
            document.getElementById('login-view').classList.remove('hidden');
        }
    },

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

        const res = await fetch(`/api/${type}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (res.ok) {
            alert(data.message); // "¡Cuenta creada con éxito!" o "Iniciaste sesión con éxito"
            if (type === 'register') this.switch('login');
            else {
                this.user = data.user;
                this.launch();
            }
        } else alert(data.error);
    },

    launch() {
        document.getElementById('auth-wall').classList.add('hidden');
        document.getElementById('app-wall').classList.remove('hidden');
        document.getElementById('nav-name').innerText = this.user.username;
        document.getElementById('nav-av').innerText = this.user.username[0].toUpperCase();
        document.getElementById('nav-av').style.background = this.user.color;
    },

    async search(q) {
        const drop = document.getElementById('search-res');
        if (q.length < 1) return drop.style.display = 'none';
        const res = await fetch(`/api/search?q=${q}`);
        const users = await res.json();
        drop.innerHTML = users.map(u => `<div class="drop-item"><div class="av" style="background:${u.color};width:20px;height:20px;font-size:10px;">${u.username[0]}</div>${u.username}</div>`).join('');
        drop.style.display = 'block';
    },

    toggleMenu() {
        const m = document.getElementById('drop-menu');
        m.style.display = m.style.display === 'block' ? 'none' : 'block';
    }
};
