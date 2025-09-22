// /js/auth.js (frontend)
// Responsible for signup + login using the Supabase browser client.

import { showNotification, openModal, closeModal } from "./config.js";

/*
  IMPORTANT:
  - This file assumes you've included the Supabase browser bundle BEFORE your module scripts:
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js"></script>
    <script type="module" src="/js/main.js"></script>
  - The global provided by that script is `supabase` (non-module). We create a client once here.
*/

const SUPABASE_URL = "https://xasbpjtbwttgguhidoek.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhhc2JwanRid3R0Z2d1aGlkb2VrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1NzM4NTgsImV4cCI6MjA3NDE0OTg1OH0.rU1K36EV6ly3ikx_1BDUl5V0ok-FCzitDyDP0-0bJyk";

// Create client (only once). `supabase` must exist from the CDN script.
if (!window.supabase || typeof window.supabase.createClient !== "function") {
  console.error("Supabase global not found. Make sure you included the CDN script BEFORE your module scripts.");
  // We still set a fallback so imports won't explode — functions will throw later if used.
}
const supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

// small helper to safely call showNotification
function notifySafe(msg) { try { showNotification(msg); } catch(e){ console.warn(e); } }

// Update header behavior and visible buttons
function updateHeaderUI(user) {
  const loginBtn = document.getElementById("loginBtn");
  const signupBtn = document.getElementById("signupBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const userMenu = document.getElementById("userMenu");
  const userInitials = document.getElementById("userInitials");
  const userName = document.getElementById("userName");

  if (user) {
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
    if (loginBtn) loginBtn.style.display = "inline-block";
    if (signupBtn) signupBtn.style.display = "inline-block";
    if (logoutBtn) logoutBtn.style.display = "none";
    if (userMenu) userMenu.style.display = "none";
  }
}

// Public setup function
export function setupAuth(currentUser = { value: null }, loginModal = null, signupModal = null) {
  if (!supabase) {
    console.error("Supabase client not initialized. Auth will not work.");
  }

  const loginBtn = document.getElementById("loginSubmit");
  const signupBtn = document.getElementById("signupSubmit");

  // LOGIN
  async function login(email, password) {
    if (!supabase) return notifySafe("Auth not available");
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      currentUser.value = data.user || null;
      // Supabase client stores session automatically. Save token optionally for fetch() usage.
      if (data.session?.access_token) localStorage.setItem("token", data.session.access_token);

      updateHeaderUI(currentUser.value);
      notifySafe("Login successful 🎉");
      if (loginModal) closeModal(loginModal);
    } catch (err) {
      notifySafe(err.message || "Login failed");
    }
  }

  // SIGNUP
  async function signup(username, full_name, email, password) {
    if (!supabase) return notifySafe("Auth not available");
    try {
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { data: { username, full_name } }
      });
      if (error) throw error;

      currentUser.value = data.user || null;
      if (data.session?.access_token) localStorage.setItem("token", data.session.access_token);

      updateHeaderUI(currentUser.value);
      notifySafe("Signup successful — check your email if confirmation required");
      if (signupModal) closeModal(signupModal);
    } catch (err) {
      notifySafe(err.message || "Signup failed");
    }
  }

  // Hook modal buttons
  if (loginBtn) {
    loginBtn.onclick = () => {
      const email = document.getElementById("loginEmail").value.trim();
      const password = document.getElementById("loginPassword").value.trim();
      if (!email || !password) return notifySafe("Enter email and password");
      login(email, password);
    };
  }
  if (signupBtn) {
    signupBtn.onclick = () => {
      const username = document.getElementById("signupUsername").value.trim();
      const full_name = document.getElementById("signupFullname").value.trim();
      const email = document.getElementById("signupEmail").value.trim();
      const password = document.getElementById("signupPassword").value.trim();
      if (!username || !full_name || !email || !password) return notifySafe("Fill all signup fields");
      signup(username, full_name, email, password);
    };
  }

  // Restore existing session (if any) and update header
  (async () => {
    if (!supabase) return;
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        // Not fatal; just log
        console.warn("supabase.auth.getUser error:", error.message || error);
      } else if (user) {
        currentUser.value = user;
        updateHeaderUI(user);
      } else {
        updateHeaderUI(null);
      }
    } catch (err) {
      console.warn("session restore error", err.message);
      updateHeaderUI(null);
    }
  })();

  // Return actions for callsites
  return { login, signup, updateHeaderUI };
}
