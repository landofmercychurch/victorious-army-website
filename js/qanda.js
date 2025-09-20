// qanda.js
import { API, getAuthHeaders, showNotification, openModal, closeModal, initials } from "./config.js";

export function renderQandA(feedContainer, currentUser, loginModal) {
  if (!feedContainer) return;

  const questionModal = document.getElementById("questionModal");
  const questionTitleInput = document.getElementById("questionTitleInput");
  const questionContentInput = document.getElementById("questionContentInput");
  const questionPostBtn = document.getElementById("questionPost");

  const answersBox = document.getElementById("answersBox");
  const answerFormWrap = document.getElementById("answerFormWrap");
  const answerText = document.getElementById("answerText");
  const answerPostBtn = document.getElementById("answerPost");
  const answerHint = document.getElementById("answerHint");

  const fab = document.getElementById("fab");

  // -----------------------
  // Open question modal (create mode)
  // -----------------------
  if (fab) {
    fab.onclick = () => {
      if (!currentUser.value) return openModal(loginModal);
      if (!questionModal) return;

      questionTitleInput.value = "";
      questionContentInput.value = "";

      document.getElementById("questionCreate").style.display = "block";
      document.getElementById("questionRead").style.display = "none";

      openModal(questionModal);
    };
  }

  // -----------------------
  // Post a new question
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
          body: JSON.stringify({ title, details: content }),
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
  // Load questions
  // -----------------------
  async function loadQuestions() {
    try {
      const res = await fetch(`${API}/questions`, { headers: getAuthHeaders() });
      const questions = await res.json();
      if (!res.ok) throw new Error(await res.text());

      feedContainer.innerHTML = "";
      if (!questions.length) {
        feedContainer.innerHTML = "<p>No questions yet. Be the first to ask!</p>";
        return;
      }

      questions.forEach(renderQuestionCard);
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

    const meta = document.createElement("div");
    meta.className = "meta";

    const av = document.createElement("div");
    av.className = "avatar";
    av.textContent = initials(question.profiles?.username || "U N");

    const who = document.createElement("div");
    who.textContent = `${question.profiles?.username || "Unknown"} • ${new Date(question.created_at).toLocaleString()}`;

    meta.append(av, who);

    const h3 = document.createElement("h3");
    h3.textContent = question.title;

    const preview = document.createElement("div");
    preview.className = "preview";
    preview.textContent = question.details.length > 180
      ? question.details.slice(0, 180) + "…"
      : question.details;

    const actions = document.createElement("div");
    actions.className = "actions";

    const readBtn = document.createElement("button");
    readBtn.className = "chip";
    readBtn.textContent = "📖 Read more";
    readBtn.onclick = () => openQuestionModal(question);

    actions.append(readBtn);
    card.append(meta, h3, preview, actions);
    feedContainer.append(card);
  }

  // -----------------------
  // Open question modal (read mode) + load answers
  // -----------------------
  function openQuestionModal(question) {
    if (!questionModal) return;

    document.getElementById("questionCreate").style.display = "none";
    document.getElementById("questionRead").style.display = "block";

    document.getElementById("questionTitle").textContent = question.title;
    document.getElementById("questionBody").textContent = question.details;

    openModal(questionModal);

    renderAnswers(question.id);
  }

  // -----------------------
  // Load & post answers
  // -----------------------
  function renderAnswers(questionId) {
    if (!answersBox) return;

    // Show/hide answer form
    answerFormWrap.style.display = currentUser.value ? "flex" : "none";
    answerHint.style.display = currentUser.value ? "none" : "block";

    // Clear previous click to avoid duplicates
    answerPostBtn.onclick = null;

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

        answers.forEach(a => {
          const div = document.createElement("div");
          div.className = "answer";
          div.innerHTML = `<strong>${a.profiles?.username || "Anon"}</strong>: ${a.content}`;
          answersBox.appendChild(div);
        });
      } catch (err) {
        answersBox.innerHTML = `<p style="color:red;">${err.message}</p>`;
      }
    }

    // Post answer
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

    loadAnswers();
  }

  // -----------------------
  // Initialize
  // -----------------------
  loadQuestions();

  return { loadQuestions };
}
