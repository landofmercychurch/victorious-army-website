// users.js
import { API, getAuthHeaders, showNotification } from "./config.js";

export function renderUsers(container, currentUser) {
  if (!container) return;

  async function loadProfile() {
    try {
      // ✅ Call backend for current user profile
      const res = await fetch(`${API}/auth/me`, {
        headers: getAuthHeaders(),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load profile");

      container.innerHTML = `
        <div class="profile-card">
          <h3>${data.username}</h3>
          <p>${data.email}</p>
        </div>
      `;

      // ✅ keep in memory
      currentUser.value = data;
    } catch (err) {
      container.innerHTML = `<p style="color:red">${err.message}</p>`;
      showNotification(err.message);
    }
  }

  // Auto-load when mounted
  loadProfile();

  return { loadProfile };
}