import { initAnnouncementPopup } from "./announcement.js";
import { initMemorials } from "./memorials.js";
import { initSermons, initSermonThumbnails } from "./sermons.js"; // Import both functions
import { initPicturePosts } from "./picturePosts.js";
import { initEvents } from "./events.js";
import { initDailyVerse } from "./dailyVerse.js";

document.addEventListener("DOMContentLoaded", async () => {
  // 1. Initialize the popup
  initAnnouncementPopup();

  // 2. Initialize all other components
  const memorialsContainer = document.getElementById("memorialsContainer");
  if (memorialsContainer) await initMemorials(memorialsContainer);

  // 3. Check if we're on sermon detail page or main page
  const params = new URLSearchParams(window.location.search);
  const sermonId = params.get("sermon");
  const isSermonDetailPage = window.location.pathname.includes("sermon-detail");
  const isSermonListPage = window.location.pathname.includes("sermon.html");

  // 4. Handle sermons based on page type
  const sermonsContainer = document.getElementById("sermonsContainer");
  const sermonThumbnailsContainer = document.getElementById("sermonThumbnails");
  
  if (sermonsContainer && !isSermonDetailPage && !isSermonListPage) {
    // Main page - Use THUMBNAILS only (fast loading)
    await initSermonThumbnails(sermonsContainer);
    
    // Still support deep linking with ?sermon=ID
    setTimeout(() => {
      if (sermonId) {
        const targetCard = sermonsContainer.querySelector(`.sermon-thumbnail-card[data-id="${sermonId}"]`);
        if (targetCard) {
          targetCard.scrollIntoView({ behavior: "smooth", block: "center" });
          // Highlight the clicked sermon
          targetCard.style.boxShadow = "0 0 0 3px #4CAF50";
        }
      }
    }, 100);
  } 
  else if (sermonThumbnailsContainer) {
    // Alternative container for thumbnails (if you change HTML structure)
    await initSermonThumbnails(sermonThumbnailsContainer);
  }
  else if (isSermonDetailPage && sermonId) {
    // Sermon detail page - Use full video player
    // This will be handled by sermon-detail.html's own script
    console.log("Loading sermon detail for ID:", sermonId);
  }
  else if (isSermonListPage) {
    // Sermon listing page - Also use thumbnails
    const sermonListContainer = document.getElementById("sermonListContainer");
    if (sermonListContainer) {
      await initSermonThumbnails(sermonListContainer);
    }
  }

  // 5. Initialize other components
  const picturePostsContainer = document.getElementById("picturePostsContainer");
  if (picturePostsContainer) await initPicturePosts(picturePostsContainer);

  const eventsContainer = document.getElementById("eventsContainer");
  if (eventsContainer) await initEvents(eventsContainer);

  const dailyVerseContainer = document.getElementById("dailyVerseContainer");
  if (dailyVerseContainer) await initDailyVerse(dailyVerseContainer);
});