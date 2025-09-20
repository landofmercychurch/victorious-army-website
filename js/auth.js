// auth.js
import { showNotification, openModal, closeModal } from "./config.js";
import { createClient } from "@supabase/supabase-js";

// -----------------------
// Supabase client
// -----------------------
const SUPABASE_URL = "https://your-supabase-url.supabase.co"; // replace with your Supabase URL
const SUPABASE_ANON_KEY = "your-anon-key"; // replace with your anon key
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// -----------------------
// Setup Auth
// -----------------------
export function setupAuth(currentUser, loginModal) {
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");

  // -----------------------
  // LOGIN
  // -----------------------
  async function login(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      currentUser.value = data.user;
      localStorage.setItem("token", data.session?.access_token || "");

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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username, full_name }
        }
      });

      if (error) throw error;

      currentUser.value = data.user;
      localStorage.setItem("token", data.session?.access_token || "");

      showNotification("Signup successful 🎉");
      closeModal(loginModal);
    } catch (err) {
      showNotification(err.message);
    }
  }

  // -----------------------
  // Bind form submissions
  // -----------------------
  if (loginForm) {
    loginForm.onsubmit = (e) => {
      e.preventDefault();
      const email = loginForm.querySelector("#loginEmail").value.trim();
      const password = loginForm.querySelector("#loginPassword").value.trim();
      if (!email || !password) return showNotification("Enter email and password");
      login(email, password);
    };
  }

  if (signupForm) {
    signupForm.onsubmit = (e) => {
      e.preventDefault();
      const username = signupForm.querySelector("#signupUsername").value.trim();
      const full_name = signupForm.querySelector("#signupFullname").value.trim();
      const email = signupForm.querySelector("#signupEmail").value.trim();
      const password = signupForm.querySelector("#signupPassword").value.trim();
      if (!username || !full_name || !email || !password) return showNotification("Fill all signup fields");
      signup(username, full_name, email, password);
    };
  }

  return { login, signup };
}
