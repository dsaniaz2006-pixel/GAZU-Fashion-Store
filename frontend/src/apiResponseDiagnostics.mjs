/** Explain failures from the Vite proxy, a stale API, or a wrong process on port 8000. */
export function diagnosticApiError({ status, path, message, isGazuApi = false }) {
  const detail = typeof message === 'string' ? message.trim() : '';
  if (status === 502 || status === 503 || status === 504) {
    // Preserve a meaningful error from the verified GAZU API, such as an OTP
    // delivery failure; don't replace it with a misleading proxy diagnosis.
    // Unidentified proxy/upstream errors keep the actionable fallback.
    if (isGazuApi && detail && !["Request failed.", "Not Found"].includes(detail)) {
      return detail;
    }
    return `GAZU backend unavailable (HTTP ${status}). Check the backend terminal and http://localhost:8000/api/health.`;
  }
  if (!isGazuApi && (detail === '' || detail === 'Request failed.' || detail === 'Not Found')) {
    return `Unexpected API response (HTTP ${status}) for ${path}. Another server may be using port 8000. Check http://localhost:8000/api/health.`;
  }
  if (detail) return detail;
  return `GAZU API request failed (HTTP ${status}) for ${path}.`;
}
