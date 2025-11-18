// src/functions/announcement.js
import { api } from "./api.js";

/**
 * Initialize the Announcement Popup
 * Automatically shows the latest active announcement
 */
export async function initAnnouncementPopup() {
  const popup = document.getElementById("announcementPopup");
  const textEl = document.getElementById("announcementText");
  const closeBtn = popup?.querySelector(".close-btn");

  if (!popup || !textEl) return;

  try {
    // Fetch all announcements
    const announcements = await api.get("/announcements");

    // Filter active announcements
    const activeAnnouncement = announcements?.find(a => a.active);

    if (!activeAnnouncement) return;

    // Inject announcement message
    textEl.textContent = activeAnnouncement.message || activeAnnouncement.text || "";

    // Show popup
    popup.style.display = "flex";
    setTimeout(() => popup.classList.add("show"), 50); // slight delay for CSS transition

    // Close button
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        popup.classList.remove("show");
        setTimeout(() => popup.style.display = "none", 300); // wait for fade-out
      });
    }

    // Optional: close when clicking outside content
    popup.addEventListener("click", (e) => {
      if (e.target === popup) {
        popup.classList.remove("show");
        setTimeout(() => popup.style.display = "none", 300);
      }
    });

  } catch (err) {
    console.error("❌ Failed to load announcement:", err);
  }
}

// Automatically run on page load
document.addEventListener("DOMContentLoaded", () => {
  initAnnouncementPopup();
});