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
  DocumentData,
  Unsubscribe,
} from "firebase/firestore";

// Avoid spamming the console when permission denied happens repeatedly
let permissionDeniedLogged = false;
export interface Category {
  id?: string;
  name: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Real-time listener for categories.
 * callback receives (categories, changes) where changes is an array of
 * { type: 'added'|'modified'|'removed', doc } to enable UI signals.
 */
export const listenToCategories = (
  callback: (categories: Category[], changes: { type: string; doc: DocumentData }[]) => void
): Unsubscribe => {
  const categoriesRef = collection(db, "categories");
  const q = query(categoriesRef, orderBy("name", "asc"));

  try {
    // Declare the unsubscribe function
    let unsubscribe: Unsubscribe;
    
    // Set up the snapshot listener
    unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const categories = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Category[];
        const changes = snapshot.docChanges().map((c) => ({ type: c.type, doc: { id: c.doc.id, ...c.doc.data() } }));
        callback(categories, changes);
      },
      (error: any) => {
        // Avoid noisy repeated messages when rules block access repeatedly.
        if (error && error.code === "permission-denied") {
          if (!permissionDeniedLogged) {
            // Log once to help debugging, then suppress further identical logs
            console.warn("Permission denied accessing categories. Check Firestore rules or project configuration.", error);
            permissionDeniedLogged = true;
          }
        } else {
          console.error("Categories realtime listener error:", error);
        }

        // call callback with empty results so UI can remain stable
        callback([], []);
      }
    );
    
    return unsubscribe;
  } catch (error) {
    console.error("Failed to start categories listener:", error);
    // Return a no-op unsubscribe function
    return () => {};
  }
};

/**
 * Get all categories
 */
export const getCategories = async (): Promise<Category[]> => {
  try {
    const categoriesRef = collection(db, "categories");
    const q = query(categoriesRef, orderBy("name", "asc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Category[];
  } catch (error) {
    console.error("Error getting categories:", error);
    throw error;
  }
};

/**
 * Get a single category by ID
 */
export const getCategory = async (id: string): Promise<Category | null> => {
  try {
    const categoryDoc = await getDoc(doc(db, "categories", id));
    if (categoryDoc.exists()) {
      return { id: categoryDoc.id, ...categoryDoc.data() } as Category;
    }
    return null;
  } catch (error) {
    console.error("Error getting category:", error);
    throw error;
  }
};

/**
 * Create a new category
 */
export const createCategory = async (category: Omit<Category, "id">): Promise<string> => {
  try {
    const categoriesRef = collection(db, "categories");
    const docRef = await addDoc(categoriesRef, {
      ...category,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating category:", error);
    throw error;
  }
};

/**
 * Update a category
 */
export const updateCategory = async (
  id: string,
  updates: Partial<Category>
): Promise<void> => {
  try {
    const categoryRef = doc(db, "categories", id);
    await updateDoc(categoryRef, {
      ...updates,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error("Error updating category:", error);
    throw error;
  }
};

/**
 * Delete a category
 */
export const deleteCategory = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, "categories", id));
  } catch (error) {
    console.error("Error deleting category:", error);
    throw error;
  }
};