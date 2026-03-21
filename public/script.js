// --- EFECTO DE ESCRITURA PARA LA FRASE PRINCIPAL ---
function typeWriter(text, elementId, speed = 50) {
    let i = 0;
    const element = document.getElementById(elementId);
    element.innerHTML = "";
    
    function type() {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    type();
}

// Ejecutar cuando cargue la página
window.onload = () => {
    // Frase personalizada que pediste
    const frase = "La red social donde tu código habla por ti.";
    const target = document.querySelector('.mockup-code code');
    
    if(target) {
        target.style.opacity = "0";
        setTimeout(() => {
            target.style.opacity = "1";
            target.innerHTML = `<span class="c-k">const</span> mission = <span class="c-v">"${frase}"</span>;`;
        }, 1000);
    }
    
    // Quitar el cargador con suavidad
    const loader = document.getElementById('loader');
    if(loader) {
        setTimeout(() => {
            loader.style.transform = "translateY(-100%)";
            loader.style.opacity = "0";
        }, 2000);
    }
};

// --- ANIMACIÓN AL PUBLICAR POST ---
function createPost() {
    const text = document.getElementById('post-input').value;
    if(!text.trim()) return;

    const feed = document.getElementById('feed-items');
    const post = document.createElement('div');
    post.className = 'post-card animate__animated animate__backInUp'; // Animación de entrada
    
    post.innerHTML = `
        <div class="composer-header">
            <div class="user-avatar">${document.getElementById('u-avatar').innerText}</div>
            <div style="margin-left:15px">
                <strong style="font-size:1.1rem">${document.getElementById('u-name').innerText}</strong>
                <p style="font-size: 0.8rem; color: #888;">Recién desplegado • 🌐</p>
            </div>
        </div>
        <div class="post-body" style="margin-top:20px; font-size:1.1rem; line-height:1.6">
            ${text}
        </div>
        <div class="post-footer" style="margin-top:20px; border-top:1px solid #eee; padding-top:15px; display:flex; gap:20px">
            <span style="cursor:pointer">❤️ 0</span>
            <span style="cursor:pointer">💬 0</span>
            <span style="cursor:pointer">🚀 Compartir</span>
        </div>
    `;
    
    feed.prepend(post);
    document.getElementById('post-input').value = '';
    
    // Sonido o vibración visual
    post.style.borderColor = "var(--accent)";
    setTimeout(() => post.style.borderColor = "var(--border-color)", 2000);
}
