import React from "react";
import { useHistory, useLocation } from "react-router-dom";
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonText } from "@ionic/react";

const CheckoutSuccess: React.FC = () => {
  const history = useHistory();
  const location: any = useLocation();
  const orderId = location?.state?.orderId;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Order Success</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <h2>Thank you for your purchase!</h2>
        {orderId ? (
          <div>
            <p>Your order id: <strong>{orderId}</strong></p>
          </div>
        ) : (
          <p>Your payment was successful.</p>
        )}

        <div style={{ marginTop: 16 }}>
          <IonButton expand="block" onClick={() => history.push("/home")}>Go to Home</IonButton>
          <IonButton expand="block" color="tertiary" onClick={() => history.push("/profile")}>View Orders</IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default CheckoutSuccess;
