import React from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonMenuButton,
} from "@ionic/react";
import "./About.css";
import TopBar from "../components/TopBar";
import "bootstrap/dist/css/bootstrap.min.css";

const About: React.FC = () => {
  return (
    <IonPage>
        <TopBar /> {/* ✅ GLOBAL TOP BAR */}

      <IonContent fullscreen className="about-page">
        <div className="container py-5">
          <div className="text-center mb-5">
            <img
              src="/src/assets/SipFreshClear.png"
              alt="App Logo"
              className="about-logo mb-3"
            />
            <p className="lead text-muted">
              SipFresh is a mobile application designed to make refreshing, 
              healthy bottled juices more accessible and convenient for everyone. 
              Whether you’re looking for a quick energy boost, a detox drink, or a fruity treat,
               SipFresh brings you a variety of freshly made juices — right at your fingertips.
            </p>
          </div>

          <div className="row g-4 justify-content-center">
            <div className="col-md-4">
              <div className="about-card p-4 text-center rounded shadow-sm">
                <h4 className="fw-semibold text-success mb-2">Our Mission</h4>
                <p className="text-muted">
                  To promote a healthy and refreshing lifestyle by offering a
                   wide selection of high-quality bottled juices through a
                    convenient and user-friendly mobile platform.
                </p>
              </div>
            </div>

            <div className="col-md-4">
              <div className="about-card p-4 text-center rounded shadow-sm">
                <h4 className="fw-semibold text-primary mb-2">Our Vision</h4>
                <p className="text-muted">
                  To become on of top leading mobile juice platform in the Philippines,
                   inspiring people to choose natural and healthy beverages every day.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 text-center contact-section">
            <h5 className="fw-bold mb-3 text-gradient">Developers</h5>
            <p className="mb-1">Anuar Jafar A. Kasan</p>
            <p className="mb-0"> Lordee Garcia</p>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default About;
