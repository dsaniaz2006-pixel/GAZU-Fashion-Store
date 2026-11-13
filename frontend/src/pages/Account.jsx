import React, { useState, useEffect, useRef } from "react";
import { api } from "../api.js";
import GoogleSignIn from "../components/GoogleSignIn.jsx";
import PasswordRecovery from "../components/PasswordRecovery.jsx";
import AccountSecurity from "../components/AccountSecurity.jsx";

export default function Account({ user, onLogin, onLogout, go }) {
  const operation = useRef(false);
  const [recovery, setRecovery] = useState(false),
    [showPassword, setShowPassword] = useState(false);
  const [fields, setFields] = useState({
    name: "",
    email: sessionStorage.getItem("gazu-pending-email") || "",
    password: "",
    confirmPassword: "",
  });

  const [register, setRegister] = useState(false);
  const [verify, setVerify] = useState(
    Boolean(sessionStorage.getItem("gazu-pending-email")),
  );
  const [resume, setResume] = useState(false);
  const [cooldown, setCooldown] = useState(() =>
    Math.max(
      0,
      Math.ceil(
        (Number(sessionStorage.getItem("gazu-otp-until")) - Date.now()) / 1000,
      ),
    ),
  );
  function startCooldown(seconds) {
    sessionStorage.setItem(
      "gazu-otp-until",
      String(Date.now() + seconds * 1000),
    );
    setCooldown(seconds);
  }
  useEffect(() => {
    if (!cooldown) return;
    const timer = setTimeout(
      () => setCooldown((c) => Math.max(0, c - 1)),
      1000,
    );
    return () => clearTimeout(timer);
  }, [cooldown]);
  function pending(email) {
    sessionStorage.setItem("gazu-pending-email", email);
    setFields((old) => ({ ...old, email, password: "", confirmPassword: "" }));
    setVerify(true);
    setResume(false);
  }
  useEffect(() => {
    const handler = (e) => pending(e.detail.email);
    window.addEventListener("gazu-verification-required", handler);
    return () =>
      window.removeEventListener("gazu-verification-required", handler);
  }, []);
  function recover(e) {
    setError(e.message);
    if (
      e.requiresVerification ||
      (resume && ["OTP_COOLDOWN", "OTP_SEND_LIMIT"].includes(e.code))
    )
      pending(e.email || fields.email);
    if (e.retryAfter) startCooldown(e.retryAfter);
  }
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const change = (e) =>
    setFields((old) => ({
      ...old,
      [e.target.name]: e.target.value,
    }));

  async function submit(event) {
    event.preventDefault();
    if (operation.current) return;
    if (
      register &&
      !verify &&
      !resume &&
      fields.password !== fields.confirmPassword
    ) {
      setError("Passwords do not match.");
      return;
    }
    operation.current = true;
    setBusy(true);
    setError("");
    setMessage("");

    try {
      if (verify) {
        const result = await api("/auth/verify-email", {
          method: "POST",
          body: {
            email: fields.email,
            otp,
          },
        });

        sessionStorage.removeItem("gazu-pending-email");
        sessionStorage.removeItem("gazu-otp-until");
        setCooldown(0);
        setVerify(false);
        setRegister(false);
        setOtp("");
        setMessage(result.message);
        if (result.token) {
          onLogin(result);
          return;
        }
        setFields((old) => ({
          ...old,
          password: "",
        }));
      } else if (resume) {
        const result = await api("/auth/resend-otp", {
          method: "POST",
          body: { email: fields.email },
        });
        pending(fields.email.trim().toLowerCase());
        setMessage(result.message);
        startCooldown(result.retryAfter || 60);
      } else if (register) {
        const result = await api("/auth/register", {
          method: "POST",
          body: fields,
        });

        if (result.requiresVerification) {
          pending(result.email);
          startCooldown(result.retryAfter || 60);
          setMessage(result.message);
        }
      } else {
        await onLogin(
          await api("/auth/login", {
            method: "POST",
            body: {
              email: fields.email,
              password: fields.password,
            },
          }),
        );
      }
    } catch (e) {
      recover(e);
    } finally {
      operation.current = false;
      setBusy(false);
    }
  }

  async function resendOtp() {
    if (operation.current) return;
    operation.current = true;
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const result = await api("/auth/resend-otp", {
        method: "POST",
        body: { email: fields.email },
      });
      setMessage(result.message);
      startCooldown(result.retryAfter || 60);
    } catch (e) {
      recover(e);
    } finally {
      operation.current = false;
      setBusy(false);
    }
  }

  async function googleSignIn(credential) {
    if (operation.current) return;
    operation.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await api("/auth/google", {
        method: "POST",
        body: { credential },
      });
      if (result.requiresVerification) {
        pending(result.email);
        startCooldown(result.retryAfter || 0);
        setMessage(result.message);
      } else onLogin(result);
    } catch (e) {
      recover(e);
    } finally {
      operation.current = false;
      setBusy(false);
    }
  }
  if (recovery)
    return (
      <PasswordRecovery
        initialEmail={user?.email || fields.email}
        onBack={() => setRecovery(false)}
        onComplete={() => {
          setRecovery(false);
          if (user) onLogout();
        }}
      />
    );
  if (user) {
    return (
      <div className="page-wrap">
        <p className="eyebrow">YOUR ACCOUNT / {user.role}</p>
        <h1>HELLO, {user.name}</h1>
        <p>{user.email}</p>
        <AccountSecurity onRecovery={() => setRecovery(true)} />

        <div className="action-row">
          <button className="btn dark" onClick={() => go("track")}>
            MY ORDERS
          </button>

          {user.role === "admin" && (
            <button className="btn dark" onClick={() => go("admin")}>
              ADMIN DASHBOARD
            </button>
          )}

          <button className="btn" onClick={onLogout}>
            SIGN OUT
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="account-page">
      <div className="account-box">
        <p className="eyebrow">WELCOME TO GAZU</p>

        <h1>
          {verify
            ? "VERIFY EMAIL."
            : resume
              ? "VERIFY EMAIL."
              : register
                ? "JOIN THE EDIT."
                : "YOUR SPACE."}
        </h1>

        <p>
          {verify
            ? `Enter the six-digit code sent to ${fields.email}`
            : resume
              ? "Enter your registered email to resume verification."
              : register
                ? "Create your customer account."
                : "Sign in to shop or manage your store."}
        </p>

        {!verify && !resume && (
          <>
            <GoogleSignIn onCredential={googleSignIn} disabled={busy} />
            <p className="auth-divider">OR</p>
          </>
        )}
        <form onSubmit={submit}>
          {verify ? (
            <label>
              Verification code
              <input
                name="otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="Enter 6-digit OTP"
                required
              />
            </label>
          ) : (
            <>
              {register && (
                <label>
                  Name
                  <input
                    name="name"
                    value={fields.name}
                    onChange={change}
                    autoComplete="name"
                    minLength={2}
                    maxLength={80}
                    required
                  />
                </label>
              )}

              <label>
                Email address
                <input
                  name="email"
                  type="email"
                  value={fields.email}
                  onChange={change}
                  autoComplete="username"
                  required
                />
              </label>

              {!resume && (
                <label>
                  Password
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={fields.password}
                    onChange={change}
                    autoComplete={
                      register ? "new-password" : "current-password"
                    }
                    minLength={8}
                    maxLength={72}
                    required
                  />
                </label>
              )}
            </>
          )}

          {register && !verify && !resume && (
            <label>
              Confirm password
              <input
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={fields.confirmPassword}
                onChange={change}
                autoComplete="new-password"
                minLength={8}
                maxLength={72}
                required
              />
            </label>
          )}
          {!verify && !resume && (
            <button
              type="button"
              className="text-link"
              aria-pressed={showPassword}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "Hide password" : "Show password"}
            </button>
          )}
          {message && (
            <p role="status" className="form-note">
              {message}
            </p>
          )}

          {error && (
            <p className="error-box" role="alert">
              {error}
            </p>
          )}

          <button disabled={busy} className="btn dark full">
            {busy
              ? "PLEASE WAIT…"
              : verify
                ? "VERIFY OTP"
                : resume
                  ? "SEND VERIFICATION CODE"
                  : register
                    ? "CREATE ACCOUNT"
                    : "SIGN IN"}
          </button>
        </form>

        {!verify && !resume && !register && (
          <button
            type="button"
            className="text-link"
            disabled={busy}
            onClick={() => setRecovery(true)}
          >
            FORGOT PASSWORD?
          </button>
        )}
        <p className="form-note">
          <button
            disabled={busy}
            onClick={() => {
              sessionStorage.removeItem("gazu-pending-email");
        sessionStorage.removeItem("gazu-otp-until");
        setCooldown(0);
              setVerify(false);
              setResume(verify ? false : !resume);
              setRegister(false);
              setError("");
              setMessage("");
              setOtp("");
            }}
          >
            {verify
              ? "USE ANOTHER EMAIL / BACK TO SIGN IN"
              : resume
                ? "BACK TO SIGN IN"
                : "ALREADY REGISTERED? VERIFY EMAIL"}
          </button>
        </p>
        {verify ? (
          <div className="form-note">
            <button disabled={busy || cooldown > 0} onClick={resendOtp}>
              {cooldown > 0 ? `RESEND IN ${cooldown}s` : "RESEND OTP"}
            </button>
          </div>
        ) : (
          <p className="form-note">
            <button
              disabled={busy}
              onClick={() => {
                setResume(false);
                setRegister(!register);
                setError("");
                setMessage("");
              }}
            >
              {register
                ? "Already registered? SIGN IN"
                : "New here? CREATE AN ACCOUNT"}
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
