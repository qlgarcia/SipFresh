import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonText,
  IonToast,
  IonSpinner,
  IonImg,
} from "@ionic/react";
import { useCart } from "../../context/CartContext";
import { createOrder } from "../../services/orderService";
import { useAuth } from "../../hooks/useAuth";
import TopBar from "../../components/TopBar";
import "./Checkout.css";

declare global {
  interface Window {
    paypal: any;
  }
}

const Checkout: React.FC = () => {
  const { cart, clearCart } = useCart();
  const history = useHistory();
  const { user, loading } = useAuth();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [processing, setProcessing] = useState(false);

  // calculations (same as Cart)
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const vatRate = 0.12;
  const vatAmount = subtotal * vatRate;
  const shippingFee = cart.length > 0 ? 45 : 0;
  const total = subtotal + vatAmount + shippingFee;

  useEffect(() => {
    const initializePayPal = async () => {
      // Wait for auth to initialize before deciding (prevents a flash when auth is still loading)
      if (loading) return;

      // Basic guard: require authenticated user to proceed to payment
      if (!user) {
        setToastMessage("Please login to complete checkout");
        setShowToast(true);
        // Redirect to home (login modal is available there) after a short delay so the toast is visible
        setTimeout(() => history.push("/home"), 1200);
        return;
      }

      // Small delay to ensure component is fully mounted before loading PayPal
      // This helps with navigation from Cart -> Checkout
      await new Promise(resolve => setTimeout(resolve, 800));

    // helper to dynamically load the PayPal SDK using Vite env var VITE_PAYPAL_CLIENT_ID
    const ensurePayPal = (): Promise<void> => {
      return new Promise((resolve, reject) => {
        try {
          // If PayPal is already loaded, resolve immediately
          if ((window as any).paypal) {
            resolve();
            return;
          }

          // Clear existing PayPal scripts to avoid conflicts
          document.querySelectorAll('script[src*="paypal.com/sdk/js"]').forEach(script => script.remove());

          const clientId = (import.meta as any).env.VITE_PAYPAL_CLIENT_ID;
          if (!clientId) {
            console.error("PayPal client ID not found in environment variables");
            setToastMessage("Payment system configuration error. Please contact support.");
            setShowToast(true);
            return reject(new Error("Missing PayPal client ID"));
          }

          const script = document.createElement("script");
          script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=PHP&intent=capture&components=buttons`;
          script.id = "paypal-sdk";
          script.async = true;
          
          let paypalCheckInterval: any = null;
          let timeoutId: any = null;

          // Resolve when PayPal object is available
          const checkPayPalAvailable = () => {
            if ((window as any).paypal?.Buttons) {
              if (paypalCheckInterval) clearInterval(paypalCheckInterval);
              if (timeoutId) clearTimeout(timeoutId);
              resolve();
              return true;
            }
            return false;
          };

          script.onload = () => {
            // Check immediately after load
            if (!checkPayPalAvailable()) {
              // If not available immediately, start polling
              paypalCheckInterval = setInterval(checkPayPalAvailable, 100);
              
              // Set a timeout to avoid infinite polling
              timeoutId = setTimeout(() => {
                if (paypalCheckInterval) clearInterval(paypalCheckInterval);
                reject(new Error("PayPal SDK initialization timeout"));
                setToastMessage("Payment system failed to load. Please refresh the page.");
                setShowToast(true);
              }, 10000); // 10 second timeout
            }
          };

          script.onerror = () => {
            if (paypalCheckInterval) clearInterval(paypalCheckInterval);
            if (timeoutId) clearTimeout(timeoutId);
            reject(new Error("Failed to load PayPal SDK"));
            setToastMessage("Payment system is currently unavailable. Please try again later.");
            setShowToast(true);
          };

          document.body.appendChild(script);
        } catch (error) {
          console.error("Error setting up PayPal:", error);
          reject(error);
        }
      });
    };

    // Use app totals directly in PHP (no client-side conversion). PayPal will be loaded with currency=PHP.
    const totalPHP = Math.max(0.01, +total.toFixed(2));

    const renderButtons = async () => {
      try {
        const paypal = (window as any).paypal;
        if (!paypal?.Buttons) {
          throw new Error("PayPal SDK not properly initialized");
        }

        // Clear existing buttons
        const container = document.getElementById("paypal-button-container");
        if (!container) {
          throw new Error("PayPal button container not found");
        }
        container.innerHTML = "";

        const buttons = paypal.Buttons({
          style: {
            layout: 'vertical',
            color: 'gold',
            shape: 'rect',
            label: 'paypal'
          },
          createOrder: (data: any, actions: any) => {
            return actions.order.create({
              purchase_units: [
                {
                  amount: {
                    currency_code: "PHP",
                    value: totalPHP.toFixed(2),
                    breakdown: {
                      item_total: { currency_code: "PHP", value: subtotal.toFixed(2) },
                      tax_total: { currency_code: "PHP", value: vatAmount.toFixed(2) },
                      shipping: { currency_code: "PHP", value: shippingFee.toFixed(2) }
                    }
                  },
                  items: cart.map((item: { name: string; quantity: number; price: number }) => ({
                    name: item.name,
                    quantity: item.quantity.toString(),
                    unit_amount: { currency_code: "PHP", value: item.price.toFixed(2) }
                  }))
                },
              ],
            });
          },
          onApprove: async (data: any, actions: any) => {
            setProcessing(true);
            try {
              const details = await actions.order.capture();

              // Map cart items to order items matching schema
              const orderItems = cart.map((it: any) => ({
                productId: it.id,
                name: it.name,
                price: it.price,
                quantity: it.quantity,
              }));

              const orderId = await createOrder({
                userId: user!.uid,
                userEmail: user!.email || undefined,
                userName: user!.displayName || undefined,
                items: orderItems,
                totalAmount: total,
                status: "pending",
                // attach payment information
                paymentId: details.id,
              } as any);

              // clear cart locally
              clearCart();

              // navigate to success page with order id
              history.replace("/order-success", { orderId });
            } catch (err: any) {
              console.error("Checkout error:", err);
              setToastMessage("Payment succeeded but saving order failed. Please contact support.");
              setShowToast(true);
              setProcessing(false);
            }
          },
          onError: (err: any) => {
            console.error("PayPal Buttons error:", err);
            setToastMessage("Payment error. Please try again.");
            setShowToast(true);
          },
        }).render("#paypal-button-container");
      } catch (err) {
        console.error("Failed to render PayPal Buttons:", err);
        setToastMessage("Payment initialization failed");
        setShowToast(true);
      }
    };

    let mounted = true;
    initializePayPal()
      .then(() => ensurePayPal())
      .then(() => {
        if (mounted) renderButtons();
      })
      .catch((err) => {
        console.error("Error loading PayPal SDK:", err);
        setToastMessage("Payment provider not available");
        setShowToast(true);
      });

    // cleanup: remove PayPal script and container children on unmount
    return () => {
      mounted = false;
      // Clear PayPal container
      const container = document.getElementById("paypal-button-container");
      if (container) container.innerHTML = "";
      
      // Remove PayPal script
      const script = document.getElementById("paypal-sdk");
      if (script) script.remove();
      
      // Clear PayPal object
      (window as any).paypal = undefined;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, cart]);

  if (cart.length === 0) {
    return (
      <IonPage>
        <TopBar />
        <IonContent className="checkout-content">
          <div className="empty-cart text-center">
            <img
              src="https://cdn-icons-png.flaticon.com/512/3081/3081559.png"
              alt="Empty Cart"
              className="empty-cart-img"
            />
            <h2>Your cart is empty</h2>
            <p>Start adding some refreshing drinks!</p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <TopBar />

      <IonContent className="checkout-content">
        <section className="checkout-section">
          <IonList lines="none">
            {cart.map((item: any) => (
              <IonItem key={item.id} className="cart-item">
                <IonImg src={item.image} alt={item.name} className="cart-image" />
                <IonLabel>
                  <div className="item-header">
                    <h2 className="item-name">{item.name}</h2>
                  </div>
                  <p className="item-details">₱{item.price.toFixed(2)}</p>
                  <p className="item-quantity">Quantity: {item.quantity}</p>
                  <p className="item-subtotal">
                    Subtotal: ₱{(item.quantity * item.price).toFixed(2)}
                  </p>
                </IonLabel>
              </IonItem>
            ))}
          </IonList>
        </section>

        {/* Order Summary Section */}
        <section className="order-summary">
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

        {/* PayPal Button Container */}
        <div id="paypal-button-container" />
        {processing && (
          <div className="processing-overlay">
            <IonSpinner /> Processing payment...
          </div>
        )}
      </IonContent>

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

export default Checkout;
