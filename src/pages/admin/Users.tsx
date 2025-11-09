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
  IonSelect,
  IonSelectOption,
  IonToast,
  IonSegment,
  IonSegmentButton,
} from "@ionic/react";
import { getUsers, updateUserRole, UserData } from "../../services/userService";
import "./Users.css";

const Users: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "user">("all");
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (roleFilter === "all") {
      setFilteredUsers(users);
    } else {
      setFilteredUsers(users.filter((user) => (user.role || "user") === roleFilter));
    }
  }, [roleFilter, users]);

  const loadUsers = async () => {
    try {
      const usersData = await getUsers();
      setUsers(usersData);
      setFilteredUsers(usersData);
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (uid: string, newRole: "admin" | "user") => {
    try {
      await updateUserRole(uid, newRole);
      setToastMessage(`User role updated to ${newRole}`);
      setShowToast(true);
      await loadUsers();
    } catch (error) {
      console.error("Error updating user role:", error);
      setToastMessage("Error updating user role");
      setShowToast(true);
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
          <IonTitle>Users Management</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonSegment
          value={roleFilter}
          onIonChange={(e) => setRoleFilter(e.detail.value as "all" | "admin" | "user")}
        >
          <IonSegmentButton value="all">
            <IonLabel>All</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="admin">
            <IonLabel>Admins</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="user">
            <IonLabel>Users</IonLabel>
          </IonSegmentButton>
        </IonSegment>

        {filteredUsers.length === 0 ? (
          <IonCard>
            <IonCardContent>
              <p style={{ textAlign: "center" }}>No users found</p>
            </IonCardContent>
          </IonCard>
        ) : (
          <IonList>
            {filteredUsers.map((user) => (
              <IonItem key={user.uid}>
                <IonLabel>
                  <h2>{user.displayName || "No Name"}</h2>
                  <p>
                    <strong>Email:</strong> {user.email || "No Email"}
                  </p>
                  <p>
                    <strong>UID:</strong> {user.uid?.substring(0, 8) || "Unknown"}...
                  </p>
                  {user.createdAt && (
                    <p>
                      <strong>Joined:</strong>{" "}
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  )}
                  <IonBadge color={user.role === "admin" ? "danger" : "primary"}>
                    {(user.role || "user").toUpperCase()}
                  </IonBadge>
                </IonLabel>
                <IonSelect
                  value={user.role || "user"}
                  onIonChange={(e) => handleRoleChange(user.uid, e.detail.value)}
                  placeholder="Select Role"
                >
                  <IonSelectOption value="user">User</IonSelectOption>
                  <IonSelectOption value="admin">Admin</IonSelectOption>
                </IonSelect>
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

export default Users;

