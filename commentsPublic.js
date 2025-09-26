// commentsPublic.js
import { api } from "./api.js";
import { showNotification } from "./config.js";

/**
 * Post a comment on a sermon
 */
export async function postSermonComment({ name = "Guest", content, sermon_id }) {
  if (!content) throw new Error("No content");
  try {
    return await api.post("/comments", { name, content, sermon_id });
  } catch (err) {
    showNotification?.("Failed to post sermon comment", "error");
    throw err;
  }
}

/**
 * Post a comment on a picture post
 */
export async function postPictureComment({ name = "Guest", content, post_id }) {
  if (!content) throw new Error("No content");
  try {
    return await api.post("/comments", { name, content, post_id });
  } catch (err) {
    showNotification?.("Failed to post post comment", "error");
    throw err;
  }
}
