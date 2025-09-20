// likes.js
import { API, getAuthHeaders, showNotification } from "./config.js";

export function initLikes(container = document) {
  // Attach like handlers to all buttons in container
  async function attachLikeHandlers() {
    const likeBtns = container.querySelectorAll(".like-btn");

    likeBtns.forEach((btn) => {
      btn.onclick = async () => {
        try {
          const postId = btn.dataset.id;
          if (!postId) return;

          const res = await fetch(`${API}/likes`, {
            method: "POST",
            headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
            body: JSON.stringify({ post_id: postId }),
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Failed to like");

          showNotification("Liked!");
          // Optional: toggle like button state
          btn.textContent = btn.textContent === "❤️ Like" ? "💔 Unlike" : "❤️ Like";
        } catch (err) {
          showNotification(err.message);
        }
      };
    });
  }

  // Auto-attach when module initialized
  attachLikeHandlers();

  // Public method to re-bind after dynamic DOM updates
  return { attachLikeHandlers };
}