// api.js
export const API = "https://victorious-army-backend.onrender.com/api"; // change if needed

async function request(path, opts = {}) {
  const url = `${API}${path}`;
  const res = await fetch(url, opts);
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const err = new Error(data?.error || res.statusText || "Request failed");
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body, headers = {}) =>
    request(path, { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body) }),
  put: (path, body, headers = {}) =>
    request(path, { method: "PUT", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body) }),
  del: (path, headers = {}) =>
    request(path, { method: "DELETE", headers }),
};