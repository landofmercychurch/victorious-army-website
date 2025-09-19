// follows.js
import { API, getAuthHeaders, showNotification } from "./config.js";

export function initFollows(container = document) {
  // Attach follow handlers to all buttons within a container
  async function attachFollowHandlers() {
    const followBtns = container.querySelectorAll(".follow-btn");
    followBtns.forEach((btn) => {
      btn.onclick = async () => {
        try {
          const targetId = btn.dataset.id;
          if (!targetId) return;

          const res = await fetch(`${API}/follows`, {
            method: "POST",
            headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
            body: JSON.stringify({ target_id: targetId }),
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Failed to follow");

          showNotification("Followed successfully");

          // Optional: toggle button text
          btn.textContent = btn.textContent === "Follow" ? "Following" : "Follow";
        } catch (err) {
          showNotification(err.message);
        }
      };
    });
  }

  // Auto-attach on init
  attachFollowHandlers();

  // Return a public method in case dynamic content needs re-binding
  return { attachFollowHandlers };
}