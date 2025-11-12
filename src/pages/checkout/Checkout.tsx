import React, { useEffect, useState, useRef } from "react";
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

// Module-level singleton loader to avoid injecting the PayPal SDK multiple times
// (React 18 StrictMode can mount/unmount components twice in dev which causes
// PayPal to register duplicate zoid listeners and throw errors). We keep a
// single promise so repeated calls reuse the same initialization.
let __paypalLoadPromise: Promise<void> | null = null;
const ensurePayPalSdk = (): Promise<void> => {
  if (__paypalLoadPromise) return __paypalLoadPromise;

  __paypalLoadPromise = new Promise((resolve, reject) => {
    try {
      if ((window as any).paypal?.Buttons) {
        resolve();
        return;
      }

      // If a script already exists, don't remove it — just wait for paypal to be ready
      const existing = document.getElementById("paypal-sdk") as HTMLScriptElement | null;

      const clientId = (import.meta as any).env.VITE_PAYPAL_CLIENT_ID;
      if (!clientId) {
        console.error("PayPal client ID not found in environment variables");
        reject(new Error("Missing PayPal client ID"));
        return;
      }

      const attachCheck = (scriptEl: HTMLScriptElement | null) => {
        let paypalCheckInterval: any = null;
        let timeoutId: any = null;

        const checkPayPalAvailable = () => {
          if ((window as any).paypal?.Buttons) {
            if (paypalCheckInterval) clearInterval(paypalCheckInterval);
            if (timeoutId) clearTimeout(timeoutId);
            resolve();
            return true;
          }
          return false;
        };

        if (checkPayPalAvailable()) return;

        if (scriptEl) {
          // If script already loaded but paypal not ready, wait/poll
          paypalCheckInterval = setInterval(checkPayPalAvailable, 100);
          timeoutId = setTimeout(() => {
            if (paypalCheckInterval) clearInterval(paypalCheckInterval);
            reject(new Error("PayPal SDK initialization timeout"));
          }, 10000);

          scriptEl.addEventListener("error", () => {
            if (paypalCheckInterval) clearInterval(paypalCheckInterval);
            if (timeoutId) clearTimeout(timeoutId);
            reject(new Error("Failed to load PayPal SDK"));
          });
          return;
        }

        // Create script if not present
        const script = document.createElement("script");
        script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=PHP&intent=capture&components=buttons`;
        script.id = "paypal-sdk";
        script.async = true;

        script.onload = () => {
          if (!checkPayPalAvailable()) {
            paypalCheckInterval = setInterval(checkPayPalAvailable, 100);
            timeoutId = setTimeout(() => {
              if (paypalCheckInterval) clearInterval(paypalCheckInterval);
              reject(new Error("PayPal SDK initialization timeout"));
            }, 10000);
          }
        };

        script.onerror = () => {
          reject(new Error("Failed to load PayPal SDK"));
        };

        document.body.appendChild(script);
      };

      attachCheck(existing);
    } catch (error) {
      __paypalLoadPromise = null;
      reject(error);
    }
  });

  return __paypalLoadPromise;
};

const Checkout: React.FC = () => {
  const { cart, clearCart } = useCart();
  const history = useHistory();
  const { user, loading } = useAuth();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [processing, setProcessing] = useState(false);
  const paypalContainerRef = useRef<HTMLDivElement | null>(null);

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

      // Close initializePayPal early: it only performs auth/delay checks.
      // The SDK loader and render functions are defined at the useEffect scope
      // below so they can be reused when initializing the PayPal buttons.
    };

    // PayPal SDK loader moved to module scope (ensurePayPalSdk) to make
    // initialization idempotent across mounts and avoid duplicate listeners.

    // Use app totals directly in PHP (no client-side conversion). PayPal will be loaded with currency=PHP.
    const totalPHP = Math.max(0.01, +total.toFixed(2));

    const renderButtons = async () => {
      try {
        const paypal = (window as any).paypal;
        if (!paypal?.Buttons) {
          throw new Error("PayPal SDK not properly initialized");
        }

        // Resolve container using ref first (more reliable with Ionic) and
        // fall back to document lookup. If not available yet, retry a few
        // times with a short delay — IonContent sometimes renders children
        // slightly later in the DOM.
        let container: HTMLElement | null = paypalContainerRef.current ?? document.getElementById("paypal-button-container");
        let retries = 0;
        while (!container && retries < 10) {
          await new Promise((r) => setTimeout(r, 100));
          container = paypalContainerRef.current ?? document.getElementById("paypal-button-container");
          retries++;
        }

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
                productId: it.productId || it.id,
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
      .then(() => ensurePayPalSdk())
      .then(() => {
        if (mounted) renderButtons();
      })
      .catch((err) => {
        console.error("Error loading PayPal SDK:", err);
        setToastMessage("Payment provider not available");
        setShowToast(true);
      });

    // cleanup: only clear component-specific DOM. Do NOT remove the global
    // PayPal script or `window.paypal` — leaving the SDK in place prevents the
    // PayPal library from re-registering internal listeners on remount (React
    // StrictMode double-mount can cause "request listener already exists").
    return () => {
      mounted = false;
      const container = document.getElementById("paypal-button-container");
      const containerNode = paypalContainerRef.current ?? document.getElementById("paypal-button-container");
      if (containerNode) containerNode.innerHTML = "";
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
