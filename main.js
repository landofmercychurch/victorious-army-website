import { initMemorials } from "./memorials.js";
import { initSermons } from "./sermons.js";
import { initPicturePosts } from "./picturePosts.js";
import { initEvents } from "./events.js";
import { initDailyVerse } from "./dailyVerse.js";
import { initEbooks } from "./ebooks.js";

document.addEventListener("DOMContentLoaded", () => {
  const memorialsContainer = document.getElementById("memorialsContainer");
  if (memorialsContainer) initMemorials(memorialsContainer);

  const sermonsContainer = document.getElementById("sermonsContainer");
  if (sermonsContainer) initSermons(sermonsContainer);

  const picturePostsContainer = document.getElementById("picturePostsContainer");
  if (picturePostsContainer) initPicturePosts(picturePostsContainer);

  const eventsContainer = document.getElementById("eventsContainer");
  if (eventsContainer) initEvents(eventsContainer);

  const dailyVerseContainer = document.getElementById("dailyVerseContainer");
  if (dailyVerseContainer) initDailyVerse(dailyVerseContainer);

  const ebooksContainer = document.getElementById("ebooksContainer");
  if (ebooksContainer) initEbooks(ebooksContainer);
});
