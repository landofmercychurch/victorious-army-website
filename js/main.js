// ==============================
// CORE IMPORTS
// ==============================
import { setupModals, setupHeaderButtons } from "./ui.js";
import { renderUsers } from "./users.js";   // ✅ fixed name
import { setupAuth } from "./auth.js";
import { showNotification } from "./config.js";
import { initTheme } from "./theme.js";
import { supabase } from "./supabaseClient.js"; // ✅ import supabase client

// ==============================
// FEATURE MODULES (side-effect only)
// ==============================
import "./follows.js";
import "./communities.js";
import "./likes.js";
import "./notifications.js";
import "./qanda.js";
import "./posts.js";
import "./tags.js";

// ==============================
// STATE
// ==============================
const currentUser = { value: null };

// ==============================
// DOM READY
// ==============================
document.addEventListener("DOMContentLoaded", async () => {
  // Init theme toggle
  initTheme();

  // Setup modals
  setupModals(currentUser);

  // Setup header login/signup buttons
  setupHeaderButtons();

  // Attach auth handling
  const loginModal = document.getElementById("loginModal");
  const signupModal = document.getElementById("signupModal");
  const { updateHeaderUI } = setupAuth(currentUser, loginModal, signupModal);

  // Render profile section
  const profileContainer = document.getElementById("profileContainer");
  if (profileContainer) {
    renderUsers(profileContainer, currentUser);
  }

  // Restore session from Supabase
  const { data: { user } } = await supabase.auth.getUser(); // ✅ fixed
  if (user) {
    currentUser.value = user;
    updateHeaderUI(user);
    showNotification(`Welcome back, ${user.email}`);
  } else {
    updateHeaderUI(null);
  }

  // Logout button
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await supabase.auth.signOut(); // ✅ fixed
      currentUser.value = null;
      localStorage.removeItem("token"); // optional
      updateHeaderUI(null);
      showNotification("Logged out successfully 👋");
    });
  }
});
