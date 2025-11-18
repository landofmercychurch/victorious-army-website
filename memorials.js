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
   🎞️ STORY SLIDESHOW (with multi-image + sound)
===================================== */
function startStorySlideshow(container, items) {
  let current = 0;
  const img = el("img", "memorial-story-img");
  container.appendChild(img);

  const audio = new Audio();
  audio.volume = 0.7;

  function showNext() {
    const m = items[current];
    if (!m) return;

    const images = Array.isArray(m.images) ? m.images : [];
    const sounds = Array.isArray(m.sounds) ? m.sounds : [];

    let imgIndex = 0;

    function showImage() {
      if (!images[imgIndex]) return;

      img.src = images[imgIndex].url;
      img.alt = m.title || "Memorial";
      img.style.opacity = 0;

      img.onload = () => {
        const zoom = 1.1 + Math.random() * 0.3;
        const moveX = (Math.random() - 0.5) * 20;
        const moveY = (Math.random() - 0.5) * 20;

        requestAnimationFrame(() => {
          img.style.transition = "transform 10s ease-in-out, opacity 1s ease-in-out";
          img.style.opacity = 1;
          img.style.transform = `scale(${zoom}) translate(${moveX}%, ${moveY}%)`;
        });
      };

      imgIndex++;
      if (imgIndex < images.length) {
        setTimeout(showImage, 8000); // 8s per image
      } else {
        current = (current + 1) % items.length;
        setTimeout(showNext, 1000);
      }
    }

    // Play associated sound if exists
    if (sounds.length > 0) {
      audio.src = sounds[0].url; // first sound for now
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }

    // Overlay info
    container.querySelector(".memorial-story-info")?.remove();
    const info = el("div", "memorial-story-info");
    info.innerHTML = `
      <h4>${m.title || "Memorial"}</h4>
      <p>${new Date(m.created_at).toLocaleDateString()}</p>
    `;
    container.appendChild(info);

    showImage();
  }

  showNext();
}

/* =====================================
   🖼️ MEMORIAL CARD (used in older section)
===================================== */
function renderMemorial(m, fullWidth = false) {
  const card = el("div", fullWidth ? "memorial-card full" : "memorial-card");

  // Slideshow for images in card
  const images = Array.isArray(m.images) ? m.images : [];
  const imgEl = el("img", "memorial-card-img");
  imgEl.src = images.length ? images[0].url : "";
  imgEl.alt = m.title || "Memorial Image";
  card.appendChild(imgEl);

  // Simple slideshow
  if (images.length > 1) {
    let idx = 0;
    setInterval(() => {
      idx = (idx + 1) % images.length;
      imgEl.src = images[idx].url;
    }, 5000); // 5s per image
  }

  const info = el("div", "memorial-info");
  const title = el("h4", null, m.title || "Memorial");
  const date = el("span", "memorial-date", new Date(m.created_at).toLocaleString());
  info.append(title, date);
  card.appendChild(info);

  return card;
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
