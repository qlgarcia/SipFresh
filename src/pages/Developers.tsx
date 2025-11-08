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
  IonIcon,
} from "@ionic/react";
import {
  logoFacebook,
  logoGoogle,
  logoTiktok,
  mailOutline,
} from "ionicons/icons";
import "./Developers.css";
import TopBar from "../components/TopBar";

const Developers: React.FC = () => {
  return (
    <IonPage id="main-content">
        <TopBar />

      <IonContent className="developers-content">
        <div className="developers-header">
          <h2>Meet the Developers</h2>
          <p>We’re 3rd Year BSIT students from the Technological Institute of the Philippines – Quezon City.</p>
        </div>

        <div className="developer-cards">
          <IonCard className="dev-card">
            <img src="https://cdn-icons-png.flaticon.com/512/219/219983.png" alt="Anuar" className="dev-photo" />
            <IonCardHeader>
              <IonCardTitle>Anuar Jafar A. Kasan</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <p>Frontend Developer & Project Lead</p>
              <div className="social-icons">
                <IonIcon icon={logoFacebook} />
                <IonIcon icon={logoGoogle} />
                <IonIcon icon={logoTiktok} />
                <IonIcon icon={mailOutline} />
              </div>
            </IonCardContent>
          </IonCard>

          <IonCard className="dev-card">
            <img src="https://cdn-icons-png.flaticon.com/512/219/219983.png" alt="Lordee" className="dev-photo" />
            <IonCardHeader>
              <IonCardTitle>Lordee Garcia</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <p>Backend Developer & Database Manager</p>
              <div className="social-icons">
                <IonIcon icon={logoFacebook} />
                <IonIcon icon={logoGoogle} />
                <IonIcon icon={logoTiktok} />
                <IonIcon icon={mailOutline} />
              </div>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Developers;
