/**
 * ECNHACA UX CONTROLLER
 * Manejo de Toasts, Transiciones y Modales
 */

// Notificaciones flotantes
function showToast(text, type = 'success') {
    const container = document.getElementById('toast-container');
    const t = document.createElement('div');
    t.className = `toast animate-pop ${type}`;
    t.innerHTML = `<i class="fa ${type === 'success' ? 'fa-check-circle' : 'fa-times-circle'}"></i> ${text}`;
    container.appendChild(t);
    setTimeout(() => {
        t.style.opacity = '0';
        setTimeout(() => t.remove(), 500);
    }, 3500);
}

// Navegación entre secciones
function changeView(viewName) {
    document.querySelectorAll('.view').forEach(v => v.classList.add('hide'));
    document.getElementById(`view-${viewName}`).classList.remove('hide');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Abrir/Cerrar Modal de Publicación
function togglePostModal(show) {
    const modal = document.getElementById('post-modal');
    modal.classList.toggle('hide', !show);
}

// Menú de usuario en la Navbar
function toggleNavMenu() {
    document.getElementById('navMenu').classList.toggle('hide');
}

// Cerrar menús al hacer click fuera
window.onclick = (e) => {
    if (e.target.className === 'modal-overlay') togglePostModal(false);
    if (!e.target.closest('.user-pill')) document.getElementById('navMenu').classList.add('hide');
};
