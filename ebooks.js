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

      // ✅ Display Cover Image
      const cover = el("a", "ebook-cover", {
        href: book.pdf_url ? book.pdf_url.replace("/upload/", "/upload/fl_attachment:false/") : "#",
        target: "_blank",
        title: book.title,
      });

      cover.style.backgroundImage = `url(${book.cover_url || "https://via.placeholder.com/180x240?text=No+Cover"})`;
      cover.loading = "lazy";
      card.appendChild(cover);

      // Info
      card.appendChild(el("h4", "ebook-title", { text: book.title }));
      if (book.author) card.appendChild(el("p", "ebook-author", { text: book.author }));
      if (book.series_order)
        card.appendChild(el("p", "ebook-part", { text: `Part ${book.series_order}` }));

      // Buttons
      const btnContainer = el("div", "ebook-btns");

      // ✅ Read Online (opens inline)
      if (book.pdf_url) {
        const inlineUrl = book.pdf_url.replace("/upload/", "/upload/fl_attachment:false/");
        const readBtn = el("a", "read-btn", { text: "📖 Read Online", href: inlineUrl, target: "_blank" });
        btnContainer.appendChild(readBtn);

        // ✅ Download Button
        const downloadBtn = el("a", "download-btn", {
          text: "⬇️ Download PDF",
          href: `/api/ebooks/download/${book.id}`,
        });
        btnContainer.appendChild(downloadBtn);
      }

      card.appendChild(btnContainer);

      return card;
    };

    // Render sections by series
    for (const [seriesName, books] of Object.entries(seriesData)) {
      const section = el("div", "ebook-series-section");
      section.appendChild(el("h3", "series-title", { text: seriesName }));

      const grid = el("div", "ebook-grid");
      books.slice(0, 5).forEach((book) => grid.appendChild(createBookCard(book)));
      section.appendChild(grid);

      if (books.length > 5) {
        const viewAllBtn = el("button", "view-all-btn", { text: "View All" });
        viewAllBtn.addEventListener("click", () => {
          grid.innerHTML = "";
          books.forEach((book) => grid.appendChild(createBookCard(book)));
          viewAllBtn.style.display = "none";
        });
        section.appendChild(viewAllBtn);
      }

      container.appendChild(section);
    }

    console.log("[INIT] Ebooks loaded:", Object.keys(seriesData).length, "series");
  } catch (err) {
    container.innerHTML = `<p style="color:red">Failed to load ebooks</p>`;
    console.error("[INIT ERROR] Ebooks:", err);
  }
}
