// picturePosts.js
import { api } from "./api.js";
import { el, openWhatsAppShare, universalShare, copyToClipboard } from "./utils.js";
import { showNotification } from "./config.js";

export async function initPicturePosts(container) {
  if (!container) return;
  container.innerHTML = "<p>Loading posts…</p>";
  try {
    const posts = await api.get("/picture-posts"); // backend should expose this
    container.innerHTML = "";
    if (!posts.length) { container.innerHTML = "<p>No picture posts yet.</p>"; return; }
    posts.forEach(render);
  } catch (err) {
    container.innerHTML = `<p style="color:red">Failed to load picture posts</p>`;
    console.error(err);
  }

  function render(p) {
    const card = el("div", "card picture-post");
    if (p.image_url) card.appendChild(el("img", "post-image", { src: p.image_url, alt: p.caption || "" }));
    card.appendChild(el("p", "caption", { text: p.caption || "" }));
    const actions = el("div", "actions");
    const share = el("button", "btn", { text: "Share" });
    share.onclick = async () => {
      const url = `${location.origin}/picture-posts/${p.id}`;
      const shared = await universalShare(p.caption || "", url);
      if (!shared) { await copyToClipboard(url); showNotification("Link copied"); }
    };
    const wa = el("button", "btn", { text: "WhatsApp" });
    wa.onclick = () => openWhatsAppShare(p.caption || "", `${location.origin}/picture-posts/${p.id}`);
    actions.append(share, wa);
    card.appendChild(actions);
    container.appendChild(card);
  }
}