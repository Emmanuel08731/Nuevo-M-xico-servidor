/** * ECNHACA UI ENGINE - Emmanuel Store
 * Maneja: Animaciones, Menús, Vistas SPA y Splash Screen
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Pantalla de carga profesional (Splash)
    setTimeout(() => {
        const splash = document.getElementById('splash');
        if(splash) {
            splash.style.opacity = '0';
            setTimeout(() => splash.classList.add('hide'), 500);
        }
        initSocialLogic(); // Llama a la lógica de app.js
    }, 2000);

    // 2. Cerrar menús al hacer clic fuera
    window.onclick = (e) => {
        const drop = document.getElementById('drop');
        if (drop && !e.target.closest('.profile-trigger') && !e.target.closest('.dropdown')) {
            drop.classList.add('hide');
        }
    };
});

// Cambiar de vista con animación de entrada
function switchView(viewId) {
    const views = document.querySelectorAll('.view');
    views.forEach(v => {
        v.classList.add('hide');
        v.style.opacity = '0';
        v.style.transform = 'translateY(10px)';
    });

    const activeView = document.getElementById(viewId);
    if(activeView) {
        activeView.classList.remove('hide');
        setTimeout(() => {
            activeView.style.opacity = '1';
            activeView.style.transform = 'translateY(0)';
            activeView.style.transition = 'all 0.4s ease';
        }, 50);
    }
    document.getElementById('drop').classList.add('hide');
}

// Menú desplegable de la derecha
function toggleDrop() {
    const drop = document.getElementById('drop');
    drop.classList.toggle('hide');
    if(!drop.classList.contains('hide')) {
        drop.style.animation = 'slideDown 0.3s ease forwards';
    }
}

// Efecto de vibración en botones
function vibrateBtn(el) {
    el.style.transform = 'scale(0.95)';
    setTimeout(() => el.style.transform = 'scale(1)', 100);
}
