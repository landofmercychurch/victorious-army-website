import { initAnnouncementPopup } from "./announcement.js";
import { initMemorials } from "./memorials.js";
import { initSermons, initSermonThumbnails } from "./sermons.js"; // Import BOTH functions
import { initPicturePosts } from "./picturePosts.js";
import { initEvents } from "./events.js";
import { initDailyVerse } from "./dailyVerse.js";

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

    // ✅ CHANGE THIS: Use initSermonThumbnails instead of initSermons
    await initSermonThumbnails(sermonsContainer);

    setTimeout(() => {
      if (sermonId) {
        // ✅ UPDATE SELECTOR: sermon-thumbnail-card instead of sermon-card
        const targetCard = sermonsContainer.querySelector(`.sermon-thumbnail-card[data-id="${sermonId}"]`);
        if (targetCard) {
          targetCard.scrollIntoView({ behavior: "smooth", block: "center" });
          // No video to play, but we can highlight it
          targetCard.style.boxShadow = "0 0 0 3px #4CAF50";
          targetCard.style.transition = "box-shadow 0.3s ease";
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
});