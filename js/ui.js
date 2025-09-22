// ui.js
import { openModal, closeModal } from "./config.js";

// ========================
// MODALS
// ========================
export function setupModals(currentUser = { value: null }) {
  // Close buttons
  document.querySelectorAll(".close").forEach(btn => {
    btn.addEventListener("click", () => {
      const target = document.querySelector(btn.dataset.close);
      if (target) closeModal(target);
    });
  });

  // Click outside modal
  document.querySelectorAll(".modal").forEach(modal => {
    modal.addEventListener("click", e => {
      if (e.target === modal) closeModal(modal);
    });
  });

  // Notification close
  const notifClose = document.getElementById("notifClose");
  const notif = document.getElementById("notification");
  if (notifClose && notif) {
    notifClose.addEventListener("click", () => closeModal(notif));
  }

  // Floating Action Button
  const fab = document.getElementById("fab");
  if (fab) {
    fab.addEventListener("click", () => {
      if (!currentUser.value) {
        // If not logged in → show login modal
        const loginModal = document.getElementById("loginModal");
        if (loginModal) openModal(loginModal);
        return;
      }

      // If logged in → decide what to open
      const feed = document.getElementById("feed");
      const qanda = document.getElementById("questionsFeed");

      if (feed && feed.offsetParent !== null) {
        const postModal = document.getElementById("postModal");
        if (postModal) {
          document.getElementById("postTitle").value = "";
          document.getElementById("postContent").value = "";
          openModal(postModal);
        }
      } else if (qanda && qanda.offsetParent !== null) {
        const questionModal = document.getElementById("questionModal");
        if (questionModal) {
          document.getElementById("questionTitleInput").value = "";
          document.getElementById("questionContentInput").value = "";
          openModal(questionModal);
        }
      }
    });
  }
}

// ========================
// THEME
// ========================
export function initTheme() {
  const themeToggle = document.getElementById("themeToggle");
  if (!themeToggle) return;

  const savedTheme = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);

  themeToggle.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
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
