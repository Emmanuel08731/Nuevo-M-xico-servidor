/**
 * ECNHACA UI v4.0 - Emmanuel Store
 * LÍNEAS ESTIMADAS: 120
 * Descripción: Manejo de UX, Toasts y Transiciones SPA.
 */

window.addEventListener('load', () => {
    // Simulamos carga de recursos
    setTimeout(() => {
        const splash = document.getElementById('splash');
        splash.style.transition = 'opacity 0.8s ease';
        splash.style.opacity = '0';
        setTimeout(() => {
            splash.classList.add('hide');
            initApp(); // Función principal de app.js
        }, 800);
    }, 2500);
});

// Sistema de Notificaciones de Alto Nivel
function pushNotify(text, type = 'success') {
    const box = document.getElementById('notif-box');
    const toast = document.createElement('div');
    toast.className = `notif ${type === 'error' ? 'error' : 'success'}`;
    
    const icon = type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle';
    toast.innerHTML = `<i class="fa ${icon}"></i> <span>${text}</span>`;
    
    box.appendChild(toast);

    // Animación de salida automática
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.4s forwards';
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}

// Navegador entre Vistas Single Page (SPA)
function navigateTo(panelId) {
    const views = document.querySelectorAll('.view-panel');
    views.forEach(v => {
        v.style.display = 'none';
        v.classList.add('hide');
    });

    const active = document.getElementById(`view-${panelId}`);
    active.classList.remove('hide');
    active.style.display = 'block';
    
    // Resetear scroll
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Cerrar menús abiertos
    document.getElementById('userMenu').classList.add('hide');
}

function toggleUserMenu() {
    const menu = document.getElementById('userMenu');
    menu.classList.toggle('hide');
    if(!menu.classList.contains('hide')) {
        menu.style.animation = 'popIn 0.3s forwards';
    }
}

// Efecto de Feedback Táctil (Botones)
function tapEffect(el) {
    el.style.transform = 'scale(0.95)';
    setTimeout(() => el.style.transform = 'scale(1)', 100);
}

// Listener para cerrar menús al hacer clic fuera
document.addEventListener('click', (e) => {
    const trigger = document.querySelector('.profile-pill');
    const menu = document.getElementById('userMenu');
    if(!trigger.contains(e.target) && !menu.contains(e.target)) {
        menu.classList.add('hide');
    }
});
