import { db } from "../firebaseConfig";
import { collection, addDoc, serverTimestamp, doc, setDoc } from "firebase/firestore";

/**
 * Seed Firebase with demo data
 * This can be called from the browser console or an admin page
 * 
 * Usage:
 * - Browser console: await seedFirebaseData()
 * - Or import and call: import { seedFirebaseData } from './utils/seedData'
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
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      {
        name: "Strawberry Dream",
        price: 160,
        stock: 40,
        category: "Juice",
        imageURL:
          "https://img.freepik.com/premium-photo/fresh-strawberry-juice-bottle_123827-19802.jpg",
        description: "Sweet strawberry juice",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      {
        name: "Citrus Splash",
        price: 170,
        stock: 45,
        category: "Juice",
        imageURL:
          "https://img.freepik.com/premium-photo/fresh-orange-juice-bottle_123827-20000.jpg",
        description: "Refreshing citrus blend",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      {
        name: "Tropical Twist",
        price: 190,
        stock: 35,
        category: "Juice",
        imageURL:
          "https://img.freepik.com/premium-photo/pineapple-juice-glass_123827-19902.jpg",
        description: "Exotic tropical fruit mix",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      {
        name: "Berry Mix",
        price: 279,
        stock: 30,
        category: "Juice",
        imageURL:
          "https://img.freepik.com/premium-photo/strawberry-juice-with-ice-glass_123827-19802.jpg",
        description: "Mixed berry delight",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
    ];

    const productIds: string[] = [];
    for (const product of products) {
      const docRef = await addDoc(collection(db, "products"), product);
      productIds.push(docRef.id);
      console.log(`✅ Added product: ${product.name} (ID: ${docRef.id})`);
    }

    console.log("✅ Demo products inserted successfully!");

    // Seed Demo Users (Firestore user documents)
    // Note: These are Firestore documents. Actual authentication users must be created via Firebase Auth.
    console.log("👥 Seeding demo user documents...");
    const demoUsers = [
      {
        uid: "demo-user-1",
        email: "customer@demo.com",
        displayName: "Demo Customer",
        role: "user" as const,
        sex: "Male",
        age: "25",
        phone: "+639123456789",
        createdAt: serverTimestamp(),
      },
      {
        uid: "demo-admin-1",
        email: "admin@demo.com",
        displayName: "Demo Admin",
        role: "admin" as const,
        sex: "Female",
        age: "30",
        phone: "+639987654321",
        createdAt: serverTimestamp(),
      },
    ];

    for (const user of demoUsers) {
      await setDoc(doc(db, "users", user.uid), user);
      console.log(`✅ Added user document: ${user.displayName} (${user.role})`);
    }

    console.log("✅ Demo user documents inserted successfully!");
    console.log("⚠️  Note: To use these users, you must also create them in Firebase Authentication.");

    // Seed Demo Orders (only if we have products)
    if (productIds.length > 0) {
      console.log("📋 Seeding demo orders...");
      const orders = [
        {
          userId: "demo-user-1",
          userEmail: "customer@demo.com",
          userName: "Demo Customer",
          items: [
            {
              productId: productIds[0],
              name: "Mango Tango",
              price: 180,
              quantity: 2,
            },
            {
              productId: productIds[1],
              name: "Strawberry Dream",
              price: 160,
              quantity: 1,
            },
          ],
          totalAmount: 520 + (520 * 0.12) + 45, // subtotal + VAT + shipping
          amount: 520 + (520 * 0.12) + 45,
          paymentId: "PAYPAL-DEMO-ORDER-001",
          status: "pending" as const,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        {
          userId: "demo-user-1",
          userEmail: "customer@demo.com",
          userName: "Demo Customer",
          items: [
            {
              productId: productIds[2],
              name: "Citrus Splash",
              price: 170,
              quantity: 3,
            },
          ],
          totalAmount: 510 + (510 * 0.12) + 45,
          amount: 510 + (510 * 0.12) + 45,
          paymentId: "PAYPAL-DEMO-ORDER-002",
          status: "accepted" as const,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        {
          userId: "demo-user-1",
          userEmail: "customer@demo.com",
          userName: "Demo Customer",
          items: [
            {
              productId: productIds[4],
              name: "Berry Mix",
              price: 279,
              quantity: 1,
            },
          ],
          totalAmount: 279 + (279 * 0.12) + 45,
          amount: 279 + (279 * 0.12) + 45,
          paymentId: "PAYPAL-DEMO-ORDER-003",
          status: "completed" as const,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
      ];

      for (const order of orders) {
        const docRef = await addDoc(collection(db, "orders"), order);
        console.log(`✅ Added order: ${docRef.id} (Status: ${order.status})`);
      }

      console.log("✅ Demo orders inserted successfully!");
    }

    console.log("🎉 All demo data seeded successfully!");
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

