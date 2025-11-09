import React from "react";
import { Route, Redirect } from "react-router-dom";
import {
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
} from "@ionic/react";
import { statsChartOutline, cubeOutline, receiptOutline, peopleOutline } from "ionicons/icons";
import Dashboard from "./Dashboard";
import Products from "./Products";
import Orders from "./Orders";
import Users from "./Users";
import AdminGuard from "../../components/AdminGuard";

const AdminLayout: React.FC = () => {
  return (
    <AdminGuard>
      <IonTabs>
        <IonRouterOutlet>
          <Route exact path="/admin/dashboard">
            <Dashboard />
          </Route>
          <Route exact path="/admin/products">
            <Products />
          </Route>
          <Route exact path="/admin/orders">
            <Orders />
          </Route>
          <Route exact path="/admin/users">
            <Users />
          </Route>
          <Route exact path="/admin">
            <Redirect to="/admin/dashboard" />
          </Route>
        </IonRouterOutlet>
        <IonTabBar slot="bottom">
          <IonTabButton tab="dashboard" href="/admin/dashboard">
            <IonIcon icon={statsChartOutline} />
            <IonLabel>Dashboard</IonLabel>
          </IonTabButton>
          <IonTabButton tab="products" href="/admin/products">
            <IonIcon icon={cubeOutline} />
            <IonLabel>Products</IonLabel>
          </IonTabButton>
          <IonTabButton tab="orders" href="/admin/orders">
            <IonIcon icon={receiptOutline} />
            <IonLabel>Orders</IonLabel>
          </IonTabButton>
          <IonTabButton tab="users" href="/admin/users">
            <IonIcon icon={peopleOutline} />
            <IonLabel>Users</IonLabel>
          </IonTabButton>
        </IonTabBar>
      </IonTabs>
    </AdminGuard>
  );
};

export default AdminLayout;

