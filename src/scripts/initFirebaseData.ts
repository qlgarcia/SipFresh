import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, doc, setDoc } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";

// Firebase configuration - you'll need to set these in your .env file
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function seedData() {
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

    // Seed Users (Note: You'll need to create these users in Firebase Auth first)
    // This script assumes you'll manually create an admin user or update an existing user's role
    console.log("👥 Users should be created through the app or Firebase Console");
    console.log("💡 To make a user admin, update their role field in Firestore to 'admin'");

    // Seed Sample Orders
    console.log("📋 Seeding sample orders...");
    const orders = [
      {
        userId: "sample-user-1",
        userEmail: "user@example.com",
        userName: "John Doe",
        items: [
          {
            productId: "prod1",
            productName: "Mango Tango",
            quantity: 2,
            price: 180,
          },
        ],
        totalAmount: 360,
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: "sample-user-2",
        userEmail: "jane@example.com",
        userName: "Jane Smith",
        items: [
          {
            productId: "prod2",
            productName: "Strawberry Dream",
            quantity: 1,
            price: 160,
          },
          {
            productId: "prod3",
            productName: "Citrus Splash",
            quantity: 1,
            price: 170,
          },
        ],
        totalAmount: 330,
        status: "accepted",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    for (const order of orders) {
      await addDoc(collection(db, "orders"), order);
      console.log(`✅ Added order for: ${order.userName}`);
    }

    console.log("✅ Demo data inserted successfully!");
    console.log("📝 Note: You may need to manually create users and update their roles");
  } catch (error) {
    console.error("❌ Error seeding data:", error);
    throw error;
  }
}

// Run the seeding function
if (import.meta.env.MODE === "development") {
  seedData()
    .then(() => {
      console.log("🎉 Seeding completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Seeding failed:", error);
      process.exit(1);
    });
} else {
  console.log("⚠️ Seeding script should only be run in development mode");
}

export default seedData;

