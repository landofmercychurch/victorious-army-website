// sermons.js
import { api } from "./api.js";
import { el, openWhatsAppShare, universalShare, copyToClipboard } from "./utils.js";
import { showNotification } from "./config.js";

export async function initSermons(container) {
  if (!container) return;
  container.innerHTML = "<p>Loading sermons…</p>";
  try {
    const list = await api.get("/sermons");
    container.innerHTML = "";
    if (!list.length) { container.innerHTML = "<p>No sermons yet.</p>"; return; }
    list.forEach(renderSermonCard);
  } catch (err) {
    container.innerHTML = `<p style="color:red">Failed to load sermons</p>`;
    console.error(err);
  }

  function renderSermonCard(s) {
    const card = el("div", "card sermon");
    card.appendChild(el("h4", "", { text: s.title }));
    card.appendChild(el("p", "meta", { text: new Date(s.created_at).toLocaleString() }));
    card.appendChild(el("p", "desc", { text: s.description || "" }));

    // thumbnail: if video_host or thumbnail property exists use it
    if (s.thumbnail_url) {
      const img = el("img", "thumb", { src: s.thumbnail_url, alt: s.title });
      card.appendChild(img);
    }

    const actions = el("div", "actions");
    const watch = el("button", "btn btn-blue", { text: "Watch" });
    watch.onclick = () => openSermonPlayer(s);
    const share = el("button", "btn", { text: "Share" });
    share.onclick = async () => {
      const url = `${location.origin}/sermons/${s.id}`;
      const shared = await universalShare(s.title, url);
      if (!shared) {
        await copyToClipboard(url);
        showNotification("Sermon link copied");
      }
    };
    const wa = el("button", "btn", { text: "WhatsApp" });
    wa.onclick = () => openWhatsAppShare(s.title, `${location.origin}/sermons/${s.id}`);

    actions.append(watch, share, wa);
    card.appendChild(actions);
    container.appendChild(card);
  }

  function openSermonPlayer(s) {
    // open modal or new window with embedded video
    const w = window.open("", "_blank");
    const html = `
      <html><head><title>${s.title}</title></head><body style="margin:0">
      <h1>${s.title}</h1>
      <p>${s.description || ""}</p>
      ${s.video_url ? `<video controls autoplay style="width:100%;max-height:80vh"><source src="${s.video_url}"></video>` : "<p>No video URL</p>"}
      <hr/>
      <div id="comments"></div>
      </body></html>`;
    w.document.write(html);
    w.document.close();

    // fetch comments and append (works after load)
    fetch(`${apiBase()}/sermons/${s.id}/comments`)
      .then(r => r.json())
      .then(data => {
        const commentsDiv = w.document.getElementById("comments");
        if (!data.length) commentsDiv.innerHTML = "<p>No comments yet</p>";
        else data.forEach(c => {
          const d = w.document.createElement("div");
          d.innerHTML = `<strong>${c.name||"Guest"}</strong>: ${c.content}`;
          commentsDiv.appendChild(d);
        });
      })
      .catch(()=>{/* ignore */});
  }

  function apiBase(){ return window.location.origin.replace(location.origin, `${apiBaseUrl()}`) } // fallback if needed
}