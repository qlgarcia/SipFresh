import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonContent,
  IonButton,
  IonIcon,
  IonInput,
  IonLabel,
  IonItem,
  IonLoading,
  IonToast,
  IonSelect,
  IonSelectOption,
} from "@ionic/react";
import { logOutOutline, cameraOutline, saveOutline } from "ionicons/icons";
import { auth, db, storage } from "../firebaseConfig";
import { onAuthStateChanged, signOut, updateProfile, User } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useHistory } from "react-router-dom";
import TopBar from "../components/TopBar";
import "./ProfilePage.css";
import { listenToOrdersForUser, Order } from "../services/orderService";

const ProfilePage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderToast, setOrderToast] = useState({ open: false, msg: "" });

  // Additional fields
  const [sex, setSex] = useState("");
  const [age, setAge] = useState("");
  const [countryCode, setCountryCode] = useState("+63");
  const [phone, setPhone] = useState("");

  const history = useHistory();

  // Load user + Firestore data on auth change
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setDisplayName(currentUser.displayName || "");
        setPhotoURL(
          currentUser.photoURL ||
            "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
        );

        try {
          const docRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data() as any;
            setSex(data.sex || "");
            setAge(data.age || "");

            if (data.phone) {
              if (data.phone.startsWith("+")) {
                const codeMatch = (data.phone as string).match(/^\+\d+/);
                const code = codeMatch ? codeMatch[0] : "+63";
                const number = (data.phone as string).replace(code, "");
                setCountryCode(code);
                setPhone(number);
              } else {
                setCountryCode("+63");
                setPhone(data.phone);
              }
            }
          }
        } catch (err) {
          console.error("Error loading user profile data:", err);
        }
      } else {
        setDisplayName("");
        setPhotoURL("https://cdn-icons-png.flaticon.com/512/3135/3135715.png");
        setSex("");
        setAge("");
        setCountryCode("+63");
        setPhone("");
      }
    });

    return () => unsub();
  }, []);

  // Logout
  const handleLogout = async () => {
    await signOut(auth);
    history.push("/home");
  };

  // Handle profile picture selection
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;
    setImageFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      setPhotoURL(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Save profile
  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert("No user logged in!");
      return;
    }

    setLoading(true);
    try {
      let uploadedPhotoURL = photoURL;

      // Upload new photo if selected
      if (imageFile) {
        const storageRef = ref(storage, `profilePictures/${user.uid}`);
        await uploadBytes(storageRef, imageFile);
        uploadedPhotoURL = await getDownloadURL(storageRef);
      }

      // Update Firebase Auth profile
      await updateProfile(user, {
        displayName,
        photoURL: uploadedPhotoURL,
      });

      // Save additional info to Firestore
      await setDoc(
        doc(db, "users", user.uid),
        {
          displayName,
          sex,
          age,
          phone: `${countryCode}${phone}`,
          email: user.email,
          photoURL: uploadedPhotoURL,
        },
        { merge: true }
      );

      alert("Profile updated successfully!");
      setImageFile(null);
    } catch (error: any) {
      console.error("Profile update failed:", error);
      alert(`Error updating profile: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Listen to user's orders in realtime and show status change notifications
  useEffect(() => {
    if (!user) return;
    const unsub = listenToOrdersForUser(user.uid, (ordersData, changes) => {
      setOrders(ordersData as Order[]);
      // show toast for status changes
      changes.forEach((c) => {
        if (c.type === "modified") {
          const status = (c.doc as any).status;
          setOrderToast({ open: true, msg: `Order ${c.doc.id?.substring(0, 8)} ${status}` });
        }
      });
    });

    return () => unsub();
  }, [user]);

  return (
    <IonPage>
      <TopBar />

      <IonContent className="profile-content">
        <IonLoading
          isOpen={loading}
          message="Saving changes..."
          onDidDismiss={() => setLoading(false)}
        />

        {user ? (
          <div className="profile-card shadow-sm">
            {/* Profile Picture */}
            <div className="text-center mb-4">
              <div className="profile-image-wrapper">
                <img
                  src={photoURL}
                  alt="Profile"
                  className="profile-image mb-2"
                />
                <label className="camera-icon" title="Change profile picture">
                  <IonIcon icon={cameraOutline} />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    hidden
                  />
                </label>
              </div>
            </div>

            {/* Display Name */}
            <IonItem className="mb-3">
              <IonLabel position="stacked">Display Name</IonLabel>
              <IonInput
                value={displayName}
                placeholder="Enter your name"
                onIonChange={(e) => setDisplayName(e.detail.value!)}
              />
            </IonItem>

            {/* Email */}
            <IonItem className="mb-3">
              <IonLabel position="stacked">Email</IonLabel>
              <IonInput value={user.email || ""} readonly />
            </IonItem>

            {/* Sex */}
            <IonItem className="mb-3">
              <IonLabel position="stacked">Sex</IonLabel>
              <select
                value={sex}
                onChange={(e) => setSex(e.target.value)}
                className="ion-input"
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid var(--ion-color-medium)",
                  borderRadius: "8px",
                }}
              >
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </IonItem>

            {/* Age */}
            <IonItem className="mb-3">
              <IonLabel position="stacked">Age</IonLabel>
              <IonInput
                type="number"
                placeholder="Enter your age"
                value={age}
                onIonChange={(e) => setAge(e.detail.value!)}
              />
            </IonItem>

            {/* Phone Number */}
            <IonItem className="mb-4">
              <IonLabel position="stacked">Phone Number</IonLabel>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  width: "100%",
                }}
              >
                <IonSelect
                  value={countryCode}
                  onIonChange={(e) => setCountryCode(e.detail.value)}
                  interface="popover"
                  style={{ width: "30%" }}
                >
                  <IonSelectOption value="+63">🇵🇭 +63</IonSelectOption>
                  <IonSelectOption value="+1">🇺🇸 +1</IonSelectOption>
                  <IonSelectOption value="+44">🇬🇧 +44</IonSelectOption>
                  <IonSelectOption value="+61">🇦🇺 +61</IonSelectOption>
                  <IonSelectOption value="+91">🇮🇳 +91</IonSelectOption>
                </IonSelect>

                <IonInput
                  type="tel"
                  placeholder="9123456789"
                  value={phone}
                  onIonChange={(e) => setPhone(e.detail.value!)}
                />
              </div>
            </IonItem>

            {/* Buttons */}
            <div className="d-flex justify-content-between">
              <IonButton expand="block" color="success" onClick={handleSave}>
                <IonIcon slot="start" icon={saveOutline} />
                Save Changes
              </IonButton>

              <IonButton expand="block" color="danger" onClick={handleLogout}>
                <IonIcon slot="start" icon={logOutOutline} />
                Log Out
              </IonButton>
            </div>

            {/* Order history (real-time) - sorted newest first */}
            <div style={{ marginTop: 24 }}>
              <h3>Your Orders</h3>
              {orders.length === 0 ? (
                <p>No orders yet.</p>
              ) : (
                [...orders]
                  .sort((a, b) => {
                    const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
                    const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
                    return dateB - dateA; // newest first
                  })
                  .map((o) => (
                    <div key={o.id} style={{ padding: 12, borderBottom: "1px solid #eee", borderRadius: 4, marginBottom: 8, backgroundColor: "#fafafa" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <strong>Order #{o.id?.substring(0, 8)}</strong>
                        <span style={{ fontSize: 12, color: "#999" }}>
                          {o.createdAt
                            ? new Date(o.createdAt).toLocaleDateString() +
                              " " +
                              new Date(o.createdAt).toLocaleTimeString()
                            : "N/A"}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: 16, fontSize: 14 }}>
                        <div>
                          <strong style={{ color: "var(--ion-color-primary)" }}>Status:</strong> {o.status.toUpperCase()}
                        </div>
                        <div>
                          <strong>Items:</strong> {o.items.length}
                        </div>
                        <div>
                          <strong>Total:</strong> ₱{(o.totalAmount || 0).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        ) : (
          <p className="text-center text-muted mt-5">
            Please log in to view your profile.
          </p>
        )}
      </IonContent>
      <IonToast
        isOpen={orderToast.open}
        onDidDismiss={() => setOrderToast({ open: false, msg: "" })}
        message={orderToast.msg}
        duration={2500}
        color="primary"
      />
    </IonPage>
  );
};

export default ProfilePage;
