import React, { useState, Suspense } from "react";
import { Redirect, Route, Switch } from "react-router-dom";
import {
  IonApp,
  IonRouterOutlet,
  IonSplitPane,
  setupIonicReact,
} from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";

// Lazy-load pages to split them into separate chunks and reduce the main bundle size
const Home = React.lazy(() => import("./pages/Home"));
const Products = React.lazy(() => import("./pages/Products"));
const CartPage = React.lazy(() => import("./pages/Cart"));
const Checkout = React.lazy(() => import("./pages/checkout/Checkout"));
const CheckoutSuccess = React.lazy(() => import("./pages/CheckoutSuccess"));
const Splash = React.lazy(() => import("./pages/Splash"));
const ProductDetailsPage = React.lazy(() => import("./pages/ProductDetailsPage"));
const SideMenu = React.lazy(() => import("./components/SideMenu"));
const About = React.lazy(() => import("./pages/About"));
const ProfilePage = React.lazy(() => import("./pages/ProfilePage"));
const CompanyHistory = React.lazy(() => import("./pages/CompanyHistory"));
const Developers = React.lazy(() => import("./pages/Developers"));
const ContactUs = React.lazy(() => import("./pages/ContactUs"));
const AdminLayout = React.lazy(() => import("./pages/admin/AdminLayout"));
import { CartProvider } from "./context/CartContext";

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
    return (
      <Suspense fallback={<div />}> 
        <Splash onFinish={() => setShowSplash(false)} />
      </Suspense>
    );
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
              <Suspense fallback={<div>Loading...</div>}>
                <Switch>
                  <Route path="/admin" component={AdminLayout} />
                  <Route exact path="/home" component={Home} />
                  <Route exact path="/product/:id" component={ProductDetailsPage} />
                  <Route exact path="/products" component={Products} />
                  <Route exact path="/cart" component={CartPage} />
                  <Route exact path="/checkout" component={Checkout} />
                  <Route exact path="/order-success" component={CheckoutSuccess} />
                  <Route path="/about" component={About} exact />
                  <Route path="/profile" component={ProfilePage} exact />
                  <Route exact path="/company-history" component={CompanyHistory} />
                  <Route exact path="/developers" component={Developers} />
                  <Route exact path="/contact-us" component={ContactUs} />
                  <Route exact path="/">
                    <Redirect to="/home" />
                  </Route>
                </Switch>
              </Suspense>
            </IonRouterOutlet>
          </IonSplitPane>
        </CartProvider>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
