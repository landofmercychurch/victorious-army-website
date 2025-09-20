export async function loadPartial(id, url) {
  try {
    const res = await fetch(url);
    const html = await res.text();
    const container = document.getElementById(id);
    if (container) container.innerHTML = html;
  } catch (err) {
    console.error(`Failed to load ${url}:`, err);
  }
}

// Load all partials
export async function loadAllPartials() {
  await loadPartial("header", "/partials/header.html");
  await loadPartial("qandaFeed", "/partials/qanda.html");
await loadPartial("mainFeed", "/partials/feed.html");// you can combine feed + sidebar inside feed.html
await loadPartial("sidebarContainer", "/partials/sidebar.html");
await loadPartial("modals", "/partials/modals.html");
await loadPartial("notification", "/partials/notification.html");
  
}

// Automatically load when module is imported
loadAllPartials();
