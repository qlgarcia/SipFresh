import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonMenuButton,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
  IonImg,
  IonFooter,
  IonText,
  IonToast,
  IonSpinner,
} from "@ionic/react";
import { trashOutline, addOutline, removeOutline } from "ionicons/icons";
import { useCart } from "../context/CartContext";
import { auth } from "../firebaseConfig";
import { onAuthStateChanged, User } from "firebase/auth";
import { createOrder } from "../services/orderService";
import { getUser } from "../services/userService";
import { useAuth } from "../hooks/useAuth";
import "./Cart.css";
import TopBar from "../components/TopBar";

const Cart: React.FC = () => {
  const { cart, removeFromCart, clearCart, increaseQuantity, decreaseQuantity } = useCart();
  const history = useHistory();
  const [user, setUser] = useState<User | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { isAdmin } = useAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // 🧮 Base calculations
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const vatRate = 0.12;
  const vatAmount = subtotal * vatRate;
  const shippingFee = cart.length > 0 ? 45 : 0;
  const total = subtotal + vatAmount + shippingFee;

  const handleCheckout = async () => {
    if (!user) {
      setToastMessage("Please login to checkout");
      setShowToast(true);
      return;
    }

    if (cart.length === 0) {
      setToastMessage("Your cart is empty");
      setShowToast(true);
      return;
    }

    setIsProcessing(true);

    try {
      // Get user data for order
      const userData = await getUser(user.uid);
      
      // Convert cart items to order items
      const orderItems = cart.map((item) => ({
        productId: item.id,
        productName: item.name,
        quantity: item.quantity,
        price: item.price,
      }));

      // Create order in Firestore
      await createOrder({
        userId: user.uid,
        userEmail: user.email || undefined,
        userName: userData?.displayName || user.displayName || undefined,
        items: orderItems,
        totalAmount: total,
        status: "pending",
      });

      // Clear cart
      clearCart();

      // Show success message and navigate
      setToastMessage("Order placed successfully!");
      setShowToast(true);

      // Navigate to admin orders page if admin, otherwise go to home
      setTimeout(() => {
        if (isAdmin) {
          history.push("/admin/orders");
        } else {
          history.push("/home");
        }
      }, 1500);
    } catch (error) {
      console.error("Error creating order:", error);
      setToastMessage("Error placing order. Please try again.");
      setShowToast(true);
      setIsProcessing(false);
    }
  };

  return (
    <IonPage>
  <TopBar />

      <IonContent className="cart-content">
        {cart.length === 0 ? (
          <div className="empty-cart text-center">
            <img
              src="https://cdn-icons-png.flaticon.com/512/3081/3081559.png"
              alt="Empty Cart"
              className="empty-cart-img"
            />
            <h2>Your cart is empty</h2>
            <p>Start adding some refreshing drinks!</p>
          </div>
        ) : (
          <>
            {/* 🧾 Cart Items */}
            <section className="cart-section">
              <IonList lines="none">
                {cart.map((item, index) => (
                  <IonItem key={`${item.id}-${index}`} className="cart-item">
                    <IonImg src={item.image} alt={item.name} className="cart-image" />
                    <IonLabel>
                      <div className="item-header">
                        <h2 className="item-name">{item.name}</h2>
                        <IonButton
                          color="danger"
                          fill="clear"
                          size="small"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <IonIcon icon={trashOutline} />
                        </IonButton>
                      </div>

                      <p className="item-details">₱{item.price.toFixed(2)}</p>

                      {/* ➕ Quantity controls */}
                      <div className="quantity-controls">
                        <IonButton
                          fill="outline"
                          size="small"
                          className="qty-btn"
                          onClick={() => decreaseQuantity(item.id)}
                        >
                          <IonIcon icon={removeOutline} />
                        </IonButton>

                        <span className="qty-text">{item.quantity}</span>

                        <IonButton
                          fill="outline"
                          size="small"
                          className="qty-btn"
                          onClick={() => increaseQuantity(item.id)}
                        >
                          <IonIcon icon={addOutline} />
                        </IonButton>
                      </div>


                      <p className="item-subtotal">
                        Subtotal: ₱{(item.price * item.quantity).toFixed(2)}
                      </p>
                    </IonLabel>
                  </IonItem>
                ))}
              </IonList>
            </section>

            {/* 💵 Order Summary */}
            <section className="order-summary shadow-sm p-3 rounded">
              <IonText color="dark">
                <h3 className="summary-title">Order Summary</h3>
              </IonText>

              <div className="summary-row">
                <span>Subtotal</span>
                <span>₱{subtotal.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>VAT (12%)</span>
                <span>₱{vatAmount.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Shipping Fee</span>
                <span>₱{shippingFee.toFixed(2)}</span>
              </div>
              <hr />
              <div className="summary-row total">
                <strong>Total</strong>
                <strong>₱{total.toFixed(2)}</strong>
              </div>
            </section>
          </>
        )}
      </IonContent>

      {cart.length > 0 && (
        <IonFooter className="cart-footer">
          <IonButton
            expand="block"
            color="success"
            className="checkout-btn"
            onClick={handleCheckout}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <IonSpinner />
                {" Processing..."}
              </>
            ) : (
              "Proceed to Checkout"
            )}
          </IonButton>
          <IonButton expand="block" color="medium" fill="clear" onClick={clearCart} disabled={isProcessing}>
            Clear Cart
          </IonButton>
        </IonFooter>
      )}

      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={3000}
        color={toastMessage.includes("Error") ? "danger" : "success"}
      />
    </IonPage>
  );
};

export default Cart;
