async function access() {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('pass').value;

    if(!email || !pass) return alert("Ingresa datos");

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: pass })
        });

        const data = await response.json();

        if(data.success) {
            document.getElementById('auth-portal').classList.add('hidden');
            document.getElementById('dashboard').classList.remove('hidden');
        } else {
            alert(data.error);
        }
    } catch (err) {
        alert("Error de conexión");
    }
}
