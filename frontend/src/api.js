const envUrl = process.env.REACT_APP_API_URL;
// If REACT_APP_API_URL is set (even to "/api"), use it (strip trailing /api for base).
// Only fall back to the production URL when the env var is completely absent.
export const API_BASE_URL =
  envUrl != null
    ? envUrl.replace(/\/api\/?$/, "")
    : "https://todoapp-jizo.onrender.com";
