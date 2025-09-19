import { API, getAuthHeaders, showNotification } from "./config.js";

export function initLikes() {
  const likeBtns = document.querySelectorAll(".like-btn");

  likeBtns.forEach((btn) => {
    btn.onclick = async () => {
      try {
        const res = await fetch(`${API}/likes`, {
          method: "POST",
          headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify({ post_id: btn.dataset.id }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to like");
        showNotification("Liked!");
      } catch (err) {
        showNotification(err.message);
      }
    };
  });
}