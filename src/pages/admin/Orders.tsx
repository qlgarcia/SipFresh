import React, { useEffect, useState } from "react";
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
  IonBadge,
  IonSpinner,
  IonCard,
  IonCardContent,
  IonSegment,
  IonSegmentButton,
  IonToast,
} from "@ionic/react";
import { updateOrderStatus, getOrders, listenToOrders, Order, OrderStatus } from "../../services/orderService";
import "./Orders.css";

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    // set up realtime listener for orders
    const unsub = listenToOrders((ordersData, changes) => {
      if (Array.isArray(ordersData)) {
        setOrders(ordersData as Order[]);
        setFilteredOrders(ordersData as Order[]);
        setLoading(false);
      }
    });

    // fallback to one-time load
    loadOrders().catch(() => {});

    return () => unsub();
  }, []);

  useEffect(() => {
    if (statusFilter === "all") {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(orders.filter((order) => order.status === statusFilter));
    }
  }, [statusFilter, orders]);

  const loadOrders = async () => {
    try {
      const ordersData = await getOrders();
      setOrders(ordersData);
      setFilteredOrders(ordersData);
    } catch (error) {
      console.error("Error loading orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, status: "accepted" | "declined") => {
    try {
      await updateOrderStatus(orderId, status);
      setToastMessage(`Order ${status === "accepted" ? "accepted" : "declined"} successfully`);
      setShowToast(true);
      // realtime listener will update UI; fallback fetch
      await loadOrders();
    } catch (error) {
      console.error("Error updating order status:", error);
      setToastMessage("Error updating order status");
      setShowToast(true);
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "accepted":
        return "success";
      case "declined":
        return "danger";
      case "completed":
        return "primary";
      default:
        return "warning";
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
          <IonTitle>Orders Management</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonSegment
          value={statusFilter}
          onIonChange={(e) => setStatusFilter(e.detail.value as OrderStatus | "all")}
        >
          <IonSegmentButton value="all">
            <IonLabel>All</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="pending">
            <IonLabel>Pending</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="accepted">
            <IonLabel>Accepted</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="declined">
            <IonLabel>Declined</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="completed">
            <IonLabel>Completed</IonLabel>
          </IonSegmentButton>
        </IonSegment>

        {filteredOrders.length === 0 ? (
          <IonCard>
            <IonCardContent>
              <p style={{ textAlign: "center" }}>No orders found</p>
            </IonCardContent>
          </IonCard>
        ) : (
          <IonList>
            {filteredOrders.map((order) => (
              <IonItem key={order.id}>
                <IonLabel>
                  <h2>Order #{order.id?.substring(0, 8)}</h2>
                  <p>
                    <strong>User:</strong> {order.userName || order.userEmail || order.userId}
                  </p>
                  <div>
                    <p>
                      <strong>Items:</strong> {order.items.length} item(s)
                    </p>
                    <details style={{ marginTop: "8px" }}>
                      <summary style={{ cursor: "pointer", color: "var(--ion-color-primary)" }}>
                        View Items
                      </summary>
                      <ul style={{ marginTop: "8px", paddingLeft: "20px" }}>
                        {order.items.map((item, idx) => (
                          <li key={idx}>
                            {item.productName} - Qty: {item.quantity} × ₱{item.price.toFixed(2)} = ₱
                            {(item.quantity * item.price).toFixed(2)}
                          </li>
                        ))}
                      </ul>
                    </details>
                  </div>
                  <p>
                    <strong>Total:</strong> ₱{order.totalAmount.toFixed(2)}
                  </p>
                  <p>
                    <strong>Date:</strong>{" "}
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleDateString() +
                        " " +
                        new Date(order.createdAt).toLocaleTimeString()
                      : "N/A"}
                  </p>
                  <IonBadge color={getStatusColor(order.status)}>
                    {order.status.toUpperCase()}
                  </IonBadge>
                </IonLabel>
                {order.status === "pending" && (
                  <>
                    <IonButton
                      slot="end"
                      color="success"
                      onClick={() => handleUpdateStatus(order.id!, "accepted")}
                    >
                      Accept
                    </IonButton>
                    <IonButton
                      slot="end"
                      color="danger"
                      onClick={() => handleUpdateStatus(order.id!, "declined")}
                    >
                      Decline
                    </IonButton>
                  </>
                )}
              </IonItem>
            ))}
          </IonList>
        )}

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

export default Orders;

