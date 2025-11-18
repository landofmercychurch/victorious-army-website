// announcement.js
import { api } from "./api.js";

export async function initAnnouncementPopup() {
  const popup = document.getElementById("announcementPopup");
  const textEl = document.getElementById("announcementText");

  if (!popup || !textEl) return;

  try {
    // Fetch from backend
    const announcements = await api.get("/announcements");

    // If no announcement exists → do nothing
    if (!announcements || announcements.length === 0) return;

    // Only show the latest announcement marked as active
    const active = announcements.find(a => a.active === true);

    if (!active) return;

    // Inject message into popup
    textEl.textContent = active.message;

    // Show popup automatically
    popup.style.display = "flex";
    popup.classList.add("show");

  } catch (err) {
    console.error("❌ Failed to load announcement:", err);
  }
}