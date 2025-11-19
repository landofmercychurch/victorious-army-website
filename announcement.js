// announcement.js
import { api } from "./api.js";

export async function initAnnouncementPopup() {
  console.log("[ANNOUNCEMENT] Initializing popup...");

  const popup = document.getElementById("announcementPopup");
  const titleEl = document.getElementById("announcementTitle");
  const textEl = document.getElementById("announcementText");

  if (!popup || !titleEl || !textEl) {
    console.warn("[ANNOUNCEMENT] Popup elements not found in DOM.");
    return;
  }

  try {
    const announcements = await api.get("/announcements");
    console.log("[ANNOUNCEMENT] Fetched:", announcements);

    const activeAnnouncement = announcements?.find(a => a.active);

    if (!activeAnnouncement) {
      console.log("[ANNOUNCEMENT] No active announcement.");
      return;
    }

    // Set title and message
    titleEl.textContent = activeAnnouncement.title || "";
    textEl.textContent = activeAnnouncement.message || "";

    // Show popup
    popup.style.display = "flex";
    setTimeout(() => popup.classList.add("show"), 30);

  } catch (err) {
    console.error("❌ Failed to load announcement:", err);
  }
}

/* ----------------------------------------
   EVENT DELEGATION FOR CLOSE BUTTON
---------------------------------------- */
document.addEventListener("click", (e) => {
  const popup = document.getElementById("announcementPopup");
  if (!popup) return;

  if (e.target.classList.contains("close-btn") || e.target === popup) {
    popup.classList.remove("show");
    setTimeout(() => (popup.style.display = "none"), 300);
  }
});

// Auto-run
document.addEventListener("DOMContentLoaded", initAnnouncementPopup);
