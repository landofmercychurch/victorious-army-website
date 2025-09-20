// posts.js
import {
  API,
  getAuthHeaders,
  showNotification,
  openModal,
  closeModal,
  initials,
} from "./config.js";

export function renderPosts(feedContainer, currentUser, loginModal) {
  if (!feedContainer) return;

  const fab = document.getElementById("fab");
  const postModal = document.getElementById("postModal");
  const postAuthor = document.getElementById("postAuthor");
  const postTitle = document.getElementById("postTitle");
  const postContent = document.getElementById("postContent");
  const postSave = document.getElementById("postSave");

  let postImage;
  let editingPost = null;

  // ✅ File input inside modal
  if (postModal) {
    postImage = document.createElement("input");
    postImage.type = "file";
    postImage.accept = "image/*";
    postImage.className = "post-image-input";
    const stack = postModal.querySelector(".stack");
    if (stack) stack.appendChild(postImage);
  }

  // ✅ Open post modal (create mode)
  if (fab) {
    fab.onclick = () => {
      if (!currentUser.value) return openModal(loginModal);

      editingPost = null;
      postAuthor.value = currentUser.value.username || "";
      postTitle.value = "";
      postContent.value = "";
      if (postImage) postImage.value = "";

      openModal(postModal);
    };
  }

  // ✅ Save post (create or update)
  if (postSave) {
    postSave.onclick = async () => {
      if (!currentUser.value) return openModal(loginModal);

      postSave.disabled = true;
      try {
        const formData = new FormData();
        formData.append("title", postTitle.value.trim());
        formData.append("content", postContent.value.trim());
        if (postImage?.files[0]) {
          formData.append("image", postImage.files[0]);
        }

        const url = editingPost
          ? `${API}/posts/${editingPost.id}`
          : `${API}/posts`;

        const res = await fetch(url, {
          method: editingPost ? "PUT" : "POST",
          headers: getAuthHeaders(),
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to save post");

        closeModal(postModal);
        loadFeed(); // reload after saving
        showNotification(editingPost ? "Post updated" : "Post created");
      } catch (err) {
        showNotification(err.message);
      } finally {
        postSave.disabled = false;
      }
    };
  }

  // ✅ Load posts feed
  async function loadFeed(tag = "") {
    try {
      const url = tag
        ? `${API}/posts?tag=${encodeURIComponent(tag.trim())}`
        : `${API}/posts`;

      const res = await fetch(url, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error(await res.text());

      const posts = await res.json();
      feedContainer.innerHTML = "";

      if (!posts.length) {
        feedContainer.innerHTML =
          "<p>No posts yet. Be the first to share something!</p>";
        return;
      }

      posts.forEach((p) => renderPostCard(p));
    } catch (err) {
      feedContainer.innerHTML = `<p style="color:red;">Failed to load feed: ${err.message}</p>`;
    }
  }

  // ✅ Render one post card
  function renderPostCard(post) {
    const card = document.createElement("div");
    card.className = "card";

    // Meta section
    const meta = document.createElement("div");
    meta.className = "meta";

    const av = document.createElement("div");
    av.className = "avatar";
    av.textContent = initials(post.user?.username || "U N");

    const who = document.createElement("div");
    who.textContent = `${post.user?.username || "Unknown"} • ${new Date(
      post.created_at
    ).toLocaleString()}`;

    meta.append(av, who);

    // Title
    const h3 = document.createElement("h3");
    h3.textContent = post.title;

    // Preview
    const preview = document.createElement("div");
    preview.className = "preview";
    preview.textContent =
      post.content.length > 180
        ? post.content.slice(0, 180) + "…"
        : post.content;

    // Image
    if (post.image_url) {
      const img = document.createElement("img");
      img.src = post.image_url;
      img.alt = post.title;
      img.className = "post-image";
      card.append(img);
    }

    // Actions
    const actions = document.createElement("div");
    actions.className = "actions";

    const readBtn = document.createElement("button");
    readBtn.className = "chip";
    readBtn.textContent = "📖 Read more";
    readBtn.onclick = () => openReadModal(post); // handled in ui.js

    actions.append(readBtn);

    // Assemble
    card.append(meta, h3, preview, actions);
    feedContainer.append(card);
  }

  // Auto-load when mounted
  loadFeed();

  return { loadFeed };
}