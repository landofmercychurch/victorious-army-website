// loadAndInit.js
async function loadPartial(containerId, path, append = false) {
  const container = document.getElementById(containerId);
  if (!container) return;
  try {
    const res = await fetch(path);
    const html = await res.text();
    if (append) {
      container.innerHTML += html;
    } else {
      container.innerHTML = html;
    }
  } catch (err) {
    console.error(`Failed to load ${path}:`, err);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  // ======================
  // LOAD PARTIAL HTML
  // ======================
  await loadPartial("header", "/partials/header.html");
  await loadPartial("main-layout", "/partials/feed.html");
  await loadPartial("main-layout", "/partials/sidebar.html", true); // append sidebar
  await loadPartial("modals", "/partials/modals.html");
  await loadPartial("notification", "/partials/notification.html");

  const currentUser = { value: null };

  // ======================
  // IMPORT & INIT MODULES
  // ======================
  const [
    { setupAuth },
    { setupModals },
    { renderUsers },
    { renderPosts },
    { renderQuestions },
    { initCommunities },
    { initTags },
    { initComments },
    { initLikes },
    { initFollows },
    { initNotifications },
  ] = await Promise.all([
    import("./auth.js"),
    import("./ui.js"),
    import("./users.js"),
    import("./posts.js"),
    import("./questions.js"),
    import("./communities.js"),
    import("./tags.js"),
    import("./comments.js"),
    import("./likes.js"),
    import("./follows.js"),
    import("./notifications.js"),
  ]);

  // ======================
  // EXECUTE INITIALIZATION
  // ======================
  setupAuth(currentUser);
  setupModals(currentUser);

  renderUsers(document.getElementById("profile"), currentUser);
  renderPosts(document.getElementById("feed"), currentUser, document.getElementById("loginModal"));
  renderQuestions(document.getElementById("questionsFeed"), currentUser, document.getElementById("loginModal"));
  initCommunities(currentUser);
  initTags();
  initComments(currentUser, document.getElementById("loginModal"));
  initLikes();
  initFollows();
  initNotifications();
});