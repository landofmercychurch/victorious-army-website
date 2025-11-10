// src/ebooks.js
import { api } from "./api.js";
import { el } from "./utils.js";

function lockBodyScroll(lock = true) {
  document.body.style.overflow = lock ? "hidden" : "";
}

// -------------------------------
// GROUP BOOKS BY SERIES
// -------------------------------
function groupBooksBySeries(books) {
  const grouped = {};
  if (!Array.isArray(books)) return grouped;

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

    if (!Array.isArray(allBooks) || allBooks.length === 0) {
      container.innerHTML = "<p>No ebooks available.</p>";
      return;
    }

    container.classList.add("ebook-feed");

    // -------------------------------
    // CREATE BOOK CARD
    // -------------------------------
    function createBookCard(book) {
      const card = el("div", "ebook-card");
      card.innerHTML = `
        <div class="ebook-cover" 
             style="background-image: url('${book.cover_url || "https://via.placeholder.com/180x240?text=No+Cover"}')"></div>
        <div class="ebook-info">
          <h4 class="ebook-title">${book.title}</h4>
          ${book.series_order ? `<p class="ebook-part">Part ${book.series_order}</p>` : ""}
        </div>
      `;
      card.addEventListener("click", () => openDetailModal(book));
      return card;
    }

    // -------------------------------
    // BOOK DETAIL MODAL
    // -------------------------------
    function openDetailModal(book) {
      const modal = el("div", "ebook-detail-modal");
      modal.innerHTML = `
        <div class="ebook-detail-content">
          <span class="close-btn">&times;</span>
          <img class="ebook-detail-cover" 
               src="${book.cover_url || "https://via.placeholder.com/180x240?text=No+Cover"}" 
               alt="${book.title}" />
          <h2>${book.title}</h2>
          ${book.author ? `<p class="ebook-author"><strong>Author:</strong> ${book.author}</p>` : ""}
          ${book.description ? `<p class="ebook-description">${book.description}</p>` : ""}
          <div class="ebook-detail-btns">
            ${
              book.pdf_url
                ? `<a href="${book.pdf_url.replace("/upload/", "/upload/fl_attachment:false/")}" 
                      target="_blank" class="read-btn">📖 Read Online</a>`
                : ""
            }
            ${
              book.pdf_url
                ? `<a href="${book.pdf_url}" download class="download-btn">⬇️ Download PDF</a>`
                : ""
            }
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      lockBodyScroll(true);

      modal.querySelector(".close-btn").onclick = () => {
        modal.remove();
        lockBodyScroll(false);
      };
      modal.addEventListener("click", e => {
        if (e.target === modal) {
          modal.remove();
          lockBodyScroll(false);
        }
      });
    }

    // -------------------------------
    // GALLERY MODAL FOR "VIEW ALL"
    // -------------------------------
    function openGalleryModal(books) {
      const groupedBooks = groupBooksBySeries(books);
      const modal = el("div", "ebook-gallery-modal");
      const content = el("div", "ebook-gallery-content");

      // Sticky close button
      const closeBtn = el("span", "gallery-close", { text: "×" });
      closeBtn.addEventListener("click", () => {
        modal.remove();
        lockBodyScroll(false);
      });

      // Scrollable inner area
      const scrollArea = el("div", "gallery-scroll-area");
      scrollArea.appendChild(el("h2", "gallery-title", { text: "All Books" }));

      // Loop through series and render grids
      Object.entries(groupedBooks).forEach(([seriesName, booksInSeries]) => {
        const section = el("div", "gallery-series-section");
        section.appendChild(el("h3", "series-title", { text: seriesName }));

        const grid = el("div", "gallery-grid");
        booksInSeries.forEach(book => {
          const thumb = el("div", "ebook-thumb");
          thumb.style.backgroundImage = `url('${book.cover_url || "https://via.placeholder.com/120x160?text=No+Cover"}')`;
          thumb.appendChild(el("span", "thumb-title", { text: book.title }));
          thumb.addEventListener("click", () => openDetailModal(book));
          grid.appendChild(thumb);
        });

        section.appendChild(grid);
        scrollArea.appendChild(section);
      });

      // Assemble modal
      content.appendChild(closeBtn);
      content.appendChild(scrollArea);
      modal.appendChild(content);
      document.body.appendChild(modal);
      lockBodyScroll(true);

      // Close modal by clicking outside
      modal.addEventListener("click", e => {
        if (e.target === modal) {
          modal.remove();
          lockBodyScroll(false);
        }
      });
    }

    // -------------------------------
    // HOMEPAGE: 2×2 GRID + VIEW ALL BUTTON
    // -------------------------------
    const previewWrapper = el("div", "ebook-preview-wrapper");
    previewWrapper.style.display = "flex";
    previewWrapper.style.flexDirection = "column";
    previewWrapper.style.alignItems = "center";
    previewWrapper.style.gap = "1rem";

    // Get latest 4 books
    const top4Books = allBooks
      .slice()
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 4);

    // Grid container
    const topGrid = el("div", "ebook-preview-grid");
    topGrid.style.display = "grid";
    topGrid.style.gridTemplateColumns = "repeat(2, 180px)";
    topGrid.style.gridTemplateRows = "repeat(2, auto)";
    topGrid.style.justifyContent = "center";
    topGrid.style.gap = "1rem";

    // Add books to grid
    top4Books.forEach(book => topGrid.appendChild(createBookCard(book)));

    // Add grid to wrapper
    previewWrapper.appendChild(topGrid);

    // "View All" button
    if (allBooks.length > 4) {
      const btn = el("button", "view-all-btn");
      btn.textContent = "View All Books";
      btn.style.marginTop = "1rem";
      btn.addEventListener("click", () => openGalleryModal(allBooks));
      previewWrapper.appendChild(btn);
    }

    // Append wrapper to container
    container.appendChild(previewWrapper);

  } catch (err) {
    console.error("Failed to load ebooks:", err);
    container.innerHTML = "<p>Failed to load ebooks.</p>";
  }
}
