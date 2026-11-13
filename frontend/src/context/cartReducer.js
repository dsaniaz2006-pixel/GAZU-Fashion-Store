export const initialCartState = { items: [], loading: false, error: "" };
const validQuantity = (q) => Number.isInteger(q) && q >= 1 && q <= 99;
function clean(items) {
  const unique = new Map();
  for (const item of items || [])
    if (item?.id && validQuantity(item.qty)) unique.set(item.id, item);
  return [...unique.values()];
}
export function cartReducer(state, action) {
  switch (action.type) {
    case "SET_CART":
      return { ...state, items: clean(action.items), error: "" };
    case "CLEAR_CART":
      return { ...state, items: [], error: "" };
    case "SET_LOADING":
      return { ...state, loading: action.loading };
    case "SET_ERROR":
      return { ...state, error: action.error };
    case "ADD_ITEM": {
      if (!action.item?.id || !validQuantity(action.item.qty)) return state;
      const found = state.items.find((p) => p.id === action.item.id);
      const qty = (found?.qty || 0) + action.item.qty;
      if (!validQuantity(qty)) return state;
      return {
        ...state,
        items: found
          ? state.items.map((p) =>
              p.id === action.item.id ? { ...p, qty } : p,
            )
          : [...state.items, action.item],
      };
    }
    case "UPDATE_QUANTITY":
      return validQuantity(action.quantity)
        ? {
            ...state,
            items: state.items.map((p) =>
              p.id === action.id ? { ...p, qty: action.quantity } : p,
            ),
          }
        : state;
    case "REMOVE_ITEM":
      return { ...state, items: state.items.filter((p) => p.id !== action.id) };
    default:
      return state;
  }
}
