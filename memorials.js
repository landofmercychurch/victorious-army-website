// memorials.js
import { api } from "./api.js";
import { el, openWhatsAppShare, universalShare, copyToClipboard } from "./utils.js";
import { showNotification } from "./config.js";

export async function initMemorials(container) {
  if (!container) return;
  container.innerHTML = "<p>Loading memorial galleries…</p>";
  try {
    const list = await api.get("/memorials"); // expect array of memorial objects {id,title,description,images: [{url,public_id}]}
    container.innerHTML = "";
    if (!list.length) {
      container.innerHTML = "<p>No memorials yet.</p>";
      return;
    }
    list.forEach(renderMemorialCard);
  } catch (err) {
    container.innerHTML = `<p style="color:red">Failed to load memorials</p>`;
    console.error(err);
  }

  function renderMemorialCard(m) {
    const card = el("div", "card memorial");
    card.appendChild(el("h4", "", { text: m.title || "Memorial" }));
    card.appendChild(el("p", "desc", { text: m.description || "" }));

    const gallery = el("div", "memorial-gallery");
    (m.images || []).slice(0, 10).forEach(img => {
      const imgEl = el("img", "thumb", { src: img.url, alt: m.title || "memorial image" });
      imgEl.onclick = () => openLightbox(img.url, m);
      gallery.appendChild(imgEl);
    });
    card.appendChild(gallery);

    const actions = el("div", "actions");
    const shareBtn = el("button", "btn", { text: "Share Memorial" });
    shareBtn.onclick = async () => {
      const url = `${location.origin}/memorials/${m.id}`;
      const shared = await universalShare(m.title || "Memorial", url);
      if (!shared) {
        await copyToClipboard(url);
        showNotification("Memorial link copied to clipboard");
      }
    };
    actions.appendChild(shareBtn);
    card.appendChild(actions);

    container.appendChild(card);
  }

  function openLightbox(url, memorial) {
    // simple lightbox: new window (you can implement modal)
    const w = window.open("", "_blank");
    w.document.write(`<title>${memorial.title || ""}</title><img src="${url}" style="max-width:100%"/>`);
    w.document.close();
  }
}