/**
 * ECNHACA UI CONTROLLER - VERSION 2.0
 */

const ui = {
    splash: () => {
        const bar = document.getElementById('loader-bar');
        const status = document.getElementById('loader-status');
        let progress = 0;

        const interval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                setTimeout(() => {
                    document.getElementById('splash').style.opacity = '0';
                    setTimeout(() => {
                        document.getElementById('splash').classList.add('hide');
                        ui.init();
                    }, 500);
                }, 600);
            }
            bar.style.width = progress + '%';
            if (progress > 80) status.innerText = "Sincronizando perfiles...";
            else if (progress > 40) status.innerText = "Conectando al servidor...";
        }, 120);
    },

    init: () => {
        const session = localStorage.getItem('ec_session');
        if (session) {
            document.getElementById('app-view').classList.remove('hide');
            const user = JSON.parse(session);
            ui.setProfile(user);
            app.fetchFeed();
        } else {
            document.getElementById('auth-view').classList.remove('hide');
        }
    },

    setProfile: (user) => {
        const circle = document.getElementById('nav-av-circle');
        circle.style.background = user.color || '#007aff';
        circle.innerText = user.username[0].toUpperCase();
    },

    showToast: (msg, type = 'success') => {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="fa ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i>
            <span>${msg}</span>
        `;
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(50px)';
            setTimeout(() => toast.remove(), 500);
        }, 4000);
    },

    toggleUserMenu: () => {
        document.getElementById('user-dropdown').classList.toggle('hide');
    },

    openPostModal: () => {
        document.getElementById('modal-post').classList.remove('hide');
    },

    closePostModal: () => {
        document.getElementById('modal-post').classList.add('hide');
    }
};

const appNav = {
    home: () => {
        document.getElementById('tab-feed').classList.remove('hide');
        document.getElementById('tab-profile').classList.add('hide');
    },
    profile: () => {
        const user = JSON.parse(localStorage.getItem('ec_session'));
        app.loadProfile(user.id);
        document.getElementById('tab-feed').classList.add('hide');
        document.getElementById('tab-profile').classList.remove('hide');
    }
};

function toggleAuthTab(mode) {
    const isLogin = mode === 'login';
    document.getElementById('register-only').classList.toggle('hide', isLogin);
    document.getElementById('btn-tab-login').classList.toggle('active', isLogin);
    document.getElementById('btn-tab-register').classList.toggle('active', !isLogin);
    document.getElementById('main-auth-btn').innerText = isLogin ? 'Ingresar al Sistema' : 'Crear Cuenta Ahora';
}

window.onload = ui.splash;
