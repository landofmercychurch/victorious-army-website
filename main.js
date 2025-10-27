import { initMemorials } from "./memorials.js";
import { initSermons } from "./sermons.js";
import { initPicturePosts } from "./picturePosts.js";
import { initEvents } from "./events.js";
import { initDailyVerse } from "./dailyVerse.js";
import { initEbooks } from "./ebooks.js";

document.addEventListener("DOMContentLoaded", async () => {
  const memorialsContainer = document.getElementById("memorialsContainer");
  if (memorialsContainer) await initMemorials(memorialsContainer);

  const sermonsContainer = document.getElementById("sermonsContainer");
  if (sermonsContainer) {
    const params = new URLSearchParams(window.location.search);
    const sermonId = params.get("sermon");

    // Load sermons
    await initSermons(sermonsContainer);

    // Wait a tiny bit to ensure cards exist in the DOM
    setTimeout(() => {
      if (sermonId) {
        const targetCard = sermonsContainer.querySelector(`.sermon-card[data-id="${sermonId}"]`);
        if (targetCard) {
          targetCard.scrollIntoView({ behavior: "smooth", block: "center" });
          const video = targetCard.querySelector("video");
          if (video) video.play().catch(() => {});
        }
      }
    }, 100); // 100ms delay usually suffices
  }

  const picturePostsContainer = document.getElementById("picturePostsContainer");
  if (picturePostsContainer) await initPicturePosts(picturePostsContainer);

  const eventsContainer = document.getElementById("eventsContainer");
  if (eventsContainer) await initEvents(eventsContainer);

  const dailyVerseContainer = document.getElementById("dailyVerseContainer");
  if (dailyVerseContainer) await initDailyVerse(dailyVerseContainer);

  const ebooksContainer = document.getElementById("ebooksContainer");
  if (ebooksContainer) await initEbooks(ebooksContainer);
});
