export const API = "https://insight-backend-gubm.onrender.com/api";

// Get headers with token
export function getAuthHeaders() {
  const token = localStorage.getItem("token"); // unified key
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Show notification message with fade effect
export function showNotification(msg) {
  const notif = document.getElementById("notification");
  const notifText = document.getElementById("notifText");
  if (!notif || !notifText) return;

  notifText.textContent = msg;
  notif.style.opacity = 0;
  notif.style.display = "flex";

  // Fade in
  let opacity = 0;
  const fadeIn = setInterval(() => {
    opacity += 0.1;
    notif.style.opacity = opacity;
    if (opacity >= 1) clearInterval(fadeIn);
  }, 20);

  // Auto fade out after 4s
  setTimeout(() => {
    let fadeOutOpacity = 1;
    const fadeOut = setInterval(() => {
      fadeOutOpacity -= 0.05;
      notif.style.opacity = fadeOutOpacity;
      if (fadeOutOpacity <= 0) {
        clearInterval(fadeOut);
        notif.style.display = "none";
      }
    }, 20);
  }, 4000);
}

// Open modal with fade-in
export function openModal(el) {
  if (!el) return;
  el.style.display = "flex";
  el.style.opacity = 0;
  let opacity = 0;
  const fadeIn = setInterval(() => {
    opacity += 0.05;
    el.style.opacity = opacity;
    if (opacity >= 1) clearInterval(fadeIn);
  }, 10);
}

// Close modal with fade-out
export function closeModal(el) {
  if (!el) return;
  let opacity = 1;
  const fadeOut = setInterval(() => {
    opacity -= 0.05;
    el.style.opacity = opacity;
    if (opacity <= 0) {
      clearInterval(fadeOut);
      el.style.display = "none";
    }
  }, 10);
}

// Generate initials from a name
export function initials(name) {
  return (name || "U N")
    .split(" ")
    .map((n) => n[0]?.toUpperCase())
    .join("")
    .slice(0, 2);
}