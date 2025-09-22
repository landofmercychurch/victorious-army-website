// auth.js
import { showNotification, openModal, closeModal } from "./config.js";

// -----------------------
// Supabase client
// -----------------------
const SUPABASE_URL = "https://igyuswrhfsdbxxgtoody.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlneXVzd3JoZnNkYnh4Z3Rvb2R5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxOTc2NzIsImV4cCI6MjA3Mzc3MzY3Mn0.7ba9HYSvJlGK-9V-VqvEHrn481nSbtHSKiVIt4CdzQM";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// -----------------------
// Update header UI
// -----------------------
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

// -----------------------
// Setup Auth
// -----------------------
export function setupAuth(currentUser, loginModal, signupModal) {
  const loginBtn = document.getElementById("loginSubmit");
  const signupBtn = document.getElementById("signupSubmit");

  // -----------------------
  // LOGIN
  // -----------------------
  async function login(email, password) {
    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      currentUser.value = data.user;

      if (data.session?.access_token) {
        localStorage.setItem("token", data.session.access_token);
      }

      updateHeaderUI(data.user);
      showNotification("Login successful 🎉");
      closeModal(loginModal);
    } catch (err) {
      showNotification(err.message);
    }
  }

  // -----------------------
  // SIGNUP
  // -----------------------
  async function signup(username, full_name, email, password) {
    try {
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: { data: { username, full_name } },
      });
      if (error) throw error;

      currentUser.value = data.user;

      if (data.session?.access_token) {
        localStorage.setItem("token", data.session.access_token);
      }

      updateHeaderUI(data.user);
      showNotification(
        "Signup successful 🎉 (check your email if confirmation is required)"
      );
      closeModal(signupModal);
    } catch (err) {
      showNotification(err.message);
    }
  }

  // -----------------------
  // BUTTON EVENTS
  // -----------------------
  if (loginBtn) {
    loginBtn.onclick = () => {
      const email = document.getElementById("loginEmail").value.trim();
      const password = document.getElementById("loginPassword").value.trim();
      if (!email || !password)
        return showNotification("Enter email and password");
      login(email, password);
    };
  }

  if (signupBtn) {
    signupBtn.onclick = () => {
      const username = document.getElementById("signupUsername").value.trim();
      const full_name = document.getElementById("signupFullname").value.trim();
      const email = document.getElementById("signupEmail").value.trim();
      const password = document.getElementById("signupPassword").value.trim();
      if (!username || !full_name || !email || !password) {
        return showNotification("Fill all signup fields");
      }
      signup(username, full_name, email, password);
    };
  }

  return { login, signup, updateHeaderUI };
}
