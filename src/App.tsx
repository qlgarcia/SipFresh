import React, { useState } from "react";
import { Redirect, Route, Switch } from "react-router-dom";
import {
  IonApp,
  IonRouterOutlet,
  IonSplitPane,
  setupIonicReact,
} from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";

import Home from "./pages/Home";
import Products from "./pages/Products";
import CartPage from "./pages/Cart";
import Splash from "./pages/Splash";
import SideMenu from "./components/SideMenu";
import About from "./pages/About";
import ProfilePage from "./pages/ProfilePage";
import { CartProvider } from "./context/CartContext";
import CompanyHistory from "./pages/CompanyHistory";
import Developers from "./pages/Developers";
import ContactUs from "./pages/ContactUs";
import AdminLayout from "./pages/admin/AdminLayout";

import "@ionic/react/css/core.css";
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";
import "@ionic/react/css/padding.css";
import "@ionic/react/css/float-elements.css";
import "@ionic/react/css/text-alignment.css";
import "@ionic/react/css/text-transformation.css";
import "@ionic/react/css/flex-utils.css";
import "@ionic/react/css/display.css";
import "./theme/variables.css";



setupIonicReact();

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [selectedModule, setSelectedModule] = useState("home");

  if (showSplash) {
    return <Splash onFinish={() => setShowSplash(false)} />;
  }

  return (
    <IonApp>
      <IonReactRouter>
        <CartProvider>
          <IonSplitPane contentId="main-content">
            <SideMenu
              selected={selectedModule}
              onSelect={(id) => setSelectedModule(id)}
            />

            <IonRouterOutlet id="main-content">
              <Switch>
                <Route path="/admin" component={AdminLayout} />
                <Route exact path="/home" component={Home} />
                <Route exact path="/products" component={Products} />
                <Route exact path="/cart" component={CartPage} />
                <Route path="/about" component={About} exact />
                <Route path="/profile" component={ProfilePage} exact />
                <Route exact path="/company-history" component={CompanyHistory} />
                <Route exact path="/developers" component={Developers} />
                <Route exact path="/contact-us" component={ContactUs} />
                <Route exact path="/">
                  <Redirect to="/home" />
                </Route>
              </Switch>
            </IonRouterOutlet>
          </IonSplitPane>
        </CartProvider>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
