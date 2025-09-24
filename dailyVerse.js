// js/dailyVerse.js
import { api } from "./api.js";
import { el } from "./utils.js";

export async function initDailyVerse(container) {
  if (!container) return;
  container.innerHTML = "<p>Loading verse…</p>";

  try {
    const verse = await api.get("/daily-verses/latest");
    if (!verse) {
      container.innerHTML = "<p>No verse today yet.</p>";
      return;
    }

    const card = el("div", "verse-card");
    card.appendChild(el("h3", "", { text: verse.reference }));
    card.appendChild(el("p", "verse-text", { text: verse.text }));

    container.innerHTML = "";
    container.appendChild(card);
  } catch (err) {
    container.innerHTML = `<p style="color:red">Failed to load daily verse.</p>`;
    console.error(err);
  }
}
