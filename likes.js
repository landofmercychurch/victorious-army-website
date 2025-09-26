// js/likes.js
import { api } from "./api.js";

/**
 * Refresh the like count for a specific sermon
 * @param {string} sermonId
 * @param {HTMLElement} likeCountEl
 */
export async function refreshLikes(sermonId, likeCountEl) {
  try {
    const res = await api.get(`/likes/count/${sermonId}?type=sermon`);
    likeCountEl.textContent = (res.count || 0) + " Likes";
  } catch (err) {
    console.error("Failed to fetch like count:", err);
    likeCountEl.textContent = "0 Likes";
  }
}

/**
 * Handle like button click for sermons
 * @param {string} sermonId
 * @param {HTMLElement} likeCountEl
 */
export async function handleLike(sermonId, likeCountEl) {
  try {
    await api.post("/likes", { sermon_id: sermonId }); // 👈 sermon_id only
    refreshLikes(sermonId, likeCountEl);
  } catch (err) {
    console.error("Failed to like sermon:", err);
  }
}
