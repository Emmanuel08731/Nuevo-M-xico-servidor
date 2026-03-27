/**
 * ECNHACA UI SCRIPT - Emmanuel
 * Maneja efectos visuales y feedback de usuario
 */

window.addEventListener('load', () => {
    setTimeout(() => {
        document.getElementById('splash').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('splash').classList.add('hide');
            startEcnhaca(); // Inicia app.js
        }, 500);
    }, 2000);
});

// Función para mostrar mensajes de éxito o error con estilo
function notify(text, type = 'ok') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type === 'ok' ? 'ok' : 'err'}`;
    toast.innerHTML = `<i class="fa ${type === 'ok' ? 'fa-check-circle' : 'fa-times-circle'}"></i> ${text}`;
    
    container.appendChild(toast);
    
    // Si es error, vibramos el contenedor
    if(type === 'err') {
        const activeForm = document.querySelector('.auth-card');
        if(activeForm) {
            activeForm.classList.add('shake');
            setTimeout(() => activeForm.classList.remove('shake'), 500);
        }
    }

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 400);
    }, 3500);
}

// Cambiar vistas con transición suave
function irA(v) {
    document.querySelectorAll('.view').forEach(view => {
        view.classList.add('hide');
        view.style.opacity = '0';
    });
    const target = document.getElementById('v-' + v);
    target.classList.remove('hide');
    setTimeout(() => target.style.opacity = '1', 50);
    document.getElementById('drop').classList.add('hide');
}

function toggleDrop() {
    document.getElementById('drop').classList.toggle('hide');
}
