// ==================== ТЕМА ====================
function applyTheme() {
    const theme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', theme);
    updateSelectedTheme();
}

function setTheme(theme) {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    updateSelectedTheme();
    showNotification(`Тема: ${theme === 'light' ? 'светлая' : 'тёмная'}`);
}

function updateSelectedTheme() {
    const current = localStorage.getItem('theme') || 'light';
    document.querySelectorAll('.theme-card').forEach(card => {
        card.classList.toggle('selected', card.dataset.themeName === current);
    });
}
applyTheme();

// ==================== НАВИГАЦИЯ ====================
function openSettings() { window.location.href = 'settings.html'; }
function goBack() { window.location.href = 'index.html'; }

function switchTab(tabName, btn) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`tab-${tabName}`).classList.add('active');
}

// ==================== ПРОФИЛЬ ====================
function loadProfile() {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const el = (id) => document.getElementById(id);

    if (el('profile-username')) el('profile-username').textContent = user.username || '@username';
    if (el('profile-nickname')) el('profile-nickname').textContent = user.nickname || 'Имя Фамилия';
    if (el('profile-bio')) el('profile-bio').textContent = user.bio || 'Описание пока не заполнено...';
    if (el('profile-avatar') && user.avatar) el('profile-avatar').src = user.avatar;

    updateCreatePostAvatar();
}

function uploadAvatar(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { showNotification('❌ Это не картинка!'); return; }
    if (file.size > 2 * 1024 * 1024) { showNotification('❌ Файл больше 2 МБ'); return; }

    const reader = new FileReader();
    reader.onload = function(e) {
        const imageData = e.target.result;
        const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
        user.avatar = imageData;
        localStorage.setItem('currentUser', JSON.stringify(user));
        document.getElementById('profile-avatar').src = imageData;
        updateCreatePostAvatar();
        showNotification('✅ Аватарка обновлена!');
    };
    reader.readAsDataURL(file);
    event.target.value = '';
}

function editProfile() {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const newNickname = prompt('Новое имя:', user.nickname || '');
    if (newNickname === null) return;
    const newBio = prompt('Новое описание:', user.bio || '');
    if (newBio === null) return;
    user.nickname = newNickname.trim() || user.nickname;
    user.bio = newBio.trim() || user.bio;
    localStorage.setItem('currentUser', JSON.stringify(user));
    loadProfile();
    showNotification('✅ Профиль обновлён!');
}

function shareProfile() {
    navigator.clipboard.writeText(window.location.href)
        .then(() => showNotification('🔗 Ссылка скопирована!'))
        .catch(() => showNotification('❌ Не удалось скопировать'));
}

function resetAccount() {
    if (confirm('Сбросить аккаунт? Все данные удалятся.')) {
        localStorage.clear();
        window.location.href = 'index.html';
    }
}

// ==================== НАСТРОЙКА ПРОФИЛЯ ====================
function checkSetup() {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (user && user.username) return;
    const modal = document.getElementById('setup-modal');
    if (modal) modal.classList.add('active');
}

function saveSetup() {
    const username = document.getElementById('setup-username').value.trim();
    const nickname = document.getElementById('setup-nickname').value.trim();
    const bio = document.getElementById('setup-bio').value.trim();

    if (!username) { showNotification('❌ Введи ник!'); return; }
    if (username.length < 3) { showNotification('❌ Ник минимум 3 символа'); return; }

    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    user.username = username.startsWith('@') ? username : '@' + username;
    user.nickname = nickname || 'Без имени';
    user.bio = bio || 'Описание пока не заполнено...';
    localStorage.setItem('currentUser', JSON.stringify(user));

    document.getElementById('setup-modal').classList.remove('active');
    loadProfile();
    showNotification('✅ Профиль настроен!');
}

// ==================== ПОСТЫ ====================
let currentPostImage = null;

function getPosts() {
    return JSON.parse(localStorage.getItem('posts') || '[]');
}
function savePosts(posts) {
    localStorage.setItem('posts', JSON.stringify(posts));
}

