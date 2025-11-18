// announcement.js
import { api } from "./api.js";

export async function initAnnouncementPopup() {
  const popup = document.getElementById("announcementPopup");
  const textEl = document.getElementById("announcementText");

  if (!popup || !textEl) return;

  try {
    const announcements = await api.get("/announcements");

    if (!announcements || announcements.length === 0) return;

    // Show only the latest active announcement
    const active = announcements.find(a => a.active === true);

    if (!active) return;

    textEl.textContent = active.message;

    // Show popup
    popup.style.display = "flex";
    popup.classList.add("show");

  } catch (err) {
    console.error("❌ Failed to load announcement:", err);
  }
}