import { API } from "./config.js";

export function initTags() {
  const tList = document.getElementById("tagList");

  async function loadTags() {
    if (!tList) return;
    try {
      const res = await fetch(`${API}/tags`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load tags");
      tList.innerHTML = "";
      data.forEach((t) => {
        const span = document.createElement("span");
        span.className = "chip";
        span.textContent = t.name;
        tList.appendChild(span);
      });
    } catch (err) {
      tList.innerHTML = `<p style="color:red">${err.message}</p>`;
    }
  }

  loadTags();
}