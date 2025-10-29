import { api } from "./api.js";
import { el } from "./utils.js";

export async function initMemorials(container) {
  if (!container) return;
  container.innerHTML = "<p>Loading memorials…</p>";

  try {
    const memorials = await api.get("/memorials");
    container.innerHTML = "";

    if (!Array.isArray(memorials) || memorials.length === 0) {
      container.innerHTML = "<p>No memorials yet.</p>";
      return;
    }

    // Sort: latest first
    memorials.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // 🎞️ Story-style Slideshow for first 10
    const storySection = el("div", "memorial-story-section");
    container.appendChild(storySection);
    startStorySlideshow(storySection, memorials.slice(0, 10));

    // 🕊️ Older memorials (static grid)
    if (memorials.length > 10) {
      const older = el("div", "older-memorials");
      const title = el("h3", null, "📸 Older Memories");
      older.appendChild(title);
      memorials.slice(10).forEach(m => older.appendChild(renderMemorial(m, true)));
      container.appendChild(older);
    }

    // 🌸 Ambient background sound
    initAmbientSound(container);

  } catch (err) {
    console.error("Failed to load memorials:", err);
    container.innerHTML = `<p style="color:red">Failed to load memorials.</p>`;
  }
}

/* =====================================
   🎞️ STORY SLIDESHOW (Ken Burns style)
===================================== */
function startStorySlideshow(container, items) {
  let current = 0;
  const img = el("img", "memorial-story-img");
  container.appendChild(img);

  function showNext() {
    const m = items[current];
    if (!m) return;

    img.src = m.image_url;
    img.alt = m.title || "Memorial";

    // Apply random zoom/pan animation
    const zoom = 1.1 + Math.random() * 0.3; // 1.1–1.4x
    const moveX = (Math.random() - 0.5) * 20; // -10% to +10%
    const moveY = (Math.random() - 0.5) * 20;

    img.style.transition = "none";
    img.style.transform = `scale(${zoom}) translate(${moveX}%, ${moveY}%)`;
    img.style.opacity = 0;

    // Small delay for fade-in
    requestAnimationFrame(() => {
      img.style.transition = "transform 10s ease-in-out, opacity 2s ease-in-out";
      img.style.opacity = 1;
      img.style.transform = `scale(${zoom + 0.2}) translate(${moveX / 2}%, ${moveY / 2}%)`;
    });

    // Overlay info
    container.querySelector(".memorial-story-info")?.remove();
    const info = el("div", "memorial-story-info");
    info.innerHTML = `
      <h4>${m.title || "Memorial"}</h4>
      <p>${new Date(m.created_at).toLocaleDateString()}</p>
    `;
    container.appendChild(info);

    // Schedule next transition
    current = (current + 1) % items.length;
    setTimeout(showNext, 10000); // 10s per image
  }

  showNext();
}

/* =====================================
   🖼️ MEMORIAL CARD (used in older section)
===================================== */
function renderMemorial(m, fullWidth = false) {
  const card = el("div", fullWidth ? "memorial-card full" : "memorial-card");
  const img = document.createElement("img");
  img.src = m.image_url || "";
  img.alt = m.title || "Memorial Image";
  img.onclick = () => openPreview(m);
  card.appendChild(img);

  const info = el("div", "memorial-info");
  const title = el("h4", null, m.title || "Memorial");
  const date = el("span", "memorial-date", new Date(m.created_at).toLocaleString());
  info.append(title, date);
  card.appendChild(info);

  return card;
}

/* =====================================
   🕊️ FULLSCREEN PREVIEW
===================================== */
function openPreview(m) {
  const overlay = el("div", "memorial-overlay");
  overlay.innerHTML = `
    <div class="memorial-preview">
      <span class="close-btn">&times;</span>
      <img src="${m.image_url || ""}" alt="${m.title || "Memorial"}" />
      <h4>${m.title || "Memorial"}</h4>
      <p>${new Date(m.created_at).toLocaleString()}</p>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.querySelector(".close-btn").onclick = () => overlay.remove();
  overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
}

/* =====================================
   🎵 AMBIENT SOUND SYSTEM
===================================== */
function initAmbientSound(target) {
  const audio = new Audio("/api/ambient");
  audio.loop = true;
  audio.volume = 0;
  const savedMute = localStorage.getItem("memorialMuted") === "true";
  if (savedMute) audio.muted = true;

  const toggle = document.createElement("button");
  toggle.className = "sound-toggle";
  toggle.innerHTML = audio.muted ? "🔇" : "🎵";
  toggle.onclick = () => {
    audio.muted = !audio.muted;
    localStorage.setItem("memorialMuted", audio.muted);
    toggle.innerHTML = audio.muted ? "🔇" : "🎵";
  };
  document.body.appendChild(toggle);

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !audio.muted) {
          audio.play().catch(() => {});
        } else {
          audio.pause();
        }
      });
    },
    { threshold: 0.3 }
  );
  observer.observe(target);
}
