import React, { useEffect, useRef, useState } from "react";
import { api } from "../api.js";
let scriptPromise;
export function loadGoogleScript() {
  if (window.google?.accounts?.id)
    return Promise.resolve(window.google.accounts.id);
  if (!scriptPromise)
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      const timer = setTimeout(() => fail(), 15000);
      function fail() {
        clearTimeout(timer);
        script.remove();
        scriptPromise = undefined;
        reject(
          new Error(
            "Google sign-in could not load. Check your connection or use email sign-in.",
          ),
        );
      }
      script.onerror = fail;
      script.onload = () => {
        clearTimeout(timer);
        window.google?.accounts?.id
          ? resolve(window.google.accounts.id)
          : fail();
      };
      document.head.appendChild(script);
    });
  return scriptPromise;
}
export default function GoogleSignIn({ onCredential, disabled = false }) {
  const node = useRef(null),
    handler = useRef(onCredential),
    busy = useRef(false),
    disabledRef = useRef(disabled);
  handler.current = onCredential;
  disabledRef.current = disabled;
  const [attempt, setAttempt] = useState(0),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  useEffect(() => {
    if (!clientId) return;
    let live = true;
    setLoading(true);
    setError("");
    (async () => {
      try {
        const google = await loadGoogleScript();
        if (!live) return;
        const { nonce } = await api("/auth/google/challenge", {
          method: "POST",
          body: {},
        });
        if (!live) return;
        google.initialize({
          client_id: clientId,
          nonce,
          ux_mode: "popup",
          auto_select: false,
          callback: async (response) => {
            if (!live || busy.current || disabledRef.current) return;
            if (!response.credential) {
              setError("Google sign-in was not completed. Please try again.");
              return;
            }
            busy.current = true;
            try {
              await handler.current(response.credential);
            } finally {
              busy.current = false;
              if (live) setAttempt((x) => x + 1);
            }
          },
        });
        node.current.replaceChildren();
        google.renderButton(node.current, {
          theme: "outline",
          size: "large",
          text: "continue_with",
          width: 280,
        });
        setLoading(false);
      } catch (e) {
        if (live) {
          setError(e.message);
          setLoading(false);
        }
      }
    })();
    return () => {
      live = false;
    };
  }, [clientId, attempt]);
  if (!clientId)
    return (
      <p className="form-note">
        Google sign-in is unavailable. Use email sign-in.
      </p>
    );
  return (
    <div className="google-signin">
      {loading && <p role="status">Preparing Google sign-in...</p>}
      <div
        ref={node}
        inert={disabled || loading ? true : undefined}
        aria-busy={disabled || loading}
      />
      {error && <p role="alert">{error}</p>}
      {error && (
        <button
          type="button"
          className="text-link"
          onClick={() => setAttempt((x) => x + 1)}
        >
          Retry Google sign-in
        </button>
      )}
      <small>
        If the chooser closes, click the Google button again. No account is
        activated until GAZU verification succeeds.
      </small>
    </div>
  );
}
