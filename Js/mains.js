import { setupAuth } from "./auth.js";
import { renderPosts } from "./posts.js";
import { renderQuestions } from "./questions.js";
import { renderCommunities } from "./communities.js";
import { renderTags } from "./tags.js";
import { setupModals } from "./ui.js";

// Run when page is ready
document.addEventListener("DOMContentLoaded", () => {
  // Setup auth & modals
  setupAuth();
  setupModals();

  // Mount feeds
  renderPosts(document.getElementById("feed"));
  renderQuestions(document.getElementById("questionsFeed"));
  renderCommunities(document.getElementById("communitiesFeed"));
  renderTags(document.getElementById("tagsFeed"));
});