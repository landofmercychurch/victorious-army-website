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
  await loadPartial("qandaFeed", "/partials/qanda.html");
  await loadPartial("mainFeed", "/partials/feed.html");
  await loadPartial("sidebarContainer", "/partials/sidebar.html");
  await loadPartial("modals", "/partials/modals.html");
  await loadPartial("notification", "/partials/notification.html");

  const currentUser = { value: null };
  const loginModal = document.getElementById("loginModal");

  // ======================
  // IMPORT & INIT MODULES
  // ======================
  const [
    { setupAuth },
    { setupModals },
    { renderUsers },
    { renderPosts },
    { renderQandA },
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
    import("./qanda.js"),
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
  setupAuth(currentUser, loginModal);
  setupModals(currentUser);

  renderUsers(document.getElementById("profile"), currentUser);
  renderPosts(document.getElementById("feed"), currentUser, loginModal);
  renderQandA(document.getElementById("questionsFeed"), currentUser, loginModal);
  initCommunities(currentUser);
  initTags();
  initComments(currentUser, loginModal);
  initLikes();
  initFollows();
  initNotifications();
});
