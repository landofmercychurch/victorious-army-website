// src/ebooks.js
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

      // Info container
      const info = el("div", "ebook-info");
      info.appendChild(el("h4", "ebook-title", { text: book.title }));
      if (book.author) info.appendChild(el("p", "ebook-author", { text: book.author }));
      if (book.series_order) info.appendChild(el("p", "ebook-part", { text: `Part ${book.series_order}` }));
      card.appendChild(info);

      // Buttons
      const btnContainer = el("div", "ebook-btns");
      if (book.pdf_url) {
        const inlineUrl = book.pdf_url.replace("/upload/", "/upload/fl_attachment:false/");
        btnContainer.appendChild(el("a", "read-btn", { text: "📖 Read Online", href: inlineUrl, target: "_blank" }));
        btnContainer.appendChild(el("a", "download-btn", { text: "⬇️ Download PDF", href: `/api/ebooks/download/${book.id}` }));
      }
      card.appendChild(btnContainer);

      return card;
    };

    // Render a series or standalone section
    const renderSection = (sectionTitle, books) => {
      const section = el("div", "ebook-series-section");
      section.appendChild(el("h3", "series-title", { text: sectionTitle }));

      const grid = el("div", "ebook-grid");
      section.appendChild(grid);

      const VISIBLE_COUNT = 6; // initially show 6 books
      let showingAll = false;

      const renderBooks = (count) => {
        grid.innerHTML = "";
        books.slice(0, count).forEach(book => grid.appendChild(createBookCard(book)));
      };

      renderBooks(VISIBLE_COUNT);

      if (books.length > VISIBLE_COUNT) {
        const toggleBtn = el("button", "view-all-btn", { text: "View More" });
        toggleBtn.addEventListener("click", () => {
          if (!showingAll) {
            renderBooks(books.length);
            toggleBtn.textContent = "Collapse";
            showingAll = true;
          } else {
            renderBooks(VISIBLE_COUNT);
            toggleBtn.textContent = "View More";
            showingAll = false;
          }
        });
        section.appendChild(toggleBtn);
      }

      container.appendChild(section);
    };

    // Loop over series
    for (const [seriesName, books] of Object.entries(seriesData)) {
      renderSection(seriesName, books);
    }

    console.log("[INIT] Ebooks loaded:", Object.keys(seriesData).length, "series");
  } catch (err) {
    container.innerHTML = `<p style="color:red">Failed to load ebooks</p>`;
    console.error("[INIT ERROR] Ebooks:", err);
  }
}

