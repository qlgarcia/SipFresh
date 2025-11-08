import { db } from "../firebaseConfig";
import { collection, addDoc } from "firebase/firestore";

/**
 * Seed Firebase with demo data
 * This can be called from the browser console or an admin page
 */
export async function seedFirebaseData() {
  console.log("🌱 Starting Firebase data seeding...");

  try {
    // Seed Products
    console.log("📦 Seeding products...");
    const products = [
      {
        name: "Mango Tango",
        price: 180,
        stock: 50,
        category: "Juice",
        imageURL:
          "https://img.freepik.com/premium-photo/mango-juice-bottle-glass_123827-19891.jpg",
        description: "Fresh mango juice with tropical flavor",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Strawberry Dream",
        price: 160,
        stock: 40,
        category: "Juice",
        imageURL:
          "https://img.freepik.com/premium-photo/fresh-strawberry-juice-bottle_123827-19802.jpg",
        description: "Sweet strawberry juice",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Citrus Splash",
        price: 170,
        stock: 45,
        category: "Juice",
        imageURL:
          "https://img.freepik.com/premium-photo/fresh-orange-juice-bottle_123827-20000.jpg",
        description: "Refreshing citrus blend",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Tropical Twist",
        price: 190,
        stock: 35,
        category: "Juice",
        imageURL:
          "https://img.freepik.com/premium-photo/pineapple-juice-glass_123827-19902.jpg",
        description: "Exotic tropical fruit mix",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Berry Mix",
        price: 279,
        stock: 30,
        category: "Juice",
        imageURL:
          "https://img.freepik.com/premium-photo/strawberry-juice-with-ice-glass_123827-19802.jpg",
        description: "Mixed berry delight",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    for (const product of products) {
      await addDoc(collection(db, "products"), product);
      console.log(`✅ Added product: ${product.name}`);
    }

    console.log("✅ Demo products inserted successfully!");
    console.log("📝 Note: Users and orders should be created through normal app usage");
    return { success: true, message: "Data seeded successfully!" };
  } catch (error) {
    console.error("❌ Error seeding data:", error);
    return { success: false, error: error };
  }
}

// Make it available globally for browser console usage
if (typeof window !== "undefined") {
  (window as any).seedFirebaseData = seedFirebaseData;
}

