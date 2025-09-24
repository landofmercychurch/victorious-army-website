// dailyVerse.js
import { api } from "./api.js";
import { el, openWhatsAppShare, universalShare, copyToClipboard } from "./utils.js";
import { showNotification } from "./config.js";

export async function initDailyVerse(container) {
  if (!container) return;
  container.innerHTML = "<p>Loading daily verse…</p>";

  try {
    const verse = await api.get("/daily-verse"); // expects latest verse object
    render(verse);
  } catch (err) {
    container.innerHTML = `<p style="color:red">Failed to load daily verse</p>`;
    console.error(err);
  }

  function render(v) {
    container.innerHTML = "";
    const wrap = el("div", "daily-verse");
    wrap.appendChild(el("h3", "", { text: v.reference || "Verse of the Day" }));
    wrap.appendChild(el("p", "verse-text", { text: v.text || "" }));

    const actions = el("div", "actions");
    const shareBtn = el("button", "btn", { text: "Share" });
    shareBtn.onclick = async () => {
      const slugUrl = `${location.origin}/verse/${v.id || ""}`; // you can create a static per-verse page if desired
      const shared = await universalShare(`${v.reference}\n${v.text}`, slugUrl);
      if (!shared) {
        await copyToClipboard(slugUrl);
        showNotification("Verse link copied to clipboard");
      }
    };
    const waBtn = el("button", "btn", { text: "Share via WhatsApp" });
    waBtn.onclick = () => openWhatsAppShare(`${v.reference}\n${v.text}`, `${location.origin}/verse/${v.id || ""}`);

    actions.append(shareBtn, waBtn);
    wrap.appendChild(actions);
    container.appendChild(wrap);
  }
}