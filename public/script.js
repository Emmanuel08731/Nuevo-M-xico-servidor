let stats = { followers: 0, following: 0, posts: 0 };

function toggleMenu() {
    document.getElementById('drop-menu').classList.toggle('hide');
}

function showSection(section) {
    document.querySelectorAll('.view').forEach(v => v.classList.add('hide'));
    document.getElementById(`view-${section === 'profile' || section === 'config' ? section : 'feed'}`).classList.remove('hide');
    document.getElementById('drop-menu').classList.add('hide');
}

function addPost() {
    const title = document.getElementById('post-title').value;
    const desc = document.getElementById('post-desc').value;
    const topic = document.getElementById('post-topic').value;

    if(!title || !desc) return alert("Completa los campos");

    const postHTML = `
        <div class="post-card">
            <div style="display:flex; justify-content:space-between; align-items:center">
                <small><b>${topic}</b></small>
                <button onclick="this.parentElement.parentElement.remove(); updatePostCount(-1)" style="background:none; border:none; color:red; cursor:pointer"><i class="fa fa-trash"></i></button>
            </div>
            <h3>${title}</h3>
            <p>${desc}</p>
        </div>
    `;

    document.getElementById('feed-items').insertAdjacentHTML('afterbegin', postHTML);
    updatePostCount(1);
    
    // Limpiar campos
    document.getElementById('post-title').value = "";
    document.getElementById('post-desc').value = "";
}

function updatePostCount(val) {
    stats.posts += val;
    document.getElementById('count-posts').innerText = stats.posts;
}

function executeSearch() {
    const type = document.getElementById('search-type').value;
    const query = document.getElementById('main-search').value;

    if(type === 'users') {
        const userHTML = `
            <div class="post-card" style="text-align:center">
                <div class="avatar-sm" style="margin: 0 auto 10px">U</div>
                <h4>${query}</h4>
                <button class="btn-post" id="btn-follow" onclick="toggleFollow(this)">Seguir</button>
            </div>
        `;
        document.getElementById('feed-items').innerHTML = userHTML;
    }
}

function toggleFollow(btn) {
    if(btn.innerText === "Seguir") {
        btn.innerText = "Dejar de seguir";
        btn.style.background = "#e1e1e1";
        btn.style.color = "black";
        stats.followers++;
    } else {
        btn.innerText = "Seguir";
        btn.style.background = "black";
        btn.style.color = "white";
        stats.followers--;
    }
    document.getElementById('count-followers').innerText = stats.followers;
}
