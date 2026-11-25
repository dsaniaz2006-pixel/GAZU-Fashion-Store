import { shouldExpireSession } from "../../authSessionPolicy.mjs";
import { diagnosticApiError } from "../../apiResponseDiagnostics.mjs";
import { publicConfig } from "../../config/publicConfig.js";

// A sleeping Render Free service can answer the first request with a gateway
// error or an HTML warm-up page. Only safe GET requests are retried; mutations
// (checkout, registration, cart updates, payments) are never replayed.
const RETRY_DELAYS_MS = [2000, 4000, 6000, 8000, 10000, 10000, 10000, 10000];
const TRANSIENT_PROXY_STATUSES = new Set([502, 503, 504]);

function waitForRetry(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("The request was aborted.", "AbortError"));
      return;
    }

    const finish = () => {
      signal?.removeEventListener("abort", abort);
      resolve();
    };
    const timer = setTimeout(finish, ms);
    const abort = () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
      reject(new DOMException("The request was aborted.", "AbortError"));
    };
    signal?.addEventListener("abort", abort, { once: true });
  });
}

// Transport and HTTP error handling live here; UI stays in components/pages.
// Authorization remains tab-scoped. A stale 401 must not log out a new session.
export async function api(path, options = {}) {
  const token = sessionStorage.getItem("gazu-token");
  const method = options.method || "GET";
  const canRetry = method.toUpperCase() === "GET";
  let response;
  let data;

  for (let attempt = 0; ; attempt += 1) {
    try {
      response = await fetch(publicConfig.apiBaseUrl + path, {
        signal: options.signal,
        method,
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

    const isGazuApi =
      response.headers?.get?.("x-gazu-api") === "gazu-store";
    const retryableGatewayError =
      canRetry &&
      !isGazuApi &&
      TRANSIENT_PROXY_STATUSES.has(response.status);

    if (retryableGatewayError && attempt < RETRY_DELAYS_MS.length) {
      await waitForRetry(RETRY_DELAYS_MS[attempt], options.signal);
      continue;
    }

    if (response.status === 204) return null;

    try {
      data = await response.json();
    } catch {
      // Render can serve an HTML warm-up page while the free instance starts.
      // That page is not a valid API response, even when it carries HTTP 200.
      if (
        canRetry &&
        !isGazuApi &&
        response.ok &&
        attempt < RETRY_DELAYS_MS.length
      ) {
        await waitForRetry(RETRY_DELAYS_MS[attempt], options.signal);
        continue;
      }
      const error = new Error(
        "Backend unavailable. Check the Render service and try again.",
      );
      Object.assign(error, {
        status: response.status,
        code: "INVALID_API_RESPONSE",
      });
      throw error;
    }
    break;
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
