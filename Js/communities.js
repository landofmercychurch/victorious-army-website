import { API, getAuthHeaders, showNotification } from "./config.js";

export function initCommunities() {
  const cList = document.getElementById("communityList");

  async function loadCommunities() {
    if (!cList) return;
    try {
      const res = await fetch(`${API}/communities`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load communities");
      cList.innerHTML = "";
      data.forEach((c) => {
        const div = document.createElement("div");
        div.className = "community";
        div.innerHTML = `<h4>${c.name}</h4><p>${c.description}</p>`;
        cList.appendChild(div);
      });
    } catch (err) {
      cList.innerHTML = `<p style="color:red">${err.message}</p>`;
    }
  }

  loadCommunities();
}