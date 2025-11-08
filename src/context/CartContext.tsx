// ✅ Updated CartContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebaseConfig";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";

interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

interface CartContextProps {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  increaseQuantity: (itemId: string) => void;
  decreaseQuantity: (itemId: string) => void;
}

const CartContext = createContext<CartContextProps>({
  cart: [],
  addToCart: () => {},
  removeFromCart: () => {},
  clearCart: () => {},
  increaseQuantity: () => {},
  decreaseQuantity: () => {},
});

export const useCart = () => useContext(CartContext);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userCartRef = doc(db, "carts", currentUser.uid);
        const snap = await getDoc(userCartRef);
        if (snap.exists()) setCart(snap.data().items || []);
      } else {
        setCart([]);
      }
    });
    return () => unsub();
  }, []);

  const syncCart = async (updatedCart: CartItem[]) => {
    if (user) {
      await setDoc(doc(db, "carts", user.uid), { items: updatedCart });
    }
  };

  const addToCart = (item: CartItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      const updated = existing
        ? prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i))
        : [...prev, { ...item, quantity: 1 }];
      syncCart(updated);
      return updated;
    });
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

  const increaseQuantity = (itemId: string) => {
    setCart((prev) => {
      const updated = prev.map((i) =>
        i.id === itemId ? { ...i, quantity: i.quantity + 1 } : i
      );
      syncCart(updated);
      return updated;
    });
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
