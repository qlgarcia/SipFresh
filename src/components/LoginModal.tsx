import React, { useState } from "react";
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
} from "@ionic/react";
import { logoGoogle, logoFacebook, closeOutline, mailOutline } from "ionicons/icons";
import { signInWithPopup, createUserWithEmailAndPassword } from "firebase/auth";
import { auth, googleProvider, db } from "../firebaseConfig";
import { doc, setDoc } from "firebase/firestore";
import "./LoginModal.css";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      await setDoc(
        doc(db, "users", user.uid),
        {
          uid: user.uid,
          displayName: user.displayName || "",
          email: user.email,
          role: "user",
          sex: "",
          age: "",
          phone: "",
          createdAt: new Date(),
        },
        { merge: true }
      );

      onClose();
    } catch (error) {
      console.error("Google login error:", error);
    }
  };

  const handleEmailSignup = async () => {
    if (!email || !password) return alert("Please fill out both fields.");
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: "",
        role: "user",
        sex: "",
        age: "",
        phone: "",
        createdAt: new Date(),
      });

      alert("Account created successfully!");
      onClose();
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose} className="login-modal">
      <IonHeader translucent={true}>
        <IonToolbar className="login-toolbar">
          <IonTitle className="login-title">Create Account</IonTitle>
          <IonButton slot="end" fill="clear" onClick={onClose}>
            <IonIcon icon={closeOutline} />
          </IonButton>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding login-content">
        <IonItem className="login-item">
          <IonLabel position="stacked">Email</IonLabel>
          <IonInput
            type="email"
            value={email}
            onIonChange={(e) => setEmail(e.detail.value!)}
            placeholder="you@example.com"
          />
        </IonItem>

        <IonItem className="login-item">
          <IonLabel position="stacked">Password</IonLabel>
          <IonInput
            type="password"
            value={password}
            onIonChange={(e) => setPassword(e.detail.value!)}
            placeholder="Enter your password"
          />
        </IonItem>

        <IonButton expand="block" className="login-btn main-btn" onClick={handleEmailSignup}>
          <IonIcon slot="start" icon={mailOutline} />
          Create Account
        </IonButton>

        <div className="divider">or</div>

        <IonButton expand="block" className="login-btn google-btn" onClick={handleGoogleLogin}>
          <IonIcon slot="start" icon={logoGoogle} />
          Continue with Google
        </IonButton>

        <IonButton
          expand="block"
          className="login-btn facebook-btn"
          onClick={() => alert("Facebook login coming soon!")}
        >
          <IonIcon slot="start" icon={logoFacebook} />
          Continue with Facebook
        </IonButton>
      </IonContent>
    </IonModal>
  );
};

export default LoginModal;
