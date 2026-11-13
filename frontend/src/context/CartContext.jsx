import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import { useAuth } from "./AuthContext.jsx";
import { api, toCart } from "../api.js";
import { cartReducer, initialCartState } from "./cartReducer.js";
const Context = createContext();
export function useCart() {
  const value = useContext(Context);
  if (!value) throw new Error("useCart requires CartProvider");
  return value;
}
export function CartProvider({ children }) {
  const { user, token } = useAuth();
  // A new authenticated session receives an entirely isolated cart and request scope.
  return (
    <CartSession key={`${user?.id || "guest"}:${token || ""}`} user={user}>
      {children}
    </CartSession>
  );
}
function CartSession({ children, user }) {
  const [state, dispatch] = useReducer(cartReducer, {
    ...initialCartState,
    loading: Boolean(user),
  });
  const [attempt, setAttempt] = useState(0);
  const alive = useRef(true),
    locked = useRef(Boolean(user)),
    sequence = useRef(0);
  useEffect(() => {
    alive.current = true;
    const id = ++sequence.current;
    const abort = new AbortController();
    locked.current = Boolean(user);
    dispatch({ type: "SET_LOADING", loading: Boolean(user) });
    if (user)
      api("/cart", { signal: abort.signal })
        .then((lines) => {
          if (alive.current && id === sequence.current)
            dispatch({ type: "SET_CART", items: toCart(lines) });
        })
        .catch((e) => {
          if (
            alive.current &&
            id === sequence.current &&
            e.name !== "AbortError"
          )
            dispatch({ type: "SET_ERROR", error: e.message });
        })
        .finally(() => {
          if (alive.current && id === sequence.current) {
            locked.current = false;
            dispatch({ type: "SET_LOADING", loading: false });
          }
        });
    return () => {
      alive.current = false;
      ++sequence.current;
      abort.abort();
    };
  }, [user?.id, attempt]);
  async function perform(path, options, checkout = false) {
    if (!user) throw new Error("Sign in to use your bag.");
    if (locked.current) throw new Error("Your bag is updating. Please wait.");
    locked.current = true;
    const id = ++sequence.current;
    dispatch({ type: "SET_LOADING", loading: true });
    dispatch({ type: "SET_ERROR", error: "" });
    try {
      const result = await api(path, options);
      if (alive.current && id === sequence.current)
        dispatch(
          checkout
            ? { type: "CLEAR_CART" }
            : { type: "SET_CART", items: toCart(result) },
        );
      return result;
    } catch (e) {
      if (alive.current && id === sequence.current)
        dispatch({ type: "SET_ERROR", error: e.message });
      throw e;
    } finally {
      if (alive.current && id === sequence.current) {
        locked.current = false;
        dispatch({ type: "SET_LOADING", loading: false });
      }
    }
  }
  const refresh = () => {
    if (!locked.current) setAttempt((n) => n + 1);
  };
  const clear = () => {
    ++sequence.current;
    locked.current = false;
    dispatch({ type: "CLEAR_CART" });
    dispatch({ type: "SET_LOADING", loading: false });
  };
  const update = (id, quantity, size = '') => {
    if (!Number.isInteger(quantity) || quantity < 0 || quantity > 99)
      return Promise.reject(new Error("Quantity must be between 0 and 99."));
    return perform(`/cart/items/${id}${quantity ? '' : `?size=${encodeURIComponent(size)}`}`, {
      method: quantity ? "PATCH" : "DELETE",
      ...(quantity ? { body: { quantity, size } } : {}),
    });
  };
  const add = (p, quantity = 1, size = '') => {
    if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 99)
      return Promise.reject(new Error("Quantity must be between 1 and 99."));
    return perform("/cart/items", {
      method: "POST",
      body: { productId: p.id, quantity, size },
    });
  };
  return (
    <Context.Provider
      value={{
        cart: state.items,
        busy: state.loading,
        loading: state.loading,
        error: state.error,
        add,
        update,
        clear,
        refresh,
        checkout: (path, body) => perform(path, { method: "POST", body }, true),
      }}
    >
      {children}
    </Context.Provider>
  );
}
