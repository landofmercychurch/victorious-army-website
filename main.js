//main.js
import { initMemorials } from "./memorials.js";
import { initSermons } from "./sermons.js";
import { initPicturePosts } from "./picturePosts.js";
import { initEvents } from "./events.js";
import { initDailyVerse } from "./dailyVerse.js";
import { initEbooks } from "./ebooks.js";

document.addEventListener("DOMContentLoaded", async () => {
  const memorialsContainer = document.getElementById("memorialsContainer");
  if (memorialsContainer) initMemorials(memorialsContainer);

  const sermonsContainer = document.getElementById("sermonsContainer");
  if (sermonsContainer) {
    // Get query param for deep-linking
    const params = new URLSearchParams(window.location.search);
    const sermonId = params.get("sermon");

    // Load sermons first
    await initSermons(sermonsContainer);

    // If deep-link exists, scroll to and play the target sermon
    if (sermonId) {
      const targetCard = sermonsContainer.querySelector(`.sermon-card[data-id="${sermonId}"]`);
      if (targetCard) {
        targetCard.scrollIntoView({ behavior: "smooth", block: "center" });

        const video = targetCard.querySelector("video");
        if (video) video.play().catch(() => {});
      }
    }
  }

  const picturePostsContainer = document.getElementById("picturePostsContainer");
  if (picturePostsContainer) initPicturePosts(picturePostsContainer);

  const eventsContainer = document.getElementById("eventsContainer");
  if (eventsContainer) initEvents(eventsContainer);

  const dailyVerseContainer = document.getElementById("dailyVerseContainer");
  if (dailyVerseContainer) initDailyVerse(dailyVerseContainer);

  const ebooksContainer = document.getElementById("ebooksContainer");
  if (ebooksContainer) initEbooks(ebooksContainer);
});
