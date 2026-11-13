import React, { useRef, useState } from "react";
import { api } from "../api.js";
export default function PasswordRecovery({
  initialEmail = "",
  onBack,
  onComplete,
}) {
  const [email, setEmail] = useState(initialEmail),
    [stage, setStage] = useState("request"),
    [code, setCode] = useState("");
  const [password, setPassword] = useState(""),
    [confirm, setConfirm] = useState(""),
    [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const lock = useRef(false);
  async function submit(e) {
    e.preventDefault();
    if (lock.current) return;
    if (stage === "reset" && password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const data = await api(
        stage === "request" ? "/auth/forgot-password" : "/auth/reset-password",
        {
          method: "POST",
          body:
            stage === "request"
              ? { email }
              : { email, code, password, confirmPassword: confirm },
        },
      );
      setMessage(data.message);
      if (stage === "request") setStage("reset");
      else {
        setPassword("");
        setConfirm("");
        setCode("");
        setStage("done");
      }
    } catch (e) {
      setError(e.message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <div className="account-page">
      <div className="account-box">
        <p className="eyebrow">GAZU ACCOUNT RECOVERY</p>
        <h1>
          {stage === "request"
            ? "RESET YOUR PASSWORD."
            : stage === "reset"
              ? "CHECK YOUR EMAIL."
              : "PASSWORD UPDATED."}
        </h1>
        <p>
          Recover a GAZU password or set one for a verified Google-only account.
          This does not change your Google password.
        </p>
        {stage !== "done" && (
          <form onSubmit={submit}>
            <label>
              Email address
              <input
                type="email"
                value={email}
                autoComplete="email"
                required
                disabled={stage === "reset"}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            {stage === "reset" && (
              <>
                <label>
                  Recovery code
                  <input
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    required
                    value={code}
                    onChange={(e) =>
                      setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                  />
                </label>
                <label>
                  New password
                  <input
                    type={show ? "text" : "password"}
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={72}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </label>
                <label>
                  Confirm new password
                  <input
                    type={show ? "text" : "password"}
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={72}
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                  />
                </label>
                <button
                  type="button"
                  className="text-link"
                  aria-pressed={show}
                  onClick={() => setShow(!show)}
                >
                  {show ? "Hide passwords" : "Show passwords"}
                </button>
              </>
            )}
            <button className="btn dark full" disabled={busy}>
              {busy
                ? "PLEASE WAIT…"
                : stage === "request"
                  ? "SEND RECOVERY CODE"
                  : "UPDATE PASSWORD"}
            </button>
          </form>
        )}
        {message && <p role="status">{message}</p>}
        {error && (
          <p role="alert" className="error-box">
            {error}
          </p>
        )}
        {stage === "reset" && (
          <button
            className="text-link"
            disabled={busy}
            onClick={() => {
              setStage("request");
              setError("");
            }}
          >
            Request a new code / change email
          </button>
        )}
        <button
          className="btn"
          disabled={busy}
          onClick={stage === "done" ? onComplete || onBack : onBack}
        >
          BACK TO SIGN IN
        </button>
      </div>
    </div>
  );
}
