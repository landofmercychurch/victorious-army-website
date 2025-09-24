// js/events.js
import { api } from "./api.js";
import { el, formatDateTime } from "./utils.js";

export async function initEvents(container) {
  if (!container) return;
  container.innerHTML = "<p>Loading events…</p>";

  try {
    const events = await api.get("/events");
    container.innerHTML = "";

    if (!events.length) {
      container.innerHTML = "<p>No upcoming events.</p>";
      return;
    }

    events.forEach(event => {
      const card = el("div", "event-card");

      card.appendChild(el("h3", "", { text: event.title }));
      if (event.description) card.appendChild(el("p", "desc", { text: event.description }));

      const meta = el("p", "meta");
      meta.textContent = `${formatDateTime(event.start_at)} • ${event.location || "TBA"}`;
      card.appendChild(meta);

      container.appendChild(card);
    });
  } catch (err) {
    container.innerHTML = `<p style="color:red">Failed to load events.</p>`;
    console.error(err);
  }
}
