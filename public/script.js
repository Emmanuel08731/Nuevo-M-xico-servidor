/**
 * ECNHACA UI CONTROLLER v7.0
 */
window.addEventListener('load', () => {
    // El cargador dura 2.5 segundos simulando conexión
    setTimeout(() => {
        document.getElementById('loader').classList.add('hide');
        checkSession();
    }, 2500);
});

function toggleAuth(mode) {
    document.getElementById('aE').classList.toggle('hide', mode === 'L');
    document.getElementById('tL').classList.toggle('act', mode === 'L');
    document.getElementById('tR').classList.toggle('act', mode === 'R');
    window.authMode = mode;
}

function openModal() { document.getElementById('modal').classList.remove('hide'); }
function closeModal() { document.getElementById('modal').classList.add('hide'); }
