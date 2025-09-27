// utils.js
export function el(tag, className = "", attrs = {}) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  for (const [k,v] of Object.entries(attrs || {})) {
    if (k === "text") e.textContent = v;
    else e.setAttribute(k, v);
  }
  return e;
}

export async function copyToClipboard(text) {
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(text);
    return true;
  }
  // fallback
  const ta = document.createElement("textarea");
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand("copy"); } finally { ta.remove(); }
  return true;
}

export function openWhatsAppShare(text, url) {
  const message = encodeURIComponent(`${text}\n${url}`);
  const wa = `https://wa.me/?text=${message}`;
  window.open(wa, "_blank");
}

export async function universalShare(fallbackText, url) {
  if (navigator.share) {
    try {
      await navigator.share({ title: document.title, text: fallbackText, url });
      return true;
    } catch (err) {
      return false;
    }
  }
  return false;
}

/**
 * Show a simple notification on screen
 */
export function showNotification(message, type = "info") {
  const el = document.createElement("div");
  el.className = `notification ${type}`;
  el.textContent = message;

  // Basic inline styles (you can move to CSS later)
  Object.assign(el.style, {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    background: type === "error" ? "#f44336" :
                type === "success" ? "#4CAF50" :
                "#333",
    color: "#fff",
    padding: "10px 15px",
    borderRadius: "6px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
    zIndex: 9999,
    fontSize: "14px",
    opacity: "0",
    transition: "opacity 0.3s ease-in-out",
  });

  document.body.appendChild(el);

  // Fade in
  requestAnimationFrame(() => {
    el.style.opacity = "1";
  });

  // Auto remove after 3s
  setTimeout(() => {
    el.style.opacity = "0";
    setTimeout(() => el.remove(), 300);
  }, 3000);
}
