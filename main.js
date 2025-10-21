import { initMemorials } from "./memorials.js";

document.addEventListener("DOMContentLoaded", () => {
  initMemorials(document.getElementById("memorialsContainer"));
});


import { initSermons } from "./sermons.js";

document.addEventListener("DOMContentLoaded", () => {
  initSermons(document.getElementById("sermonsContainer"));
});


import { initPicturePosts } from "./picturePosts.js";

document.addEventListener("DOMContentLoaded", () => {
  initPicturePosts(document.getElementById("picturePostsContainer"));
});

import { initEvents } from "./events.js";

document.addEventListener("DOMContentLoaded", () => {
  initEvents(document.getElementById("eventsContainer"));
});


import { initDailyVerse } from "./dailyVerse.js";

document.addEventListener("DOMContentLoaded", () => {
  initDailyVerse(document.getElementById("dailyVerseContainer"));
});


import { initEbooks } from "./ebooks.js";

document.addEventListener("DOMContentLoaded", () => {
  initEbooks(document.getElementById("ebooksContainer"));
});
