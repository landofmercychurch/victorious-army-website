// auth.js
import { API, showNotification, openModal, closeModal } from "./config.js";

export function setupAuth(currentUser, loginModal) {
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");

  // -----------------------
  // LOGIN
  // -----------------------
  async function login(email, password) {
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");

      localStorage.setItem("token", data.token);
      currentUser.value = data.user;

      showNotification("Login successful 🎉");
      closeModal(loginModal);
    } catch (err) {
      showNotification(err.message);
    }
  }

  // -----------------------
  // SIGNUP
  // -----------------------
  async function signup(username, email, password) {
    try {
      const res = await fetch(`${API}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Signup failed");

      localStorage.setItem("token", data.token);
      currentUser.value = data.user;

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
      const email = signupForm.querySelector("#signupEmail").value.trim();
      const password = signupForm.querySelector("#signupPassword").value.trim();
      if (!username || !email || !password) return showNotification("Fill all signup fields");
      signup(username, email, password);
    };
  }

  return { login, signup };
}
