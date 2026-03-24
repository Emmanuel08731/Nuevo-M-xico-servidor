/* =========================================================
DEVROOT SOCIAL DESIGN SYSTEM - V22.0.0
AUTOR: EMMANUEL (ENGINEERING MODE)
ESTILO: MINIMALISMO PROFESIONAL / CLEAN WHITE
REGLONES: 450+
=========================================================
*/

:root {
    /* Paleta de Colores Primaria */
    --p-50: #eff6ff;
    --p-100: #dbeafe;
    --p-200: #bfdbfe;
    --p-300: #93c5fd;
    --p-400: #60a5fa;
    --p-500: #3b82f6; /* Azul Principal */
    --p-600: #2563eb;
    --p-700: #1d4ed8;
    
    /* Neutros */
    --white: #ffffff;
    --bg-main: #f8fafc;
    --bg-soft: #f1f5f9;
    --text-main: #0f172a;
    --text-muted: #64748b;
    --border-light: #e2e8f0;
    --border-strong: #cbd5e1;

    /* Efectos */
    --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
    --glass: rgba(255, 255, 255, 0.75);
    
    /* Geometría */
    --radius-sm: 8px;
    --radius-md: 12px;
    --radius-lg: 20px;
    --radius-full: 9999px;
    
    /* Tiempos */
    --ts-fast: 0.15s;
    --ts-normal: 0.3s;
    --ts-slow: 0.5s;
}

/* --- RESET & BASE --- */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}

body {
    font-family: 'Plus Jakarta Sans', sans-serif;
    background-color: var(--bg-main);
    color: var(--text-main);
    line-height: 1.5;
    overflow-x: hidden;
}

button, input {
    font-family: inherit;
    color: inherit;
}

/* --- ANIMACIONES KEYFRAMES --- */
@keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}

@keyframes scaleIn {
    from { opacity: 0; transform: scale(0.9); }
    to { opacity: 1; transform: scale(1); }
}

@keyframes slideRight {
    from { opacity: 0; transform: translateX(-30px); }
    to { opacity: 1; transform: translateX(0); }
}

@keyframes spinCustom {
    to { transform: rotate(360deg); }
}

@keyframes pulseBorder {
    0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
    70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
    100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
}

@keyframes float {
    0% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
    100% { transform: translateY(0px); }
}

