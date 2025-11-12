import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import {
  IonPage,
  IonContent,
  IonButton,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonToast,
} from "@ionic/react";
import { cartOutline } from "ionicons/icons";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { listenToProducts, Product } from "../services/productService";
import { useCart } from "../context/CartContext"; // ✅ make sure you have CartContext
import LoginModal from "../components/LoginModal";
import TopBar from "../components/TopBar";
import "./Home.css";

const Home: React.FC = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const history = useHistory();
  const { cart, addToCart } = useCart(); // ✅ useCart hook to manage cart state
  const [products, setProducts] = useState<Product[]>([]);
  const [errorToast, setErrorToast] = useState({ open: false, msg: "" });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Real-time products
  useEffect(() => {
    const unsub = listenToProducts((products, changes) => {
      const normalized = products.map((product: any) => ({
        ...product,
        stock:
          typeof product.stock === "number"
            ? product.stock
            : typeof product.stock === "string"
            ? Number(product.stock)
            : undefined,
      }));
      setProducts(normalized);
      // Don't show toasts for initial load
      if (changes.length > 0 && products.length > 0) {
        // Skip notifications on page load/initial data fetch
        const last = changes[changes.length - 1];
        if (last.type !== "added") { // Only show for modifications and removals
          const lastProduct = last.doc as Product;
          setToastMessage(() => {
            if (last.type === "modified") return `${lastProduct.name} updated`;
            if (last.type === "removed") return `${lastProduct.name} removed`;
            return "Catalog updated";
          });
          setShowToast(true);
        }
      }
    });

    return () => unsub();
  }, []);

  const handleOrderClick = () => {
    if (user) {
      history.push("/products");
    } else {
      setShowLogin(true);
    }
  };

  // ✅ Updated Add to Cart behavior
  const getQuantityInCart = (productId?: string) => {
    if (!productId) return 0;
    return cart.reduce((sum, item) => (item.productId === productId ? sum + item.quantity : sum), 0);
  };

  const handleAddToCart = (juice: any) => {
    if (!user) {
      setShowLogin(true);
      return;
    }

    const productId = juice.id || `${juice.name}-${juice.price}`;
    const stockValue =
      typeof juice.stock === "number"
        ? juice.stock
        : typeof juice.stock === "string"
        ? Number(juice.stock)
        : undefined;

    const success = addToCart({
      id: productId,
      productId,
      name: juice.name,
      price: Number(juice.price) || 0,
      image: juice.image || juice.imageURL || "",
      quantity: 1,
      stock: stockValue,
    });

    if (!success) {
      setErrorToast({ open: true, msg: "Sorry, this product is out of stock." });
      return;
    }

    setToastMessage(`${juice.name} added to cart 🛒`);
    setShowToast(true);
  };

  return (
    <IonPage>
      <TopBar />

      <IonContent fullscreen className="home-content">
        {/* 🥭 HERO SECTION */}
        <div className="hero-section">
          <img
            src="https://img.freepik.com/premium-photo/vibrant-photo-bottle-mango-juice_1169880-20071.jpg"
            alt="Mango Juice"
            className="hero-image"
          />
          <div className="hero-text">
            <h2>Refreshing Mango Blast</h2>
            <p>Our featured flavor this week 🍹</p>
            <IonButton
              color="primary"
              shape="round"
              fill="solid"
              onClick={handleOrderClick}
            >
              {user ? "Order Now" : "Sign in to Order"}
            </IonButton>
          </div>
        </div>

        {/* 🍓 BROWSE BY FRUIT */}
        <div className="section-header">Browse by Fruit</div>
        <IonGrid>
          <IonRow className="fruit-grid">
            {[
              { name: "Strawberry", emoji: "🍓", color: "linear-gradient(135deg, #ff758c, #ff7eb3)" },
              { name: "Pineapple", emoji: "🍍", color: "linear-gradient(135deg, #fce38a, #f38181)" },
              { name: "Orange", emoji: "🍊", color: "linear-gradient(135deg, #f6d365, #fda085)" },
              { name: "Mango", emoji: "🥭", color: "linear-gradient(135deg, #f9d423, #ff4e50)" },
              { name: "Watermelon", emoji: "🍉", color: "linear-gradient(135deg, #84fab0, #8fd3f4)" },
              { name: "Blueberry", emoji: "🫐", color: "linear-gradient(135deg, #a18cd1, #fbc2eb)" },
            ].map((fruit, index) => (
              <IonCol size="6" size-md="4" key={index}>
                <div
                  role="button"
                  tabIndex={0}
                  className="fruit-card-modern"
                  style={{ background: fruit.color, cursor: 'pointer' }}
                  onClick={() => history.push(`/products?category=${encodeURIComponent(fruit.name)}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      history.push(`/products?category=${encodeURIComponent(fruit.name)}`);
                    }
                  }}
                >
                  <div className="fruit-emoji">{fruit.emoji}</div>
                  <div className="fruit-name">{fruit.name}</div>
                </div>
              </IonCol>
            ))}
          </IonRow>
        </IonGrid>

        {/* 🧃 POPULAR JUICES - from Firestore */}
        <div className="section-header">Popular Juices</div>
        <IonGrid>
          <IonRow>
            {products.length === 0 ? (
              <IonCol>
                <p style={{ textAlign: "center" }}>No products to display</p>
              </IonCol>
            ) : (
              products.slice(0, 6).map((juice) => {
                const productId = juice.id || `${juice.name}-${juice.price}`;
                const quantityInCart = getQuantityInCart(productId);
                return (
                  <IonCol size="6" key={productId}>
                    <IonCard className="product-card">
                      <img
                        src={(juice as any).imageURL || (juice as any).image || ""}
                        alt={(juice as any).name}
                        className="product-image"
                      />
                      <IonCardHeader>
                        <IonCardTitle>{(juice as any).name}</IonCardTitle>
                      </IonCardHeader>
                      <IonCardContent>
                        <p className="price-text">₱{Number((juice as any).price || 0).toFixed(2)}</p>
                        <div
                          className={`stock-indicator ${
                            typeof juice.stock === "number" && juice.stock > 0 ? "in-stock" : "out-of-stock"
                          }`}
                        >
                          {typeof juice.stock === "number"
                            ? juice.stock > 0
                              ? `In stock: ${Math.max(juice.stock - quantityInCart, 0)}`
                              : "Out of stock"
                            : "Stock unavailable"}
                        </div>
                        <IonButton
                          fill="solid"
                          color="success"
                          size="small"
                          disabled={
                            typeof juice.stock === "number" &&
                            quantityInCart >= juice.stock
                          }
                          className="add-to-cart-btn"
                          onClick={() => handleAddToCart(juice)}
                        >
                          <IonIcon icon={cartOutline} slot="start" />
                          Add to Cart
                        </IonButton>
                      </IonCardContent>
                    </IonCard>
                  </IonCol>
                );
              })
            )}
          </IonRow>
        </IonGrid>
      </IonContent>

      {/* 🔹 LOGIN MODAL */}
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />

      {/* 🔹 TOAST NOTIFICATION */}
      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={1500}
        color="success"
      />
      <IonToast
        isOpen={errorToast.open}
        onDidDismiss={() => setErrorToast({ open: false, msg: "" })}
        message={errorToast.msg}
        duration={2000}
        color="danger"
      />
    </IonPage>
  );
};

export default Home;
