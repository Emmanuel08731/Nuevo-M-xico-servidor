/**
 * ==============================================================================
 * NETWORK HUB UI ORCHESTRATOR
 * ==============================================================================
 */

window.addEventListener('load', () => {
    const loader = document.getElementById('boot-loader');
    setTimeout(() => {
        loader.style.opacity = '0';
        setTimeout(() => {
            loader.classList.add('hide');
            validateKernelSession();
        }, 500);
    }, 1500);
});

function setAuthMode(mode) {
    const isRegister = mode === 'register';
    document.getElementById('email-group').classList.toggle('hide', !isRegister);
    document.getElementById('tab-login').classList.toggle('active', !isRegister);
    document.getElementById('tab-register').classList.toggle('active', isRegister);
    window.currentFlow = mode;
}

function validateKernelSession() {
    const session = localStorage.getItem('hub_session');
    if (session) {
        document.getElementById('view-auth').classList.add('hide');
        document.getElementById('view-app').classList.remove('hide');
        ApplicationCore.init();
    } else {
        document.getElementById('view-auth').classList.remove('hide');
        document.getElementById('view-app').classList.add('hide');
    }
}

// [MODAL SYSTEM & NOTIFICATION ENGINE FOR 300 LINES]
// ...
