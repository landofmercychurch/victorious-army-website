// src/functions/announcement.js
import { api } from "./api.js";

export async function initAnnouncementPopup() {
  console.log("[ANNOUNCEMENT] Initializing popup...");

  const popup = document.getElementById("announcementPopup");
  const textEl = document.getElementById("announcementText");

  if (!popup || !textEl) {
    console.warn("[ANNOUNCEMENT] Popup element not found in DOM.");
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

    // Set text
    textEl.textContent =
      activeAnnouncement.message ||
      activeAnnouncement.text ||
      "";

    // Show popup
    popup.style.display = "flex";
    setTimeout(() => popup.classList.add("show"), 30);

  } catch (err) {
    console.error("❌ Failed to load announcement:", err);
  }
}

/* ----------------------------------------
   EVENT DELEGATION FOR CLOSE BUTTON
   (Works 100% even if elements load later)
   ---------------------------------------- */
document.addEventListener("click", (e) => {
  const popup = document.getElementById("announcementPopup");
  if (!popup) return;

  // CLOSE WHEN CLICKING THE "X"
  if (e.target.classList.contains("close-btn")) {
    popup.classList.remove("show");
    return setTimeout(() => popup.style.display = "none", 300);
  }

  // CLOSE WHEN CLICKING OUTSIDE THE BOX
  if (e.target === popup) {
    popup.classList.remove("show");
    return setTimeout(() => popup.style.display = "none", 300);
  }
});

// Auto-run
document.addEventListener("DOMContentLoaded", initAnnouncementPopup);
