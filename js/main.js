// main.js
import { setupModals, setupHeaderButtons } from "./ui.js";
import { renderUsers } from "./users.js";
import { setupAuth } from "./auth.js";
import { showNotification } from "./config.js";

const currentUser = { value: null };

// ==============================
// Update header based on auth state
// ==============================
function updateHeaderUI(user) {
  const loginBtn = document.getElementById("loginBtn");
  const signupBtn = document.getElementById("signupBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const userMenu = document.getElementById("userMenu");
  const userInitials = document.getElementById("userInitials");
  const userName = document.getElementById("userName");

  if (user) {
    // Logged in
    if (loginBtn) loginBtn.style.display = "none";
    if (signupBtn) signupBtn.style.display = "none";
    if (logoutBtn) logoutBtn.style.display = "inline-block";
    if (userMenu) userMenu.style.display = "flex";

    if (userInitials) {
      const initials = (user.user_metadata?.username || user.email || "U")
        .slice(0, 2)
        .toUpperCase();
      userInitials.textContent = initials;
    }
    if (userName) {
      userName.textContent =
        user.user_metadata?.full_name ||
        user.user_metadata?.username ||
        user.email;
    }
  } else {
    // Logged out
    if (loginBtn) loginBtn.style.display = "inline-block";
    if (signupBtn) signupBtn.style.display = "inline-block";
    if (logoutBtn) logoutBtn.style.display = "none";
    if (userMenu) userMenu.style.display = "none";
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  // Setup modals (login, signup, etc.)
  setupModals(currentUser);

  // Setup header login/signup buttons
  setupHeaderButtons();

  // Attach auth handling
  const loginModal = document.getElementById("loginModal");
  const signupModal = document.getElementById("signupModal");
  const { login, signup } = setupAuth(currentUser, loginModal, signupModal);

  // Render profile section
  const profileContainer = document.getElementById("profileContainer");
  if (profileContainer) {
    renderUsers(profileContainer, currentUser);
  }

  // 🔑 Restore session if available (handled by Supabase)
  const { data: { user } } = await window.supabase.auth.getUser();
  if (user) {
    currentUser.value = user;
    updateHeaderUI(user);
    showNotification(`Welcome back, ${user.email}`);
  } else {
    updateHeaderUI(null);
  }

  // 🔴 Hook up logout button
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await window.supabase.auth.signOut();
      currentUser.value = null;
      localStorage.removeItem("token"); // optional
      updateHeaderUI(null);
      showNotification("Logged out successfully 👋");
    });
  }
});
