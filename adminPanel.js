import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://lsjtgjpugwydzqjzzssl.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzanRnanB1Z3d5ZHpxanp6c3NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2NzU5MjAsImV4cCI6MjA3NDI1MTkyMH0.E6Ycr-X3UXnZJ7vDKaVG7RNpOmded8bcqQzxpMwosgI"; // Can be public for frontend
export const supabase = createClient(supabaseUrl, supabaseKey);

const adminPanel = document.getElementById("adminPanel");
const adminLoginDiv = document.getElementById("adminLogin");
const adminControlsDiv = document.getElementById("adminControls");
const loginBtn = document.getElementById("adminLoginBtn");
const loginError = document.getElementById("adminLoginError");

let currentUser = null;

// Admin Login
loginBtn.addEventListener("click", async () => {
  const email = document.getElementById("adminEmail").value;
  const password = document.getElementById("adminPassword").value;

  const { data: user, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    loginError.textContent = error.message;
    return;
  }

  // Check if user is admin
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.user.id)
    .single();

  if (profileErr || !profile?.is_admin) {
    loginError.textContent = "You are not an admin";
    return;
  }

  currentUser = user.user;
  adminLoginDiv.style.display = "none";
  adminControlsDiv.style.display = "block";
  console.log("Admin logged in:", currentUser.email);
});

// Example: load sermons (admin)
document.getElementById("loadSermonsBtn").addEventListener("click", async () => {
  const { data, error } = await supabase
    .from("sermons")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    alert(error.message);
    return;
  }

  const container = document.getElementById("sermonAdminList");
  container.innerHTML = data.map(s => `
    <div>
      <strong>${s.title}</strong> 
      <button onclick="deleteSermon('${s.id}')">Delete</button>
    </div>
  `).join("");
});

// Delete sermon
window.deleteSermon = async (id) => {
  if (!confirm("Delete this sermon?")) return;

  const { error } = await supabase.from("sermons").delete().eq("id", id);
  if (error) return alert(error.message);

  alert("Deleted successfully");
  document.getElementById("loadSermonsBtn").click(); // Refresh list
};
