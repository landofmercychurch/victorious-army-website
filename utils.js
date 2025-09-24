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