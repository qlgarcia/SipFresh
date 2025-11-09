import { db } from "../firebaseConfig";
import {
  collection,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  query,
  orderBy,
} from "firebase/firestore";

const parseTimestamp = (val: any): Date | undefined => {
  if (!val) return undefined;
  try {
    if (typeof val.toDate === "function") return val.toDate();
  } catch (e) {}
  if (val instanceof Date) return val;
  if (typeof val === "object" && typeof val.seconds === "number") return new Date(val.seconds * 1000);
  if (typeof val === "number") return new Date(val);
  return undefined;
};

export interface UserData {
  id?: string;
  uid: string;
  email: string;
  displayName?: string;
  role: "admin" | "user";
  sex?: string;
  age?: string;
  phone?: string;
  createdAt?: Date;
}

/**
 * Get all users
 */
export const getUsers = async (): Promise<UserData[]> => {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: parseTimestamp(doc.data().createdAt),
    })) as UserData[];
  } catch (error) {
    console.error("Error getting users:", error);
    throw error;
  }
};

/**
 * Get a single user by ID
 */
export const getUser = async (uid: string): Promise<UserData | null> => {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      return {
        id: userDoc.id,
        ...userDoc.data(),
        createdAt: parseTimestamp(userDoc.data().createdAt),
      } as UserData;
    }
    return null;
  } catch (error) {
    console.error("Error getting user:", error);
    throw error;
  }
};

/**
 * Update user data
 */
export const updateUser = async (
  uid: string,
  updates: Partial<UserData>
): Promise<void> => {
  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, updates);
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
};

/**
 * Update user role
 */
export const updateUserRole = async (
  uid: string,
  role: "admin" | "user"
): Promise<void> => {
  try {
    await updateUser(uid, { role });
  } catch (error) {
    console.error("Error updating user role:", error);
    throw error;
  }
};

