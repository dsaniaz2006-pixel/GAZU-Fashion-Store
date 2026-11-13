// Client-visible configuration only. Never expose server secrets through VITE_ names.
// Vite loads these values from the single project-root .env file.
export const publicConfig = Object.freeze({
  apiBaseUrl: import.meta.env.VITE_API_URL || "/api",
});
