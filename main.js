import { initAnnouncementPopup } from "./announcement.js";
import { initMemorials } from "./memorials.js";
import { initSermons } from "./sermons.js";
import { initPicturePosts } from "./picturePosts.js";
import { initEvents } from "./events.js";
import { initDailyVerse } from "./dailyVerse.js";

import EbooksLibrary from "./src/ebooks-library.js"; 

document.addEventListener("DOMContentLoaded", async () => {
  // 1. Initialize the popup
  initAnnouncementPopup();

  // 2. Initialize all other components
  const memorialsContainer = document.getElementById("memorialsContainer");
  if (memorialsContainer) await initMemorials(memorialsContainer);

  const sermonsContainer = document.getElementById("sermonsContainer");
  if (sermonsContainer) {
    const params = new URLSearchParams(window.location.search);
    const sermonId = params.get("sermon");

    await initSermons(sermonsContainer);

    setTimeout(() => {
      if (sermonId) {
        const targetCard = sermonsContainer.querySelector(`.sermon-card[data-id="${sermonId}"]`);
        if (targetCard) {
          targetCard.scrollIntoView({ behavior: "smooth", block: "center" });
          const video = targetCard.querySelector("video");
          if (video) video.play().catch(() => {});
        }
      }
    }, 100);
  }

  const picturePostsContainer = document.getElementById("picturePostsContainer");
  if (picturePostsContainer) await initPicturePosts(picturePostsContainer);

  const eventsContainer = document.getElementById("eventsContainer");
  if (eventsContainer) await initEvents(eventsContainer);

  const dailyVerseContainer = document.getElementById("dailyVerseContainer");
  if (dailyVerseContainer) await initDailyVerse(dailyVerseContainer);

  const ebooksContainer = document.getElementById("ebooksContainer");
  if (ebooksContainer) {
    // 1. Create an instance of the library
    window.ebookLibrary = new EbooksLibrary();
    // 2. Initialize it with the container
    await window.ebookLibrary.init(ebooksContainer);
  }
});
