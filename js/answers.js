// answers.js
import { API, getAuthHeaders, showNotification, openModal, closeModal, initials } from "./config.js";

/**
 * Render answers for a specific question
 * @param {string} questionId - ID of the question
 * @param {object} currentUser - Current logged-in user
 */
export async function renderAnswers(questionId, currentUser) {
  const answersBox = document.getElementById("answersBox");
  const answerInput = document.getElementById("answerInput");
  const answerPostBtn = document.getElementById("answerPostBtn");

  if (!answersBox || !answerInput || !answerPostBtn) return;

  // -----------------------
  // Load answers
  // -----------------------
  async function loadAnswers() {
    answersBox.innerHTML = "<p>Loading answers...</p>";

    try {
      const res = await fetch(`${API}/answers/question/${questionId}`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to fetch answers");

      answersBox.innerHTML = "";
      if (!data.length) {
        answersBox.innerHTML = "<p>No answers yet. Be the first!</p>";
        return;
      }

      data.forEach((answer) => {
        const div = document.createElement("div");
        div.className = "answer";

        const meta = document.createElement("div");
        meta.className = "meta";
        meta.textContent = `${answer.profile?.username || "Anon"} • ${new Date(answer.created_at).toLocaleString()}`;

        const content = document.createElement("div");
        content.textContent = answer.content;

        div.append(meta, content);
        answersBox.appendChild(div);
      });
    } catch (err) {
      answersBox.innerHTML = `<p style="color:red;">${err.message}</p>`;
    }
  }

  // -----------------------
  // Post an answer
  // -----------------------
  answerPostBtn.onclick = async () => {
    if (!currentUser.value) return showNotification("Login to post an answer");

    const content = answerInput.value.trim();
    if (!content) return showNotification("Answer cannot be empty");

    answerPostBtn.disabled = true;

    try {
      const res = await fetch(`${API}/answers/question/${questionId}`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to post answer");

      answerInput.value = "";
      showNotification("Answer posted ✅");
      loadAnswers();
    } catch (err) {
      showNotification(err.message);
    } finally {
      answerPostBtn.disabled = false;
    }
  };

  // Initial load
  loadAnswers();
  return { loadAnswers };
}
