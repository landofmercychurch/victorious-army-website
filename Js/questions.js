import { API, getAuthHeaders, showNotification } from "./config.js";

export function initQuestions(currentUser, loginModal) {
  const qForm = document.getElementById("questionForm");
  const qList = document.getElementById("questionList");

  if (qForm) {
    qForm.onsubmit = async (e) => {
      e.preventDefault();
      if (!currentUser.value) return openModal(loginModal);
      try {
        const res = await fetch(`${API}/questions`, {
          method: "POST",
          headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify({
            title: qForm.title.value,
            content: qForm.content.value,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to add question");
        showNotification("Question added");
        qForm.reset();
        loadQuestions();
      } catch (err) {
        showNotification(err.message);
      }
    };
  }

  async function loadQuestions() {
    if (!qList) return;
    try {
      const res = await fetch(`${API}/questions`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load questions");
      qList.innerHTML = "";
      data.forEach((q) => {
        const div = document.createElement("div");
        div.className = "question";
        div.innerHTML = `<h4>${q.title}</h4><p>${q.content}</p>`;
        qList.appendChild(div);
      });
    } catch (err) {
      qList.innerHTML = `<p style="color:red">${err.message}</p>`;
    }
  }

  loadQuestions();
}