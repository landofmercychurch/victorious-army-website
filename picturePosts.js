// picturePosts.js
import { api } from "./api.js";
import { el, openWhatsAppShare, universalShare, copyToClipboard } from "./utils.js";
import { showNotification } from "./config.js";

export async function initPicturePosts(container) {
  if (!container) return;
  container.innerHTML = "<p>Loading posts…</p>";

  try {
    const posts = await api.get("/picture-posts?_embed=comments&_embed=likes"); 
    container.innerHTML = "";

    if (!posts.length) {
      container.innerHTML = "<p>No picture posts yet.</p>";
      return;
    }

    posts.forEach(renderPost);
  } catch (err) {
    container.innerHTML = `<p style="color:red">Failed to load picture posts</p>`;
    console.error(err);
  }

  // Render single post card
  function renderPost(p) {
    const card = el("div", "card picture-post");

    if (p.image_url) {
      card.appendChild(el("img", "post-image", { src: p.image_url, alt: p.caption || "" }));
    }

    card.appendChild(el("p", "caption", { text: p.caption || "" }));

    // Actions row (likes + comments + share)
    const actions = el("div", "actions");

    // Likes
    const likeBtn = el("button", "btn like-btn", { text: `👍 ${p.likes?.length || 0}` });
    likeBtn.onclick = async () => {
      try {
        await api.post(`/picture-posts/${p.id}/like`);
        likeBtn.textContent = `👍 ${p.likes.length + 1}`;
      } catch (e) {
        showNotification("Failed to like");
        console.error(e);
      }
    };

    // Comments toggle
    const commentBtn = el("button", "btn", { text: `💬 ${p.comments?.length || 0}` });
    commentBtn.onclick = () => {
      commentBox.style.display = commentBox.style.display === "none" ? "block" : "none";
    };

    // Share
    const shareBtn = el("button", "btn", { text: "Share" });
    shareBtn.onclick = async () => {
      const url = `${location.origin}/picture-posts/${p.id}`;
      const shared = await universalShare(p.caption || "", url);
      if (!shared) {
        await copyToClipboard(url);
        showNotification("Link copied");
      }
    };

    // WhatsApp Share
    const waBtn = el("button", "btn", { text: "WhatsApp" });
    waBtn.onclick = () => {
      openWhatsAppShare(p.caption || "", `${location.origin}/picture-posts/${p.id}`);
    };

    actions.append(likeBtn, commentBtn, shareBtn, waBtn);
    card.appendChild(actions);

    // Comments section
    const commentBox = el("div", "comments");
    commentBox.style.display = "none";

    // Existing comments
    const commentList = el("div", "comment-list");
    (p.comments || []).forEach(c => {
      const item = el("p", "comment", { text: `${c.name}: ${c.content}` });
      commentList.appendChild(item);
    });

    // New comment form
    const form = el("form", "comment-form");
    const nameInput = el("input", "input", { placeholder: "Your name", required: true });
    const contentInput = el("input", "input", { placeholder: "Write a comment…", required: true });
    const submitBtn = el("button", "btn", { text: "Post" });

    form.append(nameInput, contentInput, submitBtn);

    form.onsubmit = async (e) => {
      e.preventDefault();
      try {
        const newComment = await api.post(`/comments`, {
          post_id: p.id,
          name: nameInput.value,
          content: contentInput.value,
          is_guest: true
        });

        commentList.appendChild(
          el("p", "comment", { text: `${newComment.name}: ${newComment.content}` })
        );
        contentInput.value = "";
        showNotification("Comment added");
      } catch (e) {
        showNotification("Failed to post comment");
        console.error(e);
      }
    };

    commentBox.append(commentList, form);
    card.appendChild(commentBox);

    container.appendChild(card);
  }
}
