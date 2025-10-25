// src/ebooks.js
import { api } from "./api.js";
import { el } from "./utils.js";

export async function initEbooks(container) {
  if (!container) return;
  container.innerHTML = "<p>Loading ebooks…</p>";

  try {
    const list = await api.get("/ebooks");
    container.innerHTML = "";

    if (!list.length) {
      container.innerHTML = "<p>No ebooks available.</p>";
      return;
    }

    // Separate books by series and standalone
    const seriesMap = {};
    const standalone = [];

    list.forEach(book => {
      if (book.series) {
        if (!seriesMap[book.series]) seriesMap[book.series] = [];
        seriesMap[book.series].push(book);
      } else {
        standalone.push(book);
      }
    });

    // Sort each series by series_order
    Object.values(seriesMap).forEach(books => {
      books.sort((a, b) => (a.series_order || 0) - (b.series_order || 0));
    });

    // Helper to create book card
    function createBookCard(book) {
      const card = el("div", "ebook-card");

      // Book cover clickable
      const cover = el("a", "ebook-cover", {
        href: book.pdf_url || "#",
        target: "_blank",
        title: book.title,
      });
      cover.style.backgroundImage = `url(${book.cover_url || 'https://via.placeholder.com/180x240?text=No+Cover'})`;
      cover.loading = "lazy"; // lazy load
      card.appendChild(cover);

      // Title
      const titleEl = el("h4", "ebook-title", { text: book.title });
      card.appendChild(titleEl);

      // Author
      if (book.author) {
        const authorEl = el("p", "ebook-author", { text: book.author });
        card.appendChild(authorEl);
      }

      // Optional series part
      if (book.series_order) {
        const partEl = el("p", "ebook-part", { text: `Part ${book.series_order}` });
        card.appendChild(partEl);
      }

      return card;
    }

    // Render series first
    for (const [seriesName, books] of Object.entries(seriesMap)) {
      const section = el("div", "ebook-series-section");
      const header = el("h3", "series-title", { text: seriesName });
      section.appendChild(header);

      const grid = el("div", "ebook-grid");
      // Limit to first 5 books initially to prevent page overload
      books.slice(0, 5).forEach(book => grid.appendChild(createBookCard(book)));
      section.appendChild(grid);

      // Optional "View All" button for series
      if (books.length > 5) {
        const viewAllBtn = el("button", "view-all-btn", { text: "View All" });
        viewAllBtn.addEventListener("click", () => {
          grid.innerHTML = ""; // clear current limited display
          books.forEach(book => grid.appendChild(createBookCard(book)));
          viewAllBtn.style.display = "none"; // hide button after viewing all
        });
        section.appendChild(viewAllBtn);
      }

      container.appendChild(section);
    }

    // Render standalone books
    if (standalone.length) {
      const section = el("div", "ebook-series-section");
      const header = el("h3", "series-title", { text: "Standalone Books" });
      section.appendChild(header);

      const grid = el("div", "ebook-grid");
      standalone.slice(0, 8).forEach(book => grid.appendChild(createBookCard(book)));

      if (standalone.length > 8) {
        const viewAllBtn = el("button", "view-all-btn", { text: "View All" });
        viewAllBtn.addEventListener("click", () => {
          grid.innerHTML = "";
          standalone.forEach(book => grid.appendChild(createBookCard(book)));
          viewAllBtn.style.display = "none";
        });
        section.appendChild(viewAllBtn);
      }

      section.appendChild(grid);
      container.appendChild(section);
    }

  } catch (err) {
    container.innerHTML = `<p style="color:red">Failed to load ebooks</p>`;
    console.error(err);
  }
}
