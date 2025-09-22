import { showNotification, closeModal } from "./config.js";

const SUPABASE_URL = "https://igyuswrhfsdbxxgtoody.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlneXVzd3JoZnNkYnh4Z3Rvb2R5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxOTc2NzIsImV4cCI6MjA3Mzc3MzY3Mn0.7ba9HYSvJlGK-9V-VqvEHrn481nSbtHSKiVIt4CdzQM";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

export function setupAuth(currentUser, loginModal, signupModal) {
  const loginBtn = document.getElementById("loginSubmit");
  const signupBtn = document.getElementById("signupSubmit");
  const logoutBtn = document.getElementById("logoutBtn");
  const profileContainer = document.getElementById("profile");
  const postAuthorField = document.getElementById("postAuthor");

  // -----------------------
  // HELPER: update profile UI
  // -----------------------
  function updateProfileUI(user) {
    if (profileContainer) {
      if (user) {
        profileContainer.innerHTML = `
          <div class="profile-card">
            <h3>${user.user_metadata?.username || "Anonymous"}</h3>
            <p>${user.email}</p>
          </div>
        `;
      } else {
        profileContainer.innerHTML = `<p style="color:gray">Not logged in</p>`;
      }
    }

    if (postAuthorField) {
      postAuthorField.value = user?.user_metadata?.username || "";
    }
  }

  // -----------------------
  // HELPER: toggle nav buttons
  // -----------------------
  function toggleAuthUI(isLoggedIn) {
    const navLogin = document.getElementById("loginBtn");
    const navSignup = document.getElementById("signupBtn");

    if (isLoggedIn) {
      navLogin && (navLogin.style.display = "none");
      navSignup && (navSignup.style.display = "none");
      logoutBtn && (logoutBtn.style.display = "inline-block");
    } else {
      navLogin && (navLogin.style.display = "inline-block");
      navSignup && (navSignup.style.display = "inline-block");
      logoutBtn && (logoutBtn.style.display = "none");
    }
  }

  // -----------------------
  // LOGIN
  // -----------------------
  async function login(email, password) {
    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      currentUser.value = data.user;

      if (data.session?.access_token) {
        localStorage.setItem("token", data.session.access_token);
      }

      showNotification("Login successful 🎉");
      closeModal(loginModal);
      toggleAuthUI(true);
      updateProfileUI(data.user);
    } catch (err) {
      showNotification(err.message);
    }
  }

  // -----------------------
  // SIGNUP
  // -----------------------
  async function signup(username, full_name, email, password) {
    try {
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: { data: { username, full_name } },
      });
      if (error) throw error;

      currentUser.value = data.user;

      if (data.session?.access_token) {
        localStorage.setItem("token", data.session.access_token);
      }

      showNotification(
        "Signup successful 🎉 (check your email if confirmation is required)"
      );
      closeModal(signupModal);
      toggleAuthUI(true);
      updateProfileUI(data.user);
    } catch (err) {
      showNotification(err.message);
    }
  }

  // -----------------------
  // LOGOUT
  // -----------------------
  async function logout() {
    try {
      await supabaseClient.auth.signOut();
      localStorage.removeItem("token");
      currentUser.value = null;
      showNotification("Logged out ✅");
      toggleAuthUI(false);
      updateProfileUI(null);
    } catch (err) {
      showNotification(err.message);
    }
  }

  // -----------------------
  // BUTTON EVENTS
  // -----------------------
  if (loginBtn) {
    loginBtn.onclick = () => {
      const email = document.getElementById("loginEmail").value.trim();
      const password = document.getElementById("loginPassword").value.trim();
      if (!email || !password)
        return showNotification("Enter email and password");
      login(email, password);
    };
  }

  if (signupBtn) {
    signupBtn.onclick = () => {
      const username = document
        .getElementById("signupUsername")
        .value.trim();
      const full_name = document
        .getElementById("signupFullname")
        .value.trim();
      const email = document.getElementById("signupEmail").value.trim();
      const password = document.getElementById("signupPassword").value.trim();
      if (!username || !full_name || !email || !password) {
        return showNotification("Fill all signup fields");
      }
      signup(username, full_name, email, password);
    };
  }

  if (logoutBtn) {
    logoutBtn.onclick = logout;
  }

  // -----------------------
  // PERSIST SESSION on refresh
  // -----------------------
  supabaseClient.auth.getSession().then(({ data }) => {
    if (data.session?.user) {
      currentUser.value = data.session.user;
      localStorage.setItem("token", data.session.access_token);
      toggleAuthUI(true);
      updateProfileUI(data.session.user);
    } else {
      toggleAuthUI(false);
      updateProfileUI(null);
    }
  });

  return { login, signup, logout };
}
