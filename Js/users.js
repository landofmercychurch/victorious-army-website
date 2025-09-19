import { API, getAuthHeaders } from "./config.js";

export function initUsers() {
  const profile = document.getElementById("profile");

  async function loadProfile() {
    if (!profile) return;
    try {
      const res = await fetch(`${API}/users/me`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load profile");
      profile.innerHTML = `<h3>${data.username}</h3><p>${data.email}</p>`;
    } catch (err) {
      profile.innerHTML = `<p style="color:red">${err.message}</p>`;
    }
  }

  loadProfile();
}