// config.js
export const API = "https://insight-backend-gubm.onrender.com/api";

export function getAuthHeaders() {
  const token = localStorage.getItem("jwt");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function showNotification(msg) {
  const notif = document.getElementById("notification");
  const notifText = document.getElementById("notifText");
  if (!notif || !notifText) return;
  notifText.textContent = msg;
  notif.style.display = "flex";
  setTimeout(() => {
    notif.style.display = "none";
  }, 4000);
}

export function openModal(el) { if (el) el.style.display = "flex"; }
export function closeModal(el) { if (el) el.style.display = "none"; }

export function initials(name) {
  return (name || "U N")
    .split(" ")
    .map((n) => n[0]?.toUpperCase())
    .join("")
    .slice(0, 2);
}