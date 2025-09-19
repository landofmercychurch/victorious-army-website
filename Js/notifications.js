import { API, getAuthHeaders } from "./config.js";

export function initNotifications() {
  const nList = document.getElementById("notificationList");

  async function loadNotifications() {
    if (!nList) return;
    try {
      const res = await fetch(`${API}/notifications`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load notifications");
      nList.innerHTML = "";
      data.forEach((n) => {
        const div = document.createElement("div");
        div.className = "notif";
        div.textContent = `${n.message} • ${new Date(n.created_at).toLocaleString()}`;
        nList.appendChild(div);
      });
    } catch (err) {
      nList.innerHTML = `<p style="color:red">${err.message}</p>`;
    }
  }

  loadNotifications();
}