import { API, getAuthHeaders, showNotification } from "./config.js";

export function initFollows() {
  const followBtns = document.querySelectorAll(".follow-btn");

  followBtns.forEach((btn) => {
    btn.onclick = async () => {
      try {
        const res = await fetch(`${API}/follows`, {
          method: "POST",
          headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify({ target_id: btn.dataset.id }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to follow");
        showNotification("Followed successfully");
      } catch (err) {
        showNotification(err.message);
      }
    };
  });
}