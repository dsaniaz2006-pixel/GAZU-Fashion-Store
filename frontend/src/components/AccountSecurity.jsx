import React, { useState } from "react";
import { api } from "../api.js";
import { useFetch } from "../hooks/useFetch.js";
import GoogleSignIn from "./GoogleSignIn.jsx";
export default function AccountSecurity({ onRecovery }) {
  const methods = useFetch("/auth/methods"),
    [password, setPassword] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");
  async function link(credential) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await api("/auth/link-google", {
        method: "POST",
        body: { credential, password },
      });
      setMessage(result.message);
      setPassword("");
      methods.reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="account-security">
      <h2>SIGN-IN METHODS</h2>
      {methods.loading ? (
        <p role="status">Loading sign-in methods...</p>
      ) : methods.error ? (
        <p role="alert">
          {methods.error} <button onClick={methods.reload}>Retry</button>
        </p>
      ) : (
        <>
          <p>
            {methods.data.password
              ? "Email and password enabled."
              : "Google-only account. No GAZU password is set."}{" "}
            {methods.data.google ? "Google linked." : "Google is not linked."}
          </p>
          {!methods.data.google && methods.data.password && (
            <div className="account-box">
              <p>
                Confirm your current password, then choose Google with the same
                email address.
              </p>
              <label>
                Current password
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
              <GoogleSignIn onCredential={link} disabled={busy || !password} />
            </div>
          )}
          <button className="btn" onClick={onRecovery}>
            {methods.data.password ? "CHANGE PASSWORD" : "SET A GAZU PASSWORD"}
          </button>
        </>
      )}
      {message && <p role="status">{message}</p>}
      {error && (
        <p className="error-box" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
