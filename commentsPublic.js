// commentsPublic.js
import { api } from "./api.js";

/**
 * Fetch comments for a sermon
 */
export async function fetchSermonComments(sermon_id) {
  try {
    const res = await api.get(`/comments/${sermon_id}?type=sermon`);
    return res.data;
  } catch (err) {
    showNotification?.("Failed to load sermon comments", "error");
    throw err;
  }
}

/**
 * Post a comment for a sermon
 */
export async function postSermonComment({ sermon_id, name, content }) {
  try {
    const res = await api.post("/comments/sermon", {
      sermon_id,
      name,
      content,
    });
    return res.data;
  } catch (err) {
    showNotification?.("Failed to post sermon comment", "error");
    throw err;
  }
}

/**
 * Fetch comments for a picture post
 */
export async function fetchPictureComments(post_id) {
  try {
    const res = await api.get(`/comments/${post_id}?type=post`);
    return res.data;
  } catch (err) {
    showNotification?.("Failed to load post comments", "error");
    throw err;
  }
}

/**
 * Post a comment for a picture post
 */
export async function postPictureComment({ post_id, name, content }) {
  try {
    const res = await api.post("/comments/post", {
      post_id,
      name,
      content,
    });
    return res.data;
  } catch (err) {
    showNotification?.("Failed to post picture comment", "error");
    throw err;
  }
}
