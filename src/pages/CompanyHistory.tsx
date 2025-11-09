import React from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
} from "@ionic/react";
import "./CompanyHistory.css";
import logo from "../assets/SipFreshClear.png";
import TopBar from "../components/TopBar";

const CompanyHistory: React.FC = () => {
  return (
    <IonPage>
        <TopBar />

      <IonContent fullscreen className="company-content">
        <section className="hero-section">
          <img src={logo} alt="SipFresh Logo" className="hero-logo" />
          <h1 className="hero-title">SipFresh Through the Years</h1>
          <p className="hero-subtitle">
            From small beginnings to refreshing the world—one bottle at a time.
          </p>
        </section>

        <IonCard className="history-card">
          <IonCardHeader>
            <IonCardTitle>2023 – The Beginning</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            SipFresh started as a college project aiming to promote healthy and
            natural bottled juices. With just three flavors and a small fan
            base, the dream began to grow.
          </IonCardContent>
        </IonCard>

        <IonCard className="history-card">
          <IonCardHeader>
            <IonCardTitle>2024 – Expanding Horizons</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            The team introduced new flavors, improved sustainability, and began
            developing the SipFresh mobile app to make healthy living more
            convenient.
          </IonCardContent>
        </IonCard>

        <IonCard className="history-card">
          <IonCardHeader>
            <IonCardTitle>2025 – The Digital Era</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            SipFresh went digital, reaching thousands of health-conscious users.
            With the app’s launch, ordering juices became faster, fresher, and
            smarter.
          </IonCardContent>
        </IonCard>

        <footer className="history-footer">
          <p>🍹 Stay Refreshed — SipFresh © 2025</p>
        </footer>
      </IonContent>
    </IonPage>
  );
};

export default CompanyHistory;
