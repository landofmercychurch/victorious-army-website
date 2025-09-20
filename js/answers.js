// answers.js
import { API, getAuthHeaders, showNotification } from "./config.js";

export function renderAnswers(questionId, answersBox, currentUser, loginModal) {
  if (!answersBox) return;

  const answerFormWrap = document.getElementById("answerFormWrap");
  const answerText = document.getElementById("answerText");
  const answerPostBtn = document.getElementById("answerPost");

  // Show login hint if user not logged in
  const answerHint = document.getElementById("answerHint");
  if (!currentUser.value) {
    if (answerFormWrap) answerFormWrap.style.display = "none";
    if (answerHint) answerHint.style.display = "block";
  } else {
    if (answerFormWrap) answerFormWrap.style.display = "flex";
    if (answerHint) answerHint.style.display = "none";
  }

  // -----------------------
  // Load answers
  // -----------------------
  async function loadAnswers() {
    answersBox.innerHTML = "<p>Loading answers...</p>";
    try {
      const res = await fetch(`${API}/answers/question/${questionId}`, {
        headers: getAuthHeaders(),
      });
      const answers = await res.json();
      if (!res.ok) throw new Error(answers.error || "Failed to load answers");

      answersBox.innerHTML = "";
      if (!answers.length) {
        answersBox.innerHTML = "<p>No answers yet. Be the first!</p>";
        return;
      }

      answers.forEach((a) => {
        const div = document.createElement("div");
        div.className = "answer";
        div.innerHTML = `<strong>${a.profiles?.username || "Anon"}</strong>: ${a.content}`;
        answersBox.appendChild(div);
      });
    } catch (err) {
      answersBox.innerHTML = `<p style="color:red;">${err.message}</p>`;
    }
  }

  // -----------------------
  // Post new answer
  // -----------------------
  if (answerPostBtn) {
    answerPostBtn.onclick = async () => {
      if (!currentUser.value) return openModal(loginModal);

      const content = answerText.value.trim();
      if (!content) return showNotification("Write an answer first");

      answerPostBtn.disabled = true;

      try {
        const res = await fetch(`${API}/answers`, {
          method: "POST",
          headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify({ question_id: questionId, content }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to post answer");

        answerText.value = "";
        loadAnswers();
        showNotification("Answer posted ✅");
      } catch (err) {
        showNotification(err.message);
      } finally {
        answerPostBtn.disabled = false;
      }
    };
  }

  // Initial load
  loadAnswers();

  return { loadAnswers };
}
