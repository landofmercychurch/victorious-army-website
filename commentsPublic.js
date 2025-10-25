#//commentsPublic.js
import { api } from "./api.js";
import { showNotification } from "./utils.js";

/**
 * Safely parse API responses to arrays
 */
function toArray(data) {
  if (!data) return [];
  return Array.isArray(data) ? data : (data.data && Array.isArray(data.data)) ? data.data : [];
}

/**
 * Fetch comments for a sermon
 */
export async function fetchSermonComments(sermon_id) {
  try {
    const res = await api.get(`/comments/${sermon_id}?type=sermon`);
    return toArray(res);
  } catch (err) {
    console.error("❌ Failed to fetch sermon comments:", err);
    showNotification?.("Failed to load sermon comments", "error");
    return [];
  }
}

/**
 * Fetch comments for a picture post
 */
export async function fetchPictureComments(post_id) {
  try {
    const res = await api.get(`/comments/${post_id}?type=post`);
    return toArray(res);
  } catch (err) {
    console.error("❌ Failed to fetch picture post comments:", err);
    showNotification?.("Failed to load post comments", "error");
    return [];
  }
}

/**
 * Post a comment on a sermon
 */
export async function postSermonComment({ sermon_id, name, content }) {
  try {
    if (!content?.trim()) throw new Error("Comment content is required");
    const res = await api.post("/comments", {
      sermon_id,
      name: name?.trim() || "Guest",
      content: content.trim(),
    });
    showNotification?.("Comment posted successfully", "success");
    return res;
  } catch (err) {
    console.error("❌ Failed to post sermon comment:", err);
    showNotification?.("Failed to post sermon comment", "error");
    throw err;
  }
}

/**
 * Post a comment on a picture post
 */
export async function postPictureComment({ post_id, name, content }) {
  try {
    if (!content?.trim()) throw new Error("Comment content is required");
    const res = await api.post("/comments", {
      post_id,
      name: name?.trim() || "Guest",
      content: content.trim(),
    });
    showNotification?.("Comment posted successfully", "success");
    return res;
  } catch (err) {
    console.error("❌ Failed to post picture comment:", err);
    showNotification?.("Failed to post picture comment", "error");
    throw err;
  }
}
