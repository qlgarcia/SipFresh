import React from "react";
import {
  IonHeader,
  IonToolbar,
  IonButtons,
  IonMenuButton,
  IonTitle,
  IonButton,
  IonIcon,
  IonBadge,
} from "@ionic/react";
import { cartOutline } from "ionicons/icons";
import { useCart } from "../context/CartContext";
import "./TopBar.css";

const TopBar: React.FC = () => {
  const { cart } = useCart();
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <IonHeader>
      <IonToolbar className="toolbar-modern">
        <IonButtons slot="start">
          <IonMenuButton />
        </IonButtons>

        <IonTitle>
          <span className="brand sip">Sip</span>
          <span className="brand fresh">Fresh</span>
        </IonTitle>

        <IonButtons slot="end">
          <IonButton routerLink="/cart" fill="clear" className="cart-btn">
            <IonIcon icon={cartOutline} />
            {totalItems > 0 && (
              <IonBadge color="danger" className="cart-badge">
                {totalItems}
              </IonBadge>
            )}
          </IonButton>
        </IonButtons>
      </IonToolbar>
    </IonHeader>
  );
};

export default TopBar;
