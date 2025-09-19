// questions.js
import {
  API,
  getAuthHeaders,
  showNotification,
  openModal,
  closeModal,
  initials,
} from "./config.js";

export function renderQuestions(feedContainer, currentUser, loginModal) {
  if (!feedContainer) return;

  const questionModal = document.getElementById("questionModal");
  const questionTitleInput = document.getElementById("questionTitleInput");
  const questionContentInput = document.getElementById("questionContentInput");
  const questionPostBtn = document.getElementById("questionPost");

  // -----------------------
  // Open question modal (create mode)
  // -----------------------
  const fab = document.getElementById("fab");
  if (fab) {
    fab.onclick = () => {
      if (!currentUser.value) return openModal(loginModal);
      if (!questionModal) return;

      questionTitleInput.value = "";
      questionContentInput.value = "";

      openModal(questionModal);
    };
  }

  // -----------------------
  // Submit question
  // -----------------------
  if (questionPostBtn) {
    questionPostBtn.onclick = async () => {
      if (!currentUser.value) return openModal(loginModal);

      const title = questionTitleInput.value.trim();
      const content = questionContentInput.value.trim();
      if (!title || !content) return showNotification("Enter title and content");

      questionPostBtn.disabled = true;

      try {
        const res = await fetch(`${API}/questions`, {
          method: "POST",
          headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify({ title, content }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to post question");

        closeModal(questionModal);
        loadQuestions();
        showNotification("Question added ✅");
      } catch (err) {
        showNotification(err.message);
      } finally {
        questionPostBtn.disabled = false;
      }
    };
  }

  // -----------------------
  // Load questions feed
  // -----------------------
  async function loadQuestions() {
    try {
      const res = await fetch(`${API}/questions`, {
        headers: getAuthHeaders(),
      });
      const questions = await res.json();
      if (!res.ok) throw new Error(await res.text());

      feedContainer.innerHTML = "";
      if (!questions.length) {
        feedContainer.innerHTML = "<p>No questions yet. Be the first to ask!</p>";
        return;
      }

      questions.forEach((q) => renderQuestionCard(q));
    } catch (err) {
      feedContainer.innerHTML = `<p style="color:red;">Failed to load questions: ${err.message}</p>`;
    }
  }

  // -----------------------
  // Render single question card
  // -----------------------
  function renderQuestionCard(question) {
    const card = document.createElement("div");
    card.className = "card";

    // Meta section
    const meta = document.createElement("div");
    meta.className = "meta";

    const av = document.createElement("div");
    av.className = "avatar";
    av.textContent = initials(question.user?.username || "U N");

    const who = document.createElement("div");
    who.textContent = `${question.user?.username || "Unknown"} • ${new Date(
      question.created_at
    ).toLocaleString()}`;

    meta.append(av, who);

    // Title
    const h3 = document.createElement("h3");
    h3.textContent = question.title;

    // Preview
    const preview = document.createElement("div");
    preview.className = "preview";
    preview.textContent =
      question.content.length > 180
        ? question.content.slice(0, 180) + "…"
        : question.content;

    // Actions
    const actions = document.createElement("div");
    actions.className = "actions";

    const readBtn = document.createElement("button");
    readBtn.className = "chip";
    readBtn.textContent = "📖 Read more";
    readBtn.onclick = () => openQuestionModal(question);

    actions.append(readBtn);

    // Assemble
    card.append(meta, h3, preview, actions);
    feedContainer.append(card);
  }

  // -----------------------
  // Open question modal (read mode)
  // -----------------------
  function openQuestionModal(question) {
    if (!questionModal) return;

    const titleEl = document.getElementById("questionTitle");
    const bodyEl = document.getElementById("questionBody");
    const answersBox = document.getElementById("answersBox");

    titleEl.textContent = question.title;
    bodyEl.textContent = question.content;
    answersBox.innerHTML = "<p>Loading answers...</p>";

    openModal(questionModal);

    // Load answers (if you implement answers endpoint)
    fetch(`${API}/answers/question/${question.id}`, {
      headers: getAuthHeaders(),
    })
      .then((res) => res.json())
      .then((answers) => {
        answersBox.innerHTML = "";
        if (!answers.length) {
          answersBox.innerHTML = "<p>No answers yet. Be the first!</p>";
          return;
        }
        answers.forEach((a) => {
          const div = document.createElement("div");
          div.className = "answer";
          div.innerHTML = `<strong>${a.user?.username || "Anon"}</strong>: ${a.content}`;
          answersBox.appendChild(div);
        });
      })
      .catch((err) => {
        answersBox.innerHTML = `<p style="color:red;">${err.message}</p>`;
      });
  }

  // Auto-load on mount
  loadQuestions();

  return { loadQuestions };
}