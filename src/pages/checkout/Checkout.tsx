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
} from "@ionic/react";
import { useCart } from "../../context/CartContext";
import { createOrder } from "../../services/orderService";
import { useAuth } from "../../hooks/useAuth";

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

    // helper to dynamically load the PayPal SDK using Vite env var VITE_PAYPAL_CLIENT_ID
    const ensurePayPal = (): Promise<void> => {
      return new Promise((resolve, reject) => {
        if ((window as any).paypal) return resolve();

        const clientId = (import.meta as any).env?.VITE_PAYPAL_CLIENT_ID;
        // default currency to PHP (Philippine Peso)
        const currency = (import.meta as any).env?.VITE_PAYPAL_CURRENCY || "PHP";

            // If client id isn't provided, fail fast and show a clear message instead of trying to load a bad URL
            if (!clientId) {
              console.error("PayPal client id is not set. Set VITE_PAYPAL_CLIENT_ID in your .env (use sandbox id for testing)");
              setToastMessage("Payment provider not configured. Please set VITE_PAYPAL_CLIENT_ID.");
              setShowToast(true);
              return reject(new Error("Missing PayPal client id"));
            }

            const script = document.createElement("script");
            script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency}`;
        script.async = true;
        script.onload = () => {
          // small delay to ensure paypal is attached
          setTimeout(() => {
            if ((window as any).paypal) resolve();
            else reject(new Error("PayPal SDK did not initialize."));
          }, 50);
        };
        script.onerror = (ev) => reject(new Error("Failed to load PayPal SDK"));
        document.head.appendChild(script);
      });
    };

    // Use app totals directly in PHP (no client-side conversion). PayPal will be loaded with currency=PHP.
    const totalPHP = Math.max(0.01, +total.toFixed(2));

    const renderButtons = async () => {
      try {
        const paypal = (window as any).paypal;
        if (!paypal) throw new Error("PayPal SDK not available after load");

        paypal.Buttons({
          createOrder: (data: any, actions: any) => {
            return actions.order.create({
              purchase_units: [
                {
                  amount: { value: totalPHP.toFixed(2) },
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
    ensurePayPal()
      .then(() => {
        if (mounted) renderButtons();
      })
      .catch((err) => {
        console.error("Error loading PayPal SDK:", err);
        setToastMessage("Payment provider not available");
        setShowToast(true);
      });

    // cleanup: remove container children on unmount so re-render works
    return () => {
      mounted = false;
      const container = document.getElementById("paypal-button-container");
      if (container) container.innerHTML = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, cart]);

  if (cart.length === 0) {
    return (
      <IonPage>
        <IonContent className="ion-padding">
          <h2>Your cart is empty</h2>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Checkout</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <h3>Order Summary</h3>
        <IonList>
          {cart.map((item: any) => (
            <IonItem key={item.id}>
              <IonLabel>
                <strong>{item.name}</strong>
                <p>
                  {item.quantity} × ₱{item.price.toFixed(2)} = ₱{(item.quantity * item.price).toFixed(2)}
                </p>
              </IonLabel>
            </IonItem>
          ))}
        </IonList>

        <div style={{ marginTop: 12 }}>
          <div>Subtotal: ₱{subtotal.toFixed(2)}</div>
          <div>VAT (12%): ₱{vatAmount.toFixed(2)}</div>
          <div>Shipping: ₱{shippingFee.toFixed(2)}</div>
          <h2>Total: ₱{total.toFixed(2)}</h2>
        </div>

        <div style={{ marginTop: 24 }}>
          <div id="paypal-button-container" />
          {processing && (
            <div style={{ marginTop: 12 }}>
              <IonSpinner /> Processing payment...
            </div>
          )}
        </div>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
        />
      </IonContent>
    </IonPage>
  );
};

export default Checkout;
