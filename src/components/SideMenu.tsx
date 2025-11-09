import React, { useEffect, useState } from "react";
import {
  IonMenu,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonMenuToggle,
  IonButton,
  IonFooter,
} from "@ionic/react";
import { IonToast } from "@ionic/react";
import {
  homeOutline,
  personCircleOutline,
  receiptOutline,
  informationCircleOutline,
  logOutOutline,
  logInOutline,
  pricetagOutline,
  cartOutline,
  mailOutline,
  callOutline,
  shieldOutline,
} from "ionicons/icons";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth, db } from "../firebaseConfig";
import { useHistory, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { listenToCategories, Category } from "../services/categoryService";
import LoginModal from "./LoginModal";
import logo from "../assets/SipFreshClear.png";
import "./SideMenu.css";

interface SideMenuProps {
  selected: string;
  onSelect: (id: string) => void;
}

const SideMenu: React.FC<SideMenuProps> = ({ selected, onSelect }) => {
  const [user, setUser] = useState<User | null>(null);
  // track whether auth has finished its first initialization callback
  const [authReady, setAuthReady] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const history = useHistory();
  const location = useLocation();
  const { isAdmin } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [catErrorToast, setCatErrorToast] = useState({ open: false, msg: "" });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      // mark that auth has finished its initial check (even if user is null)
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Listen to categories collection for realtime menu updates
  useEffect(() => {
    // Don't start the categories listener until auth has finished initializing.
    // This avoids attempting reads before the client is fully set up which
    // can trigger spurious permission-denied errors in some environments.
    if (!authReady) return;

    const unsub = listenToCategories((categories, changes) => {
      setCategories(categories);
      if (changes.length > 0) {
        // Only show toast for changes in admin view to avoid noise for customers
        if (isAdmin) {
          const last = changes[changes.length - 1];
          const lastCategory = last.doc as { name: string };
          setCatErrorToast({
            open: true,
            msg: `Category ${lastCategory.name} ${last.type === 'added' ? 'added' : last.type === 'modified' ? 'updated' : 'removed'}`
          });
        }
      }
    });
    return () => unsub();
  }, [isAdmin, authReady]);

  const handleNavigate = (path: string, id: string) => {
    onSelect(id);
    history.push(path);
  };

  const handleLogout = async () => {
    await signOut(auth);
    onSelect("home");
    history.push("/home");
  };

  return (
    <>
      <IonMenu
        contentId="main-content"
        side="start"
        menuId="main-menu"
        type="overlay"
      >
        {/* ✅ HEADER */}
        <IonHeader>
          <IonToolbar className="menu-toolbar">
            <IonTitle className="menu-title">
              <img src={logo} alt="Logo" className="menu-logo" />
              <span className="sip">Sip</span>
              <span className="fresh">Fresh</span>
            </IonTitle>
          </IonToolbar>
        </IonHeader>

        {/* ✅ CONTENT */}
        <IonContent className="menu-content">
          {/* USER SECTION */}
      <div className="user-section text-center">
        {user ? (
          <>
            {/* ✅ Profile Picture (clickable) */}
            <img
              src={
                user.photoURL ||
                "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
              }
              alt="User"
              className="profile-picture mb-2"
              onClick={() => handleNavigate("/profile", "profile")}
              onError={(e) => {
                // If external avatar is blocked (OpaqueResponseBlocking / NS_BINDING_ABORTED), fallback to default
                (e.currentTarget as HTMLImageElement).src = "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";
              }}
            />

            <p className="welcome-text">
              Hello! <strong>{user.displayName || user.email}</strong> 
            </p>

          </>
        ) : (
          <>
            {/* Default avatar when not logged in */}
            <img
              src="https://cdn-icons-png.flaticon.com/512/847/847969.png"
              alt="Guest Avatar"
              className="profile-picture mb-2"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";
              }}
            />
            <p className="welcome-text">⚠️ You must log in first</p>
            <IonButton
              fill="solid"
              color="primary"
              size="small"
              onClick={() => setShowLoginModal(true)}
            >
              <IonIcon slot="start" icon={logInOutline} />
              Go to Login
            </IonButton>
          </>
        )}
      </div>


          {/* MAIN MENU */}
          <IonList className="menu-list">
            <IonMenuToggle autoHide={true}>
              <IonItem
                button
                lines="none"
                detail={false}
                onClick={() => handleNavigate("/home", "home")}
                className={`menu-item ${
                  location.pathname === "/home" ? "menu-item-selected" : ""
                }`}
              >
                <IonIcon slot="start" icon={homeOutline} />
                <IonLabel>Home</IonLabel>
              </IonItem>
            </IonMenuToggle>

            {/* DYNAMIC CATEGORIES (from Firestore) */}
            {categories.map((cat) => (
              <IonMenuToggle autoHide={true} key={cat.id}>
                <IonItem
                  button
                  lines="none"
                  detail={false}
                  onClick={() => handleNavigate(`/products?category=${encodeURIComponent(cat.name)}`, cat.name)}
                  className={`menu-item ${location.pathname === "/products" ? "menu-item-selected" : ""}`}
                >
                  <IonIcon slot="start" icon={pricetagOutline} />
                  <IonLabel>{cat.name}</IonLabel>
                </IonItem>
              </IonMenuToggle>
            ))}

            <IonToast
              isOpen={catErrorToast.open}
              onDidDismiss={() => setCatErrorToast({ open: false, msg: "" })}
              message={catErrorToast.msg}
              duration={3000}
              color="warning"
            />

            <IonMenuToggle autoHide={true}>
              <IonItem
                button
                lines="none"
                detail={false}
                onClick={() => handleNavigate("/products", "products")}
                className={`menu-item ${
                  location.pathname === "/products" ? "menu-item-selected" : ""
                }`}
              >
                <IonIcon slot="start" icon={pricetagOutline} />
                <IonLabel>About our products</IonLabel>
              </IonItem>
            </IonMenuToggle>

              <IonMenuToggle autoHide={true}>
                <IonItem
                  button
                  lines="none"
                  detail={false}
                  onClick={() => handleNavigate("/cart", "cart")}
                  className={`menu-item ${
                    location.pathname === "/cart" ? "menu-item-selected" : ""
                  }`}
                >
                  <IonIcon slot="start" icon={cartOutline} />
                  <IonLabel>Cart</IonLabel>
                </IonItem>
              </IonMenuToggle>


            <IonMenuToggle autoHide={true}>
              <IonItem
                button
                lines="none"
                detail={false}
                onClick={() => handleNavigate("/profile", "profile")}
                className={`menu-item ${
                  location.pathname === "/profile" ? "menu-item-selected" : ""
                }`}
              >
                <IonIcon slot="start" icon={personCircleOutline} />
                <IonLabel>Profile</IonLabel>
              </IonItem>
            </IonMenuToggle>

            {/* NEW ABOUT PAGE LINK */}
            <IonMenuToggle autoHide={true}>
              <IonItem
                button
                lines="none"
                detail={false}
                onClick={() => handleNavigate("/about", "about")}
                className={`menu-item ${
                  location.pathname === "/about" ? "menu-item-selected" : ""
                }`}
              >
                <IonIcon slot="start" icon={informationCircleOutline} />
                <IonLabel>About the app</IonLabel>
              </IonItem>
            </IonMenuToggle>

            <IonMenuToggle autoHide={true}>
              <IonItem
                button
                lines="none"
                detail={false}
                onClick={() => handleNavigate("/company-history", "company-history")}
                className={`menu-item ${
                  location.pathname === "/company-history" ? "menu-item-selected" : ""
                }`}
              >
                <IonIcon slot="start" icon={receiptOutline} />
                <IonLabel>Company History</IonLabel>
              </IonItem>
            </IonMenuToggle>

            

            <IonMenuToggle autoHide={true}>
              <IonItem
                button
                lines="none"
                detail={false}
                onClick={() => handleNavigate("/developers", "developers")}
                className={`menu-item ${
                  location.pathname === "/developers" ? "menu-item-selected" : ""
                }`}
              >
                <IonIcon slot="start" icon={personCircleOutline} />
                <IonLabel>Developers</IonLabel>
              </IonItem>
            </IonMenuToggle>

<IonMenuToggle autoHide={true}>
  <IonItem
    button
    lines="none"
    detail={false}
    onClick={() => handleNavigate("/contact-us", "contact-us")}
    className={`menu-item ${
      location.pathname === "/contact-us" ? "menu-item-selected" : ""
    }`}
  >
    <IonIcon slot="start" icon={callOutline} />
    <IonLabel>Contact Us</IonLabel>
  </IonItem>
</IonMenuToggle>

{/* ADMIN MENU - Only show for admin users */}
{isAdmin && (
  <IonMenuToggle autoHide={true}>
    <IonItem
      button
      lines="none"
      detail={false}
      onClick={() => handleNavigate("/admin", "admin")}
      className={`menu-item ${
        location.pathname.startsWith("/admin") ? "menu-item-selected" : ""
      }`}
    >
      <IonIcon slot="start" icon={shieldOutline} />
      <IonLabel>Admin Panel</IonLabel>
    </IonItem>
  </IonMenuToggle>
)}


          </IonList>
        </IonContent>
        

        {/* ✅ FOOTER */}
        <IonFooter className="menu-footer">
          <p>🍹 Stay Fresh with SipFresh © 2025</p>
        </IonFooter>
      </IonMenu>

      {/* LOGIN MODAL */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </>
  );
};

export default SideMenu;
