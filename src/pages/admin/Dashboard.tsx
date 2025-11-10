import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonSpinner,
  IonButton,
  IonToast,
  IonButtons,
  IonBackButton,
} from "@ionic/react";
import { getUsers } from "../../services/userService";
import { getOrders, getOrdersByStatus } from "../../services/orderService";
import { getProducts } from "../../services/productService";
import { seedFirebaseData } from "../../utils/seedData";
import "./Dashboard.css";

const Dashboard: React.FC = () => {
  const [totalUsers, setTotalUsers] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [seeding, setSeeding] = useState(false);

  const loadStats = async () => {
    try {
      const [users, orders, products] = await Promise.all([
        getUsers(),
        getOrders(),
        getProducts(),
      ]);

      setTotalUsers(users.length);
      setTotalProducts(products.length);
      setTotalOrders(orders.length);

      try {
        const pending = await getOrdersByStatus("pending");
        setPendingOrders(pending.length);
      } catch (indexError) {
        console.warn("Waiting for order status index to build...");
        // Set pending orders to count from all orders
        setPendingOrders(orders.filter(order => order.status === "pending").length);
      }
    } catch (error) {
      console.error("Error loading dashboard stats:", error);
      setToastMessage("Error loading some statistics");
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleSeedData = async () => {
    if (!window.confirm("This will add demo products to Firestore. Continue?")) {
      return;
    }
    setSeeding(true);
    try {
      const result = await seedFirebaseData();
      if (result.success) {
        setToastMessage("Demo data seeded successfully!");
        setShowToast(true);
        await loadStats();
      } else {
        setToastMessage("Error seeding data. Check console for details.");
        setShowToast(true);
      }
    } catch (error) {
      console.error("Error seeding data:", error);
      setToastMessage("Error seeding data");
      setShowToast(true);
    } finally {
      setSeeding(false);
    }
  };

  if (loading) {
    return (
      <IonPage>
        <IonContent className="ion-padding">
          <div style={{ display: "flex", justifyContent: "center", paddingTop: "50px" }}>
            <IonSpinner />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>Admin Dashboard</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonGrid>
          <IonRow>
            <IonCol size="12" sizeMd="6" sizeLg="3">
              <IonCard color="primary">
                <IonCardHeader>
                  <IonCardTitle>Total Users</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <h2 style={{ fontSize: "2.5em", margin: 0 }}>{totalUsers}</h2>
                </IonCardContent>
              </IonCard>
            </IonCol>
            <IonCol size="12" sizeMd="6" sizeLg="3">
              <IonCard color="warning">
                <IonCardHeader>
                  <IonCardTitle>Pending Orders</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <h2 style={{ fontSize: "2.5em", margin: 0 }}>{pendingOrders}</h2>
                </IonCardContent>
              </IonCard>
            </IonCol>
            <IonCol size="12" sizeMd="6" sizeLg="3">
              <IonCard color="success">
                <IonCardHeader>
                  <IonCardTitle>Total Products</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <h2 style={{ fontSize: "2.5em", margin: 0 }}>{totalProducts}</h2>
                </IonCardContent>
              </IonCard>
            </IonCol>
            <IonCol size="12" sizeMd="6" sizeLg="3">
              <IonCard color="secondary">
                <IonCardHeader>
                  <IonCardTitle>Total Orders</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <h2 style={{ fontSize: "2.5em", margin: 0 }}>{totalOrders}</h2>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
        </IonGrid>

        

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2000}
          color="success"
        />
      </IonContent>
    </IonPage>
  );
};

export default Dashboard;
