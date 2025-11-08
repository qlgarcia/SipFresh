import { db } from "../firebaseConfig";
import {
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  query,
  orderBy,
  where,
  onSnapshot,
  Unsubscribe,
  DocumentData,
} from "firebase/firestore";

export type OrderStatus = "pending" | "accepted" | "declined" | "completed";

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface Order {
  id?: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

// Recursively remove undefined values from objects/arrays so Firestore won't reject the document
const cleanFirestoreData = (value: any): any => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (value instanceof Date) return value; // keep Date objects
  if (Array.isArray(value)) {
    // Clean each element and remove undefined entries
    return value
      .map((v) => cleanFirestoreData(v))
      .filter((v) => v !== undefined);
  }
  if (typeof value === "object") {
    const out: any = {};
    Object.keys(value).forEach((k) => {
      const cleaned = cleanFirestoreData(value[k]);
      if (cleaned !== undefined) {
        out[k] = cleaned;
      }
    });
    return out;
  }
  return value;
};

/**
 * Get all orders
 */
export const getOrders = async (): Promise<Order[]> => {
  try {
    const ordersRef = collection(db, "orders");
    const q = query(ordersRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as Order[];
  } catch (error) {
    console.error("Error getting orders:", error);
    throw error;
  }
};

/**
 * Real-time listener for all orders (admin view)
 */
export const listenToOrders = (
  callback: (orders: Order[], changes: { type: string; doc: DocumentData }[]) => void
): Unsubscribe => {
  const ordersRef = collection(db, "orders");
  const q = query(ordersRef, orderBy("createdAt", "desc"));

  const unsub = onSnapshot(
    q,
    (snapshot) => {
      const orders = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate(),
        updatedAt: d.data().updatedAt?.toDate(),
      })) as Order[];
      const changes = snapshot.docChanges().map((c) => ({ type: c.type, doc: { id: c.doc.id, ...c.doc.data() } }));
      callback(orders, changes);
    },
    (error) => {
      console.error("Orders realtime listener error:", error);
      callback([], []);
    }
  );

  return unsub;
};

/**
 * Real-time listener for orders of a specific user (customer view)
 */
export const listenToOrdersForUser = (
  userId: string,
  callback: (orders: Order[], changes: { type: string; doc: DocumentData }[]) => void
): Unsubscribe => {
  const ordersRef = collection(db, "orders");
  const q = query(ordersRef, where("userId", "==", userId), orderBy("createdAt", "desc"));

  const unsub = onSnapshot(
    q,
    (snapshot) => {
      const orders = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate(),
        updatedAt: d.data().updatedAt?.toDate(),
      })) as Order[];
      const changes = snapshot.docChanges().map((c) => ({ type: c.type, doc: { id: c.doc.id, ...c.doc.data() } }));
      callback(orders, changes);
    },
    (error) => {
      console.error("User orders realtime listener error:", error);
      callback([], []);
    }
  );

  return unsub;
};

/**
 * Get orders by status
 */
export const getOrdersByStatus = async (status: OrderStatus): Promise<Order[]> => {
  try {
    const ordersRef = collection(db, "orders");
    // Temporarily remove the orderBy clause while index is building
    const q = query(
      ordersRef,
      where("status", "==", status)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as Order[];
  } catch (error) {
    console.error("Error getting orders by status:", error);
    throw error;
  }
};

/**
 * Get a single order by ID
 */
export const getOrder = async (id: string): Promise<Order | null> => {
  try {
    const orderDoc = await getDoc(doc(db, "orders", id));
    if (orderDoc.exists()) {
      return {
        id: orderDoc.id,
        ...orderDoc.data(),
        createdAt: orderDoc.data().createdAt?.toDate(),
        updatedAt: orderDoc.data().updatedAt?.toDate(),
      } as Order;
    }
    return null;
  } catch (error) {
    console.error("Error getting order:", error);
    throw error;
  }
};

/**
 * Create a new order
 */
export const createOrder = async (order: Omit<Order, "id">): Promise<string> => {
  const ordersRef = collection(db, "orders");
  // Build payload and deep-clean undefined values (including inside arrays/objects)
  const payload: any = {
    ...order,
    status: order.status || "pending",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const cleanedPayload = cleanFirestoreData(payload);

  // Debug logs to help trace any remaining unsupported values reaching Firestore
  // (Remove or reduce log level once verified)
  try {
    console.debug("createOrder - raw payload:", payload);
    console.debug("createOrder - cleaned payload:", cleanedPayload);
  } catch (e) {
    // ignore logging errors
  }

  try {
    const docRef = await addDoc(ordersRef, cleanedPayload);
    return docRef.id;
  } catch (error) {
    console.error("Error creating order:", error);
    // Also log the payload that caused the error for debugging
    try {
      console.error("createOrder - payload on error:", cleanedPayload);
    } catch (e) {}
    throw error;
  }
};

/**
 * Update order status
 */
export const updateOrderStatus = async (
  id: string,
  status: OrderStatus
): Promise<void> => {
  try {
    const orderRef = doc(db, "orders", id);
    await updateDoc(orderRef, {
      status,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    throw error;
  }
};

