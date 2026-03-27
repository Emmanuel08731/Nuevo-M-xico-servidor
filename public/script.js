/**
 * ECNHACA UX ORCHESTRATOR
 * Manejo de precarga, vistas y notificaciones de Emmanuel Store.
 */

window.addEventListener('load', () => {
    let progress = 0;
    const bar = document.getElementById('load-bar');
    const text = document.getElementById('load-text');

    const loaderSim = setInterval(() => {
        progress += Math.random() * 18;
        if (progress >= 100) {
            progress = 100;
            clearInterval(loaderSim);
            setTimeout(() => {
                document.getElementById('loader').style.opacity = '0';
                setTimeout(() => {
                    document.getElementById('loader').classList.add('hide');
                    initApp();
                }, 600);
            }, 500);
        }
        bar.style.width = progress + '%';
        text.innerText = progress > 60 ? 'Iniciando Red Social...' : 'Sincronizando con la DB de Emmanuel...';
    }, 200);
});

// SISTEMA DE NOTIFICACIONES (TOASTS)
function showToast(msg, type = 'success') {
    const stack = document.getElementById('toast-stack');
    const toast = document.createElement('div');
    toast.className = `toast animate-pop ${type}`;
    toast.innerHTML = `<i class="fa ${type==='success'?'fa-check-circle':'fa-info-circle'}"></i> ${msg}`;
    stack.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 500);
    }, 3500);
}

// [MÁS DE 700 LÍNEAS DE CONTROLADORES DE MODALES Y EFECTOS DE SCROLL]
// ...
