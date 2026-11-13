import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { api } from "../api.js";
const Context = createContext();
export function useAuth() {
  const value = useContext(Context);
  if (!value) throw new Error("useAuth requires AuthProvider");
  return value;
}
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null),
    [token, setToken] = useState(() => sessionStorage.getItem("gazu-token")),
    [ready, setReady] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");
  const request = useRef(0),
    controller = useRef(null);
  const logout = useCallback(() => {
    ++request.current;
    controller.current?.abort();
    sessionStorage.removeItem("gazu-token");
    window.google?.accounts?.id?.disableAutoSelect();
    setToken(null);
    setUser(null);
    setReady(true);
    setError("");
    setMessage("");
  }, []);
  const login = useCallback((data) => {
    ++request.current;
    controller.current?.abort();
    sessionStorage.removeItem("gazu-pending-email");
    sessionStorage.removeItem("gazu-otp-until");
    sessionStorage.setItem("gazu-token", data.token);
    setToken(data.token);
    setUser(data.user);
    setReady(true);
    setError("");
    setMessage("");
  }, []);
  const restore = useCallback(async () => {
    const version = ++request.current;
    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;
    const saved = sessionStorage.getItem("gazu-token");
    setReady(false);
    setError("");
    setToken(saved);
    try {
      if (saved) {
        const data = await api("/auth/me", { signal: abort.signal });
        if (version === request.current) setUser(data.user);
      } else setUser(null);
    } catch (e) {
      if (version !== request.current || e.name === "AbortError") return;
      if (e.status === 401 || e.code === "EMAIL_NOT_VERIFIED") {
        sessionStorage.removeItem("gazu-token");
        setToken(null);
        setUser(null);
        // Expired credentials are normal after a restart or idle tab. Clear
        // them silently; public pages must remain usable by guests.
        setMessage("");
      } else setError(e.message);
    } finally {
      if (version === request.current) setReady(true);
    }
  }, []);
  useEffect(() => {
    const expire = () => {
      // Protected routes already redirect guests to /account. Never display
      // an error across the public storefront just because a token expired.
      logout();
    };
    const verification = (e) => {
      sessionStorage.setItem("gazu-pending-email", e.detail.email);
      logout();
      setMessage(
        "Verify your email to continue. Open Account to enter or resend your code.",
      );
    };
    window.addEventListener("gazu-session-expired", expire);
    window.addEventListener("gazu-verification-required", verification);
    restore();
    return () => {
      ++request.current;
      controller.current?.abort();
      window.removeEventListener("gazu-session-expired", expire);
      window.removeEventListener("gazu-verification-required", verification);
    };
  }, [restore, logout]);
  return (
    <Context.Provider
      value={{
        user,
        token,
        ready,
        loading: !ready,
        error,
        message,
        login,
        logout,
        restore,
      }}
    >
      {children}
    </Context.Provider>
  );
}
