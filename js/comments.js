// comments.js
import { API, getAuthHeaders, showNotification, openModal } from "./config.js";

export function initComments(currentUser, loginModal) {
  const readModal = document.getElementById("readModal");
  const readTitle = document.getElementById("readTitle");
  const readContent = document.getElementById("readContent");
  const commentBox = document.getElementById("commentBox");
  const commentList = document.getElementById("commentList");

  // -----------------------
  // Load comments for a post
  // -----------------------
  async function loadComments(postId) {
    if (!commentList) return;
    commentList.innerHTML = "<p>Loading comments...</p>";

    try {
      const res = await fetch(`${API}/comments/post/${postId}`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load comments");

      commentList.innerHTML = "";
      if (data.length === 0) {
        commentList.innerHTML = "<p>No comments yet — be the first!</p>";
        return;
      }

      data.forEach((c) => {
        const div = document.createElement("div");
        div.className = "comment";
        div.innerHTML = `<strong>${c.user?.username || "Anon"}</strong>: ${c.content}`;
        commentList.appendChild(div);

        // Optional: delete button if current user owns comment
        if (currentUser.value?.id === c.user_id) {
          const delBtn = document.createElement("button");
          delBtn.textContent = "Delete";
          delBtn.className = "btn btn-ghost";
          delBtn.style.marginTop = "0.4rem";
          delBtn.onclick = async () => {
            try {
              const res = await fetch(`${API}/comments/${c.id}`, {
                method: "DELETE",
                headers: getAuthHeaders(),
              });
              if (!res.ok) throw new Error("Failed to delete comment");
              showNotification("Comment deleted");
              loadComments(postId);
            } catch (err) {
              showNotification(err.message);
            }
          };
          div.appendChild(delBtn);
        }
      });
    } catch (err) {
      commentList.innerHTML = `<p style="color:red">${err.message}</p>`;
    }
  }

  // -----------------------
  // Open post modal
  // -----------------------
  function openReadModal(post) {
    if (!readModal) return;
    readTitle.textContent = post.title;
    readContent.textContent = post.content;
    readModal.style.display = "flex";
    if (commentBox) commentBox.dataset.postId = post.id;
    loadComments(post.id);
  }

  // -----------------------
  // Submit comment
  // -----------------------
  if (commentBox) {
    commentBox.onsubmit = async (e) => {
      e.preventDefault();
      if (!currentUser.value) return openModal(loginModal);

      const content = commentBox.comment.value.trim();
      if (!content) return showNotification("Enter a comment");

      try {
        const res = await fetch(`${API}/comments`, {
          method: "POST",
          headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify({
            post_id: commentBox.dataset.postId,
            content,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to add comment");

        showNotification("Comment added 🎉");
        commentBox.comment.value = "";
        loadComments(commentBox.dataset.postId);
      } catch (err) {
        showNotification(err.message);
      }
    };
  }

  return { openReadModal, loadComments };
}