// commentsPublic.js
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
