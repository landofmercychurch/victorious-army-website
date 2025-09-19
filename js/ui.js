import { openModal, closeModal } from "./config.js";

export function setupModals(currentUser = { value: null }) {

  // ========================
  // MODAL CLOSE HANDLING
  // ========================
  document.querySelectorAll(".close").forEach(btn => {
    btn.addEventListener("click", () => {
      const target = document.querySelector(btn.dataset.close);
      if (target) closeModal(target);
    });
  });

  // Close modal when clicking outside content
  document.querySelectorAll(".modal").forEach(modal => {
    modal.addEventListener("click", e => {
      if (e.target === modal) closeModal(modal);
    });
  });

  // ========================
  // NOTIFICATION TOAST
  // ========================
  const notifClose = document.getElementById("notifClose");
  const notif = document.getElementById("notification");
  if (notifClose && notif) {
    notifClose.addEventListener("click", () => closeModal(notif));
  }

  // ========================
  // FLOATING ACTION BUTTON (FAB)
  // ========================
  const fab = document.getElementById("fab");
  if (fab) {
    fab.addEventListener("click", () => {
      if (!currentUser.value) {
        // Show login modal if user not logged in
        const loginModal = document.getElementById("loginModal");
        if (loginModal) openModal(loginModal);
        return;
      }

      // Determine which feed is visible
      const postFeed = document.getElementById("feed");
      const questionsFeed = document.getElementById("questionsFeed");

      const postsVisible = postFeed && postFeed.offsetParent !== null;
      const questionsVisible = questionsFeed && questionsFeed.offsetParent !== null;

      if (postsVisible) {
        const postModal = document.getElementById("postModal");
        if (postModal) {
          // Reset post form
          document.getElementById("postAuthor").value = currentUser.value.username || "";
          document.getElementById("postTitle").value = "";
          document.getElementById("postContent").value = "";
          openModal(postModal);
        }
      } else if (questionsVisible) {
        const questionModal = document.getElementById("questionModal");
        if (questionModal) {
          // Reset question create section
          document.getElementById("questionTitleInput").value = "";
          document.getElementById("questionContentInput").value = "";
          document.getElementById("questionCreate").style.display = "block";
          document.getElementById("questionRead").style.display = "none";
          openModal(questionModal);
        }
      }
    });
  }
}