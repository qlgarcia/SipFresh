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
  IonThumbnail,
  IonImg,
} from "@ionic/react";
import { updateOrderStatus, getOrders, listenToOrders, Order, OrderStatus } from "../../services/orderService";
import "./Orders.css";

type SortOption = "newest" | "oldest" | "amount-high" | "amount-low";

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
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

  const sortOrders = (ordersToSort: Order[]): Order[] => {
    const sorted = [...ordersToSort];
    switch (sortBy) {
      case "newest":
        return sorted.sort((a, b) => {
          const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
          const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
          return dateB - dateA;
        });
      case "oldest":
        return sorted.sort((a, b) => {
          const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
          const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
          return dateA - dateB;
        });
      case "amount-high":
        return sorted.sort((a, b) => (b.totalAmount || 0) - (a.totalAmount || 0));
      case "amount-low":
        return sorted.sort((a, b) => (a.totalAmount || 0) - (b.totalAmount || 0));
      default:
        return sorted;
    }
  };

  useEffect(() => {
    let filtered = orders;
    if (statusFilter !== "all") {
      filtered = orders.filter((order) => order.status === statusFilter);
    }
    setFilteredOrders(sortOrders(filtered));
  }, [statusFilter, orders, sortBy]);

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
        {/* Status Filter */}
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

        {/* Sort Dropdown */}
        <div style={{ padding: "12px 16px", backgroundColor: "#f9f9f9", borderBottom: "1px solid #eee" }}>
          <label style={{ fontSize: 14, fontWeight: 500, display: "block", marginBottom: 8 }}>Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: "4px",
              border: "1px solid var(--ion-color-medium)",
              fontSize: 14,
            }}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="amount-high">Highest Amount</option>
            <option value="amount-low">Lowest Amount</option>
          </select>
        </div>

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
                        View Items ({order.items.length})
                      </summary>
                      <ul style={{ marginTop: "8px", paddingLeft: "0" }}>
                        {order.items.map((item, idx) => (
                          <li key={idx} style={{ listStyle: "none", marginBottom: 12, paddingBottom: 12, borderBottom: "1px solid #eee" }}>
                            <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                              {item.productId && (
                                <IonThumbnail style={{ minWidth: 60, height: 60 }}>
                                  <img
                                    src={`https://via.placeholder.com/60x60?text=${encodeURIComponent(item.productId.substring(0, 8))}`}
                                    alt={item.productName || item.name || "Product"}
                                    style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 4 }}
                                  />
                                </IonThumbnail>
                              )}
                              <div style={{ flex: 1 }}>
                                <div><strong>{item.productName || item.name || "Unknown"}</strong></div>
                                <div style={{ fontSize: 12, color: "#666" }}>ID: {item.productId}</div>
                                <div>Qty: {item.quantity} × ₱{item.price.toFixed(2)} = ₱{(item.quantity * item.price).toFixed(2)}</div>
                              </div>
                            </div>
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

