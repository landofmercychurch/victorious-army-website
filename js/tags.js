// tags.js
import { API, getAuthHeaders, showNotification } from "./config.js";

export function initTags(container = document) {
  const tList = container.querySelector("#tagList");
  
  // -----------------------
  // Load all tags
  // -----------------------
  async function loadTags() {
    if (!tList) return;
    tList.innerHTML = "<p>Loading tags...</p>";

    try {
      const res = await fetch(`${API}/tags`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load tags");

      tList.innerHTML = "";
      if (data.length === 0) {
        tList.innerHTML = "<p>No tags available.</p>";
        return;
      }

      data.forEach((t) => {
        const span = document.createElement("span");
        span.className = "chip";
        span.textContent = t.name;
        tList.appendChild(span);
      });
    } catch (err) {
      showNotification(err.message);
      tList.innerHTML = `<p style="color:red;">Failed to load tags</p>`;
    }
  }

  // Auto-load on init
  loadTags();

  // Expose method for reloading dynamically
  return { loadTags };
}