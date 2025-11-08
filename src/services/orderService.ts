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
  try {
    const ordersRef = collection(db, "orders");
    const docRef = await addDoc(ordersRef, {
      ...order,
      status: order.status || "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating order:", error);
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

