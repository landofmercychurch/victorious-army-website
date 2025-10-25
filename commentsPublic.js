

// commentsPublic.js
// commentsPublic.js

import { api } from "./api.js";
import { showNotification } from "./utils.js";

/**
 * Fetch comments for a sermon
 */
export async function fetchSermonComments(sermon_id) {
  try {
    const res = await api.get(`/comments/${sermon_id}?type=sermon`);
    return Array.isArray(res) ? res : []; // ✅ always return array
  } catch (err) {
    showNotification?.("Failed to load sermon comments", "error");
    return []; // ✅ fallback empty array
  }
}

/**
 * Fetch comments for a picture post
 */
export async function fetchPictureComments(post_id) {
  try {
    const res = await api.get(`/comments/${post_id}?type=post`);
    return Array.isArray(res) ? res : [];
  } catch (err) {
    showNotification?.("Failed to load post comments", "error");
    return [];
  }
}

/**
 * Post a comment on a sermon
 */
export async function postSermonComment({ sermon_id, name, content }) {
  try {
    const res = await api.post("/comments", {
      sermon_id,
      name,
      content,
    });
    return res;
  } catch (err) {
    showNotification?.("Failed to post sermon comment", "error");
    throw err;
  }
}

/**
 * Post a comment on a picture post
 */
export async function postPictureComment({ post_id, name, content }) {
  try {
    const res = await api.post("/comments", {
      post_id,
      name,
      content,
    });
    return res;
  } catch (err) {
    showNotification?.("Failed to post picture comment", "error");
    throw err;
  }
}
