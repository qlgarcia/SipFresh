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
import { signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithCredential } from "firebase/auth";
import { auth, db } from "../firebaseConfig";
import { doc, setDoc } from "firebase/firestore";
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
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
      let authResult;
      
      if (Capacitor.isNativePlatform()) {
        // Initialize Google Auth
        await GoogleAuth.initialize();
        
        // Sign in with native flow
        const googleUser = await GoogleAuth.signIn();
        
        // Get the ID token
        if (!googleUser || !googleUser.authentication || !googleUser.authentication.idToken) {
          throw new Error('No ID token received from Google Sign-In');
        }
        
        // Create Firebase credential
        const credential = GoogleAuthProvider.credential(
          googleUser.authentication.idToken
        );
        
        // Sign in to Firebase with credential
        authResult = await signInWithCredential(auth, credential);
      } else {
        // Web flow
        const provider = new GoogleAuthProvider();
        provider.addScope('profile');
        provider.addScope('email');
        authResult = await signInWithPopup(auth, provider);
      }

      const user = authResult.user;

      await setDoc(
        doc(db, "users", user.uid),
        {
          uid: user.uid,
          displayName: user.displayName || "",
          email: user.email,
          role: "user",
          sex: "",
          age: "",
          createdAt: new Date(),
        },
        { merge: true }
      );

      onClose();
    } catch (error) {
      console.error("Google login error:", error);
      const code = (error as any)?.code || (error as any)?.message || "";
      if (typeof code === "string" && code.includes("unauthorized-domain")) {
        alert(
          "Google sign-in blocked: the current domain is not authorized in your Firebase project.\n\n" +
            "Fix: Open Firebase Console → Authentication → Settings → Authorized domains and add this domain."
        );
      } else {
        alert("Google login error: " + ((error as any)?.message || error));
      }
    }
  };

  const handleEmailSignup = async () => {
    if (!email || !password) return alert("Please fill out both fields.");
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(
        doc(db, "users", user.uid),
        {
          uid: user.uid,
          email: user.email,
          displayName: "",
          role: "user",
          sex: "",
          age: "",
          // omit phone here so we don't overwrite any value on future logins
          createdAt: new Date(),
        },
        { merge: true }
      );

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

      </IonContent>
    </IonModal>
  );
};

export default LoginModal;
