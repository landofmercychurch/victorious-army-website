// ui.js
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
          document.getElementById("postAuthor").value =
            currentUser.value.username || "";
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

// ========================
// THEME TOGGLE
// ========================
export function initTheme() {
  const themeToggle = document.getElementById("themeToggle");
  if (!themeToggle) return;

  // Load saved theme from localStorage
  const savedTheme = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);

  themeToggle.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme");
    const nextTheme = current === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", nextTheme);
    localStorage.setItem("theme", nextTheme);
  });
}

// ========================
// HEADER BUTTONS
// ========================
export function setupHeaderButtons() {
  const navLogin = document.getElementById("loginBtn");
  const navSignup = document.getElementById("signupBtn");

  if (navLogin) {
    navLogin.addEventListener("click", () => {
      const modal = document.getElementById("loginModal");
      if (modal) openModal(modal);
    });
  }

  if (navSignup) {
    navSignup.addEventListener("click", () => {
      const modal = document.getElementById("signupModal");
      if (modal) openModal(modal);
    });
  }
}
