// events.js
import { api } from "./api.js";
import { el } from "./utils.js";
import { showNotification } from "./config.js";

export async function initEvents(container) {
  if (!container) return;
  container.innerHTML = "<p>Loading events…</p>";
  try {
    const events = await api.get("/events");
    if (!events || events.length === 0) {
      container.innerHTML = "<p>No upcoming events.</p>";
      return;
    }
    container.innerHTML = "";
    events.forEach(renderEvent);
  } catch (err) {
    container.innerHTML = `<p style="color:red">Failed to load events</p>`;
    console.error(err);
  }

  function renderEvent(e) {
    const card = el("div", "card event");
    const dt = new Date(e.start_at);
    card.appendChild(el("h4", "", { text: e.title }));
    card.appendChild(el("div", "meta", { text: `${dt.toLocaleString()} • ${e.location || ""}` }));
    card.appendChild(el("p", "desc", { text: e.description || "" }));
    container.appendChild(card);
  }
}