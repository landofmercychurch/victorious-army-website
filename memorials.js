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

    // 🎞️ Shuffle memorials by date
    memorials.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    // Carousel container (first 10)
    const carousel = el("div", "memorial-carousel");
    memorials.slice(0, 10).forEach(m => carousel.appendChild(renderMemorial(m)));
    container.appendChild(carousel);

    // Older memorials
    if (memorials.length > 10) {
      const older = el("div", "older-memorials");
      const title = el("h3", null, "🕊️ Older Memorials");
      older.appendChild(title);
      memorials.slice(10).forEach(m => older.appendChild(renderMemorial(m, true)));
      container.appendChild(older);
    }

    // 🌸 Initialize ambient sound and observer
    initAmbientSound(container);

  } catch (err) {
    console.error("Failed to load memorials:", err);
    container.innerHTML = `<p style="color:red">Failed to load memorials.</p>`;
  }
}

function renderMemorial(m, fullWidth = false) {
  const card = el("div", fullWidth ? "memorial-card full" : "memorial-card");

  // Image
  const img = document.createElement("img");
  img.src = m.image_url || "";
  img.alt = m.title || "Memorial Image";
  img.className = "memorial-image motion";
  img.onclick = () => openPreview(m);
  card.appendChild(img);

  // Info
  const info = el("div", "memorial-info");
  const title = el("h4", null, m.title || "Memorial");
  const date = el("span", "memorial-date", new Date(m.created_at).toLocaleString());
  info.append(title, date);
  card.appendChild(info);

  return card;
}

// 🕊️ Fullscreen preview
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

  // 🎚️ Fade-in function
  function fadeIn() {
    let v = 0;
    const fade = setInterval(() => {
      if (v < 1 && !audio.muted) {
        v += 0.05;
        audio.volume = Math.min(v, 1);
      } else clearInterval(fade);
    }, 200);
  }

  // 🎵 Sound toggle button
  const toggle = document.createElement("button");
  toggle.className = "sound-toggle";
  toggle.innerHTML = audio.muted ? "🔇" : "🎵";
  toggle.onclick = () => {
    audio.muted = !audio.muted;
    localStorage.setItem("memorialMuted", audio.muted);
    toggle.innerHTML = audio.muted ? "🔇" : "🎵";
  };
  document.body.appendChild(toggle);

  // 👀 Intersection Observer: play only when section visible
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !audio.muted) {
          audio.play().then(fadeIn).catch(() => {});
        } else {
          audio.pause();
        }
      });
    },
    { threshold: 0.3 }
  );
  observer.observe(target);
}
