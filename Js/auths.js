import { API, showNotification } from "./config.js";

export function initAuth(currentUser) {
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");

  if (loginForm) {
    loginForm.onsubmit = async (e) => {
      e.preventDefault();
      try {
        const res = await fetch(`${API}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: loginForm.email.value,
            password: loginForm.password.value,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Login failed");
        localStorage.setItem("jwt", data.token);
        currentUser.value = data.user;
        showNotification("Login successful");
        window.location.reload();
      } catch (err) {
        showNotification(err.message);
      }
    };
  }

  if (signupForm) {
    signupForm.onsubmit = async (e) => {
      e.preventDefault();
      try {
        const res = await fetch(`${API}/auth/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: signupForm.username.value,
            email: signupForm.email.value,
            password: signupForm.password.value,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Signup failed");
        localStorage.setItem("jwt", data.token);
        currentUser.value = data.user;
        showNotification("Signup successful");
        window.location.reload();
      } catch (err) {
        showNotification(err.message);
      }
    };
  }
}