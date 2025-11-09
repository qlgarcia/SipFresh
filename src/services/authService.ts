import { auth, db } from "../firebaseConfig";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

export interface UserRole {
  uid: string;
  email: string | null;
  role: "admin" | "user";
  displayName?: string;
}

/**
 * Get the current authenticated user
 */
export const getCurrentUser = (): Promise<User | null> => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
};

/**
 * Get user role from Firestore
 */
export const getUserRole = async (uid: string): Promise<"admin" | "user"> => {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return userData.role || "user";
    }
    return "user";
  } catch (error) {
    console.error("Error getting user role:", error);
    return "user";
  }
};

/**
 * Set user role in Firestore
 */
export const setUserRole = async (
  uid: string,
  role: "admin" | "user"
): Promise<void> => {
  try {
    await setDoc(
      doc(db, "users", uid),
      { role },
      { merge: true }
    );
  } catch (error) {
    console.error("Error setting user role:", error);
    throw error;
  }
};

/**
 * Get full user data with role
 */
export const getUserData = async (uid: string): Promise<UserRole | null> => {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      return {
        uid,
        email: data.email || null,
        role: data.role || "user",
        displayName: data.displayName || undefined,
      };
    }
    return null;
  } catch (error) {
    console.error("Error getting user data:", error);
    return null;
  }
};

/**
 * Check if current user is admin
 */
export const isAdmin = async (): Promise<boolean> => {
  const user = await getCurrentUser();
  if (!user) return false;
  const role = await getUserRole(user.uid);
  return role === "admin";
};

