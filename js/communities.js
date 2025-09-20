// communities.js
import { API, getAuthHeaders, showNotification } from "./config.js";

export function initCommunities(currentUser) {
  const cList = document.getElementById("communityList");

  // -----------------------
  // Load all communities
  // -----------------------
  async function loadCommunities() {
    if (!cList) return;
    cList.innerHTML = "<p>Loading communities...</p>";

    try {
      const res = await fetch(`${API}/communities`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load communities");

      cList.innerHTML = "";
      if (data.length === 0) {
        cList.innerHTML = "<p>No communities yet.</p>";
        return;
      }

      data.forEach((c) => {
        const div = document.createElement("div");
        div.className = "community";
        div.innerHTML = `<h4>${c.name}</h4><p>${c.description}</p>`;
        cList.appendChild(div);

        // Optional: owner controls if current user is admin or creator
        if (currentUser?.value?.is_admin || currentUser?.value?.id === c.user_id) {
          const editBtn = document.createElement("button");
          editBtn.textContent = "Edit";
          editBtn.className = "btn btn-small";
          // Add edit logic here
          div.appendChild(editBtn);

          const delBtn = document.createElement("button");
          delBtn.textContent = "Delete";
          delBtn.className = "btn btn-small";
          delBtn.onclick = async () => {
            if (!confirm("Delete this community?")) return;
            try {
              const res = await fetch(`${API}/communities/${c.id}`, {
                method: "DELETE",
                headers: getAuthHeaders(),
              });
              if (!res.ok) throw new Error("Failed to delete community");
              showNotification("Community deleted");
              loadCommunities();
            } catch (err) {
              showNotification(err.message);
            }
          };
          div.appendChild(delBtn);
        }
      });
    } catch (err) {
      cList.innerHTML = `<p style="color:red">${err.message}</p>`;
    }
  }

  // Auto-load
  loadCommunities();

  return { loadCommunities };
}