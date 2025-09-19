import { API, getAuthHeaders, showNotification } from "./config.js";

export function initPosts(currentUser, loginModal) {
  const feed = document.getElementById("feed");
  const fab = document.getElementById("fab");
  const postModal = document.getElementById("postModal");
  const postAuthor = document.getElementById("postAuthor");
  const postTitle = document.getElementById("postTitle");
  const postContent = document.getElementById("postContent");
  const postSave = document.getElementById("postSave");

  let postImage, editingPost = null;

  if (postModal) {
    postImage = document.createElement("input");
    postImage.type = "file";
    postImage.accept = "image/*";
    const stack = postModal.querySelector(".stack");
    if (stack) stack.appendChild(postImage);
  }

  fab.onclick = () => {
    if (!currentUser.value) return openModal(loginModal);
    editingPost = null;
    postAuthor.value = currentUser.value.username || "";
    postTitle.value = "";
    postContent.value = "";
    if (postImage) postImage.value = "";
    openModal(postModal);
  };

  postSave.onclick = async () => {
    if (!currentUser.value) return openModal(loginModal);
    postSave.disabled = true;
    try {
      const formData = new FormData();
      formData.append("title", postTitle.value.trim());
      formData.append("content", postContent.value.trim());
      if (postImage?.files[0]) formData.append("image", postImage.files[0]);

      const url = `${API}/posts${editingPost ? "/" + editingPost.id : ""}`;
      const res = await fetch(url, {
        method: editingPost ? "PUT" : "POST",
        headers: getAuthHeaders(),
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save post");
      closeModal(postModal);
      loadFeed();
    } catch (err) {
      showNotification(err.message);
    } finally {
      postSave.disabled = false;
    }
  };

  async function loadFeed(tag = "") {
    if (!feed) return;
    try {
      const url = tag
        ? `${API}/posts?tag=${encodeURIComponent(tag.trim())}`
        : `${API}/posts`;
      const res = await fetch(url, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error(await res.text());
      const posts = await res.json();
      feed.innerHTML = "";
      posts.forEach((p) => renderPostCard(p));
    } catch (err) {
      feed.innerHTML = `<p style="color:red;">Failed to load feed: ${err.message}</p>`;
    }
  }

  function renderPostCard(post) {
    if (!feed) return;
    const card = document.createElement("div");
    card.className = "card";

    const meta = document.createElement("div");
    meta.className = "meta";
    const av = document.createElement("div");
    av.className = "avatar";
    av.textContent = initials(post.user.username || "U N");
    const who = document.createElement("div");
    who.textContent = `${post.user.username || "Unknown"} • ${new Date(
      post.created_at
    ).toLocaleString()}`;
    meta.append(av, who);

    const h3 = document.createElement("h3");
    h3.textContent = post.title;
    const preview = document.createElement("div");
    preview.className = "preview";
    preview.textContent =
      post.content.length > 180 ? post.content.slice(0, 180) + "…" : post.content;

    if (post.image_url) {
      const img = document.createElement("img");
      img.src = post.image_url;
      img.style.maxWidth = "100%";
      img.style.borderRadius = "10px";
      card.append(img);
    }

    const actions = document.createElement("div");
    actions.className = "actions";
    const readBtn = document.createElement("button");
    readBtn.className = "chip";
    readBtn.textContent = "📖 Read more";
    readBtn.onclick = () => openReadModal(post);
    actions.append(readBtn);

    card.append(meta, h3, preview, actions);
    feed.append(card);
  }

  return { loadFeed };
}

function openModal(el) { if (el) el.style.display = "flex"; }
function closeModal(el) { if (el) el.style.display = "none"; }
function initials(name) { return (name || "U N").split(" ").map(n => n[0]?.toUpperCase()).join("").slice(0, 2); }