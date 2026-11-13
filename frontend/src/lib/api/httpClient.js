import { shouldExpireSession } from "../../authSessionPolicy.mjs";
import { diagnosticApiError } from "../../apiResponseDiagnostics.mjs";
import { publicConfig } from "../../config/publicConfig.js";

// Transport and HTTP error handling live here; UI stays in components/pages.
// Authorization remains tab-scoped. A stale 401 must not log out a new session.
export async function api(path, options = {}) {
  const token = sessionStorage.getItem("gazu-token");
  let response;
  try {
    response = await fetch(publicConfig.apiBaseUrl + path, {
      signal: options.signal,
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(options.body ? { body: JSON.stringify(options.body) } : {}),
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new Error(
      "Cannot reach the store. Check your connection and try again.",
    );
  }
  if (response.status === 204) return null;
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(
      "Backend unavailable. Check the backend terminal and port 8000.",
    );
  }
  if (!response.ok) {
    // A proxy or upstream service may return valid JSON that is not an object.
    // Keep error handling safe for null, arrays and primitive JSON values.
    const errorData = data && typeof data === "object" && !Array.isArray(data) ? data : {};
    // A stale response must never log out a replacement login. The startup
    // /auth/me request is handled by AuthProvider.restore without a banner.
    if (shouldExpireSession({
      status: response.status,
      path,
      requestToken: token,
      currentToken: sessionStorage.getItem("gazu-token"),
      code: errorData.code,
    })) {
      window.dispatchEvent(new Event("gazu-session-expired"));
    }
    const error = new Error(diagnosticApiError({
      status: response.status,
      path,
      message: errorData.message,
      isGazuApi: response.headers?.get?.("x-gazu-api") === "gazu-store",
    }));
    Object.assign(error, {
      status: response.status,
      code: errorData.code,
      email: errorData.email,
      requiresVerification: errorData.requiresVerification,
      retryAfter: errorData.retryAfter,
    });
    if (
      errorData.code === "EMAIL_NOT_VERIFIED" &&
      token === sessionStorage.getItem("gazu-token")
    )
      window.dispatchEvent(
        new CustomEvent("gazu-verification-required", {
          detail: { email: errorData.email },
        }),
      );
    throw error;
  }
  return data;
}
