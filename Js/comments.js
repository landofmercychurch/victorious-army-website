import { API, getAuthHeaders, showNotification, initials, openModal, closeModal } from "./config.js";

export function initComments(currentUser, loginModal) {
  const readModal = document.getElementById("readModal");
  const readTitle = document.getElementById("readTitle");
  const readContent = document.getElementById("readContent");
  const commentBox = document.getElementById("commentBox");
  const commentList = document.getElementById("commentList");

  async function openReadModal(post) {
    if (!readModal) return;
    readTitle.textContent = post.title;
    readContent.textContent = post.content;
    readModal.style.display = "flex";
    loadComments("post", post.id);
  }

  async function loadComments(type, id) {
    if (!commentList) return;
    commentList.innerHTML = "<p>Loading...</p>";
    try {
      const res = await fetch(`${API}/comments/${type}/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load comments");
      commentList.innerHTML = "";
      data.forEach((c) => {
        const div = document.createElement("div");
        div.className = "comment";
        div.innerHTML = `<strong>${c.users?.username || "Anon"}</strong>: ${c.content}`;
        commentList.appendChild(div);
      });
    } catch (err) {
      commentList.innerHTML = `<p style="color:red">${err.message}</p>`;
    }
  }

  if (commentBox) {
    commentBox.onsubmit = async (e) => {
      e.preventDefault();
      if (!currentUser.value) return openModal(loginModal);
      try {
        const res = await fetch(`${API}/comments`, {
          method: "POST",
          headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify({
            post_id: commentBox.dataset.postId,
            content: commentBox.comment.value,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to add comment");
        showNotification("Comment added");
        commentBox.comment.value = "";
        loadComments("post", commentBox.dataset.postId);
      } catch (err) {
        showNotification(err.message);
      }
    };
  }

  return { openReadModal };
}