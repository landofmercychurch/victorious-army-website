// src/ebooks.js
import { api } from "./api.js";
import { el } from "./utils.js";

export async function initEbooks(container) {
  if (!container) return;
  container.innerHTML = "<p>Loading ebooks…</p>";

  try {
    const seriesData = await api.get("/ebooks"); // backend returns ebooks grouped by series
    container.innerHTML = "";

    if (!seriesData || Object.keys(seriesData).length === 0) {
      container.innerHTML = "<p>No ebooks available.</p>";
      return;
    }

    // Helper: create a single ebook card with read & download
    const createBookCard = (book) => {
      const card = el("div", "ebook-card");

      // Book cover clickable (opens PDF in new tab)
      const cover = el("a", "ebook-cover", {
        href: book.pdf_url || "#",
        target: "_blank",
        title: book.title,
      });
      cover.style.backgroundImage = `url(${book.cover_url || 'https://via.placeholder.com/180x240?text=No+Cover'})`;
      cover.loading = "lazy";
      card.appendChild(cover);

      // Title
      card.appendChild(el("h4", "ebook-title", { text: book.title }));

      // Author
      if (book.author) card.appendChild(el("p", "ebook-author", { text: book.author }));

      // Part number if series_order exists
      if (book.series_order) card.appendChild(el("p", "ebook-part", { text: `Part ${book.series_order}` }));

      // --- Read online iframe ---
      if (book.pdf_url) {
        const iframe = document.createElement("iframe");
        iframe.src = book.pdf_url;
        iframe.width = "100%";
        iframe.height = "400px";
        iframe.style.marginTop = "10px";
        iframe.style.border = "1px solid #ccc";
        card.appendChild(iframe);

        // --- Download link with metadata-friendly filename ---
        const downloadLink = document.createElement("a");
        downloadLink.href = book.pdf_url;
        downloadLink.download = `${book.title || "ebook"}.pdf`;
        downloadLink.textContent = "Download PDF";
        downloadLink.style.display = "block";
        downloadLink.style.marginTop = "5px";
        downloadLink.style.color = "#007BFF";
        downloadLink.style.textDecoration = "underline";
        card.appendChild(downloadLink);
      }

      return card;
    };

    // Render each series
    for (const [seriesName, books] of Object.entries(seriesData)) {
      const section = el("div", "ebook-series-section");
      section.appendChild(el("h3", "series-title", { text: seriesName }));

      const grid = el("div", "ebook-grid");

      // Show first 5 books for series to avoid overload
      books.slice(0, 5).forEach(book => grid.appendChild(createBookCard(book)));
      section.appendChild(grid);

      // Optional "View All" button if more than 5
      if (books.length > 5) {
        const viewAllBtn = el("button", "view-all-btn", { text: "View All" });
        viewAllBtn.addEventListener("click", () => {
          grid.innerHTML = ""; // clear limited display
          books.forEach(book => grid.appendChild(createBookCard(book)));
          viewAllBtn.style.display = "none"; // hide button after showing all
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
