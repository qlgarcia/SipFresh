// ✅ Updated CartContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebaseConfig";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  size?: string;
  stock?: number;
}

interface CartContextProps {
  cart: CartItem[];
  addToCart: (item: CartItem) => boolean;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  increaseQuantity: (itemId: string) => boolean;
  decreaseQuantity: (itemId: string) => void;
}

const CartContext = createContext<CartContextProps>({
  cart: [],
  addToCart: () => false,
  removeFromCart: () => {},
  clearCart: () => {},
  increaseQuantity: () => false,
  decreaseQuantity: () => {},
});

export const useCart = () => useContext(CartContext);

const SIZE_SUFFIXES = ["-Small", "-Medium", "-Large"];

const deriveProductId = (id: string): string => {
  if (!id) return id;
  for (const suffix of SIZE_SUFFIXES) {
    if (id.endsWith(suffix)) {
      return id.slice(0, -suffix.length);
    }
  }
  return id;
};

const normalizeCartItem = (raw: CartItem): CartItem => {
  const quantity = raw.quantity ?? 1;
  const productId = raw.productId || deriveProductId(raw.id);
  return {
    ...raw,
    productId,
    quantity: quantity <= 0 ? 1 : quantity,
  };
};

const sanitizeForStorage = (items: CartItem[]) =>
  items.map((item) => {
    const sanitized: Record<string, unknown> = { ...item };
    Object.keys(sanitized).forEach((key) => {
      if (sanitized[key] === undefined) {
        delete sanitized[key];
      }
    });
    return sanitized;
  });

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userCartRef = doc(db, "carts", currentUser.uid);
        const snap = await getDoc(userCartRef);
        if (snap.exists()) {
          const storedItems = (snap.data().items || []).map((item: CartItem) =>
            normalizeCartItem(item)
          );
          setCart(storedItems);
        }
      } else {
        setCart([]);
      }
    });
    return () => unsub();
  }, []);

  const syncCart = async (updatedCart: CartItem[]) => {
    if (user) {
      await setDoc(doc(db, "carts", user.uid), { items: sanitizeForStorage(updatedCart) });
    }
  };

  const addToCart = (rawItem: CartItem): boolean => {
    let added = false;
    setCart((prev) => {
      const item = normalizeCartItem(rawItem);
      const productId = item.productId;
      const incrementBy = item.quantity ?? 1;
      const candidates = prev.filter((cartItem) => cartItem.productId === productId);
      const currentTotal = candidates.reduce((sum, cartItem) => sum + cartItem.quantity, 0);

      const knownStock =
        item.stock ??
        candidates.find((cartItem) => typeof cartItem.stock === "number")?.stock ??
        undefined;

      const desiredTotal = currentTotal + incrementBy;

      if (typeof knownStock === "number" && desiredTotal > knownStock) {
        return prev;
      }

      const existing = prev.find((cartItem) => cartItem.id === item.id);
      const normalizedStock = typeof knownStock === "number" ? knownStock : item.stock;

      const updated = existing
        ? prev.map((cartItem) =>
            cartItem.id === item.id
              ? {
                  ...cartItem,
                  quantity: cartItem.quantity + incrementBy,
                  stock: normalizedStock ?? cartItem.stock,
                }
              : cartItem.productId === productId && normalizedStock !== undefined
              ? { ...cartItem, stock: normalizedStock }
              : cartItem
          )
        : [
            ...prev.map((cartItem) =>
              cartItem.productId === productId && normalizedStock !== undefined
                ? { ...cartItem, stock: normalizedStock }
                : cartItem
            ),
            {
              ...item,
              quantity: incrementBy,
              stock: normalizedStock,
            },
          ];

      added = true;
      syncCart(updated);
      return updated;
    });
    return added;
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => {
      const updated = prev.filter((i) => i.id !== itemId);
      syncCart(updated);
      return updated;
    });
  };

  const clearCart = () => {
    setCart([]);
    if (user) setDoc(doc(db, "carts", user.uid), { items: [] });
  };

  const increaseQuantity = (itemId: string): boolean => {
    let increased = false;
    setCart((prev) => {
      const target = prev.find((item) => item.id === itemId);
      if (!target) {
        return prev;
      }

      const productId = target.productId;
      const candidates = prev.filter((item) => item.productId === productId);
      const currentTotal = candidates.reduce((sum, item) => sum + item.quantity, 0);
      const knownStock =
        target.stock ??
        candidates.find((item) => typeof item.stock === "number")?.stock ??
        undefined;

      if (typeof knownStock === "number" && currentTotal >= knownStock) {
        return prev;
      }

      const incremented = prev.map((item) =>
        item.id === itemId ? { ...item, quantity: item.quantity + 1 } : item
      );
      increased = true;
      syncCart(incremented);
      return incremented;
    });
    return increased;
  };

  const decreaseQuantity = (itemId: string) => {
    setCart((prev) => {
      const updated = prev
        .map((i) =>
          i.id === itemId ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i
        )
        .filter((i) => i.quantity > 0);
      syncCart(updated);
      return updated;
    });
  };

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeFromCart, clearCart, increaseQuantity, decreaseQuantity }}
    >
      {children}
    </CartContext.Provider>
  );
};
