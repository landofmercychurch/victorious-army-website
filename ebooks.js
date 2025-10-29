import { api } from "./api.js";
import { el } from "./utils.js";

export async function initEbooks(container) {
  if (!container) return;
  container.innerHTML = "<p>Loading ebooks…</p>";

  try {
    // Fetch grouped books from backend
    const groupedBooks = await api.get("/ebooks");
    container.innerHTML = "";

    if (!groupedBooks || Object.keys(groupedBooks).length === 0) {
      container.innerHTML = "<p>No ebooks available.</p>";
      return;
    }

    // Create a single modals container
    const modalsContainer = el("div", "ebook-modals-container");
    document.body.appendChild(modalsContainer);

    // -------------------------------
    // BOOK CARD CREATION
    // -------------------------------
    const createBookCard = (book) => {
      const card = el("div", "ebook-card");

      // Cover
      const cover = el("div", "ebook-cover");
      cover.style.backgroundImage = `url(${book.cover_url || "https://via.placeholder.com/180x240?text=No+Cover"})`;
      card.appendChild(cover);

      // Info
      const info = el("div", "ebook-info");
      info.appendChild(el("h4", "ebook-title", { text: book.title }));
      if (book.series_order) info.appendChild(el("p", "ebook-part", { text: `Part ${book.series_order}` }));
      card.appendChild(info);

      // Click opens detail modal
      card.onclick = () => openDetailModal(book);
      return card;
    };

    // -------------------------------
    // DETAIL MODAL
    // -------------------------------
    const openDetailModal = (book) => {
      const modal = el("div", "ebook-detail-modal");
      modal.innerHTML = `
        <div class="ebook-detail-content">
          <span class="close-btn">&times;</span>
          <img class="ebook-detail-cover" src="${book.cover_url || "https://via.placeholder.com/180x240?text=No+Cover"}" alt="${book.title}" />
          <h2>${book.title}</h2>
          ${book.author ? `<p class="ebook-author"><strong>Author:</strong> ${book.author}</p>` : ""}
          ${book.description ? `<p class="ebook-description">${book.description}</p>` : ""}
          <div class="ebook-detail-btns">
            ${book.pdf_url ? `<a href="${book.pdf_url.replace("/upload/", "/upload/fl_attachment:false/")}" target="_blank" class="read-btn">📖 Read Online</a>` : ""}
            <!-- ${book.pdf_url ? `<a href="/api/ebooks/download/${book.id}" class="download-btn">⬇️ Download PDF</a>` : ""} -->
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      modal.querySelector(".close-btn").onclick = () => modal.remove();
      modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    };

    // -------------------------------
    // GRID MODAL FOR VIEW MORE
    // -------------------------------
    const openGridModal = (books, title = "Books") => {
      const modal = el("div", "ebook-grid-modal");
      const content = el("div", "ebook-grid-content");
      content.appendChild(el("h2", "ebook-grid-title", { text: title }));

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

    // -------------------------------
    // RENDER SECTION PREVIEW (HOMEPAGE)
    // -------------------------------
    const renderSectionPreview = (title, books) => {
      const section = el("div", "ebook-section-preview");
      section.appendChild(el("h3", "section-title", { text: title }));

      // Horizontal scroll grid (mobile-friendly)
      const grid = el("div", "ebook-preview-grid");
      books.slice(0, 4).forEach(book => grid.appendChild(createBookCard(book)));
      section.appendChild(grid);

      if (books.length > 4) {
        const btn = el("button", "view-all-btn", { text: "View More" });
        btn.onclick = () => openGridModal(books, title);
        section.appendChild(btn);
      }

      container.appendChild(section);
    };

    // -------------------------------
    // RENDER ALL SERIES
    // -------------------------------
    for (const [seriesName, books] of Object.entries(groupedBooks)) {
      renderSectionPreview(seriesName, books);
    }

    console.log("[INIT] Ebooks loaded:", Object.keys(groupedBooks).length, "series/groups");

  } catch (err) {
    container.innerHTML = `<p style="color:red">Failed to load ebooks</p>`;
    console.error("[INIT ERROR] Ebooks:", err);
  }
}
