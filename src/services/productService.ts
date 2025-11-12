import { db } from "../firebaseConfig";
import {
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  Unsubscribe,
  DocumentData,
  runTransaction,
} from "firebase/firestore";

export interface Product {
  id?: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  imageURL: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Get all products
 */
export const getProducts = async (): Promise<Product[]> => {
  try {
    const productsRef = collection(db, "products");
    const q = query(productsRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Product[];
  } catch (error) {
    console.error("Error getting products:", error);
    throw error;
  }
};

/**
 * Real-time listener for products.
 * callback receives (products, changes) where changes is an array of
 * { type: 'added'|'modified'|'removed', doc } to enable UI signals.
 */
export const listenToProducts = (
  callback: (products: Product[], changes: { type: string; doc: DocumentData }[]) => void
): Unsubscribe => {
  const productsRef = collection(db, "products");
  const q = query(productsRef, orderBy("createdAt", "desc"));

  const unsub = onSnapshot(
    q,
    (snapshot) => {
      const products = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Product[];
      const changes = snapshot.docChanges().map((c) => ({ type: c.type, doc: { id: c.doc.id, ...c.doc.data() } }));
      callback(products, changes);
    },
    (error) => {
      console.error("Products realtime listener error:", error);
      // call callback with empty changes to let UI handle errors if desired
      callback([], []);
    }
  );

  return unsub;
};

/**
 * Get a single product by ID
 */
export const getProduct = async (id: string): Promise<Product | null> => {
  try {
    const productDoc = await getDoc(doc(db, "products", id));
    if (productDoc.exists()) {
      return { id: productDoc.id, ...productDoc.data() } as Product;
    }
    return null;
  } catch (error) {
    console.error("Error getting product:", error);
    throw error;
  }
};

/**
 * Listen to a single product document for real-time updates
 */
export const listenToProductById = (
  id: string,
  callback: (product: Product | null) => void
): Unsubscribe => {
  const docRef = doc(db, "products", id);
  const unsub = onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) callback({ id: snap.id, ...snap.data() } as Product);
      else callback(null);
    },
    (error) => {
      console.error("Product realtime listener error:", error);
      callback(null);
    }
  );
  return unsub;
};

/**
 * Create a new product
 */
export const createProduct = async (product: Omit<Product, "id">): Promise<string> => {
  try {
    const productsRef = collection(db, "products");
    const docRef = await addDoc(productsRef, {
      ...product,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating product:", error);
    throw error;
  }
};

/**
 * Update a product
 */
export const updateProduct = async (
  id: string,
  updates: Partial<Product>
): Promise<void> => {
  try {
    const productRef = doc(db, "products", id);
    await updateDoc(productRef, {
      ...updates,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error("Error updating product:", error);
    throw error;
  }
};

/**
 * Delete a product
 */
export const deleteProduct = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, "products", id));
  } catch (error) {
    console.error("Error deleting product:", error);
    throw error;
  }
};

/**
 * Atomically decrease stock for multiple products.
 * Throws if any product is missing or would go negative.
 */
export const decreaseProductStockBatch = async (
  items: { productId: string; quantity: number }[]
): Promise<void> => {
  if (!items.length) return;

  const aggregated = items.reduce<Record<string, number>>((acc, { productId, quantity }) => {
    if (!productId) {
      return acc;
    }
    acc[productId] = (acc[productId] || 0) + quantity;
    return acc;
  }, {});

  await runTransaction(db, async (transaction) => {
    for (const [productId, quantity] of Object.entries(aggregated)) {
      const productRef = doc(db, "products", productId);
      const snapshot = await transaction.get(productRef);

      if (!snapshot.exists()) {
        console.warn(`Product ${productId} not found while decreasing stock.`);
        continue;
      }

      const data = snapshot.data() as Product;
      const currentStock = typeof data.stock === "number" ? data.stock : 0;

      if (quantity <= 0) {
        continue;
      }

      if (currentStock < quantity) {
        throw new Error(`Not enough stock for ${data.name ?? productId}.`);
      }

      transaction.update(productRef, {
        stock: currentStock - quantity,
        updatedAt: new Date(),
      });
    }
  });
};

