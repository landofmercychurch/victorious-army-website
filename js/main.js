// ==============================
// CORE IMPORTS
// ==============================
import { setupModals, setupHeaderButtons } from "./ui.js";
import { renderUsers } from "./users.js";   // ✅ corrected (users.js)
import { setupAuth } from "./auth.js";
import { showNotification } from "./config.js";
import { initTheme } from "./theme.js";     // ✅ theme support

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
// HEADER UPDATE LOGIC
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

// ==============================
// DOM READY
// ==============================
document.addEventListener("DOMContentLoaded", async () => {
  // Ensure Supabase client exists
  if (!window.supabase) {
    console.error("❌ Supabase client is not initialised. Check your HTML script.");
    return;
  }
  console.log("✅ Supabase client available");

  // Init theme toggle
  initTheme();

  // Setup modals
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

  // Restore session from Supabase
  try {
    const { data, error } = await window.supabase.auth.getUser();
    if (error) throw error;

    if (data.user) {
      currentUser.value = data.user;
      updateHeaderUI(data.user);
      showNotification(`Welcome back, ${data.user.email}`);
    } else {
      updateHeaderUI(null);
    }
  } catch (err) {
    console.warn("⚠️ Could not restore session:", err.message);
    updateHeaderUI(null);
  }

  // Logout button
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await window.supabase.auth.signOut();
      currentUser.value = null;
      localStorage.removeItem("token"); // optional cleanup
      updateHeaderUI(null);
      showNotification("Logged out successfully 👋");
    });
  }
});
