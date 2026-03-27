/**
 * ECNHACA UI SYSTEM
 * Control de Modales, Notificaciones y Vistas
 */

function toast(msg, type = "ok") {
    const box = document.getElementById('toast-box');
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerText = msg;
    box.appendChild(t);
    setTimeout(() => t.remove(), 3000);
}

function openPostModal() {
    document.getElementById('modal-post').classList.remove('hide');
}

function closePostModal() {
    document.getElementById('modal-post').classList.add('hide');
}

function showView(viewName) {
    document.querySelectorAll('.view').forEach(v => v.classList.add('hide'));
    document.getElementById(`v-${viewName}`).classList.remove('hide');
    if(viewName === 'feed') loadPosts();
}

function toggleMenu() {
    document.getElementById('navMenu').classList.toggle('hide');
}
