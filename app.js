// ============================
// Insight Hub Full Frontend JS (Clean & Safe, API /api)
// ============================

document.addEventListener('DOMContentLoaded', () => {
    // ==== Global Variables ====
    const API = 'https://insight-backend-gubm.onrender.com/api'; // updated to match backend
    let currentUser = null;
    let editingPost = null;
    let openReadPost = null;
    let openQuestion = null;

    // ==== DOM Elements ====
    const feed = document.getElementById('feed');
    const questionsFeed = document.getElementById('questionsFeed');
    const communitiesFeed = document.getElementById('communitiesFeed');
    const tagsFeed = document.getElementById('tagsFeed');
    const notif = document.getElementById('notification');
    const notifText = document.getElementById('notifText');

    // Auth
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const loginModal = document.getElementById('loginModal');
    const authUsername = document.getElementById('authUsername');
    const authFullname = document.getElementById('authFullname');
    const authEmail = document.getElementById('authEmail');
    const authPassword = document.getElementById('authPassword');
    const loginSubmit = document.getElementById('loginSubmit');
    const signupSubmit = document.getElementById('signupSubmit');
    const commentFormWrap = document.getElementById('commentFormWrap');
    const commentHint = document.getElementById('commentHint');

    // Posts
    const fab = document.getElementById('fab');
    const postModal = document.getElementById('postModal');
    const postAuthor = document.getElementById('postAuthor');
    const postTitle = document.getElementById('postTitle');
    const postContent = document.getElementById('postContent');
    const postSave = document.getElementById('postSave');
    let postImage;
    if (postModal) {
        postImage = document.createElement('input');
        postImage.type = 'file';
        postImage.accept = 'image/*';
        const stack = postModal.querySelector('.stack');
        if (stack) stack.appendChild(postImage);
    }

    // Read modal
    const readModal = document.getElementById('readModal');
    const readTitle = document.getElementById('readTitle');
    const readMeta = document.getElementById('readMeta');
    const readBody = document.getElementById('readBody');
    const commentsBox = document.getElementById('commentsBox');
    const commentText = document.getElementById('commentText');
    const commentPost = document.getElementById('commentPost');

    // Questions modal
    const questionModal = document.getElementById('questionModal');
    const questionTitle = document.getElementById('questionTitle');
    const questionMeta = document.getElementById('questionMeta');
    const questionBody = document.getElementById('questionBody');
    const answersBox = document.getElementById('answersBox');
    const answerText = document.getElementById('answerText');
    const answerPost = document.getElementById('answerPost');
    const answerFormWrap = document.getElementById('answerFormWrap');
    const answerHint = document.getElementById('answerHint');

    // Communities modal
    const communityModal = document.getElementById('communityModal');
    const communityName = document.getElementById('communityName');
    const communityDesc = document.getElementById('communityDesc');
    const communitySave = document.getElementById('communitySave');

    // Notifications modal
    const notifModal = document.getElementById('notifModal');
    const notificationsBox = document.getElementById('notificationsBox');

    // ==== Utility Functions ====
    const getAuthHeaders = () => {
        const token = localStorage.getItem('jwt');
        return token ? { Authorization: `Bearer ${token}` } : {};
    };
    const initials = name => (name || 'U N').split(' ').map(n => n[0]?.toUpperCase()).join('').slice(0, 2);
    const openModal = el => el && (el.style.display = 'flex');
    const closeModal = el => el && (el.style.display = 'none');
    const showNotification = msg => {
        if (!notif || !notifText) return;
        notifText.textContent = msg;
        notif.style.display = 'flex';
        setTimeout(() => { notif.style.display = 'none'; }, 4000);
    };

    // Close modals
    document.querySelectorAll('.close').forEach(x =>
        x.addEventListener('click', () => {
            const target = document.querySelector(x.dataset.close);
            if (target) closeModal(target);
        })
    );

    document.querySelectorAll('.modal').forEach(m =>
        m.addEventListener('click', e => { if (e.target === m) closeModal(m); })
    );

    document.getElementById('notifClose')?.addEventListener('click', () => { if (notif) notif.style.display = 'none'; });

    // ==== Auth Functions ====
    async function login(email, password) {
        try {
            loginSubmit.disabled = true;
            const res = await fetch(`${API}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Login failed');
            localStorage.setItem('jwt', data.token);
            currentUser = data.user;
            loginBtn.style.display = 'none';
            logoutBtn.style.display = 'inline-block';
            closeModal(loginModal);
            loadAll();
        } catch (err) {
            showNotification(err.message);
        } finally { loginSubmit.disabled = false; }
    }

    async function signup() {
        try {
            signupSubmit.disabled = true;
            const payload = {
                username: authUsername.value.trim(),
                full_name: authFullname.value.trim(),
                email: authEmail.value.trim(),
                password: authPassword.value.trim()
            };
            const res = await fetch(`${API}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Signup failed');
            await login(payload.email, payload.password);
        } catch (err) { showNotification(err.message); }
        finally { signupSubmit.disabled = false; }
    }

    loginBtn.onclick = () => openModal(loginModal);
    logoutBtn.onclick = () => {
        localStorage.removeItem('jwt');
        currentUser = null;
        loginBtn.style.display = 'inline-block';
        logoutBtn.style.display = 'none';
        if (commentFormWrap) commentFormWrap.style.display = 'none';
        if (commentHint) commentHint.style.display = 'block';
    };
    loginSubmit.onclick = () => login(authEmail.value, authPassword.value);
    signupSubmit.onclick = () => signup();

    // ============================
    // Posts
    // ============================
    fab.onclick = () => {
        if (!currentUser) return openModal(loginModal);
        editingPost = null;
        postAuthor.value = currentUser.username || '';
        postTitle.value = '';
        postContent.value = '';
        if (postImage) postImage.value = '';
        openModal(postModal);
    };

    postSave.onclick = async () => {
        if (!currentUser) return openModal(loginModal);
        postSave.disabled = true;
        try {
            const formData = new FormData();
            formData.append('title', postTitle.value.trim());
            formData.append('content', postContent.value.trim());
            if (postImage?.files[0]) formData.append('image', postImage.files[0]);
            const url = `${API}/posts${editingPost ? '/' + editingPost.id : ''}`;
            const res = await fetch(url, {
                method: editingPost ? 'PUT' : 'POST',
                headers: getAuthHeaders(), // FormData handles content-type
                body: formData
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to save post');
            closeModal(postModal);
            loadFeed();
        } catch (err) { showNotification(err.message); }
        finally { postSave.disabled = false; }
    };

    async function loadFeed(tag = '') {
        if (!feed) return;
        try {
            const url = tag ? `${API}/posts?tag=${encodeURIComponent(tag.trim())}` : `${API}/posts`;
            const res = await fetch(url, { headers: getAuthHeaders() });
            if (!res.ok) throw new Error(await res.text());
            const posts = await res.json();
            feed.innerHTML = '';
            posts.forEach(p => renderPostCard(p));
        } catch (err) { feed.innerHTML = `<p style="color:red;">Failed to load feed: ${err.message}</p>`; }
    }

    function renderPostCard(post) {
        if (!feed) return;
        const card = document.createElement('div'); card.className = 'card';
        const meta = document.createElement('div'); meta.className = 'meta';
        const av = document.createElement('div'); av.className = 'avatar'; av.textContent = initials(post.user.username || 'U N');
        const who = document.createElement('div'); who.textContent = `${post.user.username || 'Unknown'} • ${new Date(post.created_at).toLocaleString()}`;
        meta.append(av, who);

        const h3 = document.createElement('h3'); h3.textContent = post.title;
        const preview = document.createElement('div'); preview.className = 'preview'; preview.textContent = post.content.length > 180 ? post.content.slice(0, 180) + '…' : post.content;

        if (post.image_url) {
            const img = document.createElement('img'); img.src = post.image_url;
            img.style.maxWidth = '100%';
            img.style.borderRadius = '10px';
            card.append(img);
        }

        const actions = document.createElement('div'); actions.className = 'actions';
        const readBtn = document.createElement('button'); readBtn.className = 'chip'; readBtn.textContent = '📖 Read more'; readBtn.onclick = () => openReadModal(post);
        const likeBtn = document.createElement('button'); likeBtn.className = 'chip'; likeBtn.textContent = '❤️ Like'; likeBtn.onclick = () => likePost(post.id);

        actions.append(readBtn, likeBtn);

        const ownerWrap = document.createElement('span'); ownerWrap.className = 'owner-actions';
        if (currentUser && currentUser.id === post.user_id) {
            const editBtn = document.createElement('button'); editBtn.className = 'chip'; editBtn.textContent = '✏️ Edit';
            editBtn.onclick = () => {
                editingPost = post;
                postAuthor.value = post.user.username;
                postTitle.value = post.title;
                postContent.value = post.content;
                openModal(postModal);
            };
            const delBtn = document.createElement('button'); delBtn.className = 'chip'; delBtn.textContent = '🗑️ Delete';
            delBtn.onclick = async () => {
                if (confirm('Delete this post?')) {
                    await fetch(`${API}/posts/${post.id}`, { method: 'DELETE', headers: getAuthHeaders() });
                    loadFeed();
                }
            };
            ownerWrap.append(editBtn, delBtn);
        }
        actions.append(ownerWrap);
        card.append(meta, h3, preview, actions);
        feed.append(card);
    }

    // ============================
    // Comments / Read Modal
    // ============================
    async function openReadModal(post) {
        if (!readTitle || !readMeta || !readBody || !commentsBox) return;
        openReadPost = post;
        readTitle.textContent = post.title;
        readMeta.textContent = `${post.user.username || 'Unknown'} • ${new Date(post.created_at).toLocaleString()}`;
        readBody.textContent = post.content;
        commentsBox.innerHTML = '';
        if (commentFormWrap && commentHint) {
            commentFormWrap.style.display = currentUser ? 'flex' : 'none';
            commentHint.style.display = currentUser ? 'none' : 'block';
        }

        try {
            const res = await fetch(`${API}/comments/post/${post.id}`, { headers: getAuthHeaders() });
            if (!res.ok) throw new Error(await res.text());
            const comments = await res.json();
            if (comments.length === 0) {
                const empty = document.createElement('div'); empty.className = 'empty'; empty.textContent = 'No comments yet — be the first!';
                commentsBox.append(empty);
            } else comments.forEach(c => renderComment(c));
        } catch (err) { console.error(err); }

        commentPost.onclick = async () => {
            if (!currentUser) return openModal(loginModal);
            const content = commentText.value.trim();
            if (!content) return alert('Enter comment');
            try {
                const payload = { post_id: post.id, content };
                const res = await fetch(`${API}/comments`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, body: JSON.stringify(payload) });
                if (!res.ok) throw new Error(await res.text());
                commentText.value = '';
                openReadModal(post); // refresh comments
            } catch (err) { showNotification(err.message); }
        };

        openModal(readModal);
    }

    function renderComment(comment) {
        if (!commentsBox) return;
        const row = document.createElement('div'); row.className = 'comment';
        const who = document.createElement('div'); who.className = 'who'; who.textContent = comment.user.username || 'Anonymous';
        const text = document.createElement('div'); text.textContent = comment.content;
        row.append(who, text);

        if (currentUser && currentUser.id === comment.user_id) {
            const del = document.createElement('button'); del.className = 'btn btn-ghost'; del.style.marginTop = '.4rem'; del.textContent = 'Delete';
            del.onclick = async () => {
                await fetch(`${API}/comments/${comment.id}`, { method: 'DELETE', headers: getAuthHeaders() });
                openReadModal(openReadPost);
            };
            row.append(del);
        }

        commentsBox.append(row);
    }

    // ============================
    // Initial Load
    // ============================
    function loadAll() {
        loadFeed();
        // other loaders like loadQuestionsFeed, loadCommunitiesFeed, loadTagsFeed, loadNotifications
    }

    if (localStorage.getItem('jwt')) loadAll();
});
