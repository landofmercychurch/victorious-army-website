// notifications.js
import { API, getAuthHeaders, showNotification } from "./config.js";

export function initNotifications(container = document) {
  const nList = container.querySelector("#notificationsBox");
  
  // -----------------------
  // Load notifications
  // -----------------------
  async function loadNotifications() {
    if (!nList) return;
    nList.innerHTML = "<p>Loading notifications...</p>";

    try {
      const res = await fetch(`${API}/notifications`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load notifications");

      nList.innerHTML = "";
      if (!data.length) {
        nList.innerHTML = "<p>No notifications.</p>";
        return;
      }

      data.forEach((n) => {
        const div = document.createElement("div");
        div.className = "notif";
        div.textContent = `${n.message} • ${new Date(n.created_at).toLocaleString()}`;
        nList.appendChild(div);
      });
    } catch (err) {
      showNotification(err.message);
      nList.innerHTML = `<p style="color:red;">Failed to load notifications</p>`;
    }
  }

  // Auto-load on init
  loadNotifications();

  // Return public method to reload dynamically
  return { loadNotifications };
}