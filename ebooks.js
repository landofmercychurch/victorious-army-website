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
      card.appendChild(cover);

      // Title
      const titleEl = el("h4", "ebook-title", { text: book.title });
      card.appendChild(titleEl);

      // Author
      if (book.author) {
        const authorEl = el("p", "ebook-author", { text: book.author });
        card.appendChild(authorEl);
      }

      return card;
    }

    // Render series first
    for (const [seriesName, books] of Object.entries(seriesMap)) {
      const section = el("div", "ebook-series-section");
      const header = el("h3", "series-title", { text: seriesName });
      section.appendChild(header);

      const grid = el("div", "ebook-grid");
      books.forEach(book => grid.appendChild(createBookCard(book)));
      section.appendChild(grid);
      container.appendChild(section);
    }

    // Render standalone books
    if (standalone.length) {
      const section = el("div", "ebook-series-section");
      const header = el("h3", "series-title", { text: "Standalone Books" });
      section.appendChild(header);

      const grid = el("div", "ebook-grid");
      standalone.forEach(book => grid.appendChild(createBookCard(book)));
      section.appendChild(grid);
      container.appendChild(section);
    }

  } catch (err) {
    container.innerHTML = `<p style="color:red">Failed to load ebooks</p>`;
    console.error(err);
  }
}
