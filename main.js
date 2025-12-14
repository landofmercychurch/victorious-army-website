import { initAnnouncementPopup } from "./announcement.js";
import { initMemorials } from "./memorials.js";
import { initSermons, initSermonThumbnails } from "./sermons.js";
import { initPicturePosts } from "./picturePosts.js";
import { initEvents } from "./events.js";
import { initDailyVerse } from "./dailyVerse.js";

document.addEventListener("DOMContentLoaded", async () => {
  // 1. Initialize the popup
  initAnnouncementPopup();

  // 2. Initialize all other components
  const memorialsContainer = document.getElementById("memorialsContainer");
  if (memorialsContainer) await initMemorials(memorialsContainer);

  // 3. Check page type
  const params = new URLSearchParams(window.location.search);
  const sermonId = params.get("sermon");
  const isSermonDetailPage = window.location.pathname.includes("sermon-detail");
  const isSermonListPage = window.location.pathname.includes("sermon.html");

  // 4. Handle sermons - TEMPORARY: Use original initSermons to keep functionality
  const sermonsContainer = document.getElementById("sermonsContainer");
  
  if (sermonsContainer && !isSermonDetailPage && !isSermonListPage) {
    // For now, keep using original initSermons to maintain all features
    await initSermons(sermonsContainer);
    
    // Add clickable thumbnails overlay for navigation to detail page
    setTimeout(() => {
      // Add overlay to each sermon card that links to detail page
      document.querySelectorAll('.sermon-card').forEach(card => {
        const video = card.querySelector('video');
        const sermonId = card.dataset.id;
        const thumbnail = card.querySelector('.sermon-overlay');
        
        if (thumbnail) {
          // Make the overlay clickable
          thumbnail.style.cursor = 'pointer';
          thumbnail.title = 'Click to view full sermon page';
          thumbnail.onclick = () => {
            window.location.href = `sermon-detail.html?id=${sermonId}`;
          };
          
          // Add a small "View Full Page" button
          const viewFullBtn = document.createElement('button');
          viewFullBtn.className = 'view-full-btn';
          viewFullBtn.innerHTML = '📺 View Full Page';
          viewFullBtn.onclick = (e) => {
            e.stopPropagation();
            window.location.href = `sermon-detail.html?id=${sermonId}`;
          };
          thumbnail.appendChild(viewFullBtn);
        }
      });
      
      // Handle deep linking
      if (sermonId) {
        const targetCard = sermonsContainer.querySelector(`.sermon-card[data-id="${sermonId}"]`);
        if (targetCard) {
          targetCard.scrollIntoView({ behavior: "smooth", block: "center" });
          const video = targetCard.querySelector("video");
          if (video) video.play().catch(() => {});
        }
      }
    }, 500);
  }
  else if (isSermonDetailPage && sermonId) {
    // Sermon detail page - will be handled by its own script
    console.log("Loading sermon detail for ID:", sermonId);
  }
  else if (isSermonListPage) {
    // Sermon listing page - use thumbnails
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