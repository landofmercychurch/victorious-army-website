import { setupModals, setupHeaderButtons } from "./ui.js";
import { renderUsers } from "./user.js";
import { setupAuth } from "./auth.js";
import { showNotification } from "./config.js";

const currentUser = { value: null };

document.addEventListener("DOMContentLoaded", async () => {
  // Setup modals (login, signup, etc.)
  setupModals(currentUser);

  // Setup header login/signup buttons
  setupHeaderButtons();

  // Attach auth handling
  const loginModal = document.getElementById("loginModal");
  const signupModal = document.getElementById("signupModal");
  setupAuth(currentUser, loginModal, signupModal);

  // Render profile section
  const profileContainer = document.getElementById("profileContainer");
  if (profileContainer) {
    renderUsers(profileContainer, currentUser);
  }

  // 🚫 Remove manual token restore logic here
  // because auth.js already restores session automatically
});
