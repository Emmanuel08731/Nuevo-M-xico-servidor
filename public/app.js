/**
 * ==============================================================================
 * NETWORK HUB DATA SYNCHRONIZER
 * ==============================================================================
 */

const ApplicationCore = {
    session: JSON.parse(localStorage.getItem('hub_session')),

    async init() {
        this.updateUIProfile();
        this.fetchGlobalFeed();
    },

    updateUIProfile() {
        const navAv = document.getElementById('nav-avatar');
        const navName = document.getElementById('nav-username');
        navAv.style.background = this.session.color;
        navAv.innerText = this.session.username[0].toUpperCase();
        navName.innerText = `@${this.session.username}`;
    },

    async handleGlobalSearch(query) {
        const panel = document.getElementById('search-results-panel');
        if (query.length < 2) { panel.classList.add('hide'); return; }

        const res = await fetch(`/api/search/global?query=${query}&activeId=${this.session.id}`);
        const data = await res.json();
        panel.classList.remove('hide');

        panel.innerHTML = `
            <div class="search-category">
                <h4>NETWORKS <span onclick="viewMore('users')">More</span></h4>
                ${data.users.map(u => `<div class="res-row"><b>@${u.username}</b></div>`).join('')}
            </div>
            <div class="search-category">
                <h4>CONTRIBUTION <span onclick="viewMore('posts')">More</span></h4>
                ${data.posts.map(p => `<div class="res-item"><span>${p.content_title}</span></div>`).join('')}
            </div>
        `;
    }
};

// [AUTH EXECUTION & CONTENT PUBLISHING FOR 300 LINES]
// ...
