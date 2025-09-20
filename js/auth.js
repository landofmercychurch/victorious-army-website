// auth.js
import { API, showNotification, openModal } from "./config.js";

export function setupAuth(currentUser, loginModal) {
  const usernameInput = document.getElementById("authUsername");
  const fullnameInput = document.getElementById("authFullname");
  const emailInput = document.getElementById("authEmail");
  const passwordInput = document.getElementById("authPassword");
  const loginBtn = document.getElementById("loginSubmit");
  const signupBtn = document.getElementById("signupSubmit");
  const authFeedback = document.getElementById("authFeedback");

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

      // Save token & user profile
      localStorage.setItem("token", data.token);
      currentUser.value = data.user;

      authFeedback.textContent = "Login successful 🎉";
      authFeedback.style.color = "green";
      setTimeout(() => closeModal(loginModal), 1000);
    } catch (err) {
      authFeedback.textContent = err.message;
      authFeedback.style.color = "red";
    }
  }

  // -----------------------
  // SIGNUP
  // -----------------------
  async function signup(username, fullname, email, password) {
    try {
      const res = await fetch(`${API}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, fullname, email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Signup failed");

      // Save token & user profile
      localStorage.setItem("token", data.token);
      currentUser.value = data.user;

      authFeedback.textContent = "Signup successful 🎉";
      authFeedback.style.color = "green";
      setTimeout(() => closeModal(loginModal), 1000);
    } catch (err) {
      authFeedback.textContent = err.message;
      authFeedback.style.color = "red";
    }
  }

  // -----------------------
  // Bind buttons
  // -----------------------
  if (loginBtn) {
    loginBtn.onclick = () => {
      const email = emailInput.value.trim();
      const password = passwordInput.value.trim();
      if (!email || !password) return showNotification("Enter email and password");
      login(email, password);
    };
  }

  if (signupBtn) {
    signupBtn.onclick = () => {
      const username = usernameInput.value.trim();
      const fullname = fullnameInput.value.trim();
      const email = emailInput.value.trim();
      const password = passwordInput.value.trim();
      if (!username || !fullname || !email || !password)
        return showNotification("Fill all signup fields");
      signup(username, fullname, email, password);
    };
  }

  return { login, signup };
}