/* --- CLASES DE ANIMACIÓN --- */
.animate-fade { animation: fadeInUp var(--ts-normal) ease forwards; }
.animate-scale { animation: scaleIn var(--ts-normal) cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
.animate-slide { animation: slideRight var(--ts-normal) ease forwards; }
.animate-float { animation: float 3s ease-in-out infinite; }

/* --- LOGIN GATE --- */
#auth-gate {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: radial-gradient(circle at top left, var(--p-100), transparent),
                radial-gradient(circle at bottom right, #fef2f2, transparent);
    padding: 20px;
}

.auth-container {
    background: var(--white);
    width: 100%;
    max-width: 1000px;
    height: 600px;
    display: flex;
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    overflow: hidden;
    border: 1px solid var(--border-light);
}

.auth-info-panel {
    flex: 1;
    background: var(--p-600);
    padding: 60px;
    color: var(--white);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    position: relative;
}

.auth-info-panel h1 {
    font-size: 3rem;
    font-weight: 800;
    letter-spacing: -2px;
}

.auth-info-panel h1 span { color: var(--p-300); }

.auth-form-panel {
    flex: 1.2;
    padding: 60px;
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.input-wrapper {
    margin-bottom: 20px;
    position: relative;
}

.input-wrapper label {
    display: block;
    font-size: 0.85rem;
    font-weight: 700;
    margin-bottom: 8px;
    color: var(--text-muted);
}

.input-wrapper input {
    width: 100%;
    padding: 14px 18px;
    border-radius: var(--radius-md);
    border: 2px solid var(--bg-soft);
    background: var(--bg-soft);
    transition: var(--ts-normal);
}

.input-wrapper input:focus {
    background: var(--white);
    border-color: var(--p-500);
    outline: none;
    box-shadow: 0 0 0 4px var(--p-100);
}

.btn-primary {
    background: var(--p-600);
    color: var(--white);
    padding: 16px;
    border-radius: var(--radius-md);
    border: none;
    font-weight: 700;
    cursor: pointer;
    transition: var(--ts-normal);
    width: 100%;
}

.btn-primary:hover {
    background: var(--p-700);
    transform: translateY(-2px);
}

/* --- NAVBAR --- */
.navbar {
    position: fixed;
    top: 0;
    width: 100%;
    height: 72px;
    background: var(--glass);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border-light);
    z-index: 1000;
    display: flex;
    align-items: center;
}

.nav-inner {
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
    padding: 0 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.brand-logo {
    font-size: 1.6rem;
    font-weight: 900;
    color: var(--text-main);
    letter-spacing: -1.5px;
}

.brand-logo span { color: var(--p-500); }

.search-container {
    background: var(--bg-soft);
    border-radius: var(--radius-full);
    padding: 10px 20px;
    width: 350px;
    display: flex;
    align-items: center;
    gap: 12px;
}

.search-container input {
    border: none;
    background: transparent;
    outline: none;
    width: 100%;
}

/* --- FEED LAYOUT --- */
.main-wrapper {
    max-width: 1200px;
    margin: 100px auto 0;
    display: grid;
    grid-template-columns: 260px 1fr 320px;
    gap: 32px;
    padding: 0 24px;
}

/* --- ASIDE MENU --- */
.sidebar-link {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 14px 20px;
    border-radius: var(--radius-md);
    cursor: pointer;
    color: var(--text-muted);
    font-weight: 600;
    transition: var(--ts-normal);
}

.sidebar-link:hover {
    background: var(--white);
    color: var(--p-600);
}

.sidebar-link.active {
    background: var(--white);
    color: var(--p-600);
    box-shadow: var(--shadow-sm);
}

/* --- POST CARDS --- */
.create-post {
    background: var(--white);
    border-radius: var(--radius-lg);
    padding: 24px;
    box-shadow: var(--shadow-md);
    margin-bottom: 24px;
}

.post-card {
    background: var(--white);
    border-radius: var(--radius-lg);
    border: 1px solid var(--border-light);
    margin-bottom: 24px;
    overflow: hidden;
    transition: var(--ts-normal);
}

.post-card:hover {
    box-shadow: var(--shadow-lg);
}

.post-header {
    padding: 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.post-user-info {
    display: flex;
    align-items: center;
    gap: 12px;
}

.avatar-md {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: var(--p-500);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
}

.post-content {
    padding: 0 20px 20px;
    font-size: 1.05rem;
}

.post-image {
    width: 100%;
    aspect-ratio: 16/9;
    background: #eee;
    object-fit: cover;
}

.post-actions {
    padding: 16px 20px;
    display: flex;
    align-items: center;
    gap: 24px;
    border-top: 1px solid var(--bg-soft);
}

.action-item {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    color: var(--text-muted);
    font-size: 0.95rem;
    transition: var(--ts-fast);
}

.action-item:hover { color: var(--p-500); }
.action-item i { font-size: 1.3rem; }

/* --- WIDGETS --- */
.widget-card {
    background: var(--white);
    border-radius: var(--radius-lg);
    padding: 24px;
    box-shadow: var(--shadow-sm);
}

.widget-title {
    font-weight: 800;
    font-size: 1.1rem;
    margin-bottom: 20px;
}

/* --- TOASTS --- */
#notification-system {
    position: fixed;
    bottom: 30px;
    right: 30px;
    z-index: 9999;
}

.toast {
    background: var(--text-main);
    color: white;
    padding: 16px 28px;
    border-radius: var(--radius-md);
    margin-top: 10px;
    box-shadow: var(--shadow-lg);
    display: flex;
    align-items: center;
    gap: 12px;
    animation: slideUp var(--ts-normal) forwards;
}

@keyframes slideUp {
    from { transform: translateY(100px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
}

/* --- SCROLLBAR --- */
::-webkit-scrollbar { width: 8px; }
::-webkit-scrollbar-track { background: var(--bg-main); }
::-webkit-scrollbar-thumb { background: var(--border-strong); border-radius: 10px; }
::-webkit-scrollbar-thumb:hover { background: var(--text-muted); }

/* --- RESPONSIVO --- */
@media (max-width: 1024px) {
    .main-wrapper { grid-template-columns: 80px 1fr; }
    .extra-side, .sidebar-link span { display: none; }
}

@media (max-width: 640px) {
    .main-wrapper { grid-template-columns: 1fr; }
    .side-menu { display: none; }
    .auth-container { height: auto; flex-direction: column; }
    .auth-info-panel { padding: 40px; }
}
