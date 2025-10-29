// src/ebooks.js
import { api } from "./api.js";
import { el } from "./utils.js";

function lockBodyScroll(lock = true) {
  document.body.style.overflow = lock ? "hidden" : "";
}

export async function initEbooks(container) {
  if (!container) return;
  container.innerHTML = "<p>Loading ebooks…</p>";

  try {
    const groupedBooks = await api.get("/ebooks");
    container.innerHTML = "";

    if (!groupedBooks || Object.keys(groupedBooks).length === 0) {
      container.innerHTML = "<p>No ebooks available.</p>";
      return;
    }

    container.classList.add("ebook-feed");

    // -------------------------------
    // CREATE EBOOK CARD
    // -------------------------------
    function createBookCard(book) {
      const card = el("div", "ebook-card");
      const cover = el("div", "ebook-cover");
      cover.style.backgroundImage = `url(${book.cover_url || "https://via.placeholder.com/180x240?text=No+Cover"})`;
      card.appendChild(cover);

      const info = el("div", "ebook-info");
      info.appendChild(el("h4", "ebook-title", { text: book.title }));
      if (book.series_order) info.appendChild(el("p", "ebook-part", { text: `Part ${book.series_order}` }));
      card.appendChild(info);

      card.onclick = () => openDetailModal(book);
      return card;
    }

    // -------------------------------
    // DETAIL MODAL
    // -------------------------------
    function openDetailModal(book) {
      const modal = el("div", "post-modal-overlay");
      const content = el("div", "post-modal-content");
      content.innerHTML = `
        <button class="post-modal-close">&times;</button>
        <div class="post-modal-body">
          <img class="modal-image" src="${book.cover_url || "https://via.placeholder.com/180x240?text=No+Cover"}" alt="${book.title}" />
          <h3 class="modal-title">${book.title}</h3>
          ${book.author ? `<p class="modal-desc"><strong>Author:</strong> ${book.author}</p>` : ""}
          ${book.description ? `<p class="modal-desc">${book.description}</p>` : ""}
          <div class="modal-actions">
            ${book.pdf_url ? `<a href="${book.pdf_url.replace("/upload/", "/upload/fl_attachment:false/")}" target="_blank" class="read-btn">📖 Read Online</a>` : ""}
            ${book.pdf_url ? `<a href="${book.pdf_url}" download class="download-btn">⬇️ Download PDF</a>` : ""}
          </div>
        </div>
      `;
      modal.appendChild(content);
      document.body.appendChild(modal);
      lockBodyScroll(true);

      // Close handlers
      content.querySelector(".post-modal-close").onclick = () => {
        modal.remove();
        lockBodyScroll(false);
      };
      modal.onclick = (e) => { if (e.target === modal) { modal.remove(); lockBodyScroll(false); } };
    }

    // -------------------------------
    // GALLERY MODAL
    // -------------------------------
    function openGalleryModal(books, title) {
      const modal = el("div", "gallery-modal show");
      const backdrop = el("div", "gallery-backdrop");
      const inner = el("div", "gallery-inner");
      const closeBtn = el("button", "gallery-close", { text: "×" });
      inner.appendChild(el("h2", "gallery-title", { text: title }));

      const grid = el("div", "gallery-grid");
      books.forEach(book => {
        const item = el("div", "gallery-item");
        const thumb = el("img", "gallery-thumb");
        thumb.src = book.cover_url || "https://via.placeholder.com/120x160?text=No+Cover";
        const label = el("span", "gallery-label", { text: book.title });
        item.appendChild(thumb);
        item.appendChild(label);
        item.onclick = () => {
          modal.remove();
          openDetailModal(book);
        };
        grid.appendChild(item);
      });

      inner.appendChild(grid);
      inner.appendChild(closeBtn);
      modal.appendChild(backdrop);
      modal.appendChild(inner);
      document.body.appendChild(modal);
      lockBodyScroll(true);

      // Close handlers
      closeBtn.onclick = () => { modal.remove(); lockBodyScroll(false); };
      backdrop.onclick = () => { modal.remove(); lockBodyScroll(false); };
    }

    // -------------------------------
    // RENDER SECTION (HOMEPAGE)
    // -------------------------------
    function renderSectionPreview(title, books) {
      const section = el("div", "ebook-section-preview");
      section.appendChild(el("h3", "section-title", { text: title }));

      // Show only 4 books
      const grid = el("div", "ebook-preview-grid");
      books.slice(0, 4).forEach(book => grid.appendChild(createBookCard(book)));
      section.appendChild(grid);

      // "View All" button
      if (books.length > 4) {
        const btn = el("button", "view-all-btn", { text: "View All" });
        btn.onclick = () => openGalleryModal(books, title);
        section.appendChild(btn);
      }

      container.appendChild(section);
    }

    // -------------------------------
    // RENDER ALL SERIES
    // -------------------------------
    Object.entries(groupedBooks).forEach(([seriesName, books]) => renderSectionPreview(seriesName, books));

  } catch (err) {
    container.innerHTML = `<p style="color:red">Failed to load ebooks</p>`;
    console.error("[INIT ERROR] Ebooks:", err);
  }
}
