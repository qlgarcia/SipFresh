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
  const { addToCart } = useCart(); // ✅ useCart hook to manage cart state

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleOrderClick = () => {
    if (user) {
      history.push("/products");
    } else {
      setShowLogin(true);
    }
  };

  // ✅ Updated Add to Cart behavior
  const handleAddToCart = (juice: any) => {
    if (!user) {
      setShowLogin(true);
      return;
    }

    addToCart({
      name: juice.name,
      price: juice.price,
      image: juice.image,
      quantity: 1,
    });

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
                  className="fruit-card-modern"
                  style={{ background: fruit.color }}
                >
                  <div className="fruit-emoji">{fruit.emoji}</div>
                  <div className="fruit-name">{fruit.name}</div>
                </div>
              </IonCol>
            ))}
          </IonRow>
        </IonGrid>

        {/* 🧃 POPULAR JUICES */}
        <div className="section-header">Popular Juices</div>
        <IonGrid>
          <IonRow>
            {[
              {
                name: "Berry Mix",
                price: 279.0,
                image:
                  "https://img.freepik.com/premium-photo/strawberry-juice-with-ice-glass_123827-19802.jpg",
              },
              {
                name: "Citrus Blast",
                price: 299.0,
                image:
                  "https://img.freepik.com/premium-photo/fresh-orange-juice-bottle_123827-20000.jpg",
              },
              {
                name: "Tropical Wave",
                price: 329.0,
                image:
                  "https://img.freepik.com/premium-photo/pineapple-mango-juice-bottle_123827-19902.jpg",
              },
            ].map((juice, index) => (
              <IonCol size="6" key={index}>
                <IonCard className="product-card">
                  <img
                    src={juice.image}
                    alt={juice.name}
                    className="product-image"
                  />
                  <IonCardHeader>
                    <IonCardTitle>{juice.name}</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <p className="price-text">₱{juice.price.toFixed(2)}</p>
                    <IonButton
                      fill="solid"
                      color="success"
                      size="small"
                      onClick={() => handleAddToCart(juice)}
                    >
                      <IonIcon icon={cartOutline} slot="start" />
                      Add to Cart
                    </IonButton>
                  </IonCardContent>
                </IonCard>
              </IonCol>
            ))}
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
    </IonPage>
  );
};

export default Home;