function previewImage(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { showNotification('❌ Это не картинка!'); return; }
    if (file.size > 3 * 1024 * 1024) { showNotification('❌ Файл больше 3 МБ'); return; }

    const reader = new FileReader();
    reader.onload = function(e) {
        currentPostImage = e.target.result;
        document.getElementById('post-preview-img').src = currentPostImage;
        document.getElementById('post-preview').style.display = 'block';
    };
    reader.readAsDataURL(file);
}

function removePreview() {
    currentPostImage = null;
    document.getElementById('post-preview').style.display = 'none';
    document.getElementById('post-image-input').value = '';
}

function createPost() {
    const text = document.getElementById('post-text').value.trim();
    if (!text && !currentPostImage) {
        showNotification('❌ Напиши текст или добавь картинку');
        return;
    }

    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const posts = getPosts();

    const newPost = {
        id: Date.now(),
        username: user.username || '@user',
        avatar: user.avatar || 'https://via.placeholder.com/50',
        text: text,
        image: currentPostImage,
        likes: 0,
        likedBy: [],
        comments: [],
        time: Date.now()
    };

    posts.unshift(newPost);
    savePosts(posts);

    document.getElementById('post-text').value = '';
    removePreview();
    renderPosts();
    updateStats();
    showNotification('✅ Пост опубликован!');
}

