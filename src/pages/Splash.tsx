import React, { useEffect } from "react";
import "./Splash.css";

interface SplashProps {
  onFinish: () => void;
}

const Splash: React.FC<SplashProps> = ({ onFinish }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 3000); // 3s then move to Home
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="splash-screen">

      <div className="bottle-logo">
        <div className="liquid"></div>
      </div>


      <h1 className="brand-name"><span className="sip">Sip</span><span className="fresh">Fresh</span></h1>
      <p className="tagline">Squeeze the Freshness</p>

    
      <div className="fruit">🍊</div>
    </div>
  );
};

export default Splash;
