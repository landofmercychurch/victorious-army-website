// js/dailyVerse.js
import { db } from "./firebaseConfig.js";
import { collection, query, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

export async function initDailyVerse(container) {
  if (!container) return;
  container.innerHTML = "<p>Loading daily verse…</p>";

  try {
    const q = query(collection(db, "daily_verses"), orderBy("created_at", "desc"), limit(1));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      container.innerHTML = "<p>No verse uploaded yet.</p>";
      return;
    }

    const doc = snapshot.docs[0].data();

    container.innerHTML = `
      <div class="verse-card">
        <h3>${doc.reference}</h3>
        <p class="verse-text">${doc.text}</p>
      </div>
    `;
  } catch (err) {
    console.error("Error loading daily verse:", err);
    container.innerHTML = `<p style="color:red;">Failed to load verse.</p>`;
  }
}

// Auto-run on load
document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("dailyVerseContainer");
  initDailyVerse(container);
});
