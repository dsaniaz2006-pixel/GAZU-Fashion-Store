import { useEffect, useState } from "react";
import { api, toProduct } from "../../api.js";

const GUEST_WISHLIST_KEY = "gazu-guest-wishlist-v1";
const PRODUCT_ID = /^[a-f0-9]{24}$/i;

function readGuestWishlist() {
  try {
    const items = JSON.parse(localStorage.getItem(GUEST_WISHLIST_KEY) || "[]");
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

// User-specific wishlist state belongs to this feature, not the navigation UI.
// Keep the guest merge, optimistic updates and rollback behavior unchanged.
export function useWishlist(user, notify) {
  const [wishlist, setWishlist] = useState([]);

  useEffect(() => {
    let current = true;
    const guest = readGuestWishlist();
    if (!user) {
      setWishlist(guest);
      return () => { current = false; };
    }
    (async () => {
      try {
        if (guest.length) {
          await api("/profile/wishlist/merge", {
            method: "POST",
            body: { ids: guest.map((item) => item.id).filter((id) => PRODUCT_ID.test(id)) },
          });
        }
        const saved = await api("/profile/wishlist");
        if (current) {
          setWishlist(saved.map(toProduct));
          localStorage.removeItem(GUEST_WISHLIST_KEY);
        }
      } catch (error) {
        if (current) notify(`Wishlist sync unavailable: ${error.message}`);
      }
    })();
    return () => { current = false; };
  }, [user?.id]);

  const toggleWish = async (product) => {
    const had = wishlist.some((item) => item.id === product.id);
    setWishlist((old) => had ? old.filter((item) => item.id !== product.id) : [...old, product]);
    if (!user) {
      const next = had ? wishlist.filter((item) => item.id !== product.id) : [...wishlist, product];
      try {
        localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(next.slice(0, 100)));
      } catch {
        // Browser storage can be disabled; the current in-memory view still works.
      }
      return;
    }
    try {
      await api(`/profile/wishlist/${product.id}`, { method: had ? "DELETE" : "PUT" });
    } catch (error) {
      setWishlist((old) => had ? [...old, product] : old.filter((item) => item.id !== product.id));
      notify(error.message);
    }
  };
  return { wishlist, toggleWish };
}
