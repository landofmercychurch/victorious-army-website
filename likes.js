// js/likes.js
import { api } from "./api.js";

/**
 * Refresh the like count for a specific sermon
 * @param {number|string} sermonId
 * @param {HTMLElement} likeCountEl
 */
export async function refreshLikes(sermonId, likeCountEl) {
  try {
    const res = await api.get(`/likes/count/${sermonId}`);
    likeCountEl.textContent = res.count + " Likes";
  } catch (err) {
    console.error("Failed to fetch like count:", err);
    likeCountEl.textContent = "0 Likes";
  }
}

/**
 * Handle like button click
 * @param {number|string} sermonId
 * @param {HTMLElement} likeCountEl
 */
export async function handleLike(sermonId, likeCountEl) {
  try {
    await api.post("/likes", { postId: sermonId, type: "sermon" });
    refreshLikes(sermonId, likeCountEl);
  } catch (err) {
    console.error("Failed to like sermon:", err);
  }
}
