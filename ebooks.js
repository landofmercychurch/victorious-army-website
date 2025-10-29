import { api } from "./api.js";
import { el } from "./utils.js";

export async function initEbooks(container) {
  if (!container) return;
  container.innerHTML = "<p>Loading ebooks…</p>";

  try {
    const data = await api.get("/ebooks");
    container.innerHTML = "";

    if (!data || Object.keys(data).length === 0) {
      container.innerHTML = "<p>No ebooks available.</p>";
      return;
    }

    // Separate series and standalone books
    const seriesBooks = {};
    const standaloneBooks = [];

    Object.values(data).flat().forEach(book => {
      if (book.series) {
        if (!seriesBooks[book.series]) seriesBooks[book.series] = [];
        seriesBooks[book.series].push(book);
      } else {
        standaloneBooks.push(book);
      }
    });

    const createBookCard = (book) => {
      const card = el("div", "ebook-card");
      const cover = el("div", "ebook-cover");
      cover.style.backgroundImage = `url(${book.cover_url || "https://via.placeholder.com/180x240?text=No+Cover"})`;
      card.appendChild(cover);

      const info = el("div", "ebook-info");
      info.appendChild(el("h4", "ebook-title", { text: book.title }));
      if (book.author) info.appendChild(el("p", "ebook-author", { text: book.author }));
      if (book.series_order) info.appendChild(el("p", "ebook-part", { text: `Part ${book.series_order}` }));
      card.appendChild(info);

      card.onclick = () => openDetailModal(book);
      return card;
    };

    const openDetailModal = (book) => {
      const modal = el("div", "ebook-detail-modal");
      modal.innerHTML = `
        <div class="ebook-detail-content">
          <span class="close-btn">&times;</span>
          <img class="ebook-detail-cover" src="${book.cover_url || "https://via.placeholder.com/180x240?text=No+Cover"}" alt="${book.title}" />
          <h2>${book.title}</h2>
          <p class="ebook-description">${book.description || ""}</p>
          <div class="ebook-detail-btns">
            ${book.pdf_url ? `<a href="${book.pdf_url.replace("/upload/", "/upload/fl_attachment:false/")}" target="_blank" class="read-btn">📖 Read Online</a>` : ""}
            ${book.pdf_url ? `<a href="/api/ebooks/download/${book.id}" class="download-btn">⬇️ Download PDF</a>` : ""}
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      modal.querySelector(".close-btn").onclick = () => modal.remove();
      modal.onclick = e => { if (e.target === modal) modal.remove(); };
    };

    const openGridModal = (books, title = "Books") => {
      const modal = el("div", "ebook-grid-modal");
      const content = el("div", "ebook-grid-content");
      const header = el("h2", "ebook-grid-title", { text: title });
      content.appendChild(header);

      const grid = el("div", "ebook-grid-modal-thumbnails");
      books.forEach(book => {
        const thumb = el("div", "ebook-thumb");
        thumb.style.backgroundImage = `url(${book.cover_url || "https://via.placeholder.com/120x160?text=No+Cover"})`;
        const label = el("span", "ebook-thumb-title", { text: book.title });
        thumb.appendChild(label);
        thumb.onclick = () => openDetailModal(book);
        grid.appendChild(thumb);
      });
      content.appendChild(grid);

      const closeBtn = el("span", "modal-close-btn", { text: "×" });
      closeBtn.onclick = () => modal.remove();
      content.appendChild(closeBtn);

      modal.appendChild(content);
      document.body.appendChild(modal);
    };

    const renderSection = (title, books) => {
      const section = el("div", "ebook-series-section");
      section.appendChild(el("h3", "series-title", { text: title }));

      const grid = el("div", "ebook-grid");
      section.appendChild(grid);

      const VISIBLE_COUNT = 6;
      books.slice(0, VISIBLE_COUNT).forEach(b => grid.appendChild(createBookCard(b)));

      if (books.length > VISIBLE_COUNT) {
        const btn = el("button", "view-all-btn", { text: "View More" });
        btn.onclick = () => openGridModal(books, title);
        section.appendChild(btn);
      }

      container.appendChild(section);
    };

    // Render series
    Object.entries(seriesBooks).forEach(([seriesName, books]) => renderSection(seriesName, books));

    // Render standalone
    if (standaloneBooks.length) renderSection("Standalone Books", standaloneBooks);

    console.log("[INIT] Ebooks loaded successfully.");
  } catch (err) {
    container.innerHTML = `<p style="color:red">Failed to load ebooks</p>`;
    console.error("[INIT ERROR] Ebooks:", err);
  }
}
