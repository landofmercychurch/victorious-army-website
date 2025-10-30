// src/ebooks.js
import { api } from "./api.js";
import { el } from "./utils.js";

function lockBodyScroll(lock = true) {
  document.body.style.overflow = lock ? "hidden" : "";
}

// -------------------------------
// GROUP BOOKS BY SERIES (Standalone handled)
// -------------------------------
function groupBooksBySeries(books) {
  const grouped = {};
  books.forEach(book => {
    const seriesName = book.series && book.series.trim() !== "" ? book.series : "Standalone";
    if (!grouped[seriesName]) grouped[seriesName] = [];
    grouped[seriesName].push(book);
  });
  return grouped;
}

// -------------------------------
// INIT EBOOKS
// -------------------------------
export async function initEbooks(container) {
  if (!container) return;
  container.innerHTML = "<p>Loading ebooks…</p>";

  try {
    const allBooks = await api.get("/ebooks");
    container.innerHTML = "";

    if (!allBooks || allBooks.length === 0) {
      container.innerHTML = "<p>No ebooks available.</p>";
      return;
    }

    container.classList.add("ebook-feed");

    const groupedBooks = groupBooksBySeries(allBooks);

    // -------------------------------
    // CREATE EBOOK CARD
    // -------------------------------
    function createBookCard(book) {
      const card = el("div", "ebook-card");
      card.innerHTML = `
        <div class="ebook-cover" style="background-image: url('${book.cover_url || "https://via.placeholder.com/180x240?text=No+Cover"}')"></div>
        <div class="ebook-info">
          <h4 class="ebook-title">${book.title}</h4>
          ${book.series_order ? `<p class="ebook-part">Part ${book.series_order}</p>` : ""}
        </div>
      `;
      card.addEventListener("click", () => openDetailModal(book));
      return card;
    }

    // -------------------------------
    // DETAIL MODAL
    // -------------------------------
    function openDetailModal(book) {
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
            ${book.pdf_url ? `<a href="${book.pdf_url}" download class="download-btn">⬇️ Download PDF</a>` : ""}
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      lockBodyScroll(true);

      modal.querySelector(".close-btn").onclick = () => { modal.remove(); lockBodyScroll(false); };
      modal.addEventListener("click", e => { if (e.target === modal) { modal.remove(); lockBodyScroll(false); } });
    }

    // -------------------------------
    // GALLERY MODAL FOR "VIEW ALL"
    // -------------------------------
    function openGalleryModal(books, title = "Books") {
      const modal = el("div", "ebook-gallery-modal");
      modal.innerHTML = `
        <div class="ebook-gallery-content">
          <h2 class="gallery-title">${title}</h2>
          <div class="gallery-grid">
            ${books.map(book => `
              <div class="ebook-thumb" style="background-image: url('${book.cover_url || "https://via.placeholder.com/120x160?text=No+Cover"}')">
                <span class="thumb-title">${book.title}</span>
              </div>
            `).join("")}
          </div>
          <span class="gallery-close">&times;</span>
        </div>
      `;
      document.body.appendChild(modal);
      lockBodyScroll(true);

      modal.querySelectorAll(".ebook-thumb").forEach((thumb, i) => {
        thumb.addEventListener("click", () => openDetailModal(books[i]));
      });

      modal.querySelector(".gallery-close").onclick = () => { modal.remove(); lockBodyScroll(false); };
      modal.addEventListener("click", e => { if (e.target === modal) { modal.remove(); lockBodyScroll(false); } });
    }

    // -------------------------------
    // RENDER SECTION (HOMEPAGE)
    // -------------------------------
    function renderSectionPreview(title, books) {
      if (!books || books.length === 0) return;

      const section = el("div", "ebook-section-preview");
      section.appendChild(el("h3", "section-title", { text: title }));

      // Sort newest first
      const sortedBooks = books.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      // Only display top 4 on homepage
      const top4 = sortedBooks.slice(0, 4);

      // Render top4
      const grid = el("div", "ebook-preview-grid");
      top4.forEach(book => grid.appendChild(createBookCard(book)));
      section.appendChild(grid);

      // If more than 4, add "View All" button
      if (sortedBooks.length > 4) {
        const btn = el("button", "view-all-btn", { text: "View All" });
        btn.addEventListener("click", () => openGalleryModal(sortedBooks, title));
        section.appendChild(btn);
      }

      container.appendChild(section);
    }

    // -------------------------------
    // RENDER ALL SERIES
    // -------------------------------
    Object.entries(groupedBooks).forEach(([seriesName, books]) => {
      renderSectionPreview(seriesName, books);
    });

  } catch (err) {
    container.innerHTML = `<p style="color:red">Failed to load ebooks</p>`;
    console.error("[INIT ERROR] Ebooks:", err);
  }
}
