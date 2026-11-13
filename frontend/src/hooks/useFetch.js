import { useCallback, useEffect, useState } from "react";
import { api } from "../api.js";
// sessionScope is explicit for private data. No auth provider is required for public hooks.
export function useFetch(path, refresh = 0, sessionScope = "public") {
  const [attempt, setAttempt] = useState(0);
  const key = JSON.stringify([path, refresh, sessionScope, attempt]);
  const [state, setState] = useState({
    key: null,
    data: null,
    loading: Boolean(path),
    error: "",
  });
  useEffect(() => {
    const controller = new AbortController();
    let live = true;
    setState({ key, data: null, loading: Boolean(path), error: "" });
    if (path)
      api(path, { signal: controller.signal })
        .then((data) => {
          if (live) setState({ key, data, loading: false, error: "" });
        })
        .catch((e) => {
          if (live && e.name !== "AbortError")
            setState({ key, data: null, loading: false, error: e.message });
        });
    return () => {
      live = false;
      controller.abort();
    };
  }, [key]);
  const reload = useCallback(() => setAttempt((n) => n + 1), []);
  return {
    ...(state.key === key
      ? state
      : { data: null, loading: Boolean(path), error: "" }),
    reload,
  };
}
