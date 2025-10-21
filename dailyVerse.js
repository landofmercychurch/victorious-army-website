// dailyVerse.js
import { api } from "./api.js";
import { el } from "./utils.js";

/**
 * Display today's verse on the church homepage
 */
export async function initDailyVerse(container) {
  if (!container) return;

  container.innerHTML = "<p>Loading today’s verse…</p>";

  try {
    const verse = await api.get("/daily-verse");
    container.innerHTML = "";

    if (!verse) {
      container.innerHTML = "<p>No daily verse has been added yet.</p>";
      return;
    }

    const wrapper = el("div", "daily-verse-card");
    const textEl = el("p", "verse-text", { text: `“${verse.text}”` });
    const refEl = el("p", "verse-ref", { text: verse.reference });

    wrapper.appendChild(textEl);
    wrapper.appendChild(refEl);
    container.appendChild(wrapper);
  } catch (err) {
    console.error("❌ Failed to load daily verse:", err);
    container.innerHTML = `<p style="color:red;">Could not load today's verse.</p>`;
  }
}
