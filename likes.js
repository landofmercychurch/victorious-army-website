// js/likes.js
import { api } from "./api.js";

/**
 * Refresh the like count for a specific picture post
 * @param {string} postId
 * @param {HTMLElement} likeCountEl
 */
export async function refreshPostLikes(postId, likeCountEl) {
  try {
    const res = await api.get(`/likes/count?type=post&post_id=${postId}`);
    likeCountEl.textContent = (res.count || 0) + " Likes";
  } catch (err) {
    console.error("Failed to fetch post like count:", err);
    likeCountEl.textContent = "0 Likes";
  }
}

/**
 * Handle like button click for picture posts
 * @param {string} postId
 * @param {HTMLElement} likeCountEl
 */
export async function handlePostLike(postId, likeCountEl) {
  try {
    await api.post("/likes", { post_id: postId });
    refreshPostLikes(postId, likeCountEl);
  } catch (err) {
    console.error("Failed to like post:", err);
  }
}
