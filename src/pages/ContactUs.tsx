import React from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonButton,
  IonIcon,
} from "@ionic/react";
import { mailOutline, callOutline, locationOutline, sendOutline } from "ionicons/icons";
import TopBar from "../components/TopBar";
import "./ContactUs.css";


const ContactUs: React.FC = () => {
  return (
    <IonPage>
        <TopBar />

      <IonContent className="contact-content">
        <div className="contact-container">
          <h2 className="contact-heading">We’d love to hear from you!</h2>
          <p className="contact-subtext">
            Have questions or feedback about SipFresh? Send us a message below.
          </p>

          <IonItem className="contact-item">
            <IonLabel position="stacked">Your Name</IonLabel>
            <IonInput placeholder="Enter your name" />
          </IonItem>

          <IonItem className="contact-item">
            <IonLabel position="stacked">Email</IonLabel>
            <IonInput placeholder="Enter your email" type="email" />
          </IonItem>

          <IonItem className="contact-item">
            <IonLabel position="stacked">Message</IonLabel>
            <IonTextarea placeholder="Type your message here..." rows={5} />
          </IonItem>

          <IonButton expand="block" className="contact-btn">
            <IonIcon slot="start" icon={sendOutline} />
            Send Message
          </IonButton>

          <div className="contact-info">
            <div className="info-item">
              <IonIcon icon={mailOutline} />
              <span>sipfreshteam@gmail.com</span>
            </div>
            <div className="info-item">
              <IonIcon icon={callOutline} />
              <span>+63 912 345 6789</span>
            </div>
            <div className="info-item">
              <IonIcon icon={locationOutline} />
              <span>Technological Institute of the Philippines, QC</span>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ContactUs;
