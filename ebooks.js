import { api } from "./api.js";
import { el } from "./utils.js";

export async function initEbooks(container) {
  if (!container) return;
  container.innerHTML = "<p>Loading ebooks…</p>";

  try {
    const seriesData = await api.get("/ebooks");
    container.innerHTML = "";

    if (!seriesData || Object.keys(seriesData).length === 0) {
      container.innerHTML = "<p>No ebooks available.</p>";
      return;
    }

    // Create modals container
    const modalsContainer = el("div", "ebook-modals-container");
    document.body.appendChild(modalsContainer);

    const createBookCard = (book) => {
      const card = el("div", "ebook-card");

      // Cover
      const cover = el("a", "ebook-cover", {
        href: book.pdf_url ? book.pdf_url.replace("/upload/", "/upload/fl_attachment:false/") : "#",
        target: "_blank",
        title: book.title,
      });
      cover.style.backgroundImage = `url(${book.cover_url || "https://via.placeholder.com/180x240?text=No+Cover"})`;
      cover.loading = "lazy";
      card.appendChild(cover);

      // Info
      const info = el("div", "ebook-info");
      info.appendChild(el("h4", "ebook-title", { text: book.title }));
      if (book.author) info.appendChild(el("p", "ebook-author", { text: book.author }));
      if (book.series_order) info.appendChild(el("p", "ebook-part", { text: `Part ${book.series_order}` }));
      card.appendChild(info);

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
      modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
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

    const renderSection = (sectionTitle, books) => {
      const section = el("div", "ebook-series-section");
      section.appendChild(el("h3", "series-title", { text: sectionTitle }));

      const grid = el("div", "ebook-grid");
      section.appendChild(grid);

      const VISIBLE_COUNT = 6; // show 6 books initially
      let showingAll = false;

      const renderBooks = (count) => {
        grid.innerHTML = "";
        books.slice(0, count).forEach(book => {
          const card = createBookCard(book);
          card.onclick = () => openDetailModal(book);
          grid.appendChild(card);
        });
      };

      renderBooks(VISIBLE_COUNT);

      if (books.length > VISIBLE_COUNT) {
        const toggleBtn = el("button", "view-all-btn", { text: "View More" });
        toggleBtn.addEventListener("click", () => {
          openGridModal(books, sectionTitle);
        });
        section.appendChild(toggleBtn);
      }

      container.appendChild(section);
    };

    // Render all series
    for (const [seriesName, books] of Object.entries(seriesData)) {
      renderSection(seriesName, books);
    }

    console.log("[INIT] Ebooks loaded:", Object.keys(seriesData).length, "series");
  } catch (err) {
    container.innerHTML = `<p style="color:red">Failed to load ebooks</p>`;
    console.error("[INIT ERROR] Ebooks:", err);
  }
}
