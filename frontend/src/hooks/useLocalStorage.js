import { useCallback, useEffect, useRef, useState } from "react";
// Only for non-sensitive preferences. Never use this for JWTs or server cart data.
export function useLocalStorage(key, fallback, validate = () => true) {
  const rules = useRef({ fallback, validate });
  rules.current = { fallback, validate };
  const read = useCallback(() => {
    try {
      const raw = localStorage.getItem(key);
      const value = raw === null ? rules.current.fallback : JSON.parse(raw);
      return rules.current.validate(value) ? value : rules.current.fallback;
    } catch {
      return rules.current.fallback;
    }
  }, [key]);
  const [value, setValue] = useState(read);
  useEffect(() => {
    setValue(read());
    const sync = (e) => {
      if (e.key === key || e.key === null) setValue(read());
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, [key, read]);
  const save = useCallback(
    (next) => {
      setValue((old) => {
        const result = typeof next === "function" ? next(old) : next;
        if (!rules.current.validate(result)) return old;
        try {
          localStorage.setItem(key, JSON.stringify(result));
        } catch {}
        return result;
      });
    },
    [key],
  );
  return [value, save];
}
