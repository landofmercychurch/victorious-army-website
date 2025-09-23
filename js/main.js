// ==============================
// CORE IMPORTS
// ==============================
import { setupModals, setupHeaderButtons } from "./ui.js";
import { renderUsers } from "./users.js";
import { setupAuth } from "./auth.js";
import { showNotification, API } from "./config.js";  // ✅ include API
import { initTheme } from "./theme.js";
import { supabase } from "./supabaseClient.js";

// ==============================
// FEATURE MODULES
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
// FETCH POSTS
// ==============================
async function fetchPosts() {
  try {
    const res = await fetch(`${API}/posts`);
    if (!res.ok) throw new Error("Failed to fetch posts");
    const posts = await res.json();
    renderPosts(posts);
  } catch (err) {
    console.error("❌ Error loading posts:", err);
    showNotification("Could not load posts.");
  }
}

function renderPosts(posts) {
  const feed = document.getElementById("mainFeed");
  if (!feed) return;

  feed.innerHTML = posts.map(post => `
    <div class="post">
      <div class="post-header">
        <strong>${post.author?.name || "Anonymous"}</strong>
        <span class="date">${new Date(post.created_at).toLocaleString()}</span>
      </div>
      <div class="post-content">${post.content || ""}</div>
    </div>
  `).join("");
}

// ==============================
// DOM READY
// ==============================
document.addEventListener("DOMContentLoaded", async () => {
  initTheme();
  setupModals(currentUser);
  setupHeaderButtons();

  const loginModal = document.getElementById("loginModal");
  const signupModal = document.getElementById("signupModal");
  const { updateHeaderUI } = setupAuth(currentUser, loginModal, signupModal);

  const profileContainer = document.getElementById("profileContainer");
  if (profileContainer) {
    renderUsers(profileContainer, currentUser);
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    currentUser.value = user;
    updateHeaderUI(user);
    showNotification(`Welcome back, ${user.email}`);
  } else {
    updateHeaderUI(null);
  }

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await supabase.auth.signOut();
      currentUser.value = null;
      localStorage.removeItem("token");
      updateHeaderUI(null);
      showNotification("Logged out successfully 👋");
    });
  }

  // ✅ Load posts once everything is ready
  fetchPosts();
});
