// ebooks.js
import { api } from "./api.js";
import { el } from "./utils.js";


export async function initEbooks(container) {
  if (!container) return;
  container.innerHTML = "<p>Loading ebooks…</p>";
  try {
    const list = await api.get("/ebooks");
    container.innerHTML = "";
    if (!list.length) { container.innerHTML = "<p>No ebooks available.</p>"; return; }
    const grid = el("div", "ebook-grid");
    list.forEach(b => {
      const itm = el("div", "ebook-card");
      itm.appendChild(el("h4", "", { text: b.title }));
      itm.appendChild(el("p", "meta", { text: b.author || "" }));
      const link = el("a", "btn btn-ghost", { text: "Open PDF", href: b.pdf_url || "#", target: "_blank" });
      itm.appendChild(link);
      grid.appendChild(itm);
    });
    container.appendChild(grid);
  } catch (err) {
    container.innerHTML = `<p style="color:red">Failed to load ebooks</p>`;
    console.error(err);
  }
}
