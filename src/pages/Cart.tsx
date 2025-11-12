import React, { useState, useEffect } from "react";
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
// Checkout will be handled in a dedicated Checkout page using PayPal
import { useAuth } from "../hooks/useAuth";
import "./Cart.css";
import TopBar from "../components/TopBar";

const Cart: React.FC = () => {
  const { cart, removeFromCart, clearCart, increaseQuantity, decreaseQuantity } = useCart();
  const [user, setUser] = useState<User | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
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
                {cart.map((item, index) => {
                  const remainingStock =
                    typeof item.stock === "number"
                      ? Math.max(
                          item.stock -
                            cart
                              .filter((cartItem) => cartItem.productId === item.productId)
                              .reduce((sum, cartItem) => sum + cartItem.quantity, 0),
                          0
                        )
                      : undefined;
                  return (
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
                          disabled={
                            typeof item.stock === "number" &&
                            cart
                              .filter((cartItem) => cartItem.productId === item.productId)
                              .reduce((sum, cartItem) => sum + cartItem.quantity, 0) >= item.stock
                          }
                          onClick={() => {
                            const success = increaseQuantity(item.id);
                            if (!success) {
                              setToastMessage("Error: Cannot add more. Stock limit reached.");
                              setShowToast(true);
                            }
                          }}
                        >
                          <IonIcon icon={addOutline} />
                        </IonButton>
                      </div>


                      <p className="item-subtotal">
                        Subtotal: ₱{(item.price * item.quantity).toFixed(2)}
                      </p>
                      {typeof item.stock === "number" && (
                        <p className="item-stock">
                          Available stock: {remainingStock ?? 0}
                        </p>
                      )}
                    </IonLabel>
                    </IonItem>
                  );
                })}
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
            routerLink="/checkout"
          >
            Proceed to Checkout
          </IonButton>
          <IonButton expand="block" color="medium" fill="clear" onClick={clearCart}>
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
