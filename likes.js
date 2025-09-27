// js/likes.js
import { api } from "./api.js";

/**
 * Refresh the like count for a specific sermon
 * @param {string} sermonId
 * @param {HTMLElement} likeCountEl
 */
export async function refreshLikes(sermonId, likeCountEl) {
  try {
    // Use query params instead of path param
    const res = await api.get(`/likes/count?type=sermon&sermon_id=${sermonId}`);
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
    await api.post("/likes", { sermon_id: sermonId }); // post the like
    refreshLikes(sermonId, likeCountEl);
  } catch (err) {
    console.error("Failed to like sermon:", err);
  }
}
