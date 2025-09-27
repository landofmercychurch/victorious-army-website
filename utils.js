// utils.js

/**
 * Create an element with optional class and attributes/text.
 * @param {string} tag - The HTML tag name.
 * @param {string} className - Optional class name.
 * @param {object|string} attrs - Attributes object or text content.
 * @returns {HTMLElement}
 */
export function el(tag, className = "", attrs = {}) {
  const e = document.createElement(tag);

  // Set class
  if (className) e.className = className;

  // Handle attrs or text
  if (typeof attrs === "string") {
    e.textContent = attrs;
  } else if (typeof attrs === "object" && attrs !== null) {
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "text") e.textContent = v;
      else e.setAttribute(k, v);
    }
  }

  return e;
}

/**
 * Copy text to clipboard (with fallback)
 */
export async function copyToClipboard(text) {
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(text);
    return true;
  }
  const ta = document.createElement("textarea");
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand("copy"); } finally { ta.remove(); }
  return true;
}

/**
 * Open WhatsApp share
 */
export function openWhatsAppShare(text, url) {
  const message = encodeURIComponent(`${text}\n${url}`);
  const wa = `https://wa.me/?text=${message}`;
  window.open(wa, "_blank");
}

/**
 * Universal share using Web Share API or fallback
 */
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
  requestAnimationFrame(() => el.style.opacity = "1");

  // Auto remove after 3s
  setTimeout(() => {
    el.style.opacity = "0";
    setTimeout(() => el.remove(), 300);
  }, 3000);
}
