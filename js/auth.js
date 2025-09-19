// auth.js
import { API, showNotification } from "./config.js";

export function setupAuth(currentUser) {
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

      // Save token & user
      localStorage.setItem("token", data.token);
      currentUser.value = data.user;

      showNotification("Login successful 🎉");
      window.location.href = "/"; // redirect home
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

      // Save token & user
      localStorage.setItem("token", data.token);
      currentUser.value = data.user;

      showNotification("Signup successful 🎉");
      window.location.href = "/";
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
      login(loginForm.email.value, loginForm.password.value);
    };
  }

  if (signupForm) {
    signupForm.onsubmit = (e) => {
      e.preventDefault();
      signup(signupForm.username.value, signupForm.email.value, signupForm.password.value);
    };
  }

  // -----------------------
  // Return functions for external use
  // -----------------------
  return { login, signup };
}
