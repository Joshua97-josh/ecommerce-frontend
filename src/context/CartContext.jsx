import { createContext, useContext, useState, useCallback } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  // cartItems: array of { id, product, quantity }
  const [cartItems, setCartItems] = useState([]);

  // Replace entire cart (called after fetching from API)
  const setCart = useCallback((items) => setCartItems(items), []);

  // Add or increment item locally (optimistic update)
  const addItem = useCallback((product, quantity = 1) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      return [...prev, { id: Date.now(), product, quantity }];
    });
  }, []);

  // Remove item by cart row id
  const removeItem = useCallback((cartId) => {
    setCartItems((prev) => prev.filter((i) => i.id !== cartId));
  }, []);

  // Update quantity
  const updateQuantity = useCallback((cartId, quantity) => {
    if (quantity < 1) return;
    setCartItems((prev) =>
      prev.map((i) => (i.id === cartId ? { ...i, quantity } : i))
    );
  }, []);

  const clearCart = useCallback(() => setCartItems([]), []);

  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);
  const cartTotal = cartItems.reduce(
    (sum, i) => sum + i.product.price * i.quantity, 0
  );

  return (
    <CartContext.Provider
      value={{ cartItems, setCart, addItem, removeItem, updateQuantity, clearCart, cartCount, cartTotal }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be inside CartProvider");
  return ctx;
}