function renderPosts() {
    const feed = document.getElementById('posts-feed');
    if (!feed) return;

    const posts = getPosts();
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');

    if (posts.length === 0) {
        feed.innerHTML = '<div class="feed-empty">📭 Пока нет постов. Будь первым!</div>';
        return;
    }

    feed.innerHTML = '';
    posts.forEach(post => {
        const isLiked = post.likedBy && post.likedBy.includes(user.username);
        const isOwner = post.username === user.username;

        const div = document.createElement('div');
        div.className = 'post';
        div.innerHTML = `
            <div class="post-header">
                <img src="${post.avatar}" class="post-avatar" alt="">
                <div class="post-author">
                    <div class="post-username">${post.username}</div>
                    <div class="post-time">${formatTime(post.time)}</div>
                </div>
                ${isOwner ? `<button class="post-delete" onclick="deletePost(${post.id})">🗑️</button>` : ''}
            </div>
            ${post.text ? `<div class="post-text">${escapeHtml(post.text)}</div>` : ''}
            ${post.image ? `<img src="${post.image}" class="post-image" alt="">` : ''}
            <div class="post-actions">
                <button class="post-action ${isLiked ? 'liked' : ''}" onclick="toggleLike(${post.id})">
                    ${isLiked ? '❤️' : '🤍'} <span>${post.likes || 0}</span>
                </button>
                <button class="post-action" onclick="toggleComments(${post.id})">
                    💬 <span>${post.comments.length}</span>
                </button>
            </div>
            <div class="comments-section" id="comments-${post.id}">
                <div class="comments-list">
                    ${post.comments.map(c => `
                        <div class="comment">
                            <img src="${c.avatar}" class="comment-avatar" alt="">
                            <div class="comment-body">
                                <div class="comment-author">${c.username}</div>
                                <div class="comment-text">${escapeHtml(c.text)}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="comment-input-area">
                    <input type="text" class="comment-input" placeholder="Написать комментарий..." onkeydown="if(event.key === 'Enter') addComment(${post.id}, this)">
                    <button class="comment-send" onclick="addComment(${post.id}, this.previousElementSibling)">Отправить</button>
                </div>
            </div>
        `;
        feed.appendChild(div);
    });
}

function toggleLike(postId) {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (!user.username) return;

    const posts = getPosts();
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    if (!post.likedBy) post.likedBy = [];

    const idx = post.likedBy.indexOf(user.username);
    if (idx === -1) {
        post.likedBy.push(user.username);
        post.likes = (post.likes || 0) + 1;
    } else {
        post.likedBy.splice(idx, 1);
        post.likes = Math.max(0, (post.likes || 1) - 1);
    }
    savePosts(posts);
    renderPosts();
    updateStats();
}

function deletePost(postId) {
    if (!confirm('Удалить пост?')) return;
    const posts = getPosts().filter(p => p.id !== postId);
    savePosts(posts);
    renderPosts();
    updateStats();
    showNotification(' Пост удалён');
}

function toggleComments(postId) {
    const section = document.getElementById(`comments-${postId}`);
    if (section) section.classList.toggle('open');
}

function addComment(postId, input) {
    const text = input.value.trim();
    if (!text) return;

    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (!user.username) { showNotification('❌ Настрой профиль'); return; }

    const posts = getPosts();
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    if (!post.comments) post.comments = [];

    post.comments.push({
        username: user.username,
        avatar: user.avatar || 'https://via.placeholder.com/32',
        text: text,
        time: Date.now()
    });
    savePosts(posts);
    renderPosts();
    setTimeout(() => {
        const s = document.getElementById(`comments-${postId}`);
        if (s) s.classList.add('open');
    }, 50);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatTime(timestamp) {
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 60) return 'только что';
    if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`;
    return new Date(timestamp).toLocaleDateString('ru-RU');
}

function updateStats() {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (!user.username) return;
    const posts = getPosts();
    const myPosts = posts.filter(p => p.username === user.username);
    const myLikes = myPosts.reduce((sum, p) => sum + (p.likes || 0), 0);
    const el = (id) => document.getElementById(id);
    if (el('stat-posts')) el('stat-posts').textContent = myPosts.length;
    if (el('stat-likes')) el('stat-likes').textContent = myLikes;
}

function updateCreatePostAvatar() {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const avatar = document.getElementById('create-post-avatar');
    const name = document.getElementById('create-post-name');
    if (avatar && user.avatar) avatar.src = user.avatar;
    if (name && user.username) name.textContent = user.username;
}

// ==================== ЧАТ ====================
const CHAT_ID = 'statusbot';

function getMessages() {
    return JSON.parse(localStorage.getItem(`chat_${CHAT_ID}`) || '[]');
}
function saveMessages(msgs) {
    localStorage.setItem(`chat_${CHAT_ID}`, JSON.stringify(msgs));
}

function renderMessages() {
    const container = document.getElementById('chat-messages');
    if (!container) return;
    const messages = getMessages();
    container.innerHTML = '';

    if (messages.length === 0) {
        const welcome = 'Привет! Я Status Bot \nНапиши /help, чтобы узнать команды.';
        addMessageDOM('bot', welcome);
        saveMessages([{ sender: 'bot', text: welcome, time: Date.now() }]);
        return;
    }
    messages.forEach(msg => addMessageDOM(msg.sender, msg.text));
    container.scrollTop = container.scrollHeight;
}

function addMessageDOM(sender, text) {
    const container = document.getElementById('chat-messages');
    if (!container) return;
    const div = document.createElement('div');
    div.className = `message ${sender}`;
    div.textContent = text;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function addMessage(sender, text) {
    addMessageDOM(sender, text);
    const msgs = getMessages();
    msgs.push({ sender, text, time: Date.now() });
    saveMessages(msgs);
}

function sendMessage() {
    const input = document.getElementById('chat-input');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;
    addMessage('user', text);
    input.value = '';
    setTimeout(() => {
        const reply = getBotReply(text);
        addMessage('bot', reply);
    }, 700);
}

function getBotReply(text) {
    const cmd = text.toLowerCase().trim();
    if (cmd === '/help') return ' Команды:\n/help — список\n/status — статус\n/time — время\n/post — создать пост';
    if (cmd === '/status') return '✅ Все системы работают!';
    if (cmd === '/time') return ` ${new Date().toLocaleTimeString('ru-RU')}`;
    if (cmd === '/post') return ' Напиши пост в форме выше!';
    if (cmd.startsWith('/')) return `❓ Неизвестная команда: ${text}\nНапиши /help`;
    return `🤖 Ты написал: "${text}"`;
}

// ==================== УВЕДОМЛЕНИЯ ====================
function showNotification(text) {
    const notif = document.createElement('div');
    notif.className = 'notification';
    notif.textContent = text;
    document.body.appendChild(notif);
    setTimeout(() => notif.classList.add('show'), 10);
    setTimeout(() => {
        notif.classList.remove('show');
        setTimeout(() => notif.remove(), 300);
    }, 2000);
}

// ==================== ЗАПУСК ====================
document.addEventListener('DOMContentLoaded', () => {
    loadProfile();
    renderMessages();
    checkSetup();
    renderPosts();
    updateStats();
    updateCreatePostAvatar();
});