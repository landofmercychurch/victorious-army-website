// commentsPublic.js
import { api } from "./api.js";
import { showNotification } from "./config.js";

export async function postGuestComment({ name, content, target_type, target_id }) {
  if (!content) throw new Error("No content");
  return api.post("/comments", { name, content, target_type, target_id });
}